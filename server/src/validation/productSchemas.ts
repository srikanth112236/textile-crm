import Joi from 'joi';

/**
 * Canonical product validation schemas.
 *
 * Single source of truth for manual product create/update, variant helpers
 * and the future bulk-import validator. Do not duplicate these rules in
 * controllers — import them from here.
 */

// Legacy variation schemas (backwards compatibility)
export const variationSchema = Joi.object({
  name: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
  priceModifier: Joi.number().default(0),
  stock: Joi.number().min(0).optional(),
  sku: Joi.string().trim().optional(),
});

export const variationOptionSchema = Joi.object({
  type: Joi.string().trim().required(),
  values: Joi.array().items(Joi.string()).min(1).required(),
});

// Advanced Variant Attribute Option schema
export const variantAttributeOptionSchema = Joi.object({
  value: Joi.string().trim().required(),
  label: Joi.string().trim().optional().allow(''),
  colorCode: Joi.string().trim().optional().allow('').regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  imageUrl: Joi.string().trim().optional().allow(''),
  sortOrder: Joi.number().min(0).default(0),
});

// Advanced Variant Attribute schema
export const variantAttributeSchema = Joi.object({
  name: Joi.string().trim().required(),
  displayName: Joi.string().trim().optional().allow(''),
  type: Joi.string().valid('color', 'size', 'text', 'image', 'button').default('button'),
  options: Joi.array().items(variantAttributeOptionSchema).min(1).required(),
  required: Joi.boolean().default(true),
});

// Variant SKU schema
export const variantSKUSchema = Joi.object({
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
export const brandSchema = Joi.object({
  name: Joi.string().trim().required(),
  slug: Joi.string().trim().optional().allow(''),
  logo: Joi.string().trim().optional().allow(''),
  website: Joi.string().uri().optional().allow(''),
});

// Specification schema
export const specificationSchema = Joi.object({
  group: Joi.string().trim().optional().allow(''),
  name: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
  unit: Joi.string().trim().optional().allow(''),
});

// Shipping info schema
export const shippingInfoSchema = Joi.object({
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
export const digitalProductSchema = Joi.object({
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
export const volumePricingSchema = Joi.object({
  minQuantity: Joi.number().min(1).required(),
  maxQuantity: Joi.number().min(1).optional().allow(null),
  price: Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(100).optional(),
});

// Product identifiers schema
export const productIdentifiersSchema = Joi.object({
  gtin: Joi.string().trim().optional().allow(''),
  upc: Joi.string().trim().optional().allow(''),
  ean: Joi.string().trim().optional().allow(''),
  isbn: Joi.string().trim().optional().allow(''),
  mpn: Joi.string().trim().optional().allow(''),
});

// Inventory settings schema
export const inventorySettingsSchema = Joi.object({
  trackInventory: Joi.boolean().default(true),
  allowBackorder: Joi.boolean().default(false),
  backorderLimit: Joi.number().min(0).optional().allow(null),
  soldIndividually: Joi.boolean().default(false),
  lowStockThreshold: Joi.number().min(0).default(10),
  outOfStockThreshold: Joi.number().min(0).default(0),
});

// Visibility schema
export const visibilitySchema = Joi.object({
  visibility: Joi.string().valid('visible', 'catalog', 'search', 'hidden').default('visible'),
  featured: Joi.boolean().default(false),
  publishDate: Joi.date().optional().allow(null),
  unpublishDate: Joi.date().optional().allow(null),
  password: Joi.string().trim().optional().allow(''),
});

// Related products schema
export const relatedProductsSchema = Joi.object({
  crossSells: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  upSells: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  frequentlyBoughtTogether: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  accessories: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
});

// Custom URI validator that accepts full URIs, relative paths, and data URLs.
// More flexible than Joi's .uri( ), which rejects backend-relative upload paths.
export const uriOrPathValidator = Joi.string().custom((value, helpers) => {
  if (!value || value.trim() === '') {
    return value;
  }

  try {
    new URL(value);
    return value; // Valid full URI
  } catch {
    if (value.startsWith('/') || value.startsWith('data:')) {
      return value; // Valid relative path or data URL
    }
    return helpers.error('string.uriOrPath');
  }
}, 'URI or path validation').messages({
  'string.uriOrPath': '{{#label}} must be a valid URI (http://, https://), relative path (starting with /), or data URL (data:)',
});

export const metadataSchema = Joi.object({
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

export const productImageSchema = Joi.alternatives().try(
  uriOrPathValidator.required(),
  Joi.object({
    url: uriOrPathValidator.required(),
    altText: Joi.string().trim().max(200).optional().allow('', null),
  }).required()
);

export const productVideoSchema = Joi.object({
  url: Joi.string().trim().required(),
  thumbnailUrl: Joi.string().trim().optional().allow(''),
  title: Joi.string().trim().optional().allow(''),
  enabled: Joi.boolean().optional(),
  provider: Joi.string().valid('upload', 'instagram', 'youtube', 'vimeo').optional(),
  sourceUrl: Joi.string().trim().optional().allow(''),
  shortcode: Joi.string().trim().optional().allow(''),
  embedUrl: Joi.string().trim().optional().allow(''),
  mediaType: Joi.string().valid('file', 'reel', 'post', 'tv').optional(),
  aspectRatio: Joi.string().valid('9:16', '16:9', '1:1').optional(),
});

export const createProductSchema = Joi.object({
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
  videos: Joi.array().items(productVideoSchema).optional(),

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

export const updateProductSchema = Joi.object({
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
  videos: Joi.array().items(productVideoSchema).optional(),

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

/**
 * Bulk import needs create rules with a permissive shape: the importer
 * resolves references (category, tags) and normalises media before calling
 * validate(). Use this instead of forking the schema in the import service.
 */
export const importProductSchema = createProductSchema;
