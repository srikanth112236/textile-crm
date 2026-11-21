import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { Category } from '../models/Category';
import { Tag } from '../models/Tag';
import { Product } from '../models/Product';
import { Settings } from '../models/Settings';
import { AuditLog, AuditAction } from '../models/AuditLog';
import {
  ImportJob,
  IImportJob,
  IImportPreviewRow,
  IImportRowIssue,
  IImportRowResult,
} from '../models/ImportJob';
import { createProductSchema } from '../validation/productSchemas';
import { normalizeShipping } from '../utils/shiprocketReady';

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const IMPORT_TTL_DAYS = 7;

export const IMPORT_HEADERS = [
  'name',
  'sku',
  'category',
  'price',
  'compare_at_price',
  'cost_price',
  'stock',
  'status',
  'description',
  'short_description',
  'images',
  'tags',
  'badge',
  'fit',
  'fabric',
  'pattern',
  'occasion',
  'features',
  'materials',
  'wash_care',
  'condition',
  'warranty',
  'weight_g',
  'length_cm',
  'width_cm',
  'height_cm',
  'seo_title',
  'seo_description',
  'video_url',
  'instagram_url',
] as const;

const REQUIRED_HEADERS = ['name', 'sku', 'category', 'price', 'stock', 'description', 'images'];
const VALID_STATUSES = ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued', 'scheduled'];
const VALID_BADGES = ['bestseller', 'trending', 'limited', 'new', 'sale'];
const VALID_CONDITIONS = ['new', 'refurbished', 'used', 'like_new'];

export class ImportError extends Error {
  status: number;
  details?: string[];
  constructor(message: string, status = 400, details?: string[]) {
    super(message);
    this.name = 'ImportError';
    this.status = status;
    this.details = details;
  }
}

interface RowPayload {
  row: number;
  sku: string;
  errors: IImportRowIssue[];
  warnings: string[];
  data: Record<string, unknown> | null;
  action?: 'create' | 'update' | 'skip';
  existingId?: string;
  before?: Record<string, unknown>;
  zipImages?: string[];
}

interface VariantSheetRow {
  parent_sku?: string;
  sku?: string;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  price?: string;
  compare_at_price?: string;
  stock?: string;
  weight_g?: string;
  barcode?: string;
  image_url?: string;
  is_default?: string;
}

interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

interface TagRef {
  id: string;
  name: string;
  slug: string;
}

interface ImportContext {
  categories: Map<string, CategoryRef>;
  tags: Map<string, TagRef>;
  defaults: {
    weightG: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
}

function importDir(): string {
  // Private runtime storage — deliberately NOT under `/uploads`, which Express
  // serves publicly. Payloads contain full product rows and must stay admin-only.
  return path.join(process.cwd(), '.imports');
}

async function ensureImportDir(): Promise<string> {
  const dir = importDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function importPayloadPath(jobId: string): string {
  return path.join(importDir(), `${jobId}.json`);
}

function splitList(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  return String(value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const cleaned = String(value).replace(/[₹,$\s]/g, '').replace(/,/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Reject spreadsheet formula injection without blocking negative numbers. */
function isFormulaCell(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith('=') || v.startsWith('+') || v.startsWith('@')) return true;
  if (v.startsWith('-') && !/^-\d/.test(v)) return true;
  return false;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pushIssue(
  target: IImportRowIssue[],
  message: string,
  field?: string
): void {
  target.push(field ? { field, message } : { message });
}

function parseCsvMatrix(buffer: Buffer): { headers: string[]; rows: Record<string, string>[] } {
  let matrix: string[][];
  try {
    matrix = parse(buffer, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    }) as string[][];
  } catch (error: any) {
    throw new ImportError(`Could not read the CSV file: ${error.message || 'invalid format'}`, 400);
  }

  if (!matrix || matrix.length === 0) {
    throw new ImportError('The CSV file is empty.', 400);
  }

  const headers = matrix[0].map((h) => String(h || '').trim().toLowerCase());
  const duplicates = headers.filter((h, i) => h && headers.indexOf(h) !== i);
  if (duplicates.length > 0) {
    throw new ImportError(`Duplicate columns found: ${[...new Set(duplicates)].join(', ')}`, 400);
  }

  const rows = matrix.slice(1).map((cols) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cols[index] === undefined || cols[index] === null ? '' : String(cols[index]).trim();
    });
    return record;
  });

  return { headers, rows };
}

function cellToString(value: any): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((part: any) => part.text || '').join('');
    if (value.text !== undefined) return String(value.text);
    if (value.result !== undefined) return String(value.result);
    if (value.hyperlink !== undefined) return String(value.text || value.hyperlink);
    return '';
  }
  return String(value).trim();
}

function sheetToRecords(sheet: ExcelJS.Worksheet): { headers: string[]; rows: Record<string, string>[] } {
  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    headers[columnNumber - 1] = cellToString(cell.value).toLowerCase();
  });
  // Trim trailing empty header slots.
  while (headers.length > 0 && !headers[headers.length - 1]) headers.pop();

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((header, index) => {
      if (!header) return;
      const value = cellToString(row.getCell(index + 1).value);
      if (value !== '') hasValue = true;
      record[header] = value;
    });
    if (hasValue) rows.push(record);
  });

  return { headers, rows };
}

async function parseWorkbook(buffer: Buffer): Promise<{
  headers: string[];
  rows: Record<string, string>[];
  variantRows: VariantSheetRow[];
}> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch (error: any) {
    throw new ImportError(`Could not read the Excel file: ${error.message || 'invalid format'}`, 400);
  }

  const productSheet = workbook.getWorksheet('Products') || workbook.worksheets[0];
  if (!productSheet) throw new ImportError('The workbook has no Products sheet.', 400);
  const products = sheetToRecords(productSheet);

  const variantSheet = workbook.getWorksheet('Variants');
  const variants = variantSheet ? sheetToRecords(variantSheet) : { headers: [], rows: [] };
  if (variants.rows.length > 0) {
    const missing = ['parent_sku', 'sku', 'price', 'stock']
      .filter((header) => !variants.headers.includes(header));
    if (missing.length > 0) {
      throw new ImportError(`Variants sheet is missing: ${missing.join(', ')}`, 400);
    }
  }

  return {
    headers: products.headers,
    rows: products.rows,
    variantRows: variants.rows as VariantSheetRow[],
  };
}

async function parseImportFile(buffer: Buffer, fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx')) {
    const parsed = await parseWorkbook(buffer);
    return { format: 'xlsx' as const, ...parsed };
  }
  if (!lower.endsWith('.csv')) {
    throw new ImportError('Only CSV and XLSX files are supported.', 400);
  }
  const parsed = parseCsvMatrix(buffer);
  return { format: 'csv' as const, ...parsed, variantRows: [] as VariantSheetRow[] };
}

function detectImageExt(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return '.png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return '.gif';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  if (buffer.toString('ascii', 4, 8) === 'ftyp' && /avi[fs]/.test(buffer.toString('ascii', 8, 12))) return '.avif';
  return null;
}

async function extractZipImages(zipBuffer: Buffer, jobId: string): Promise<{
  imagesBySku: Map<string, string[]>;
  warnings: string[];
}> {
  const imagesBySku = new Map<string, string[]>();
  const warnings: string[] = [];
  let totalBytes = 0;

  let zip: AdmZip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch {
    throw new ImportError('The images ZIP could not be read.', 400);
  }

  const baseDir = path.join(importDir(), jobId, 'images');

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const entryName = entry.entryName.replace(/\\/g, '/');
    if (entryName.includes('..') || entryName.startsWith('/') || entryName.startsWith('__MACOSX/')) {
      warnings.push(`Skipped unsafe ZIP entry: ${entryName}`);
      continue;
    }
    const match = entryName.match(/^(?:images\/)?([^/]+)\/([^/]+)$/i);
    if (!match) {
      warnings.push(`Skipped ZIP file outside images/{sku}/: ${entryName}`);
      continue;
    }

    const sku = match[1].toUpperCase();
    const originalName = match[2];
    if (!/\.(jpe?g|png|webp|avif|gif)$/i.test(originalName)) {
      warnings.push(`Skipped non-image ZIP file: ${entryName}`);
      continue;
    }

    const data = entry.getData();
    if (data.length > 5 * 1024 * 1024) {
      warnings.push(`Skipped ${entryName}: image is over 5 MB.`);
      continue;
    }
    totalBytes += data.length;
    if (totalBytes > 100 * 1024 * 1024) {
      throw new ImportError('The ZIP images exceed the 100 MB uncompressed limit.', 400);
    }

    const detected = detectImageExt(data);
    if (!detected) {
      warnings.push(`Skipped ${entryName}: not a supported image file.`);
      continue;
    }

    const safeSku = sku.replace(/[^A-Z0-9_-]/g, '-');
    const folder = path.join(baseDir, safeSku);
    await fs.mkdir(folder, { recursive: true });
    const existing = imagesBySku.get(sku)?.length || 0;
    if (existing >= 20) {
      warnings.push(`Skipped ${entryName}: ${sku} already has 20 images.`);
      continue;
    }

    const fileName = `${existing + 1}-${Date.now()}${detected}`;
    const filePath = path.join(folder, fileName);
    await fs.writeFile(filePath, data);
    const list = imagesBySku.get(sku) || [];
    list.push(filePath);
    imagesBySku.set(sku, list);
  }

  return { imagesBySku, warnings };
}

async function loadContext(): Promise<ImportContext> {
  const [categories, tags, settings] = await Promise.all([
    Category.find({ status: 'active' }).select('_id name slug').lean(),
    Tag.find({ isActive: true }).select('_id name slug').lean(),
    Settings.findOne({ key: 'global' }).lean(),
  ]);

  const categoryMap = new Map<string, CategoryRef>();
  for (const category of categories as any[]) {
    const ref: CategoryRef = {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
    };
    categoryMap.set(ref.id, ref);
    categoryMap.set(ref.slug.toLowerCase(), ref);
    categoryMap.set(ref.name.toLowerCase(), ref);
  }

  const tagMap = new Map<string, TagRef>();
  for (const tag of tags as any[]) {
    const ref: TagRef = { id: String(tag._id), name: tag.name, slug: tag.slug };
    tagMap.set(ref.id, ref);
    tagMap.set(ref.slug.toLowerCase(), ref);
    tagMap.set(ref.name.toLowerCase(), ref);
  }

  const s: any = settings;
  return {
    categories: categoryMap,
    tags: tagMap,
    defaults: {
      weightG: s?.shipping?.defaultWeightG ?? 500,
      lengthCm: s?.shipping?.defaultLengthCm ?? 30,
      widthCm: s?.shipping?.defaultWidthCm ?? 25,
      heightCm: s?.shipping?.defaultHeightCm ?? 3,
    },
  };
}

interface NormalisedRow {
  row: number;
  sku: string;
  errors: IImportRowIssue[];
  warnings: string[];
  data: Record<string, unknown> | null;
  preview: IImportPreviewRow;
  action?: 'create' | 'update' | 'skip';
  existingId?: string;
  before?: Record<string, unknown>;
  zipImages?: string[];
}

const UPDATABLE_FIELDS = [
  'name', 'slug', 'shortDescription', 'description', 'category', 'tags', 'images', 'videos',
  'hasVariants', 'variantAttributes', 'variantSKUs', 'variations', 'variationOptions',
  'price', 'compareAtPrice', 'costPrice', 'volumePricing', 'stock', 'sku', 'inventory',
  'lowStockThreshold', 'brand', 'specifications', 'features', 'materials', 'fit', 'fabric',
  'pattern', 'occasion', 'washCare', 'sizeChart', 'modelHeight', 'modelSizeWorn', 'badges',
  'condition', 'warranty', 'identifiers', 'shipping', 'digital', 'status', 'visibility',
  'relatedProducts', 'metadata',
];

function normalizeRow(
  raw: Record<string, string>,
  rowNumber: number,
  context: ImportContext,
  zipImageCount = 0
): NormalisedRow {
  const errors: IImportRowIssue[] = [];
  const warnings: string[] = [];

  for (const [field, value] of Object.entries(raw)) {
    if (isFormulaCell(value)) {
      pushIssue(errors, `Cell starts with a formula character and was rejected.`, field);
    }
  }

  const sku = String(raw.sku || '').trim().toUpperCase();
  const name = String(raw.name || '').trim();
  const description = String(raw.description || '').trim();

  if (!sku) pushIssue(errors, 'SKU is required.', 'sku');
  if (!name) pushIssue(errors, 'Name is required.', 'name');
  if (!description) pushIssue(errors, 'Description is required.', 'description');

  // Category resolution: id, slug, or exact name (case-insensitive).
  const categoryRaw = String(raw.category || '').trim();
  const category = context.categories.get(categoryRaw) ||
    context.categories.get(categoryRaw.toLowerCase());
  if (!categoryRaw) {
    pushIssue(errors, 'Category is required.', 'category');
  } else if (!category) {
    pushIssue(errors, `Category "${categoryRaw}" was not found.`, 'category');
  }

  const price = toNumber(raw.price);
  if (price === null) pushIssue(errors, 'Price must be a number.', 'price');
  else if (price < 0) pushIssue(errors, 'Price cannot be negative.', 'price');

  const compareAtPrice = toNumber(raw.compare_at_price);
  if (compareAtPrice !== null && compareAtPrice < 0) {
    pushIssue(errors, 'Compare-at price cannot be negative.', 'compare_at_price');
  } else if (compareAtPrice !== null && price !== null && compareAtPrice < price) {
    warnings.push('Compare-at price is lower than the selling price.');
  }

  const costPrice = toNumber(raw.cost_price);
  if (costPrice !== null && costPrice < 0) {
    pushIssue(errors, 'Cost price cannot be negative.', 'cost_price');
  }

  const stock = toNumber(raw.stock);
  if (stock === null) pushIssue(errors, 'Stock must be a number.', 'stock');
  else if (stock < 0 || !Number.isInteger(stock)) {
    pushIssue(errors, 'Stock must be a whole number >= 0.', 'stock');
  }

  const status = String(raw.status || 'draft').trim().toLowerCase() || 'draft';
  if (!VALID_STATUSES.includes(status)) {
    pushIssue(errors, `Status must be one of: ${VALID_STATUSES.join(', ')}.`, 'status');
  }

  const csvImages = splitList(raw.images);
  const useZipImages = zipImageCount > 0;
  const imageValues = useZipImages ? ['/uploads/import-pending.jpg'] : csvImages;

  if (useZipImages && csvImages.length > 0) {
    warnings.push('ZIP images will replace the image URLs in this row.');
  }
  if (imageValues.length === 0) pushIssue(errors, 'At least one image URL or ZIP image is required.', 'images');
  if (imageValues.length > 20) pushIssue(errors, 'A product can have at most 20 images.', 'images');
  if (!useZipImages) {
    for (const image of imageValues) {
      if (!isHttpUrl(image) && !image.startsWith('/uploads/')) {
        pushIssue(errors, `Image must be an http(s) URL or /uploads path: ${image}`, 'images');
      }
    }
  }

  const tagRefs: TagRef[] = [];
  for (const tagValue of splitList(raw.tags)) {
    const tag = context.tags.get(tagValue) || context.tags.get(tagValue.toLowerCase());
    if (!tag) warnings.push(`Tag "${tagValue}" was not found and was skipped.`);
    else if (!tagRefs.some((t) => t.id === tag.id)) tagRefs.push(tag);
  }

  const badges = splitList(raw.badge).filter((badge) => {
    if (VALID_BADGES.includes(badge.toLowerCase())) return true;
    warnings.push(`Badge "${badge}" was skipped (not a recognised badge).`);
    return false;
  });

  const condition = String(raw.condition || 'new').trim().toLowerCase() || 'new';
  if (!VALID_CONDITIONS.includes(condition)) {
    pushIssue(errors, `Condition must be one of: ${VALID_CONDITIONS.join(', ')}.`, 'condition');
  }

  const value: Record<string, unknown> = {
    name,
    sku,
    description,
    category: category?.id,
    price: price ?? undefined,
    stock: stock ?? undefined,
    status: VALID_STATUSES.includes(status) ? status : 'draft',
    images: imageValues,
  };

  const assign = (key: string, rawValue: unknown, transform?: (v: string) => unknown) => {
    if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') return;
    value[key] = transform ? transform(String(rawValue).trim()) : String(rawValue).trim();
  };

  assign('slug', raw.slug, (v) => slugify(v));
  assign('shortDescription', raw.short_description);
  assign('fit', raw.fit);
  assign('fabric', raw.fabric);
  assign('pattern', raw.pattern);
  assign('occasion', raw.occasion);
  assign('washCare', raw.wash_care);
  assign('warranty', raw.warranty);
  assign('modelHeight', raw.model_height);
  assign('modelSizeWorn', raw.model_size_worn);

  if (compareAtPrice !== null) value.compareAtPrice = compareAtPrice;
  if (costPrice !== null) value.costPrice = costPrice;
  if (tagRefs.length > 0) value.tags = tagRefs.map((tag) => tag.id);
  if (badges.length > 0) value.badges = badges.map((badge) => badge.toLowerCase());
  if (VALID_CONDITIONS.includes(condition)) value.condition = condition;

  const features = splitList(raw.features);
  if (features.length > 0) value.features = features;
  const materials = splitList(raw.materials);
  if (materials.length > 0) value.materials = materials;

  // Shipping: always available, but only materialise when provided or needed
  // for an active product. Missing dimensions are filled from Settings defaults.
  const hasShippingInput = ['weight_g', 'length_cm', 'width_cm', 'height_cm'].some(
    (key) => String(raw[key] || '').trim() !== ''
  );
  if (hasShippingInput || status === 'active') {
    const { shipping, warnings: shippingWarnings } = normalizeShipping(
      {
        weight: toNumber(raw.weight_g),
        length: toNumber(raw.length_cm),
        width: toNumber(raw.width_cm),
        height: toNumber(raw.height_cm),
      },
      context.defaults
    );
    value.shipping = shipping;
    warnings.push(...shippingWarnings);
  }

  const metaTitle = String(raw.seo_title || '').trim();
  const metaDescription = String(raw.seo_description || '').trim();
  if (metaTitle || metaDescription) {
    value.metadata = {
      ...(metaTitle ? { metaTitle } : {}),
      ...(metaDescription ? { metaDescription } : {}),
    };
  }

  const videos: Array<{ url: string }> = [];
  if (String(raw.video_url || '').trim()) videos.push({ url: String(raw.video_url).trim() });
  if (String(raw.instagram_url || '').trim()) videos.push({ url: String(raw.instagram_url).trim() });
  if (videos.length > 0) value.videos = videos;

  const { error, value: validated } = createProductSchema.validate(value, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    for (const detail of error.details) {
      pushIssue(errors, detail.message, detail.path.join('.'));
    }
  }

  const preview: IImportPreviewRow = {
    row: rowNumber,
    name,
    sku,
    category: category?.name || categoryRaw,
    price: price ?? 0,
    stock: stock ?? 0,
    status: String(value.status || 'draft'),
    imageCount: useZipImages ? zipImageCount : imageValues.length,
    tagCount: tagRefs.length,
  };

  return {
    row: rowNumber,
    sku,
    errors,
    warnings,
    data: errors.length === 0 ? (validated as Record<string, unknown>) : null,
    preview,
  };
}

const DEFAULT_ONLY_FIELDS = ['hasVariants', 'condition', 'status', 'lowStockThreshold', 'inventory', 'visibility'];

function snapshotProduct(product: any): Record<string, unknown> {
  const object = typeof product.toObject === 'function'
    ? product.toObject({ depopulate: true })
    : product;
  const snapshot: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (object[field] !== undefined) {
      snapshot[field] = object[field] === null ? null : JSON.parse(JSON.stringify(object[field]));
    }
  }
  return snapshot;
}

function diffFields(before: Record<string, unknown>, data: Record<string, unknown>): string[] {
  const changed: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(value ?? null)) changed.push(key);
  }
  return changed;
}

function filterUpsertData(
  data: Record<string, unknown>,
  raw: Record<string, string>,
  hasVariants: boolean
): Record<string, unknown> {
  const filtered = { ...data };
  for (const field of DEFAULT_ONLY_FIELDS) {
    const rawKey = field === 'lowStockThreshold' ? 'low_stock_threshold' : field;
    if (!String(raw[rawKey] || '').trim() && !(field === 'hasVariants' && hasVariants)) {
      delete filtered[field];
    }
  }
  return filtered;
}

function buildVariantAttributes(rows: VariantSheetRow[]): Array<{
  name: string;
  displayName?: string;
  type: 'color' | 'size' | 'text' | 'button';
  options: Array<{ value: string; sortOrder?: number }>;
  required: boolean;
}> {
  const attributes = new Map<string, { name: string; values: string[] }>();
  for (const row of rows) {
    for (const slot of [1, 2] as const) {
      const name = String(row[`option${slot}_name` as keyof VariantSheetRow] || '').trim();
      const value = String(row[`option${slot}_value` as keyof VariantSheetRow] || '').trim();
      if (!name || !value) continue;
      const existing = attributes.get(name) || { name, values: [] };
      if (!existing.values.includes(value)) existing.values.push(value);
      attributes.set(name, existing);
    }
  }

  return [...attributes.values()].map((attribute) => {
    const lower = attribute.name.toLowerCase();
    const type = lower.includes('color') || lower.includes('colour')
      ? 'color'
      : lower.includes('size')
        ? 'size'
        : 'button';
    return {
      name: attribute.name,
      displayName: attribute.name,
      type,
      options: attribute.values.map((value, index) => ({ value, sortOrder: index })),
      required: true,
    };
  });
}

function applyVariantsToRow(
  row: NormalisedRow,
  variantRows: VariantSheetRow[],
  existingVariantOwners: Map<string, string>
): void {
  if (!row.data || variantRows.length === 0) return;

  const attributes = buildVariantAttributes(variantRows);
  const attributeNames = attributes.map((attribute) => attribute.name);
  const variantSKUs: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();

  variantRows.forEach((variant, index) => {
    const sku = String(variant.sku || '').trim().toUpperCase();
    const price = toNumber(variant.price);
    const stock = toNumber(variant.stock);
    if (!sku) {
      pushIssue(row.errors, `Variant row ${index + 2}: SKU is required.`);
      return;
    }
    if (!/^[A-Z0-9\-_]+$/.test(sku)) {
      pushIssue(row.errors, `Variant ${sku}: SKU contains invalid characters.`);
      return;
    }
    if (seen.has(sku)) {
      pushIssue(row.errors, `Variant ${sku}: duplicate SKU in the Variants sheet.`);
      return;
    }
    seen.add(sku);

    const owner = existingVariantOwners.get(sku);
    if (owner && owner !== row.sku.toUpperCase()) {
      pushIssue(row.errors, `Variant ${sku}: already belongs to product ${owner}.`);
      return;
    }
    if (price === null || price < 0) {
      pushIssue(row.errors, `Variant ${sku}: price must be a number >= 0.`);
      return;
    }
    if (stock === null || stock < 0 || !Number.isInteger(stock)) {
      pushIssue(row.errors, `Variant ${sku}: stock must be a whole number >= 0.`);
      return;
    }

    const variantAttributes: Record<string, string> = {};
    for (const slot of [1, 2] as const) {
      const name = String(variant[`option${slot}_name` as keyof VariantSheetRow] || '').trim();
      const value = String(variant[`option${slot}_value` as keyof VariantSheetRow] || '').trim();
      if (name && value) variantAttributes[name] = value;
    }
    if (Object.keys(variantAttributes).length !== attributeNames.length) {
      pushIssue(row.errors, `Variant ${sku}: every option must have a value.`);
      return;
    }

    variantSKUs.push({
      sku,
      attributes: variantAttributes,
      price,
      compareAtPrice: toNumber(variant.compare_at_price) ?? undefined,
      stock,
      weight: toNumber(variant.weight_g) ?? undefined,
      barcode: String(variant.barcode || '').trim(),
      images: splitList(variant.image_url),
      isDefault: /^(1|true|yes|y)$/i.test(String(variant.is_default || '')),
      isEnabled: true,
      position: index,
    });
  });

  if (variantSKUs.length === 0) {
    pushIssue(row.errors, 'Variants sheet has no usable variants for this product.');
    row.data = null;
    return;
  }
  if (!variantSKUs.some((variant) => variant.isDefault)) {
    variantSKUs[0].isDefault = true;
  }

  row.data.hasVariants = true;
  row.data.variantAttributes = attributes;
  row.data.variantSKUs = variantSKUs;

  const { error } = createProductSchema.validate(row.data, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    for (const detail of error.details) {
      pushIssue(row.errors, detail.message, detail.path.join('.'));
    }
    row.data = null;
  }
}

export interface ValidateImportResult {
  job: IImportJob;
  payload: RowPayload[];
}

export async function validateProductImport(input: {
  buffer: Buffer;
  fileName: string;
  fileSize: number;
  userId: string;
  mode?: 'create' | 'upsert';
  imagesZip?: { buffer: Buffer; size: number; fileName: string } | null;
}): Promise<ValidateImportResult> {
  if (!input.fileSize) throw new ImportError('Please choose a CSV or XLSX file.', 400);
  if (input.fileSize > MAX_IMPORT_BYTES) {
    throw new ImportError('The file is larger than 10 MB. Split it into smaller files.', 400);
  }
  if (input.imagesZip && input.imagesZip.size > 50 * 1024 * 1024) {
    throw new ImportError('The images ZIP is larger than 50 MB.', 400);
  }

  const jobId = new mongoose.Types.ObjectId();
  const parsed = await parseImportFile(input.buffer, input.fileName);
  const { headers, rows, variantRows } = parsed;

  if (headers.length === 0 || !headers.some(Boolean)) {
    throw new ImportError('The import file has no header row.', 400);
  }
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new ImportError(
      `Missing required columns: ${missingHeaders.join(', ')}`,
      400,
      missingHeaders
    );
  }
  if (rows.length === 0) {
    throw new ImportError('The import has headers but no product rows.', 400);
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ImportError(`This file has ${rows.length} rows. The limit is ${MAX_IMPORT_ROWS}.`, 400);
  }

  await ensureImportDir();
  const zipResult = input.imagesZip
    ? await extractZipImages(input.imagesZip.buffer, jobId.toString())
    : { imagesBySku: new Map<string, string[]>(), warnings: [] as string[] };

  const context = await loadContext();
  const normalised: NormalisedRow[] = rows.map((row, index) => {
    const sku = String(row.sku || '').trim().toUpperCase();
    const zipImages = zipResult.imagesBySku.get(sku) || [];
    const normalisedRow = normalizeRow(row, index + 2, context, zipImages.length);
    if (zipImages.length > 0) normalisedRow.zipImages = zipImages;
    return normalisedRow;
  });

  const mode = input.mode === 'upsert' ? 'upsert' : 'create';
  const bySku = new Map(normalised.map((row) => [row.sku, row]));
  const variantGroups = new Map<string, VariantSheetRow[]>();
  for (const variant of variantRows) {
    const parent = String(variant.parent_sku || '').trim().toUpperCase();
    if (!parent) continue;
    if (!bySku.has(parent)) {
      throw new ImportError(`Variants sheet references unknown parent_sku "${parent}".`, 400);
    }
    const list = variantGroups.get(parent) || [];
    list.push(variant);
    variantGroups.set(parent, list);
  }

  const variantSkus = variantRows
    .map((variant) => String(variant.sku || '').trim().toUpperCase())
    .filter(Boolean);
  const existingVariantOwners = new Map<string, string>();
  if (variantSkus.length > 0) {
    const owners = await Product.find({ 'variantSKUs.sku': { $in: variantSkus } })
      .select('sku variantSKUs.sku')
      .lean();
    for (const product of owners as any[]) {
      for (const variant of product.variantSKUs || []) {
        existingVariantOwners.set(String(variant.sku).toUpperCase(), String(product.sku).toUpperCase());
      }
    }
  }

  for (const row of normalised) {
    const group = variantGroups.get(row.sku);
    if (group) applyVariantsToRow(row, group, existingVariantOwners);
    for (const warning of zipResult.warnings) {
      if (warning.includes('images/') || warning.includes('ZIP')) row.warnings.push(warning);
    }
  }

  // Duplicate product SKUs inside the file.
  const seen = new Map<string, number>();
  for (const row of normalised) {
    if (!row.sku) continue;
    const firstRow = seen.get(row.sku);
    if (firstRow) {
      pushIssue(row.errors, `Duplicate SKU in file (already on row ${firstRow}).`, 'sku');
      row.data = null;
    } else {
      seen.set(row.sku, row.row);
    }
  }

  const skus = [...seen.keys()];
  if (skus.length > 0) {
    if (mode === 'create') {
      const existing = await Product.find({ sku: { $in: skus } }).select('sku').lean();
      const existingSkus = new Set((existing as any[]).map((p) => String(p.sku).toUpperCase()));
      for (const row of normalised) {
        if (existingSkus.has(row.sku)) {
          pushIssue(row.errors, 'A product with this SKU already exists. Switch to upsert to update it.', 'sku');
          row.data = null;
        }
      }
    } else {
      const existing = await Product.find({ sku: { $in: skus } });
      const byExistingSku = new Map((existing as any[]).map((product) => [String(product.sku).toUpperCase(), product]));
      for (const row of normalised) {
        const product = byExistingSku.get(row.sku);
        if (!product || !row.data) continue;
        const raw = rows.find((r) => String(r.sku || '').trim().toUpperCase() === row.sku) || {};
        const filtered = filterUpsertData(row.data, raw, Boolean(row.data.hasVariants));
        const before = snapshotProduct(product);
        const changed = diffFields(before, filtered);
        if (changed.length === 0) {
          row.action = 'skip';
          row.warnings.push('No changes detected; this row will be skipped.');
          row.data = null;
        } else {
          row.action = 'update';
          row.existingId = String(product._id);
          row.before = before;
          row.data = filtered;
          row.warnings.push(`Will update: ${changed.slice(0, 8).join(', ')}${changed.length > 8 ? '…' : ''}`);
        }
      }
    }
  }

  // Variant SKUs must not collide with product SKUs in this file.
  const productSkuSet = new Set(skus);
  for (const variantSku of variantSkus) {
    if (productSkuSet.has(variantSku)) {
      throw new ImportError(`Variant SKU ${variantSku} matches a product SKU in the Products sheet.`, 400);
    }
  }

  const payload: RowPayload[] = normalised.map((row) => ({
    row: row.row,
    sku: row.sku,
    errors: row.errors,
    warnings: row.warnings,
    data: row.data,
    action: row.action || (row.errors.length === 0 ? 'create' : undefined),
    existingId: row.existingId,
    before: row.before,
    zipImages: row.zipImages,
  }));

  const results: IImportRowResult[] = normalised.map((row) => ({
    row: row.row,
    sku: row.sku,
    status: row.errors.length > 0 ? 'failed'
      : row.action === 'update' ? 'update'
      : row.action === 'skip' ? 'skipped'
      : 'valid',
    issues: row.errors,
    warnings: row.warnings,
  }));

  const validRows = results.filter((row) => row.status === 'valid' || row.status === 'update').length;
  const updateRows = results.filter((row) => row.status === 'update').length;
  const errorRows = results.filter((row) => row.status === 'failed').length;
  const warningRows = results.filter((row) => row.warnings.length > 0).length;
  const fileHash = crypto.createHash('sha256').update(input.buffer).digest('hex');

  const payloadPath = importPayloadPath(jobId.toString());
  await fs.writeFile(payloadPath, JSON.stringify({ rows: payload }), 'utf8');

  const expiresAt = new Date(Date.now() + IMPORT_TTL_DAYS * 24 * 60 * 60 * 1000);

  const job = await ImportJob.create({
    _id: jobId,
    type: 'products',
    mode,
    fileName: path.basename(input.fileName || 'products.csv'),
    fileSize: input.fileSize,
    fileHash,
    status: 'validated',
    totalRows: rows.length,
    processedRows: 0,
    headers,
    preview: normalised.slice(0, 20).map((row) => row.preview),
    rows: results,
    summary: { validRows, updateRows, errorRows, warningRows },
    payloadPath,
    createdBy: new mongoose.Types.ObjectId(input.userId),
    expiresAt,
  });

  return { job, payload };
}

export interface CommitOptions {
  defaultStatus?: 'draft' | 'keep';
}

/**
 * Starts the commit in the background and returns immediately so the admin UI
 * can poll progress. `commitProductImport` remains the synchronous worker.
 */
async function publishZipImages(sku: string, files: string[]): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const safeSku = sku.replace(/[^A-Z0-9_-]/g, '-');
  const destination = path.join(process.cwd(), 'uploads', 'products', 'imports', safeSku);
  await fs.mkdir(destination, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    try {
      const name = path.basename(file);
      await fs.copyFile(file, path.join(destination, name));
      urls.push(`/uploads/products/imports/${safeSku}/${name}`);
    } catch {
      // A missing temp file should not abort the whole product.
    }
  }
  return urls;
}

async function removeImportWorkDir(jobId: string): Promise<void> {
  await fs.rm(path.join(importDir(), jobId), { recursive: true, force: true }).catch(() => undefined);
}

export async function startProductImport(
  jobId: string,
  userId: string,
  options: CommitOptions = {}
): Promise<IImportJob> {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ImportError('Invalid import job id.', 400);
  }

  const job = await ImportJob.findById(jobId);
  if (!job) throw new ImportError('Import job not found.', 404);
  if (job.mode !== 'create' && job.mode !== 'upsert') {
    throw new ImportError('Unsupported import mode.', 400);
  }
  if (job.status !== 'validated') {
    throw new ImportError('This import is not ready to commit. Validate the file again.', 400);
  }
  if (!job.payloadPath) throw new ImportError('The import payload is missing. Upload the file again.', 400);

  job.status = 'importing';
  job.startedAt = new Date();
  job.cancelRequested = false;
  job.processedRows = 0;
  job.created = 0;
  job.updated = 0;
  job.skipped = 0;
  job.failed = 0;
  await job.save();

  setImmediate(() => {
    commitProductImport(jobId, userId, options, { alreadyStarted: true }).catch(async (error) => {
      try {
        const failedJob = await ImportJob.findById(jobId);
        if (failedJob && failedJob.status !== 'completed') {
          failedJob.status = 'failed';
          failedJob.error = error?.message || 'Import failed.';
          failedJob.completedAt = new Date();
          await failedJob.save();
        }
      } catch {
        // If even the status update fails there is nothing else to do.
      }
    });
  });

  return job;
}

export async function resumeProductImport(
  jobId: string,
  userId: string,
  options: CommitOptions = {}
): Promise<IImportJob> {
  if (!mongoose.Types.ObjectId.isValid(jobId)) throw new ImportError('Invalid import job id.', 400);
  const job = await ImportJob.findById(jobId);
  if (!job) throw new ImportError('Import job not found.', 404);
  if (!['failed', 'cancelled', 'importing'].includes(job.status)) {
    throw new ImportError('Only failed or cancelled imports can be resumed.', 400);
  }
  if (!job.payloadPath) throw new ImportError('The import payload has expired. Upload the file again.', 400);
  try {
    await fs.access(job.payloadPath);
  } catch {
    throw new ImportError('The import payload has expired. Upload the file again.', 400);
  }

  job.status = 'importing';
  job.cancelRequested = false;
  job.error = undefined;
  job.resumedAt = new Date();
  await job.save();

  setImmediate(() => {
    commitProductImport(jobId, userId, options, { alreadyStarted: true, resume: true }).catch(async (error) => {
      try {
        const failedJob = await ImportJob.findById(jobId);
        if (failedJob && failedJob.status !== 'completed') {
          failedJob.status = 'failed';
          failedJob.error = error?.message || 'Import resume failed.';
          failedJob.completedAt = new Date();
          await failedJob.save();
        }
      } catch { /* ignore */ }
    });
  });

  return job;
}

export async function cancelProductImport(jobId: string): Promise<IImportJob> {
  if (!mongoose.Types.ObjectId.isValid(jobId)) throw new ImportError('Invalid import job id.', 400);
  const job = await ImportJob.findById(jobId);
  if (!job) throw new ImportError('Import job not found.', 404);
  if (['completed', 'failed', 'cancelled'].includes(job.status)) return job;

  job.cancelRequested = true;
  if (job.status === 'validated') {
    job.status = 'cancelled';
    job.completedAt = new Date();
    await removeImportWorkDir(jobId);
    await fs.unlink(job.payloadPath || '').catch(() => undefined);
    job.payloadPath = undefined;
  }
  await job.save();
  return job;
}

export async function rollbackProductImport(jobId: string, userId: string): Promise<IImportJob> {
  if (!mongoose.Types.ObjectId.isValid(jobId)) throw new ImportError('Invalid import job id.', 400);
  const job = await ImportJob.findById(jobId);
  if (!job) throw new ImportError('Import job not found.', 404);
  if (job.rolledBackAt) throw new ImportError('This import has already been rolled back.', 400);
  if (!job.rollbackPath || !job.rollbackExpiresAt || job.rollbackExpiresAt.getTime() < Date.now()) {
    throw new ImportError('The rollback window for this import has expired.', 400);
  }

  let data: { rows: Array<{ productId: string; status: string; before?: Record<string, unknown> }> };
  try {
    data = JSON.parse(await fs.readFile(job.rollbackPath, 'utf8'));
  } catch {
    throw new ImportError('The rollback snapshot is missing or unreadable.', 400);
  }

  for (const item of data.rows) {
    if (!item.productId) continue;
    if (item.status === 'created') {
      await Product.findByIdAndDelete(item.productId).catch(() => undefined);
    } else if (item.status === 'updated' && item.before) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.set(item.before);
        await product.save().catch(() => undefined);
      }
    }
  }

  await fs.unlink(job.rollbackPath).catch(() => undefined);
  job.rolledBackAt = new Date();
  job.rollbackPath = undefined;
  job.rollbackExpiresAt = undefined;
  await job.save();

  await AuditLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    action: AuditAction.DELETE,
    resource: 'product',
    status: 'success',
    details: { importJobId: job._id.toString(), rolledBack: true },
  }).catch(() => undefined);

  return job;
}

/** Mark jobs left mid-run by a restart. The UI can offer Resume afterwards. */
export async function markInterruptedImports(): Promise<number> {
  const result = await ImportJob.updateMany(
    { status: 'importing' },
    { $set: { status: 'failed', error: 'Import was interrupted by a server restart. Use Resume to continue.' } }
  );
  return result.modifiedCount || 0;
}

export async function commitProductImport(
  jobId: string,
  userId: string,
  options: CommitOptions = {},
  internal: { alreadyStarted?: boolean; resume?: boolean } = {}
): Promise<IImportJob> {
  if (!mongoose.Types.ObjectId.isValid(jobId)) throw new ImportError('Invalid import job id.', 400);

  const job = await ImportJob.findById(jobId);
  if (!job) throw new ImportError('Import job not found.', 404);
  if (job.mode !== 'create' && job.mode !== 'upsert') {
    throw new ImportError('Unsupported import mode.', 400);
  }
  if (!internal.alreadyStarted && job.status !== 'validated') {
    throw new ImportError('This import is not ready to commit. Validate the file again.', 400);
  }
  if (!job.payloadPath) throw new ImportError('The import payload is missing. Upload the file again.', 400);

  let payload: { rows: RowPayload[] };
  try {
    payload = JSON.parse(await fs.readFile(job.payloadPath, 'utf8'));
  } catch {
    throw new ImportError('The import payload expired. Upload the file again.', 400);
  }

  job.status = 'importing';
  job.startedAt = job.startedAt || new Date();
  job.cancelRequested = false;
  if (internal.resume) {
    job.processedRows = job.rows.filter((row) => ['created', 'updated', 'skipped'].includes(row.status)).length;
    job.created = job.rows.filter((row) => row.status === 'created').length;
    job.updated = job.rows.filter((row) => row.status === 'updated').length;
    job.skipped = job.rows.filter((row) => row.status === 'skipped').length;
    job.failed = job.rows.filter((row) => row.status === 'failed').length;
  } else {
    job.processedRows = 0;
    job.created = 0;
    job.updated = 0;
    job.skipped = 0;
    job.failed = 0;
  }
  await job.save();

  const tagUsage = new Map<string, number>();
  const rollbackRows: Array<{ row: number; productId: string; status: 'created' | 'updated'; before?: Record<string, unknown> }> = [];
  const started = Date.now();

  try {
    for (let index = 0; index < payload.rows.length; index += 50) {
      const chunk = payload.rows.slice(index, index + 50);

      const fresh = await ImportJob.findById(jobId).select('cancelRequested').lean();
      if (fresh?.cancelRequested) {
        job.status = 'cancelled';
        job.completedAt = new Date();
        await job.save();
        return job;
      }

      for (const entry of chunk) {
        const result = job.rows.find((row) => row.row === entry.row);
        if (!result) continue;
        if (internal.resume && ['created', 'updated', 'skipped'].includes(result.status)) continue;

        if (entry.action === 'skip') {
          result.status = 'skipped';
          job.skipped += 1;
          job.processedRows += 1;
          continue;
        }

        if (!entry.data) {
          result.status = 'failed';
          job.failed += 1;
          job.processedRows += 1;
          continue;
        }

        const data: any = { ...entry.data };
        if ((options.defaultStatus ?? 'draft') === 'draft') data.status = 'draft';
        if (entry.zipImages && entry.zipImages.length > 0) {
          const urls = await publishZipImages(entry.sku, entry.zipImages);
          if (urls.length > 0) data.images = urls;
        }

        try {
          if (entry.existingId) {
            const product = await Product.findById(entry.existingId);
            if (!product) throw new Error('The product no longer exists.');
            const before = snapshotProduct(product);
            product.set(data);
            await product.save();
            result.status = 'updated';
            result.productId = product._id.toString();
            result.issues = [];
            job.updated += 1;
            rollbackRows.push({ row: entry.row, productId: product._id.toString(), status: 'updated', before });

            for (const tagId of (product.tags || []) as any[]) {
              const key = String(tagId);
              tagUsage.set(key, (tagUsage.get(key) || 0) + 1);
            }
          } else {
            const product = new Product(data);
            await product.save();
            result.status = 'created';
            result.productId = product._id.toString();
            result.issues = [];
            job.created += 1;
            rollbackRows.push({ row: entry.row, productId: product._id.toString(), status: 'created' });

            for (const tagId of (product.tags || []) as any[]) {
              const key = String(tagId);
              tagUsage.set(key, (tagUsage.get(key) || 0) + 1);
            }
          }
        } catch (error: any) {
          result.status = 'failed';
          result.issues = [{
            message: error?.code === 11000
              ? 'A product with this SKU already exists.'
              : error?.message || 'Product could not be saved.',
          }];
          job.failed += 1;
        } finally {
          job.processedRows += 1;
        }
      }

      await job.save();
    }

    if (tagUsage.size > 0) {
      await Promise.all(
        [...tagUsage.entries()].map(([tagId, count]) =>
          Tag.updateOne({ _id: tagId }, { $inc: { usageCount: count } }).catch(() => undefined)
        )
      );
    }

    if (rollbackRows.length > 0) {
      const rollbackPath = path.join(importDir(), `${jobId}-rollback.json`);
      await fs.writeFile(rollbackPath, JSON.stringify({ rows: rollbackRows }), 'utf8');
      job.rollbackPath = rollbackPath;
      job.rollbackExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    job.status = 'completed';
    job.completedAt = new Date();
    job.summary.durationMs = Date.now() - started;
    job.processedRows = job.rows.filter((row) => ['created', 'updated', 'skipped', 'failed'].includes(row.status)).length;
    await job.save();

    await removeImportWorkDir(jobId);
    await fs.unlink(job.payloadPath).catch(() => undefined);
    job.payloadPath = undefined;
    await job.save();

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.CREATE,
      resource: 'product',
      status: 'success',
      details: {
        importJobId: job._id.toString(),
        fileName: job.fileName,
        mode: job.mode,
        totalRows: job.totalRows,
        created: job.created,
        updated: job.updated,
        skipped: job.skipped,
        failed: job.failed,
        durationMs: job.summary.durationMs,
      },
    }).catch(() => undefined);

    return job;
  } catch (error: any) {
    const message = error?.message || 'Import failed.';
    job.status = 'failed';
    job.error = message;
    job.completedAt = new Date();
    await job.save().catch(() => undefined);
    throw new ImportError(message, 500);
  }
}

export async function getImportJob(jobId: string): Promise<IImportJob> {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ImportError('Invalid import job id.', 400);
  }
  const job = await ImportJob.findById(jobId);
  if (!job) throw new ImportError('Import job not found.', 404);
  return job;
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  // Also neutralise formula characters when opening the report in Excel.
  const safe = /^[=+@]/.test(text) || (/^-/.test(text) && !/^-\d/.test(text)) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildImportReportCsv(job: IImportJob): string {
  const header = ['row', 'sku', 'status', 'productId', 'errors', 'warnings'];
  const lines = [header.join(',')];
  for (const row of job.rows) {
    lines.push([
      row.row,
      row.sku,
      row.status,
      row.productId || '',
      row.issues.map((e) => `${e.field ? `${e.field}: ` : ''}${e.message}`).join(' | '),
      row.warnings.join(' | '),
    ].map(csvEscape).join(','));
  }
  return `${lines.join('\r\n')}\r\n`;
}

export async function exportProductsCsv(query: Record<string, any> = {}): Promise<string> {
  const filter: any = {};
  const status = String(query.status || 'all');
  if (status && status !== 'all') filter.status = status;

  if (query.search) {
    const safe = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: new RegExp(safe, 'i') },
      { sku: new RegExp(safe, 'i') },
    ];
  }

  if (query.category) {
    const value = String(query.category);
    if (mongoose.Types.ObjectId.isValid(value)) {
      filter.category = value;
    } else {
      const category = await Category.findOne({
        $or: [{ slug: value.toLowerCase() }, { name: new RegExp(`^${value}$`, 'i') }],
      }).select('_id').lean();
      filter.category = category ? (category as any)._id : new mongoose.Types.ObjectId();
    }
  }

  const products = await Product.find(filter)
    .populate('category', 'slug name')
    .populate('tags', 'slug name')
    .sort({ createdAt: -1 })
    .limit(10000)
    .lean();

  const lines = [IMPORT_HEADERS.join(',')];
  for (const product of products as any[]) {
    const images = (product.images || []).map((image: any) =>
      typeof image === 'string' ? image : image?.url
    ).filter(Boolean);
    const tags = (product.tags || []).map((tag: any) =>
      typeof tag === 'object' ? (tag.slug || tag.name) : tag
    ).filter(Boolean);
    const category = product.category && typeof product.category === 'object'
      ? (product.category.slug || product.category.name)
      : product.category;
    const firstVideo = (product.videos || []).find((video: any) => video?.url)?.url || '';

    lines.push([
      product.name,
      product.sku,
      category || '',
      product.price ?? '',
      product.compareAtPrice ?? '',
      product.costPrice ?? '',
      product.stock ?? 0,
      product.status || 'draft',
      product.description || '',
      product.shortDescription || '',
      images.join('|'),
      tags.join('|'),
      (product.badges || []).join('|'),
      product.fit || '',
      product.fabric || '',
      product.pattern || '',
      product.occasion || '',
      (product.features || []).join('|'),
      (product.materials || []).join('|'),
      product.washCare || '',
      product.condition || 'new',
      product.warranty || '',
      product.shipping?.weight ?? '',
      product.shipping?.length ?? '',
      product.shipping?.width ?? '',
      product.shipping?.height ?? '',
      product.metadata?.metaTitle || '',
      product.metadata?.metaDescription || '',
      firstVideo,
      '',
    ].map(csvEscape).join(','));
  }

  return `${lines.join('\r\n')}\r\n`;
}

export function buildImportTemplateCsv(): string {
  const header = IMPORT_HEADERS.join(',');
  const rows = [
    [
      'Oversized Heavyweight Tee',
      'MT-TS-001',
      't-shirts',
      '799',
      '1299',
      '420',
      '40',
      'draft',
      '240 GSM combed cotton, boxy fit.',
      'Heavyweight everyday tee.',
      'https://cdn.example.com/mt-ts-001-1.jpg|https://cdn.example.com/mt-ts-001-2.jpg',
      'oversized|new',
      'bestseller',
      'Oversized',
      'Cotton',
      'Solid',
      'Casual',
      'Breathable fabric|Everyday comfort',
      '100% cotton',
      'Machine wash cold',
      'new',
      '',
      '500',
      '30',
      '25',
      '3',
      'Oversized Heavyweight Tee | Mentoos',
      'Premium 240 GSM oversized tee in black.',
      '',
      '',
    ],
    [
      'Pure Linen Mandarin Shirt',
      'MT-SH-014',
      'shirts',
      '1199',
      '1799',
      '640',
      '24',
      'draft',
      'Breathable linen blend with a mandarin collar.',
      'Linen mandarin-collar shirt.',
      'https://cdn.example.com/mt-sh-014-1.jpg',
      'linen|summer',
      'new',
      'Regular Fit',
      'Linen',
      'Solid',
      'Casual',
      'Breathable|Lightweight',
      'Linen blend',
      'Gentle wash',
      'new',
      '',
      '350',
      '32',
      '26',
      '4',
      '',
      '',
      '',
      '',
    ],
    [
      'Multi-Pocket Cargo Joggers',
      'MT-JG-003',
      'joggers',
      '1299',
      '1899',
      '720',
      '32',
      'draft',
      'Tapered cargo joggers with six utility pockets.',
      'Utility cargo jogger.',
      'https://cdn.example.com/mt-jg-003-1.jpg',
      'cargo|streetwear',
      'trending',
      'Tapered',
      'Cotton Fleece',
      'Solid',
      'Casual',
      'Six pockets|Elastic drawstring',
      'Cotton fleece',
      'Machine wash',
      'new',
      '',
      '600',
      '34',
      '28',
      '5',
      '',
      '',
      '',
      '',
    ],
  ];

  return [header, ...rows.map((row) => row.map(csvEscape).join(','))].join('\r\n') + '\r\n';
}
