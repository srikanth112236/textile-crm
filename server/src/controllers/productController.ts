import { Request, Response } from 'express';
import { 
  Product, 
  IProduct, 
  IReview, 
  IVariation, 
  IVariationOption,
  IVariantAttribute,
  IVariantSKU,
  ISpecification,
  IVolumePricing,
} from '../models/Product';
import { Category } from '../models/Category';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { Settings } from '../models/Settings';
import { normalizeShipping, validateVariantAttributes, applyVariantWeightDefaults } from '../utils/shiprocketReady';
import Joi from 'joi';
import mongoose from 'mongoose';
import { requireCustomer } from '../utils/requireCustomer';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

// Legacy variation schemas (backwards compatibility)
const variationSchema = Joi.object({
  name: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
  priceModifier: Joi.number().default(0),
  stock: Joi.number().min(0).optional(),
  sku: Joi.string().trim().optional(),
});

const variationOptionSchema = Joi.object({
  type: Joi.string().trim().required(),
  values: Joi.array().items(Joi.string()).min(1).required(),
});

// Advanced Variant Attribute Option schema
const variantAttributeOptionSchema = Joi.object({
  value: Joi.string().trim().required(),
  label: Joi.string().trim().optional().allow(''),
  colorCode: Joi.string().trim().optional().allow('').regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  imageUrl: Joi.string().trim().optional().allow(''),
  sortOrder: Joi.number().min(0).default(0),
});

// Advanced Variant Attribute schema
const variantAttributeSchema = Joi.object({
  name: Joi.string().trim().required(),
  displayName: Joi.string().trim().optional().allow(''),
  type: Joi.string().valid('color', 'size', 'text', 'image', 'button').default('button'),
  options: Joi.array().items(variantAttributeOptionSchema).min(1).required(),
  required: Joi.boolean().default(true),
});

// Variant SKU schema
const variantSKUSchema = Joi.object({
  _id: Joi.string().optional(),
  sku: Joi.string().trim().uppercase().required(),
  attributes: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  price: Joi.number().min(0).required(),
  compareAtPrice: Joi.number().min(0).optional().allow(null),
  costPrice: Joi.number().min(0).optional().allow(null),
  stock: Joi.number().min(0).default(0),
  lowStockThreshold: Joi.number().min(0).optional(),
  weight: Joi.number().min(0).optional().allow(null),
  barcode: Joi.string().trim().optional().allow(''),
  images: Joi.array().items(Joi.string()).default([]),
  isDefault: Joi.boolean().default(false),
  isEnabled: Joi.boolean().default(true),
  position: Joi.number().min(0).default(0),
});

// Brand schema
const brandSchema = Joi.object({
  name: Joi.string().trim().required(),
  slug: Joi.string().trim().optional().allow(''),
  logo: Joi.string().trim().optional().allow(''),
  website: Joi.string().uri().optional().allow(''),
});

// Specification schema
const specificationSchema = Joi.object({
  group: Joi.string().trim().optional().allow(''),
  name: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
  unit: Joi.string().trim().optional().allow(''),
});

// Shipping info schema
const shippingInfoSchema = Joi.object({
  weight: Joi.number().min(0).optional().allow(null),
  weightUnit: Joi.string().valid('g', 'kg', 'oz', 'lb').default('g'),
  length: Joi.number().min(0).optional().allow(null),
  width: Joi.number().min(0).optional().allow(null),
  height: Joi.number().min(0).optional().allow(null),
  dimensionUnit: Joi.string().valid('cm', 'in', 'm').default('cm'),
  shippingClass: Joi.string().trim().optional().allow(''),
  requiresShipping: Joi.boolean().default(true),
  freeShipping: Joi.boolean().default(false),
});

// Digital product schema
const digitalProductSchema = Joi.object({
  isDigital: Joi.boolean().default(false),
  downloadLimit: Joi.number().min(0).optional().allow(null),
  downloadExpiry: Joi.number().min(0).optional().allow(null),
  files: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    url: Joi.string().trim().required(),
    size: Joi.number().min(0).optional(),
    type: Joi.string().trim().optional(),
  })).optional(),
});

// Volume pricing schema
const volumePricingSchema = Joi.object({
  minQuantity: Joi.number().min(1).required(),
  maxQuantity: Joi.number().min(1).optional().allow(null),
  price: Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(100).optional(),
});

// Product identifiers schema
const productIdentifiersSchema = Joi.object({
  gtin: Joi.string().trim().optional().allow(''),
  upc: Joi.string().trim().optional().allow(''),
  ean: Joi.string().trim().optional().allow(''),
  isbn: Joi.string().trim().optional().allow(''),
  mpn: Joi.string().trim().optional().allow(''),
});

// Inventory settings schema
const inventorySettingsSchema = Joi.object({
  trackInventory: Joi.boolean().default(true),
  allowBackorder: Joi.boolean().default(false),
  backorderLimit: Joi.number().min(0).optional().allow(null),
  soldIndividually: Joi.boolean().default(false),
  lowStockThreshold: Joi.number().min(0).default(10),
  outOfStockThreshold: Joi.number().min(0).default(0),
});

// Visibility schema
const visibilitySchema = Joi.object({
  visibility: Joi.string().valid('visible', 'catalog', 'search', 'hidden').default('visible'),
  featured: Joi.boolean().default(false),
  publishDate: Joi.date().optional().allow(null),
  unpublishDate: Joi.date().optional().allow(null),
  password: Joi.string().trim().optional().allow(''),
});

// Related products schema
const relatedProductsSchema = Joi.object({
  crossSells: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  upSells: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  frequentlyBoughtTogether: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  accessories: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
});

// Custom URI validator that accepts full URIs, relative paths, and data URLs
// This is more flexible than Joi's .uri() which is too strict
const uriOrPathValidator = Joi.string().custom((value, helpers) => {
  // Allow empty strings (handled by optional/allow(''))
  if (!value || value.trim() === '') {
    return value;
  }
  
  // Check if it's a valid full URI
  try {
    new URL(value);
    return value; // Valid full URI
  } catch {
    // Not a full URI, check if it's a relative path or data URL
    if (value.startsWith('/') || value.startsWith('data:')) {
      return value; // Valid relative path or data URL
    }
    // Invalid format
    return helpers.error('string.uriOrPath');
  }
}, 'URI or path validation').messages({
  'string.uriOrPath': '{{#label}} must be a valid URI (http://, https://), relative path (starting with /), or data URL (data:)',
});

const metadataSchema = Joi.object({
  metaTitle: Joi.string().max(60).trim().optional().allow(''),
  metaDescription: Joi.string().max(160).trim().optional().allow(''),
  metaKeywords: Joi.array().items(Joi.string().trim()).optional(),
  ogTitle: Joi.string().max(60).trim().optional().allow(''),
  ogDescription: Joi.string().max(200).trim().optional().allow(''),
  ogImage: uriOrPathValidator.optional().allow(''),
  twitterCard: Joi.string().valid('summary', 'summary_large_image', 'app', 'player').optional(),
  canonicalUrl: uriOrPathValidator.optional().allow(''),
  structuredData: Joi.object().optional(),
});

const productImageSchema = Joi.alternatives().try(
  uriOrPathValidator.required(),
  Joi.object({
    url: uriOrPathValidator.required(),
    altText: Joi.string().trim().max(200).optional().allow('', null),
  }).required()
);

const createProductSchema = Joi.object({
  // Basic Info
  name: Joi.string().max(200).trim().required(),
  slug: Joi.string().trim().optional().allow(''),
  shortDescription: Joi.string().max(500).trim().optional().allow(''),
  description: Joi.string().max(10000).trim().required(),
  
  // Categorization
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  tags: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  
  // Media
  images: Joi.array().items(productImageSchema).min(1).required(),
  videos: Joi.array().items(Joi.object({
    url: Joi.string().trim().required(),
    thumbnailUrl: Joi.string().trim().optional().allow(''),
    title: Joi.string().trim().optional().allow(''),
  })).optional(),
  
  // Advanced Variants
  hasVariants: Joi.boolean().default(false),
  variantAttributes: Joi.array().items(variantAttributeSchema).optional(),
  variantSKUs: Joi.array().items(variantSKUSchema).optional(),
  
  // Legacy Variants (backwards compatibility)
  variations: Joi.array().items(variationSchema).optional(),
  variationOptions: Joi.array().items(variationOptionSchema).optional(),
  
  // Pricing
  price: Joi.number().min(0).required(),
  compareAtPrice: Joi.number().min(0).optional().allow(null),
  costPrice: Joi.number().min(0).optional().allow(null),
  volumePricing: Joi.array().items(volumePricingSchema).optional(),
  
  // Inventory
  stock: Joi.number().min(0).default(0),
  sku: Joi.string().pattern(/^[A-Z0-9\-_]+$/).uppercase().trim().required(),
  inventory: inventorySettingsSchema.optional(),
  lowStockThreshold: Joi.number().min(0).default(10),
  
  // Product Details
  brand: brandSchema.optional().allow(null),
  specifications: Joi.array().items(specificationSchema).optional(),
  features: Joi.array().items(Joi.string().trim()).optional(),
  materials: Joi.array().items(Joi.string().trim()).optional(),
  fit: Joi.string().trim().max(100).optional().allow(''),
  fabric: Joi.string().trim().max(100).optional().allow(''),
  pattern: Joi.string().trim().max(100).optional().allow(''),
  occasion: Joi.string().trim().max(100).optional().allow(''),
  washCare: Joi.string().trim().max(1000).optional().allow(''),
  sizeChart: Joi.array().items(
    Joi.object({
      size: Joi.string().trim().max(10).required(),
      chest: Joi.string().trim().max(20).optional().allow(''),
      shoulder: Joi.string().trim().max(20).optional().allow(''),
      length: Joi.string().trim().max(20).optional().allow(''),
      sleeve: Joi.string().trim().max(20).optional().allow(''),
      waist: Joi.string().trim().max(20).optional().allow(''),
      hip: Joi.string().trim().max(20).optional().allow(''),
      thigh: Joi.string().trim().max(20).optional().allow(''),
      bottom: Joi.string().trim().max(20).optional().allow(''),
    })
  ).max(30).optional(),
  modelHeight: Joi.string().trim().max(20).optional().allow(''),
  modelSizeWorn: Joi.string().trim().max(10).optional().allow(''),
  badges: Joi.array().items(Joi.string().valid('bestseller', 'trending', 'limited', 'new', 'sale')).optional(),
  condition: Joi.string().valid('new', 'refurbished', 'used', 'like_new').default('new'),
  warranty: Joi.string().trim().optional().allow(''),
  
  // Identifiers
  identifiers: productIdentifiersSchema.optional(),
  
  // Shipping & Fulfillment
  shipping: shippingInfoSchema.optional(),
  digital: digitalProductSchema.optional(),
  
  // Visibility & Status
  status: Joi.string().valid('draft', 'active', 'inactive', 'out_of_stock', 'discontinued', 'scheduled').default('draft'),
  visibility: visibilitySchema.optional(),
  
  // Related Products
  relatedProducts: relatedProductsSchema.optional(),
  
  // SEO
  metadata: metadataSchema.optional(),
});

const updateProductSchema = Joi.object({
  // Basic Info
  name: Joi.string().max(200).trim().optional(),
  slug: Joi.string().trim().optional().allow(''),
  shortDescription: Joi.string().max(500).trim().optional().allow(''),
  description: Joi.string().max(10000).trim().optional(),
  
  // Categorization
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  tags: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  
  // Media
  images: Joi.array().items(productImageSchema).optional(),
  videos: Joi.array().items(Joi.object({
    url: Joi.string().trim().required(),
    thumbnailUrl: Joi.string().trim().optional().allow(''),
    title: Joi.string().trim().optional().allow(''),
  })).optional(),
  
  // Advanced Variants
  hasVariants: Joi.boolean().optional(),
  variantAttributes: Joi.array().items(variantAttributeSchema).optional(),
  variantSKUs: Joi.array().items(variantSKUSchema).optional(),
  
  // Legacy Variants (backwards compatibility)
  variations: Joi.array().items(variationSchema).optional(),
  variationOptions: Joi.array().items(variationOptionSchema).optional(),
  
  // Pricing
  price: Joi.number().min(0).optional(),
  compareAtPrice: Joi.number().min(0).optional().allow(null),
  costPrice: Joi.number().min(0).optional().allow(null),
  volumePricing: Joi.array().items(volumePricingSchema).optional(),
  
  // Inventory
  stock: Joi.number().min(0).optional(),
  sku: Joi.string().pattern(/^[A-Z0-9\-_]+$/).uppercase().trim().optional(),
  inventory: inventorySettingsSchema.optional(),
  lowStockThreshold: Joi.number().min(0).optional(),
  
  // Product Details
  brand: brandSchema.optional().allow(null),
  specifications: Joi.array().items(specificationSchema).optional(),
  features: Joi.array().items(Joi.string().trim()).optional(),
  materials: Joi.array().items(Joi.string().trim()).optional(),
  fit: Joi.string().trim().max(100).optional().allow(''),
  fabric: Joi.string().trim().max(100).optional().allow(''),
  pattern: Joi.string().trim().max(100).optional().allow(''),
  occasion: Joi.string().trim().max(100).optional().allow(''),
  washCare: Joi.string().trim().max(1000).optional().allow(''),
  sizeChart: Joi.array().items(
    Joi.object({
      size: Joi.string().trim().max(10).required(),
      chest: Joi.string().trim().max(20).optional().allow(''),
      shoulder: Joi.string().trim().max(20).optional().allow(''),
      length: Joi.string().trim().max(20).optional().allow(''),
      sleeve: Joi.string().trim().max(20).optional().allow(''),
      waist: Joi.string().trim().max(20).optional().allow(''),
      hip: Joi.string().trim().max(20).optional().allow(''),
      thigh: Joi.string().trim().max(20).optional().allow(''),
      bottom: Joi.string().trim().max(20).optional().allow(''),
    })
  ).max(30).optional(),
  modelHeight: Joi.string().trim().max(20).optional().allow(''),
  modelSizeWorn: Joi.string().trim().max(10).optional().allow(''),
  badges: Joi.array().items(Joi.string().valid('bestseller', 'trending', 'limited', 'new', 'sale')).optional(),
  condition: Joi.string().valid('new', 'refurbished', 'used', 'like_new').optional(),
  warranty: Joi.string().trim().optional().allow(''),
  
  // Identifiers
  identifiers: productIdentifiersSchema.optional(),
  
  // Shipping & Fulfillment
  shipping: shippingInfoSchema.optional(),
  digital: digitalProductSchema.optional(),
  
  // Visibility & Status
  status: Joi.string().valid('draft', 'active', 'inactive', 'out_of_stock', 'discontinued', 'scheduled').optional(),
  visibility: visibilitySchema.optional(),
  
  // Related Products
  relatedProducts: relatedProductsSchema.optional(),
  
  // SEO
  metadata: metadataSchema.optional(),
});

// Get products with pagination, filters, and search
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      status,
      minPrice,
      maxPrice,
      search,
      sort = 'createdAt',
      order = 'desc',
      lowStock,
      recent,
      color,
      size,
      fit,
      fabric,
      pattern,
      occasion,
      minRating,
      minDiscount,
      inStock,
      badge,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    // Status filter (public users only see active products, admin can see all)
    if (status && (status === 'draft' || status === 'active' || status === 'inactive' || status === 'out_of_stock' || status === 'discontinued')) {
      filter.status = status;
    } else {
      // Default: show only active products for non-admin users
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        filter.status = 'active';
      }
    }

    // Category filter (supports both ObjectId and category slug)
    // Fast path: exact slug match hits the indexed field; regex fallback only on miss.
    // Hierarchy-aware: a parent (Trousers, Activewear, Ethnic Wear) also matches
    // its children's products, so umbrella links never go empty after the leaf split.
    const subtreeIds = async (catId: any): Promise<any[]> => {
      const kids = await Category.find({ parent: catId }).select('_id').lean();
      return [catId, ...kids.map((k: any) => k._id)];
    };
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        filter.category = { $in: await subtreeIds(category) };
      } else {
        const slugKey = (category as string).toLowerCase();
        let catObj = await Category.findOne({ slug: slugKey }).select('_id').lean();
        if (!catObj) {
          catObj = await Category.findOne({
            $or: [
              { slug: slugKey },
              { name: new RegExp(`^${slugKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            ],
          }).select('_id').lean();
        }
        if (catObj) {
          filter.category = { $in: await subtreeIds((catObj as any)._id) };
        } else {
          filter.category = new mongoose.Types.ObjectId();
        }
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
    }

    // Color filter (supports single or comma-separated colors, e.g. Black, Navy)
    // Relaxed: matches across name + description + variants (previously omitted
    // `description`, hiding products whose color only appeared there). Skipped
    // when the search text already contains the color word — the tokenized
    // search below covers it, and double-constraining over-filters.
    if (color && typeof color === 'string') {
      const colors = color.split(',').map((c) => c.trim()).filter(Boolean);
      const searchTokens =
        search && typeof search === 'string' ? search.toLowerCase().split(/\s+/) : [];
      const norm = (s: string) => s.toLowerCase().replace(/^gray$/, 'grey');
      const remaining = colors.filter((c) => !searchTokens.map(norm).includes(norm(c)));
      if (remaining.length > 0) {
        const escC = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const colorRegexes = remaining.map((c) => new RegExp(escC(c), 'i'));
        filter.$or = filter.$or || [];
        // Match product name, description or variant attribute options
        filter.$or.push(
          ...colorRegexes.flatMap((cr) => [
            { name: cr },
            { shortDescription: cr },
            { description: cr },
            { sku: cr },
            { 'variantAttributes.options.value': cr },
          ])
        );
      }
    }

    // Size filter (supports single or comma-separated sizes, e.g. S, M, L, XL, XXL)
    if (size && typeof size === 'string') {
      const sizes = size.split(',').map((s) => s.trim()).filter(Boolean);
      if (sizes.length > 0) {
        filter['variantAttributes.options.value'] = {
          $in: sizes.map((s) => new RegExp(`^${s}$`, 'i')),
        };
      }
    }

    // Recently added filter - products created in the last 7 days
    if (recent === 'true') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filter.createdAt = { $gte: sevenDaysAgo };
    }

    // Phase B: merchandising filters (fit / fabric / pattern / occasion)
    const csvIn = (v: unknown): string[] =>
      typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
    for (const [key, field] of [['fit', 'fit'], ['fabric', 'fabric'], ['pattern', 'pattern'], ['occasion', 'occasion']] as Array<[string, string]>) {
      const vals = csvIn((req.query as any)[key]);
      if (vals.length > 0) {
        filter[field] = { $in: vals.map((s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) };
      }
    }

    // Rating filter (minimum average rating)
    if (minRating) {
      const r = parseFloat(minRating as string);
      if (!Number.isNaN(r)) filter.averageRating = { $gte: r };
    }

    // Availability filter (in stock only)
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    // Badge filter: stored badges + computed sale/new
    if (badge && typeof badge === 'string') {
      const badges = csvIn(badge).map((b) => b.toLowerCase());
      const or: any[] = [];
      const stored = badges.filter((b) => ['bestseller', 'trending', 'limited'].includes(b));
      if (stored.length > 0) or.push({ badges: { $in: stored } });
      if (badges.includes('sale')) {
        or.push({ $expr: { $gt: ['$compareAtPrice', '$price'] } });
      }
      if (badges.includes('new')) {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        or.push({ createdAt: { $gte: twoWeeksAgo } });
      }
      if (or.length === 1) {
        Object.assign(filter, or[0]);
      } else if (or.length > 1) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: or });
      }
    }

    // Discount filter (minimum discount %)
    const minDisc = minDiscount ? parseFloat(minDiscount as string) : NaN;
    const needsDiscountCalc = !Number.isNaN(minDisc) || sort === 'discount';
    if (!Number.isNaN(minDisc)) {
      filter.$expr = {
        $gte: [
          {
            $cond: [
              { $gt: ['$compareAtPrice', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$compareAtPrice', '$price'] }, '$compareAtPrice'] }, 100] },
              0,
            ],
          },
          minDisc,
        ],
      };
    }

    // Tokenized multi-word search: "Black Shirt" matches products containing BOTH
    // tokens anywhere (name/desc/sku/variant/category) — not just the exact phrase.
    // Hoisted helpers (fieldsFor/groupsFor) are reused by the zero-result
    // fallback chain after the main query runs.
    const hasTextSearch = search && typeof search === 'string' && search.trim().length > 0;
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fieldsFor = (rx: RegExp) => [
      { name: rx },
      { shortDescription: rx },
      { description: rx },
      { sku: rx },
      { 'variantAttributes.options.value': rx },
      { fit: rx },
      { fabric: rx },
      { pattern: rx },
      { occasion: rx },
    ];
    // Words that carry no product meaning — dropped during fallback retries so
    // "best shirts under 999" / "vest price 999" / "shirt with 999" still resolve.
    const SEARCH_STOPWORDS = new Set([
      'best', 'top', 'with', 'within', 'without', 'price', 'prices', 'rs', 'inr',
      'under', 'below', 'above', 'over', 'than', 'less', 'more', 'for', 'men',
      'mens', 'buy', 'shop', 'show', 'find', 'get', 'please', 'me', 'my',
      'product', 'products', 'item', 'items', 'combo', 'offer', 'offers', 'deal',
      'deals', 'good', 'nice', 'new', 'latest', 'cheap', 'stylish', 'trendy',
      'premium', 'original', 'branded', 'fancy', 'a', 'an', 'the', 'and', 'or',
    ]);
    const isStopToken = (t: string) => SEARCH_STOPWORDS.has(t.toLowerCase()) || /^\d+$/.test(t);
    let searchTokens: string[] = [];
    let searchCats: any[] = [];
    // Snapshot of all non-text filters — fallback retries rebuild from this so
    // price/color/category choices survive while text matching is relaxed.
    let preTextFilter: any = null;
    try {
      preTextFilter = structuredClone(filter);
    } catch {
      preTextFilter = { ...filter };
    }
    const catIdsFor = (t: string, cats: any[]): any[] => {
      const rx = new RegExp(esc(t), 'i');
      return cats
        .filter(
          (c: any) => rx.test(c.name || '') || rx.test(c.slug || '') || rx.test(c.description || '')
        )
        .map((c: any) => c._id);
    };
    const groupsFor = (toks: string[], cats: any[]): any[] =>
      toks.map((t) => {
        const rx = new RegExp(esc(t), 'i');
        const ors: any[] = fieldsFor(rx);
        const ids = catIdsFor(t, cats);
        if (ids.length > 0) ors.push({ category: { $in: ids } });
        return { $or: ors };
      });
    if (hasTextSearch && lowStock !== 'true') {
      const cleanSearch = (search as string).trim().replace(/\s+/g, ' ');
      const tokens = cleanSearch.split(' ').filter((t) => t.length > 0).slice(0, 6);

      // Category ids matching ANY token (so "shirt" pulls Shirts category).
      // Fetched once, then partitioned PER TOKEN below — a token group must
      // only see categories matching THAT token, otherwise "Black Shirt"
      // degrades to "everything in shirt categories".
      const catOr = tokens.flatMap((t) => {
        const rx = new RegExp(esc(t), 'i');
        return [{ name: rx }, { slug: rx }, { description: rx }];
      });
      const matchingCats = await Category.find({ $or: catOr })
        .select('_id name slug description')
        .lean();
      searchTokens = tokens;
      searchCats = matchingCats;
      const matchingCatIds = matchingCats.map((c: any) => c._id);

      // Per-token OR group; tokens combined with AND so every word must match somewhere.
      // Each group only includes categories matching THAT token (per-token
      // scoping — see above), so "Black" must match the product, not just
      // ride along on the "Shirt" category.
      const tokenGroups: any[] = groupsFor(tokens, matchingCats);

      // Exact-phrase group kept as a boost alternative (single $or) for SKU/exact matches
      const exactRx = new RegExp(esc(cleanSearch), 'i');
      const exactOr: any[] = fieldsFor(exactRx);
      if (matchingCatIds.length > 0) exactOr.push({ category: { $in: matchingCatIds } });

      const searchClause: any = tokenGroups.length > 1 ? { $and: tokenGroups } : tokenGroups[0];
      // Combine exact-phrase OR with token AND: match either (helps SKU + phrase)
      const combined = { $or: [exactOr.length === 1 ? exactOr[0] : { $or: exactOr }, searchClause] };

      if (filter.$or) {
        // Combine existing $or (like color) with search using $and
        filter.$and = filter.$and || [];
        filter.$and.push(combined);
      } else {
        // Flatten: if no prior $or, use AND of token groups directly (faster index use)
        if (tokenGroups.length > 1) {
          filter.$and = filter.$and || [];
          filter.$and.push(...tokenGroups);
          // Also allow exact-phrase matches via separate $or with category? covered above.
        } else {
          filter.$or = (tokenGroups[0] as any).$or;
        }
      }
    }

    // Sort options
    const sortOptions: any = {};
    if (sort === 'price') {
      sortOptions.price = order === 'asc' ? 1 : -1;
    } else if (sort === 'rating') {
      sortOptions.averageRating = order === 'asc' ? 1 : -1;
    } else if (sort === 'name') {
      sortOptions.name = order === 'asc' ? 1 : -1;
    } else if (sort === 'best-selling') {
      // Proxy: most reviewed = most bought
      sortOptions.totalReviews = -1;
      sortOptions.averageRating = -1;
    } else if (sort === 'recommended') {
      sortOptions['visibility.featured'] = -1;
      sortOptions.averageRating = -1;
      sortOptions.createdAt = -1;
    } else if (sort === 'discount') {
      // Handled via aggregation (computed discount %); fallback keeps newest
      sortOptions.createdAt = -1;
    } else {
      sortOptions.createdAt = order === 'asc' ? 1 : -1;
    }

    // Execute query - use aggregation for low stock filter
    let products: any[];
    let total: number;

    if (lowStock === 'true') {
      // Use aggregation to properly filter by comparing stock with lowStockThreshold
      // Build match filter without $text (not supported in aggregation)
      const aggregationFilter: any = { ...filter };
      delete aggregationFilter.$text; // Remove $text as it's not supported in aggregation
      
      const aggregationPipeline: any[] = [
        { $match: aggregationFilter },
        {
          $addFields: {
            isLowStock: {
              $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }],
            },
          },
        },
        { $match: { isLowStock: true } },
      ];
      
      // Add text search filter if present (using $match with regex as fallback)
      if (hasTextSearch) {
        aggregationPipeline.splice(1, 0, {
          $match: {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { sku: { $regex: search, $options: 'i' } },
            ],
          },
        });
      }

      // Add sort stage
      if (Object.keys(sortOptions).length > 0) {
        aggregationPipeline.push({ $sort: sortOptions });
      }

      // Add pagination
      aggregationPipeline.push({ $skip: skip }, { $limit: limitNum });

      // Add category population
      aggregationPipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      });
      aggregationPipeline.push({
        $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
      });
      // Don't restrict fields - return all product data
      // The category is already populated via $lookup

      // Count pipeline
      const countPipeline: any[] = [
        { $match: aggregationFilter },
        {
          $addFields: {
            isLowStock: {
              $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }],
            },
          },
        },
        { $match: { isLowStock: true } },
      ];
      
      // Add text search to count pipeline if present
      if (hasTextSearch) {
        countPipeline.push({
          $match: {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { sku: { $regex: search, $options: 'i' } },
            ],
          },
        });
      }
      
      countPipeline.push({ $count: 'total' });

      const [productsResult, countResult] = await Promise.all([
        Product.aggregate(aggregationPipeline),
        Product.aggregate(countPipeline),
      ]);

      products = productsResult;
      total = countResult[0]?.total || 0;
    } else if (sort === 'discount') {
      // Discount sort needs computed % off — aggregation path
      const discountFilter: any = { ...filter };
      const discountPipeline: any[] = [
        { $match: discountFilter },
        {
          $addFields: {
            discountPct: {
              $cond: [
                { $gt: ['$compareAtPrice', 0] },
                { $multiply: [{ $divide: [{ $subtract: ['$compareAtPrice', '$price'] }, '$compareAtPrice'] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { discountPct: order === 'asc' ? 1 : -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      ];
      const [discountProducts, discountCount] = await Promise.all([
        Product.aggregate(discountPipeline),
        Product.countDocuments(discountFilter),
      ]);
      products = discountProducts;
      total = discountCount;
    } else {
      // Regular query for other filters — find + count in parallel
      // (sequential awaits doubled Atlas round-trip latency on every PLP hit).
      const findQuery = Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
      const [found, counted] = await Promise.all([findQuery, Product.countDocuments(filter)]);
      products = found;
      total = counted;
    }

    // SKU exact-match boost: a single SKU-like token (e.g. MT-TSH-001) substring-
    // matches many rows; lift exact SKU hits to the top of this page so the
    // typed product code resolves immediately instead of hiding in the list.
    try {
      const rawQ =
        search && typeof search === 'string' ? search.trim().replace(/\s+/g, ' ') : '';
      if (rawQ && !rawQ.includes(' ') && /^[a-z0-9-]{4,}$/i.test(rawQ) && /\d/.test(rawQ)) {
        const qLower = rawQ.toLowerCase();
        products = [...products].sort((a: any, b: any) => {
          const aExact = String(a?.sku || '').toLowerCase() === qLower ? 0 : 1;
          const bExact = String(b?.sku || '').toLowerCase() === qLower ? 0 : 1;
          return aExact - bExact;
        });
      }
    } catch { /* ranking is best-effort */ }

    // Zero-result fallback chain: NEVER return an empty shelf for a typed
    // search when the catalog has related products. Retries run only when the
    // strict query hit zero, cheapest first, reusing the non-text filters
    // (price/color/category) so user intent survives relaxation.
    let fallback: { relaxed: boolean; strategy?: string; appliedQuery?: string } | null = null;
    if (hasTextSearch && total === 0 && searchTokens.length > 0 && preTextFilter) {
      const runRegular = async (f: any): Promise<{ rows: any[]; count: number }> => {
        const [rows, count] = await Promise.all([
          Product.find(f).populate('category', 'name slug').sort(sortOptions).skip(skip).limit(limitNum).lean(),
          Product.countDocuments(f),
        ]);
        return { rows, count };
      };
      const cloneBase = (): any => {
        try {
          return structuredClone(preTextFilter);
        } catch {
          return { ...preTextFilter };
        }
      };

      // Attempt 1: drop stopwords / bare numbers ("best shirts" → "shirts",
      // "vest price 999" → "vest", "shirt with 999" → "shirt").
      const meaningful = searchTokens.filter((t) => !isStopToken(t));
      if (!fallback && meaningful.length > 0 && meaningful.length < searchTokens.length) {
        const f = cloneBase();
        f.$and = f.$and || [];
        f.$and.push(...groupsFor(meaningful, searchCats));
        const r = await runRegular(f);
        if (r.count > 0) {
          products = r.rows;
          total = r.count;
          fallback = { relaxed: true, strategy: 'stopwords', appliedQuery: meaningful.join(' ') };
        }
      }

      // Attempt 2: ANY word may match (OR across tokens, other filters kept).
      if (!fallback) {
        const f = cloneBase();
        const anyOr: any[] = searchTokens.flatMap((t) => {
          const rx = new RegExp(esc(t), 'i');
          const ors: any[] = fieldsFor(rx);
          const ids = catIdsFor(t, searchCats);
          if (ids.length > 0) ors.push({ category: { $in: ids } });
          return ors;
        });
        // Dedupe identical conditions to keep the query small
        const seen = new Set<string>();
        const deduped = anyOr.filter((c) => {
          const k = JSON.stringify(c);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        // Preserve a base $or (e.g. color filter) — AND the relaxed text with it.
        if ((f as any).$or) {
          f.$and = f.$and || [];
          f.$and.push({ $or: deduped });
        } else {
          f.$or = deduped;
        }
        const r = await runRegular(f);
        if (r.count > 0) {
          products = r.rows;
          total = r.count;
          fallback = { relaxed: true, strategy: 'any-word', appliedQuery: searchTokens.join(' ') };
        }
      }

      // Attempt 3: same category/price shelf, text dropped ("more like this").
      if (!fallback) {
        const f = cloneBase();
        const catIds = searchCats.map((c: any) => c._id);
        if (!f.category && catIds.length > 0) f.category = { $in: catIds };
        const r = await runRegular(f);
        if (r.count > 0) {
          products = r.rows;
          total = r.count;
          fallback = { relaxed: true, strategy: 'category', appliedQuery: '' };
        }
      }

      // Attempt 4 (last resort): newest products honoring only price/color —
      // text AND category dropped, so a shelf is virtually always returned.
      if (!fallback) {
        const f = cloneBase();
        delete f.category;
        const r = await runRegular(f);
        if (r.count > 0) {
          products = r.rows;
          total = r.count;
          fallback = { relaxed: true, strategy: 'popular', appliedQuery: '' };
        }
      }
    }

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      fallback,
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single product
// Phase 8: Also tracks product view for recommendations
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID format' });
      return;
    }

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('tags', 'name slug color'); // Phase 8: Populate tags

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check if product is active (for non-admin users)
    // Allow access if:
    // 1. Product is active (public access)
    // 2. User is authenticated and is admin or superadmin (can see all statuses)
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    
    if (product.status !== 'active' && !isAdmin) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Phase 8: Track product view for authenticated users
    const userId = req.user?.userId;
    if (userId) {
      const { trackProductView } = await import('../services/recommendations');
      trackProductView(userId, id).catch((err) => {
        console.error('Error tracking product view:', err);
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create product (Admin/Superadmin only)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = createProductSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Validate category exists
    const category = await Category.findById(value.category);
    if (!category) {
      res.status(400).json({ error: 'Category not found' });
      return;
    }

    // Phase 0: Shiprocket-ready normalization (weight/dimensions + Size attribute)
    try {
      const settings = await Settings.findOne({ key: 'global' });
      const defaults = {
        weightG: settings?.shipping.defaultWeightG ?? 500,
        lengthCm: settings?.shipping.defaultLengthCm ?? 30,
        widthCm: settings?.shipping.defaultWidthCm ?? 25,
        heightCm: settings?.shipping.defaultHeightCm ?? 3,
      };
      const { shipping, warnings } = normalizeShipping(value.shipping, defaults);
      value.shipping = { ...(value.shipping || {}), ...shipping };
      if (value.hasVariants && value.variantAttributes) {
        const variantError = validateVariantAttributes(value.variantAttributes);
        if (variantError) {
          res.status(400).json({ error: variantError });
          return;
        }
      }
      if (value.hasVariants && value.variantSKUs) {
        applyVariantWeightDefaults(value.variantSKUs, defaults.weightG);
      }
      // Enforce Shiprocket fields for active shippable products
      const isActive = (value.status || 'draft') === 'active';
      const requiresShipping = value.shipping?.requiresShipping !== false && !value.digital?.isDigital;
      if (isActive && requiresShipping) {
        if (!value.shipping.weight || !value.shipping.length || !value.shipping.width || !value.shipping.height) {
          res.status(400).json({ error: 'Active products require shipping weight + length/width/height for Shiprocket.' });
          return;
        }
      }
      if (warnings.length > 0) {
        console.warn('Product shipping normalized:', warnings.join(' '));
      }
    } catch (normErr) {
      console.warn('Shipping normalization skipped:', normErr);
    }

    // Phase 8: Validate tags exist if provided
    if (value.tags && value.tags.length > 0) {
      const { Tag } = await import('../models/Tag');
      const tags = await Tag.find({ _id: { $in: value.tags }, isActive: true });
      if (tags.length !== value.tags.length) {
        res.status(400).json({ error: 'One or more tags not found or inactive' });
        return;
      }
      
      // Update tag usage counts
      await Tag.updateMany(
        { _id: { $in: value.tags } },
        { $inc: { usageCount: 1 } }
      );
    }

    // Check if main SKU already exists
    const existingProduct = await Product.findOne({ sku: value.sku });
    if (existingProduct) {
      res.status(400).json({ error: 'Product with this SKU already exists' });
      return;
    }

    // Validate variant SKUs uniqueness (if product has variants)
    if (value.hasVariants && value.variantSKUs && value.variantSKUs.length > 0) {
      // Check for duplicate SKUs within the variant list
      const variantSkus = value.variantSKUs.map((v: any) => v.sku.toUpperCase());
      const uniqueVariantSkus = new Set(variantSkus);
      if (uniqueVariantSkus.size !== variantSkus.length) {
        res.status(400).json({ error: 'Duplicate SKUs found in variant list' });
        return;
      }

      // Check if any variant SKU matches the main SKU
      if (variantSkus.includes(value.sku.toUpperCase())) {
        res.status(400).json({ error: 'Variant SKU cannot be the same as main product SKU' });
        return;
      }

      // Check if any variant SKU already exists in database
      const existingVariantProducts = await Product.find({
        $or: [
          { sku: { $in: variantSkus } },
          { 'variantSKUs.sku': { $in: variantSkus } },
        ],
      });
      if (existingVariantProducts.length > 0) {
        res.status(400).json({ error: 'One or more variant SKUs already exist' });
        return;
      }

      // Validate variant attributes match variantSKU attributes
      if (value.variantAttributes && value.variantAttributes.length > 0) {
        const attributeNames = value.variantAttributes.map((attr: any) => attr.name);
        
        for (const variantSKU of value.variantSKUs) {
          const variantAttrKeys = Object.keys(variantSKU.attributes || {});
          
          // Check that all attribute names are defined
          for (const attrKey of variantAttrKeys) {
            if (!attributeNames.includes(attrKey)) {
              res.status(400).json({ 
                error: `Variant SKU ${variantSKU.sku} has undefined attribute: ${attrKey}` 
              });
              return;
            }
          }

          // Check that variant has all required attributes
          const requiredAttrs = value.variantAttributes
            .filter((attr: any) => attr.required)
            .map((attr: any) => attr.name);
          
          for (const requiredAttr of requiredAttrs) {
            if (!variantAttrKeys.includes(requiredAttr)) {
              res.status(400).json({ 
                error: `Variant SKU ${variantSKU.sku} is missing required attribute: ${requiredAttr}` 
              });
              return;
            }
          }

          // Validate attribute values are from valid options
          for (const [attrName, attrValue] of Object.entries(variantSKU.attributes)) {
            const attribute = value.variantAttributes.find((a: any) => a.name === attrName);
            if (attribute) {
              const validValues = attribute.options.map((o: any) => o.value);
              if (!validValues.includes(attrValue)) {
                res.status(400).json({ 
                  error: `Variant SKU ${variantSKU.sku} has invalid value "${attrValue}" for attribute "${attrName}". Valid values: ${validValues.join(', ')}` 
                });
                return;
              }
            }
          }
        }
      }

      // Ensure at least one variant is set as default
      const hasDefault = value.variantSKUs.some((v: any) => v.isDefault);
      if (!hasDefault && value.variantSKUs.length > 0) {
        value.variantSKUs[0].isDefault = true;
      }
    }

    // Validate related products exist if provided
    if (value.relatedProducts) {
      const relatedIds = [
        ...(value.relatedProducts.crossSells || []),
        ...(value.relatedProducts.upSells || []),
        ...(value.relatedProducts.frequentlyBoughtTogether || []),
        ...(value.relatedProducts.accessories || []),
      ];
      
      if (relatedIds.length > 0) {
        const uniqueRelatedIds = [...new Set(relatedIds)];
        const existingRelated = await Product.find({ _id: { $in: uniqueRelatedIds } });
        if (existingRelated.length !== uniqueRelatedIds.length) {
          res.status(400).json({ error: 'One or more related products not found' });
          return;
        }
      }
    }

    // Clean up empty metadata object
    if (value.metadata) {
      const metadataKeys = Object.keys(value.metadata);
      const hasMetadata = metadataKeys.some((key) => {
        const val = value.metadata[key];
        return val !== undefined && val !== null && val !== '' && 
               (Array.isArray(val) ? val.length > 0 : true);
      });
      if (!hasMetadata) {
        delete value.metadata;
      }
    }

    // Clean up empty optional objects
    const optionalObjects = ['brand', 'shipping', 'digital', 'inventory', 'identifiers', 'visibility', 'relatedProducts'];
    for (const key of optionalObjects) {
      if (value[key] && typeof value[key] === 'object') {
        const hasValue = Object.values(value[key]).some((v: any) => 
          v !== undefined && v !== null && v !== '' && 
          (Array.isArray(v) ? v.length > 0 : true)
        );
        if (!hasValue) {
          delete value[key];
        }
      }
    }

    // Create product
    const product = new Product(value);
    await product.save();

    await product.populate('category', 'name slug');

    // Log audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.CREATE,
        resource: 'product',
        resourceId: product._id,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        details: { 
          productName: product.name, 
          sku: product.sku,
          hasVariants: product.hasVariants,
          variantCount: product.variantSKUs?.length || 0,
        },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the request if audit logging fails
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    
    // Log failed audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.CREATE,
        resource: 'product',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'failed',
        errorMessage: error.message || 'Product creation failed',
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Product with this SKU already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update product (Admin/Superadmin only)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateProductSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Validate category exists if provided
    if (value.category) {
      const category = await Category.findById(value.category);
      if (!category) {
        res.status(400).json({ error: 'Category not found' });
        return;
      }
    }

    // Phase 8: Validate and update tags if provided
    if (value.tags !== undefined) {
      const { Tag } = await import('../models/Tag');
      
      if (value.tags.length > 0) {
        const tags = await Tag.find({ _id: { $in: value.tags }, isActive: true });
        if (tags.length !== value.tags.length) {
          res.status(400).json({ error: 'One or more tags not found or inactive' });
          return;
        }
      }

      // Update tag usage counts
      const oldTags = product.tags?.map((t: any) => t.toString()) || [];
      const newTags = value.tags.map((t: string) => t.toString()) || [];
      
      // Decrement usage for removed tags
      const removedTags = oldTags.filter((t: string) => !newTags.includes(t));
      if (removedTags.length > 0) {
        await Tag.updateMany(
          { _id: { $in: removedTags } },
          { $inc: { usageCount: -1 } }
        );
      }

      // Increment usage for new tags
      const addedTags = newTags.filter((t: string) => !oldTags.includes(t));
      if (addedTags.length > 0) {
        await Tag.updateMany(
          { _id: { $in: addedTags } },
          { $inc: { usageCount: 1 } }
        );
      }
    }

    // Check if SKU already exists (if changed)
    if (value.sku && value.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: value.sku });
      if (existingProduct) {
        res.status(400).json({ error: 'Product with this SKU already exists' });
        return;
      }
    }

    // Phase 0: Shiprocket-ready normalization on update
    try {
      const settings = await Settings.findOne({ key: 'global' });
      const defaults = {
        weightG: settings?.shipping.defaultWeightG ?? 500,
        lengthCm: settings?.shipping.defaultLengthCm ?? 30,
        widthCm: settings?.shipping.defaultWidthCm ?? 25,
        heightCm: settings?.shipping.defaultHeightCm ?? 3,
      };
      const mergedHasVariants = value.hasVariants ?? (product as any).hasVariants;
      const mergedAttributes = value.variantAttributes ?? (product as any).variantAttributes;
      if (mergedHasVariants && mergedAttributes) {
        const variantError = validateVariantAttributes(mergedAttributes);
        if (variantError && value.variantAttributes) {
          res.status(400).json({ error: variantError });
          return;
        }
      }
      if (value.shipping || value.status) {
        const mergedShipping = { ...((product as any).shipping?.toObject?.() ?? (product as any).shipping ?? {}), ...(value.shipping || {}) };
        const { shipping } = normalizeShipping(mergedShipping, defaults);
        value.shipping = { ...(value.shipping || {}), ...shipping };
      }
      if (value.variantSKUs) {
        applyVariantWeightDefaults(value.variantSKUs, defaults.weightG);
      }
    } catch (normErr) {
      console.warn('Shipping normalization skipped on update:', normErr);
    }

    // Clean up empty metadata object
    if (value.metadata) {
      const metadataKeys = Object.keys(value.metadata);
      const hasMetadata = metadataKeys.some((key) => {
        const val = value.metadata[key];
        return val !== undefined && val !== null && val !== '' && 
               (Array.isArray(val) ? val.length > 0 : true);
      });
      if (!hasMetadata) {
        delete value.metadata;
        // If updating metadata to empty, remove it from product
        if (product.metadata) {
          product.metadata = undefined;
        }
      } else {
        // Merge with existing metadata
        product.metadata = { ...(product.metadata || {}), ...value.metadata };
      }
      delete value.metadata; // Remove from value so we don't overwrite the merged version
    }

    // Update fields
    const oldPrice = product.price;
    const oldStock = product.stock || 0;
    const oldSkuStock: Record<string, number> = {};
    for (const s of ((product as any).variantSKUs || []) as any[]) {
      if (s?.sku) oldSkuStock[String(s.sku)] = s.stock || 0;
    }
    Object.keys(value).forEach((key) => {
      if (value[key] !== undefined && key !== 'metadata') {
        (product as any)[key] = value[key];
      }
    });

    await product.save();
    await product.populate('category', 'name slug');

    // Retention: price-drop alerts when admin lowers the price
    try {
      if (value.price !== undefined && product.price < oldPrice) {
        const { notifyPriceDrop } = await import('../services/stockNotifications');
        notifyPriceDrop(product._id.toString(), oldPrice, product.price).catch((e) => console.warn('Price-drop notify failed:', e));
      }
    } catch (e) {
      console.warn('Price-drop check skipped:', e);
    }

    // Retention: back-in-stock alerts on restock (total or any variant SKU 0 → >0)
    try {
      const restockedTotal = oldStock <= 0 && (product.stock || 0) > 0;
      let restockedVariant = false;
      if (!restockedTotal && Array.isArray((product as any).variantSKUs)) {
        for (const s of (product as any).variantSKUs as any[]) {
          if (s?.sku && (oldSkuStock[String(s.sku)] || 0) <= 0 && (s.stock || 0) > 0 && s.isEnabled !== false) {
            restockedVariant = true;
            break;
          }
        }
      }
      if (restockedTotal || restockedVariant) {
        const { notifyRestock } = await import('../services/stockNotifications');
        notifyRestock(product._id.toString()).catch((e) => console.warn('Restock notify failed:', e));
      }
    } catch (e) {
      console.warn('Restock check skipped:', e);
    }

    // Log audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.UPDATE,
        resource: 'product',
        resourceId: product._id,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        details: { productName: product.name, sku: product.sku },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    
    // Log failed audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.UPDATE,
        resource: 'product',
        resourceId: req.params.id ? new mongoose.Types.ObjectId(req.params.id) : undefined,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'failed',
        errorMessage: error.message || 'Product update failed',
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Product with this SKU already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete product (Superadmin only)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Delete associated images
    const fs = await import('fs');
    const path = await import('path');
    const { invalidateCDN } = await import('../utils/cdnInvalidation');

    const imagesToDelete = product.images || [];
    const deletedImageUrls: string[] = [];

    for (const image of imagesToDelete) {
      try {
        // Handle both string and object formats
        const imageUrl = typeof image === 'string' ? image : (image as any).url;
        if (imageUrl && imageUrl.includes('/uploads/products/')) {
          const filename = path.basename(imageUrl);
          const filePath = path.join(__dirname, '../../uploads/products', filename);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted product image: ${filename}`);
            deletedImageUrls.push(imageUrl);
          }
        }
      } catch (deleteError: any) {
        console.error(`Error deleting image:`, deleteError.message);
        // Continue deleting other images even if one fails
      }
    }

    // Invalidate CDN cache for deleted images (production only)
    if (deletedImageUrls.length > 0) {
      try {
        await invalidateCDN(deletedImageUrls);
      } catch (cdnError: any) {
        console.error('Error invalidating CDN cache:', cdnError.message);
        // Don't fail the deletion if CDN invalidation fails
      }
    }

    const productId = product._id;
    const productName = product.name;
    const productSku = product.sku;

    await Product.findByIdAndDelete(id);

    // Log audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.DELETE,
        resource: 'product',
        resourceId: productId,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        details: { productName, sku: productSku },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Product and associated images deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    
    // Log failed audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.DELETE,
        resource: 'product',
        resourceId: req.params.id ? new mongoose.Types.ObjectId(req.params.id) : undefined,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'failed',
        errorMessage: error.message || 'Product deletion failed',
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search products (with Elasticsearch integration)
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, minPrice, maxPrice, page = '1', limit = '20' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Try Elasticsearch first
    const { searchProductsES } = await import('../services/search');
    const { isElasticsearchAvailable } = await import('../config/elasticsearch');
    
    if (isElasticsearchAvailable()) {
      const filters: any = {};
      if (category && mongoose.Types.ObjectId.isValid(category as string)) {
        filters.category = category as string;
      }
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);

      const result = await searchProductsES(q, filters, pageNum, limitNum);
      
      // Fetch full product details from MongoDB
      const productIds = result.products.map((p: any) => p._id);
      const products = await Product.find({ _id: { $in: productIds } })
        .populate('category', 'name slug')
        .lean();

      // Maintain Elasticsearch result order
      const productsMap = new Map(products.map((p: any) => [p._id.toString(), p]));
      const orderedProducts = productIds
        .map((id: string) => productsMap.get(id))
        .filter((p: any) => p !== undefined);

      return res.status(200).json({
        success: true,
        data: orderedProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum),
        },
      });
    }

    // Fallback to MongoDB regex partial search
    const skip = (pageNum - 1) * limitNum;
    const cleanQuery = q.trim();
    const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');

    const matchingCats = await Category.find({
      $or: [
        { name: searchRegex },
        { slug: searchRegex },
      ],
    }).select('_id');
    const matchingCatIds = matchingCats.map((c) => c._id);

    const filter: any = {
      status: 'active', // Only search active products for public
      $or: [
        { name: searchRegex },
        { shortDescription: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
        { 'variantAttributes.options.value': searchRegex },
        ...(matchingCatIds.length > 0 ? [{ category: { $in: matchingCatIds } }] : []),
      ],
    };

    if (category && mongoose.Types.ObjectId.isValid(category as string)) {
      const kids = await Category.find({ parent: category }).select('_id').lean();
      filter.category = { $in: [category, ...kids.map((k: any) => k._id)] };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get dynamic product filters (available categories, colors, sizes, min/max prices)
export const getProductFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    const baseFilter: any = { status: 'active' };

    // Hierarchy-aware like getProducts: parents include children's products.
    const subtreeIds = async (catId: any): Promise<any[]> => {
      const kids = await Category.find({ parent: catId }).select('_id').lean();
      return [catId, ...kids.map((k: any) => k._id)];
    };
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        baseFilter.category = { $in: await subtreeIds(category) };
      } else {
        // Fast path: exact slug hits the index; regex fallback only on miss.
        const slugKey = (category as string).toLowerCase();
        let catObj = await Category.findOne({ slug: slugKey }).select('_id').lean();
        if (!catObj) {
          catObj = await Category.findOne({
            $or: [
              { slug: slugKey },
              { name: new RegExp(`^${slugKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            ],
          }).select('_id').lean();
        }
        if (catObj) {
          baseFilter.category = { $in: await subtreeIds((catObj as any)._id) };
        }
      }
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const cleanSearch = search.trim();
      const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      baseFilter.$or = [
        { name: searchRegex },
        { shortDescription: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
        { 'variantAttributes.options.value': searchRegex },
      ];
    }

    // Price range + sizes + categories + merchandising distincts all run in
    // parallel (previously 4+ sequential Atlas round-trips per filter open).
    const sizesAggPromise = Product.aggregate([
      { $match: baseFilter },
      { $unwind: '$variantAttributes' },
      { $unwind: '$variantAttributes.options' },
      { $group: { _id: '$variantAttributes.options.value' } },
    ]);
    const priceAggPromise = Product.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);
    const categoriesPromise = Category.find({ status: 'active' }).select('name slug').lean();
    const merchPromise = Promise.all([
      Product.distinct('fit', { ...baseFilter, fit: { $nin: [null, ''] } }),
      Product.distinct('fabric', { ...baseFilter, fabric: { $nin: [null, ''] } }),
      Product.distinct('pattern', { ...baseFilter, pattern: { $nin: [null, ''] } }),
      Product.distinct('occasion', { ...baseFilter, occasion: { $nin: [null, ''] } }),
    ]);
    // Color detection needs only names + distinct option values — NOT full
    // documents (descriptions/variants payloads made this the slowest stage).
    const colorScanPromise = Promise.all([
      Product.find(baseFilter).select('name').limit(2000).lean(),
      Product.distinct('variantAttributes.options.value', baseFilter),
    ]);

    const [priceAgg, sizesAgg, activeCategories, [fits, fabrics, patterns, occasions], [nameRows, optionValues]] =
      await Promise.all([priceAggPromise, sizesAggPromise, categoriesPromise, merchPromise, colorScanPromise]);

    // 1. Price Range
    const minPrice = priceAgg[0]?.minPrice || 0;
    const maxPrice = priceAgg[0]?.maxPrice || 5000;

    // 2. Available Sizes from variantAttributes
    const rawSizes = (sizesAgg as any[]).map((item) => item._id).filter(Boolean);
    const ORDERED_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
    const availableSizes = ORDERED_SIZES.filter(s => rawSizes.includes(s)).concat(rawSizes.filter(s => !ORDERED_SIZES.includes(s)));

    const KNOWN_COLORS = [
      { name: 'Black', hex: '#000000', regex: /black|jet black/i },
      { name: 'White', hex: '#FFFFFF', regex: /white|crisp white|pristine white/i },
      { name: 'Navy', hex: '#1B2A4A', regex: /navy|royal navy|dark navy/i },
      { name: 'Beige', hex: '#E1D4C0', regex: /beige|khaki|sand beige/i },
      { name: 'Maroon', hex: '#800020', regex: /maroon|royal maroon/i },
      { name: 'Green', hex: '#2D5A27', regex: /green|olive|olive green|sage green/i },
      { name: 'Grey', hex: '#808080', regex: /grey|gray|charcoal|steel grey/i },
      { name: 'Blue', hex: '#2563EB', regex: /blue|sky blue|royal blue|indigo/i },
    ];

    const activeProductsCorpus =
      `${(nameRows as any[]).map((p) => p.name || '').join(' ')} ${(optionValues as any[]).filter(Boolean).join(' ')}`;

    const availableColors = KNOWN_COLORS.filter((colorItem) =>
      colorItem.regex.test(activeProductsCorpus)
    ).map(({ name, hex }) => ({ name, hex }));

    res.status(200).json({
      success: true,
      data: {
        categories: activeCategories,
        colors: availableColors.length > 0 ? availableColors : KNOWN_COLORS.map(({ name, hex }) => ({ name, hex })),
        sizes: availableSizes.length > 0 ? availableSizes : ['S', 'M', 'L', 'XL', 'XXL'],
        minPrice,
        maxPrice,
        fits: (fits as string[]).filter(Boolean).sort(),
        fabrics: (fabrics as string[]).filter(Boolean).sort(),
        patterns: (patterns as string[]).filter(Boolean).sort(),
        occasions: (occasions as string[]).filter(Boolean).sort(),
        badges: ['new', 'bestseller', 'trending', 'limited', 'sale'],
      },
    });
  } catch (error: any) {
    console.error('Get product filters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get product recommendations (using Elasticsearch "more_like_this")
// Phase 8: Also tracks product view for recommendations
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = '4' } = req.query;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID format' });
      return;
    }

    const limitNum = parseInt(limit as string, 10);

    // Phase 8: Track product view for authenticated users
    const userId = req.user?.userId;
    if (userId) {
      const { trackProductView } = await import('../services/recommendations');
      trackProductView(userId, id).catch((err) => {
        console.error('Error tracking product view:', err);
      });
    }

    // Try Elasticsearch first
    const { getMoreLikeThis } = await import('../services/search');
    const { isElasticsearchAvailable } = await import('../config/elasticsearch');
    
    if (isElasticsearchAvailable()) {
      const recommendations = await getMoreLikeThis(id, limitNum);
      
      if (recommendations.length > 0) {
        // Fetch full product details from MongoDB
        const productIds = recommendations.map((p: any) => p._id);
        const products = await Product.find({ _id: { $in: productIds } })
          .populate('category', 'name slug')
          .select('name price images stock status sku averageRating totalReviews tags')
          .lean();

        // Maintain Elasticsearch result order
        const productsMap = new Map(products.map((p: any) => [p._id.toString(), p]));
        const orderedProducts = productIds
          .map((id: string) => productsMap.get(id))
          .filter((p: any) => p !== undefined);

        return res.status(200).json({
          success: true,
          data: orderedProducts,
        });
      }
    }

    // Fallback: Get products from same category
    const product = await Product.findById(id).select('category');
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const recommendations = await Product.find({
      category: product.category,
      _id: { $ne: id },
      status: 'active',
    })
      .populate('category', 'name slug')
      .select('name price images stock status sku averageRating totalReviews tags')
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Get personalized recommendations
export const getPersonalizedRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const { getPersonalizedRecommendations: getPersonalized } = await import('../services/recommendations');
    const recommendations = await getPersonalized(userId, limitNum);

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Get personalized recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Get recently viewed products
export const getRecentlyViewed = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const { getRecentlyViewedProducts } = await import('../services/recommendations');
    const products = await getRecentlyViewedProducts(userId, limitNum);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Get recently viewed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Get trending products
export const getTrendingProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const { getTrendingProducts: getTrending } = await import('../services/recommendations');
    const trendingIds = await getTrending(limitNum);

    const products = await Product.find({
      _id: { $in: trendingIds.map((id) => new mongoose.Types.ObjectId(id)) },
      status: 'active',
    })
      .populate('category', 'name slug')
      .select('name price images stock status sku averageRating totalReviews tags')
      .lean();

    // Maintain order
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
    const orderedProducts = trendingIds
      .map((id) => productMap.get(id))
      .filter((p: any) => p !== undefined);

    res.status(200).json({
      success: true,
      data: orderedProducts,
    });
  } catch (error: any) {
    console.error('Get trending products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit review (Phase 8 enhanced)
export const submitReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID format' });
      return;
    }

    // Validate input (Phase 8: includes photos)
    // Use uriOrPathValidator to accept relative paths from uploads
    const reviewMediaSchema = Joi.object({
      url: uriOrPathValidator.required(),
      type: Joi.string().valid('image', 'video').required(),
      thumbnailUrl: uriOrPathValidator.optional(),
    });

    const reviewSchema = Joi.object({
      rating: Joi.number().integer().min(1).max(5).required(),
      comment: Joi.string().trim().max(1000).required(),
      photos: Joi.array().items(reviewMediaSchema).max(5).optional(),
    });

    const { error, value } = reviewSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      (review) => review.userId.toString() === userId
    );

    if (existingReview) {
      res.status(400).json({ error: 'You have already reviewed this product' });
      return;
    }

    // Get user name for review
    const { User } = await import('../models/User');
    const user = await User.findById(userId).select('name email');
    const userName = user?.name || user?.email?.split('@')[0] || 'Anonymous';

    // Phase 8: Check if user purchased this product (verified purchase)
    const { Order } = await import('../models/Order');
    const { OrderStatus } = await import('../models/Order');
    
    const userOrder = await Order.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      'items.productId': new mongoose.Types.ObjectId(id),
      status: { $in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] },
    });

    const verifiedPurchase = !!userOrder;

    // Add review with Phase 8 enhancements
    const newReview = {
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      rating: value.rating,
      comment: value.comment,
      photos: value.photos || [],
      verifiedPurchase,
      helpfulVotes: [],
      helpfulCount: 0,
      notHelpfulCount: 0,
      moderationStatus: 'pending' as const,
      isHidden: false,
      isFlagged: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    product.reviews.push(newReview as any);

    // Save product (this will trigger pre-save hook to update averageRating)
    await product.save();

    // Return the newly created review (format it like getReviews does)
    const savedReview = product.reviews[product.reviews.length - 1];
    const reviewData: any = {
      _id: savedReview._id,
      userId: savedReview.userId,
      userName: savedReview.userName,
      rating: savedReview.rating,
      comment: savedReview.comment,
      photos: savedReview.photos || [],
      verifiedPurchase: savedReview.verifiedPurchase || false,
      helpfulCount: savedReview.helpfulCount || 0,
      notHelpfulCount: savedReview.notHelpfulCount || 0,
      moderationStatus: savedReview.moderationStatus, // Include status so user sees their pending review
      createdAt: savedReview.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be visible after admin approval.',
      data: reviewData,
    });
  } catch (error: any) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get product reviews (Phase 8 enhanced with sorting and filtering)
export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      page = '1', 
      limit = '10',
      sort = 'newest', // newest, highest, lowest, most_helpful
      status = 'approved', // approved, pending, rejected, all (admin only)
    } = req.query;
    
    // Normalize status parameter (handle string vs other types)
    const statusParam = String(status || 'approved').toLowerCase();

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID format' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Filter reviews by status
    const userRole = req.user?.role;
    const currentUserId = req.user?.userId;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    
    // Get all reviews from product (including hidden ones)
    let filteredReviews = [...(product.reviews || [])];
    
    // Debug logging before any filtering
    console.log(`[getReviews] Product: ${id}`);
    console.log(`[getReviews] Total reviews in product: ${filteredReviews.length}`);
    console.log(`[getReviews] User role: ${userRole}, IsAdmin: ${isAdmin}`);
    console.log(`[getReviews] Status param: "${statusParam}"`);
    
    // Filter out deleted reviews first
    filteredReviews = filteredReviews.filter((review: any) => !review.deletedAt);
    console.log(`[getReviews] After removing deleted: ${filteredReviews.length} reviews`);
    
    // Log hidden reviews count
    const hiddenCount = filteredReviews.filter((r: any) => r.isHidden).length;
    console.log(`[getReviews] Hidden reviews count: ${hiddenCount}`);
    
    // Admins can see all reviews based on status filter (including hidden/flagged)
    if (isAdmin) {
      // For admins, explicitly handle each status filter
      if (statusParam === 'pending' || statusParam === 'rejected') {
        filteredReviews = filteredReviews.filter(
          (review: any) => review.moderationStatus === statusParam
        );
        console.log(`[getReviews] Filtered by status ${statusParam}: ${filteredReviews.length} reviews`);
      } else if (statusParam === 'approved') {
        filteredReviews = filteredReviews.filter(
          (review: any) => review.moderationStatus === 'approved'
        );
        console.log(`[getReviews] Filtered by approved: ${filteredReviews.length} reviews`);
      } else if (statusParam === 'all') {
        // Show ALL reviews for admin (including hidden/flagged, any status)
        // Only deleted reviews are excluded (already filtered above)
        // No additional filtering needed - show everything
        // IMPORTANT: Hidden reviews ARE included here for admin view
        console.log(`[getReviews] Status is 'all' - showing ALL reviews (including hidden): ${filteredReviews.length} reviews`);
      } else {
        // Default fallback - show all for admin
        console.log(`[getReviews] Unknown status, showing all: ${filteredReviews.length} reviews`);
      }
      // Note: For admins, hidden reviews are ALWAYS included in the response when status='all'
      // They are only hidden from public view (regular users)
    } else {
      // Regular users: see all reviews (pending/approved/rejected) EXCEPT hidden ones
      const beforeFilter = filteredReviews.length;
      filteredReviews = filteredReviews.filter((review: any) => !review.isHidden);
      console.log(`[getReviews] Regular user - filtered out hidden: ${beforeFilter} -> ${filteredReviews.length}`);
    }

    // Sort reviews
    filteredReviews.sort((a: any, b: any) => {
      switch (sort) {
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'most_helpful':
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Paginate
    const total = filteredReviews.length;
    const paginatedReviews = filteredReviews.slice(skip, skip + limitNum);

    // Map to response format (exclude internal fields for public)
    const reviews = paginatedReviews.map((review: any) => {
      const reviewData: any = {
        _id: review._id,
        userId: review.userId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        photos: review.photos || [],
        verifiedPurchase: review.verifiedPurchase || false,
        helpfulCount: review.helpfulCount || 0,
        notHelpfulCount: review.notHelpfulCount || 0,
        createdAt: review.createdAt,
      };

      // Include admin reply if exists
      if (review.adminReply) {
        reviewData.adminReply = review.adminReply;
      }

      // Include moderation status for admin or the review owner
      const isReviewOwner = currentUserId && review.userId?.toString() === currentUserId;
      if (isAdmin || isReviewOwner) {
        reviewData.moderationStatus = review.moderationStatus;
        // Only include moderation details for admins
        if (isAdmin) {
          reviewData.moderationNotes = review.moderationNotes;
          reviewData.moderatedBy = review.moderatedBy;
          reviewData.moderatedAt = review.moderatedAt;
          reviewData.isHidden = review.isHidden || false;
          reviewData.isFlagged = review.isFlagged || false;
        }
      }

      // Check if current user has voted (currentUserId already defined above)
      if (currentUserId && review.helpfulVotes) {
        const userVote = review.helpfulVotes.find(
          (vote: any) => vote.userId.toString() === currentUserId
        );
        if (userVote) {
          reviewData.userVote = userVote.isHelpful;
        }
      }

      return reviewData;
    });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Vote helpful/unhelpful on review
export const voteReviewHelpful = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id, reviewId } = req.params;
    const { isHelpful } = req.body; // true for helpful, false for not helpful

    // Validate input
    if (typeof isHelpful !== 'boolean') {
      res.status(400).json({ error: 'isHelpful must be a boolean value' });
      return;
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Invalid product or review ID format' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const review = product.reviews.find(
      (r: any) => r._id && r._id.toString() === reviewId
    );

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Check if user already voted
    const existingVoteIndex = (review.helpfulVotes || []).findIndex(
      (vote: any) => vote.userId.toString() === userId
    );

    if (existingVoteIndex >= 0) {
      // Update existing vote
      const existingVote = review.helpfulVotes[existingVoteIndex];
      if (existingVote.isHelpful === isHelpful) {
        // User is removing their vote
        if (existingVote.isHelpful) {
          review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
        } else {
          review.notHelpfulCount = Math.max(0, (review.notHelpfulCount || 0) - 1);
        }
        review.helpfulVotes.splice(existingVoteIndex, 1);
      } else {
        // User is changing their vote
        if (existingVote.isHelpful) {
          review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
          review.notHelpfulCount = (review.notHelpfulCount || 0) + 1;
        } else {
          review.notHelpfulCount = Math.max(0, (review.notHelpfulCount || 0) - 1);
          review.helpfulCount = (review.helpfulCount || 0) + 1;
        }
        existingVote.isHelpful = isHelpful;
        existingVote.createdAt = new Date();
      }
    } else {
      // Add new vote
      if (!review.helpfulVotes) {
        review.helpfulVotes = [];
      }
      review.helpfulVotes.push({
        userId: new mongoose.Types.ObjectId(userId),
        isHelpful,
        createdAt: new Date(),
      });
      
      if (isHelpful) {
        review.helpfulCount = (review.helpfulCount || 0) + 1;
      } else {
        review.notHelpfulCount = (review.notHelpfulCount || 0) + 1;
      }
    }

    review.updatedAt = new Date();
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulCount: review.helpfulCount || 0,
        notHelpfulCount: review.notHelpfulCount || 0,
        userVote: isHelpful,
      },
    });
  } catch (error: any) {
    console.error('Vote review helpful error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Moderate review (Admin/Superadmin only)
export const moderateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id, reviewId } = req.params;

    // Validate input
    const moderationSchema = Joi.object({
      status: Joi.string().valid('approved', 'rejected').required(),
      notes: Joi.string().trim().max(500).optional().allow(''),
    });

    const { error, value } = moderationSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Invalid product or review ID format' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const review = product.reviews.find(
      (r: any) => r._id && r._id.toString() === reviewId
    );

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Update moderation status
    review.moderationStatus = value.status;
    review.moderatedBy = new mongoose.Types.ObjectId(userId);
    review.moderatedAt = new Date();
    if (value.notes) {
      review.moderationNotes = value.notes;
    }
    review.updatedAt = new Date();

    await product.save();

    // Log audit
    try {
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.UPDATE,
        resource: 'review',
        resourceId: reviewId,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        details: { 
          productId: id,
          reviewId,
          moderationStatus: value.status,
        },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: `Review ${value.status} successfully`,
      data: review,
    });
  } catch (error: any) {
    console.error('Moderate review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Admin - Reply to review
export const replyToReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id, reviewId } = req.params;
    const { reply } = req.body;

    // Validate input
    const replySchema = Joi.object({
      reply: Joi.string().trim().max(1000).required(),
    });

    const { error, value } = replySchema.validate({ reply }, { abortEarly: false });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Invalid product or review ID format' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const review = product.reviews.find(
      (r: any) => r._id && r._id.toString() === reviewId
    );

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Update admin reply
    review.adminReply = {
      comment: value.reply,
      repliedBy: new mongoose.Types.ObjectId(userId),
      repliedAt: new Date(),
    };
    review.updatedAt = new Date();

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      data: review,
    });
  } catch (error: any) {
    console.error('Reply to review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Admin - Hide/Unhide review
export const toggleReviewVisibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id, reviewId } = req.params;
    const { hide } = req.body;

    if (typeof hide !== 'boolean') {
      res.status(400).json({ error: 'hide must be a boolean value' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Invalid product or review ID format' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const review = product.reviews.find(
      (r: any) => r._id && r._id.toString() === reviewId
    );

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    review.isHidden = hide;
    review.updatedAt = new Date();

    // Mark reviews as modified so pre-save hook recalculates totalReviews
    product.markModified('reviews');
    await product.save();

    res.status(200).json({
      success: true,
      message: `Review ${hide ? 'hidden' : 'unhidden'} successfully`,
      data: review,
    });
  } catch (error: any) {
    console.error('Toggle review visibility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Admin - Flag/Unflag review as inappropriate
export const toggleReviewFlag = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id, reviewId } = req.params;
    const { flag } = req.body;

    if (typeof flag !== 'boolean') {
      res.status(400).json({ error: 'flag must be a boolean value' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Invalid product or review ID format' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const review = product.reviews.find(
      (r: any) => r._id && r._id.toString() === reviewId
    );

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    review.isFlagged = flag;
    if (flag) {
      review.flaggedBy = new mongoose.Types.ObjectId(userId);
      review.flaggedAt = new Date();
    } else {
      review.flaggedBy = undefined;
      review.flaggedAt = undefined;
    }
    review.updatedAt = new Date();

    // Mark reviews as modified so pre-save hook recalculates totalReviews
    product.markModified('reviews');
    await product.save();

    res.status(200).json({
      success: true,
      message: `Review ${flag ? 'flagged' : 'unflagged'} successfully`,
      data: review,
    });
  } catch (error: any) {
    console.error('Toggle review flag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Admin - Delete review (soft delete)
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Invalid product or review ID format' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const review = product.reviews.find(
      (r: any) => r._id && r._id.toString() === reviewId
    );

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Soft delete
    review.deletedAt = new Date();
    review.updatedAt = new Date();

    // Mark reviews as modified so pre-save hook recalculates totalReviews and averageRating
    product.markModified('reviews');
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Phase 8: Admin - Get all reviews across all products (for moderation dashboard)
export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '20',
      status = 'pending', // pending, approved, rejected, all
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build aggregation pipeline to get reviews across all products
    const products = await Product.aggregate([
      { $unwind: '$reviews' },
      { $match: { 'reviews.deletedAt': { $exists: false } } }, // Exclude deleted reviews
      { $match: status === 'all' ? {} : { 'reviews.moderationStatus': status } },
      { $sort: { 'reviews.createdAt': -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $project: {
          productId: '$_id',
          productName: '$name',
          productSlug: '$slug',
          review: '$reviews',
        },
      },
    ]);

    // Get total count
    const totalResult = await Product.aggregate([
      { $unwind: '$reviews' },
      { $match: { 'reviews.deletedAt': { $exists: false } } }, // Exclude deleted reviews
      { $match: status === 'all' ? {} : { 'reviews.moderationStatus': status } },
      { $count: 'total' },
    ]);
    const total = totalResult[0]?.total || 0;

    // Format response
    const reviews = products.map((item: any) => ({
      _id: item.review._id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      userId: item.review.userId,
      userName: item.review.userName,
      rating: item.review.rating,
      comment: item.review.comment,
      photos: item.review.photos || [],
      verifiedPurchase: item.review.verifiedPurchase || false,
      helpfulCount: item.review.helpfulCount || 0,
      notHelpfulCount: item.review.notHelpfulCount || 0,
      moderationStatus: item.review.moderationStatus,
      moderationNotes: item.review.moderationNotes,
      moderatedBy: item.review.moderatedBy,
      moderatedAt: item.review.moderatedAt,
      adminReply: item.review.adminReply,
      isHidden: item.review.isHidden || false,
      isFlagged: item.review.isFlagged || false,
      createdAt: item.review.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// ADVANCED VARIANT HELPER ENDPOINTS
// =====================================================

// Generate variant SKU combinations from attributes (Admin helper)
export const generateVariantCombinations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantAttributes, basePrice, baseSku } = req.body;

    // Validate input
    const generateSchema = Joi.object({
      variantAttributes: Joi.array().items(variantAttributeSchema).min(1).required(),
      basePrice: Joi.number().min(0).required(),
      baseSku: Joi.string().trim().uppercase().required(),
    });

    const { error, value } = generateSchema.validate({ variantAttributes, basePrice, baseSku }, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Generate all combinations of variant options
    const generateCombinations = (attributes: IVariantAttribute[]): Array<{ [key: string]: string }> => {
      if (attributes.length === 0) return [{}];
      
      const [first, ...rest] = attributes;
      const restCombinations = generateCombinations(rest);
      const combinations: Array<{ [key: string]: string }> = [];
      
      for (const option of first.options) {
        for (const restCombo of restCombinations) {
          combinations.push({
            [first.name]: option.value,
            ...restCombo,
          });
        }
      }
      
      return combinations;
    };

    const combinations = generateCombinations(value.variantAttributes);

    // Generate SKU for each combination
    const variantSKUs: Partial<IVariantSKU>[] = combinations.map((combo, index) => {
      // Generate SKU suffix from attribute values
      const skuSuffix = Object.values(combo)
        .map((v: string) => v.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, ''))
        .join('-');
      
      return {
        sku: `${value.baseSku}-${skuSuffix}`,
        attributes: combo,
        price: value.basePrice,
        stock: 0,
        isEnabled: true,
        isDefault: index === 0,
        position: index,
      };
    });

    res.status(200).json({
      success: true,
      message: `Generated ${variantSKUs.length} variant combinations`,
      data: {
        totalCombinations: variantSKUs.length,
        variantSKUs,
      },
    });
  } catch (error: any) {
    console.error('Generate variant combinations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Validate variant SKUs uniqueness (Admin helper)
export const validateVariantSKUs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skus, productId } = req.body;

    if (!Array.isArray(skus) || skus.length === 0) {
      res.status(400).json({ error: 'SKUs array is required' });
      return;
    }

    // Normalize SKUs to uppercase
    const normalizedSkus = skus.map((sku: string) => sku.toUpperCase());

    // Check for duplicates within the provided list
    const uniqueSkus = new Set(normalizedSkus);
    const hasDuplicates = uniqueSkus.size !== normalizedSkus.length;
    const duplicatesInList = normalizedSkus.filter((sku: string, index: number) => 
      normalizedSkus.indexOf(sku) !== index
    );

    // Check which SKUs already exist in database
    const query: any = {
      $or: [
        { sku: { $in: normalizedSkus } },
        { 'variantSKUs.sku': { $in: normalizedSkus } },
      ],
    };

    // Exclude current product if updating
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query._id = { $ne: productId };
    }

    const existingProducts = await Product.find(query).select('sku variantSKUs.sku name');
    
    const existingSkus: string[] = [];
    for (const product of existingProducts) {
      if (normalizedSkus.includes(product.sku)) {
        existingSkus.push(product.sku);
      }
      if (product.variantSKUs) {
        for (const variant of product.variantSKUs) {
          if (normalizedSkus.includes(variant.sku)) {
            existingSkus.push(variant.sku);
          }
        }
      }
    }

    const uniqueExisting = [...new Set(existingSkus)];

    res.status(200).json({
      success: true,
      data: {
        totalChecked: normalizedSkus.length,
        hasDuplicatesInList: hasDuplicates,
        duplicatesInList: [...new Set(duplicatesInList)],
        existsInDatabase: uniqueExisting.length > 0,
        existingSkus: uniqueExisting,
        isValid: !hasDuplicates && uniqueExisting.length === 0,
      },
    });
  } catch (error: any) {
    console.error('Validate variant SKUs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk update variant stock (Admin)
export const bulkUpdateVariantStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { variants } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID format' });
      return;
    }

    // Validate input
    const bulkUpdateSchema = Joi.object({
      variants: Joi.array().items(Joi.object({
        sku: Joi.string().trim().uppercase().required(),
        stock: Joi.number().min(0).required(),
        price: Joi.number().min(0).optional(),
        isEnabled: Joi.boolean().optional(),
      })).min(1).required(),
    });

    const { error, value } = bulkUpdateSchema.validate({ variants }, { abortEarly: false });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (!product.hasVariants || !product.variantSKUs || product.variantSKUs.length === 0) {
      res.status(400).json({ error: 'Product does not have variants' });
      return;
    }

    // Update each variant
    const updatedVariants: string[] = [];
    const notFoundVariants: string[] = [];

    for (const update of value.variants) {
      const variantIndex = product.variantSKUs.findIndex(
        (v: IVariantSKU) => v.sku === update.sku
      );

      if (variantIndex >= 0) {
        product.variantSKUs[variantIndex].stock = update.stock;
        if (update.price !== undefined) {
          product.variantSKUs[variantIndex].price = update.price;
        }
        if (update.isEnabled !== undefined) {
          product.variantSKUs[variantIndex].isEnabled = update.isEnabled;
        }
        updatedVariants.push(update.sku);
      } else {
        notFoundVariants.push(update.sku);
      }
    }

    // Mark variantSKUs as modified and save
    product.markModified('variantSKUs');
    await product.save();

    res.status(200).json({
      success: true,
      message: `Updated ${updatedVariants.length} variants`,
      data: {
        updated: updatedVariants,
        notFound: notFoundVariants,
        totalStock: product.stock,
      },
    });
  } catch (error: any) {
    console.error('Bulk update variant stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get product with full variant details (including stock levels)
export const getProductVariants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID format' });
      return;
    }

    const product = await Product.findById(id)
      .select('name sku price stock hasVariants variantAttributes variantSKUs variations variationOptions');

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Calculate variant statistics
    let stats = null;
    if (product.hasVariants && product.variantSKUs && product.variantSKUs.length > 0) {
      const enabledVariants = product.variantSKUs.filter((v: IVariantSKU) => v.isEnabled);
      const totalVariantStock = enabledVariants.reduce((sum: number, v: IVariantSKU) => sum + v.stock, 0);
      const lowStockVariants = enabledVariants.filter((v: IVariantSKU) => 
        v.stock <= (v.lowStockThreshold || product.lowStockThreshold || 10) && v.stock > 0
      );
      const outOfStockVariants = enabledVariants.filter((v: IVariantSKU) => v.stock === 0);
      const priceRange = {
        min: Math.min(...enabledVariants.map((v: IVariantSKU) => v.price)),
        max: Math.max(...enabledVariants.map((v: IVariantSKU) => v.price)),
      };

      stats = {
        totalVariants: product.variantSKUs.length,
        enabledVariants: enabledVariants.length,
        totalStock: totalVariantStock,
        lowStockCount: lowStockVariants.length,
        outOfStockCount: outOfStockVariants.length,
        priceRange,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        hasVariants: product.hasVariants,
        variantAttributes: product.variantAttributes || [],
        variantSKUs: product.variantSKUs || [],
        // Legacy support
        variations: product.variations || [],
        variationOptions: product.variationOptions || [],
        stats,
      },
    });
  } catch (error: any) {
    console.error('Get product variants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// DUPLICATE PRODUCT
// =====================================================

/**
 * Duplicate a product with all its variants and attributes
 * POST /api/products/:id/duplicate
 */
export const duplicateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newName, newSku } = req.body;
    const userId = (req as any).user?.userId;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product ID format' });
      return;
    }

    // Find source product
    const sourceProduct = await Product.findById(id).lean();
    if (!sourceProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Generate new SKU if not provided
    const baseSku = newSku || `${sourceProduct.sku}-COPY`;
    
    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku: baseSku });
    let finalSku = baseSku;
    if (existingSku) {
      // Add timestamp to make unique
      finalSku = `${baseSku}-${Date.now().toString(36).toUpperCase()}`;
    }

    // Generate unique slug
    const baseSlug = sourceProduct.slug ? `${sourceProduct.slug}-copy` : `${sourceProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-copy`;
    let slug = baseSlug;
    let slugCounter = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Deep clone the product
    const duplicateData: any = {
      ...sourceProduct,
      _id: undefined, // Remove original ID
      name: newName || `${sourceProduct.name} (Copy)`,
      slug,
      sku: finalSku,
      status: 'draft', // Always create as draft
      isPublished: false,
      views: 0,
      salesCount: 0,
      averageRating: 0,
      reviewCount: 0,
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Update variant SKUs with new base SKU
    if (duplicateData.hasVariants && duplicateData.variantSKUs?.length > 0) {
      const skuPrefix = finalSku;
      duplicateData.variantSKUs = duplicateData.variantSKUs.map((variant: any, index: number) => {
        // Generate new unique SKU for each variant
        const attributePart = Object.values(variant.attributes)
          .map((v: any) => String(v).toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3))
          .join('-');
        
        return {
          ...variant,
          _id: new mongoose.Types.ObjectId(), // New ID for each variant
          sku: `${skuPrefix}-${attributePart}`,
        };
      });
    }

    // Clear legacy variations' IDs and update SKUs
    if (duplicateData.variations?.length > 0) {
      duplicateData.variations = duplicateData.variations.map((v: any) => ({
        ...v,
        _id: undefined,
        sku: v.sku ? `${finalSku}-${v.name?.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4)}` : undefined,
      }));
    }

    // Clear reviews from duplicate
    duplicateData.reviews = [];

    // Create the duplicate product
    const duplicatedProduct = new Product(duplicateData);
    await duplicatedProduct.save();

    // Log the action
    await AuditLog.create({
      user: userId,
      action: AuditAction.CREATE,
      resource: 'product',
      resourceId: duplicatedProduct._id,
      changes: {
        duplicatedFrom: id,
        originalName: sourceProduct.name,
        newName: duplicatedProduct.name,
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
    });

    // Populate category for response
    await duplicatedProduct.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product duplicated successfully',
      data: {
        product: duplicatedProduct,
        original: {
          _id: sourceProduct._id,
          name: sourceProduct.name,
        },
      },
    });
  } catch (error: any) {
    console.error('Duplicate product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/products/reviews/featured - public homepage social proof (approved reviews, highest rated first)
export const getFeaturedReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const limitNum = Math.min(12, Math.max(1, parseInt((req.query.limit as string) || '8', 10)));
    const rows = await Product.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$reviews' },
      {
        $match: {
          'reviews.moderationStatus': 'approved',
          'reviews.isHidden': { $ne: true },
          'reviews.deletedAt': { $exists: false },
        },
      },
      { $sort: { 'reviews.rating': -1, 'reviews.helpfulCount': -1, 'reviews.createdAt': -1 } },
      { $limit: limitNum },
      {
        $project: {
          _id: 0,
          rating: '$reviews.rating',
          comment: '$reviews.comment',
          userName: '$reviews.userName',
          verifiedPurchase: '$reviews.verifiedPurchase',
          helpfulCount: '$reviews.helpfulCount',
          createdAt: '$reviews.createdAt',
          photos: '$reviews.photos',
          productId: '$_id',
          productName: '$name',
          productPrice: '$price',
          productImage: { $arrayElemAt: ['$images', 0] },
        },
      },
    ]);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Featured reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
