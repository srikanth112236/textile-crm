/**
 * Product Validation Utility
 * Mirrors backend Joi validation for client-side validation
 * Helps catch errors earlier and provides better UX
 */

export interface ValidationError {
  field: string;
  message: string;
  path?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: Record<string, string>;
}

// Helper functions
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

const isValidSKU = (sku: string): boolean => {
  return /^[A-Z0-9\-_]+$/i.test(sku);
};

const isValidMongoId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  // Allow full URLs
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  // Allow relative paths
  if (url.startsWith('/')) return true;
  // Allow data URLs
  if (url.startsWith('data:')) return true;
  return false;
};

// Validation for variant attribute options
export const validateVariantAttributeOption = (option: any, index: number, attrName: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  const prefix = `variantAttributes.${attrName}.options[${index}]`;

  if (!option.value || typeof option.value !== 'string' || option.value.trim() === '') {
    errors.push({ field: `${prefix}.value`, message: 'Option value is required' });
  }

  if (option.colorCode && option.colorCode !== '' && !isValidHexColor(option.colorCode)) {
    errors.push({ 
      field: `${prefix}.colorCode`, 
      message: 'Color code must be a valid hex color (e.g., #FF0000 or #F00)' 
    });
  }

  if (option.sortOrder !== undefined && (typeof option.sortOrder !== 'number' || option.sortOrder < 0)) {
    errors.push({ field: `${prefix}.sortOrder`, message: 'Sort order must be a non-negative number' });
  }

  return errors;
};

// Validation for variant attributes
export const validateVariantAttribute = (attr: any, index: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  const prefix = `variantAttributes[${index}]`;

  if (!attr.name || typeof attr.name !== 'string' || attr.name.trim() === '') {
    errors.push({ field: `${prefix}.name`, message: 'Attribute name is required' });
  }

  const validTypes = ['color', 'size', 'text', 'image', 'button'];
  if (attr.type && !validTypes.includes(attr.type)) {
    errors.push({ 
      field: `${prefix}.type`, 
      message: `Type must be one of: ${validTypes.join(', ')}` 
    });
  }

  if (!attr.options || !Array.isArray(attr.options) || attr.options.length === 0) {
    errors.push({ field: `${prefix}.options`, message: 'At least one option is required' });
  } else {
    attr.options.forEach((opt: any, optIndex: number) => {
      errors.push(...validateVariantAttributeOption(opt, optIndex, attr.name || `attr${index}`));
    });
  }

  return errors;
};

// Validation for variant SKUs
export const validateVariantSKU = (sku: any, index: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  const prefix = `variantSKUs[${index}]`;

  if (!sku.sku || typeof sku.sku !== 'string' || sku.sku.trim() === '') {
    errors.push({ field: `${prefix}.sku`, message: 'SKU is required' });
  } else if (!isValidSKU(sku.sku)) {
    errors.push({ 
      field: `${prefix}.sku`, 
      message: 'SKU must contain only letters, numbers, hyphens, and underscores' 
    });
  }

  if (!sku.attributes || typeof sku.attributes !== 'object' || Object.keys(sku.attributes).length === 0) {
    errors.push({ field: `${prefix}.attributes`, message: 'Attributes are required' });
  }

  if (sku.price === undefined || sku.price === null || typeof sku.price !== 'number') {
    errors.push({ field: `${prefix}.price`, message: 'Price is required' });
  } else if (sku.price < 0) {
    errors.push({ field: `${prefix}.price`, message: 'Price cannot be negative' });
  }

  if (sku.stock !== undefined && (typeof sku.stock !== 'number' || sku.stock < 0)) {
    errors.push({ field: `${prefix}.stock`, message: 'Stock cannot be negative' });
  }

  if (sku.lowStockThreshold !== undefined && (typeof sku.lowStockThreshold !== 'number' || sku.lowStockThreshold < 0)) {
    errors.push({ field: `${prefix}.lowStockThreshold`, message: 'Low stock threshold cannot be negative' });
  }

  if (sku.weight !== undefined && sku.weight !== null && (typeof sku.weight !== 'number' || sku.weight < 0)) {
    errors.push({ field: `${prefix}.weight`, message: 'Weight cannot be negative' });
  }

  if (sku.images && Array.isArray(sku.images)) {
    sku.images.forEach((img: string, imgIndex: number) => {
      if (img && !isValidImageUrl(img)) {
        errors.push({ 
          field: `${prefix}.images[${imgIndex}]`, 
          message: 'Invalid image URL' 
        });
      }
    });
  }

  return errors;
};

// Validation for brand
export const validateBrand = (brand: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (brand) {
    if (!brand.name || typeof brand.name !== 'string' || brand.name.trim() === '') {
      errors.push({ field: 'brand.name', message: 'Brand name is required when brand is provided' });
    }

    if (brand.website && !brand.website.startsWith('http://') && !brand.website.startsWith('https://')) {
      errors.push({ field: 'brand.website', message: 'Brand website must be a valid URL' });
    }
  }

  return errors;
};

// Validation for specifications
export const validateSpecification = (spec: any, index: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  const prefix = `specifications[${index}]`;

  if (!spec.name || typeof spec.name !== 'string' || spec.name.trim() === '') {
    errors.push({ field: `${prefix}.name`, message: 'Specification name is required' });
  }

  if (!spec.value || typeof spec.value !== 'string' || spec.value.trim() === '') {
    errors.push({ field: `${prefix}.value`, message: 'Specification value is required' });
  }

  return errors;
};

// Validation for volume pricing
export const validateVolumePricing = (pricing: any, index: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  const prefix = `volumePricing[${index}]`;

  if (pricing.minQuantity === undefined || typeof pricing.minQuantity !== 'number' || pricing.minQuantity < 1) {
    errors.push({ field: `${prefix}.minQuantity`, message: 'Minimum quantity must be at least 1' });
  }

  if (pricing.price === undefined || typeof pricing.price !== 'number' || pricing.price < 0) {
    errors.push({ field: `${prefix}.price`, message: 'Price must be a non-negative number' });
  }

  return errors;
};

// Main validation function for product data
export const validateProductData = (data: any, isEdit: boolean = false): ValidationResult => {
  const errors: ValidationError[] = [];

  // Basic required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Product name is required' });
  } else if (data.name.length > 200) {
    errors.push({ field: 'name', message: 'Product name cannot exceed 200 characters' });
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (data.description.length > 10000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 10000 characters' });
  }

  if (data.shortDescription && data.shortDescription.length > 500) {
    errors.push({ field: 'shortDescription', message: 'Short description cannot exceed 500 characters' });
  }

  // Category
  if (!data.category || !isValidMongoId(data.category)) {
    errors.push({ field: 'category', message: 'Valid category is required' });
  }

  // Price
  if (data.price === undefined || data.price === null || typeof data.price !== 'number') {
    errors.push({ field: 'price', message: 'Price is required' });
  } else if (data.price < 0) {
    errors.push({ field: 'price', message: 'Price cannot be negative' });
  } else if (data.price === 0) {
    errors.push({ field: 'price', message: 'Price must be greater than 0' });
  }

  // SKU
  if (!data.sku || typeof data.sku !== 'string' || data.sku.trim() === '') {
    errors.push({ field: 'sku', message: 'SKU is required' });
  } else if (!isValidSKU(data.sku)) {
    errors.push({ field: 'sku', message: 'SKU must contain only letters, numbers, hyphens, and underscores' });
  }

  // Stock
  if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0)) {
    errors.push({ field: 'stock', message: 'Stock cannot be negative' });
  }

  // Images
  if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
    errors.push({ field: 'images', message: 'At least one image is required' });
  } else {
    data.images.forEach((img: any, index: number) => {
      const url = typeof img === 'string' ? img : img?.url;
      if (!url || !isValidImageUrl(url)) {
        errors.push({ field: `images[${index}]`, message: `Image ${index + 1} has an invalid URL` });
      }
    });
  }

  // Status
  const validStatuses = ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued', 'scheduled'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  // Low stock threshold
  if (data.lowStockThreshold !== undefined && (typeof data.lowStockThreshold !== 'number' || data.lowStockThreshold < 0)) {
    errors.push({ field: 'lowStockThreshold', message: 'Low stock threshold cannot be negative' });
  }

  // Variant Attributes
  if (data.hasVariants && data.variantAttributes && Array.isArray(data.variantAttributes)) {
    data.variantAttributes.forEach((attr: any, index: number) => {
      errors.push(...validateVariantAttribute(attr, index));
    });
  }

  // Variant SKUs
  if (data.hasVariants && data.variantSKUs && Array.isArray(data.variantSKUs)) {
    // Check for duplicate SKUs
    const skus = data.variantSKUs.map((v: any) => v.sku?.toUpperCase());
    const uniqueSkus = new Set(skus);
    if (uniqueSkus.size !== skus.length) {
      const duplicates = skus.filter((sku: string, index: number) => skus.indexOf(sku) !== index);
      errors.push({ 
        field: 'variantSKUs', 
        message: `Duplicate SKUs found: ${[...new Set(duplicates)].join(', ')}` 
      });
    }

    data.variantSKUs.forEach((sku: any, index: number) => {
      errors.push(...validateVariantSKU(sku, index));
    });
  }

  // Brand
  if (data.brand) {
    errors.push(...validateBrand(data.brand));
  }

  // Specifications
  if (data.specifications && Array.isArray(data.specifications)) {
    data.specifications.forEach((spec: any, index: number) => {
      errors.push(...validateSpecification(spec, index));
    });
  }

  // Volume Pricing
  if (data.volumePricing && Array.isArray(data.volumePricing)) {
    data.volumePricing.forEach((pricing: any, index: number) => {
      errors.push(...validateVolumePricing(pricing, index));
    });

    // Check for overlapping quantity ranges
    const sortedPricing = [...data.volumePricing].sort((a, b) => a.minQuantity - b.minQuantity);
    for (let i = 0; i < sortedPricing.length - 1; i++) {
      const current = sortedPricing[i];
      const next = sortedPricing[i + 1];
      if (current.maxQuantity && current.maxQuantity >= next.minQuantity) {
        errors.push({ 
          field: `volumePricing[${i}]`, 
          message: `Volume pricing tier ${i + 1} overlaps with tier ${i + 2}` 
        });
      }
    }
  }

  // Tags validation
  if (data.tags && Array.isArray(data.tags)) {
    data.tags.forEach((tag: string, index: number) => {
      if (!isValidMongoId(tag)) {
        errors.push({ field: `tags[${index}]`, message: `Tag ${index + 1} has an invalid ID` });
      }
    });
  }

  // Metadata validation
  if (data.metadata) {
    if (data.metadata.metaTitle && data.metadata.metaTitle.length > 60) {
      errors.push({ field: 'metadata.metaTitle', message: 'Meta title cannot exceed 60 characters' });
    }
    if (data.metadata.metaDescription && data.metadata.metaDescription.length > 160) {
      errors.push({ field: 'metadata.metaDescription', message: 'Meta description cannot exceed 160 characters' });
    }
    if (data.metadata.ogTitle && data.metadata.ogTitle.length > 60) {
      errors.push({ field: 'metadata.ogTitle', message: 'OG title cannot exceed 60 characters' });
    }
    if (data.metadata.ogDescription && data.metadata.ogDescription.length > 200) {
      errors.push({ field: 'metadata.ogDescription', message: 'OG description cannot exceed 200 characters' });
    }
  }

  // Convert errors to field errors map
  const fieldErrors: Record<string, string> = {};
  errors.forEach((error) => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
};

// Batch validation for variant SKUs (for large sets)
export const batchValidateVariantSKUs = (
  variantSKUs: any[], 
  batchSize: number = 50
): Promise<ValidationResult> => {
  return new Promise((resolve) => {
    const errors: ValidationError[] = [];
    const batches: any[][] = [];
    
    // Split into batches
    for (let i = 0; i < variantSKUs.length; i += batchSize) {
      batches.push(variantSKUs.slice(i, i + batchSize));
    }

    // Process batches with setTimeout to prevent UI blocking
    let batchIndex = 0;
    const processBatch = () => {
      if (batchIndex >= batches.length) {
        const fieldErrors: Record<string, string> = {};
        errors.forEach((error) => {
          if (!fieldErrors[error.field]) {
            fieldErrors[error.field] = error.message;
          }
        });
        resolve({ isValid: errors.length === 0, errors, fieldErrors });
        return;
      }

      const batch = batches[batchIndex];
      const baseIndex = batchIndex * batchSize;
      
      batch.forEach((sku: any, index: number) => {
        errors.push(...validateVariantSKU(sku, baseIndex + index));
      });

      batchIndex++;
      setTimeout(processBatch, 0);
    };

    processBatch();
  });
};

// Parse backend validation errors to field-level errors
export const parseBackendErrors = (backendResponse: any): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};

  if (backendResponse?.details && Array.isArray(backendResponse.details)) {
    backendResponse.details.forEach((detail: string) => {
      // Parse Joi error message format: "\"fieldName\" error message"
      const match = detail.match(/^"([^"]+)"\s+(.+)$/);
      if (match) {
        const [, field, message] = match;
        // Convert Joi field path to our format (e.g., variantSKUs.0.sku -> variantSKUs[0].sku)
        const normalizedField = field.replace(/\.(\d+)\./g, '[$1].');
        fieldErrors[normalizedField] = message;
      } else {
        // If we can't parse it, add to a general error
        if (!fieldErrors._general) {
          fieldErrors._general = detail;
        } else {
          fieldErrors._general += '; ' + detail;
        }
      }
    });
  }

  if (backendResponse?.error && !fieldErrors._general) {
    fieldErrors._general = backendResponse.error;
  }

  return fieldErrors;
};

// Get user-friendly field label
export const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    name: 'Product Name',
    description: 'Description',
    shortDescription: 'Short Description',
    price: 'Price',
    category: 'Category',
    stock: 'Stock',
    sku: 'SKU',
    status: 'Status',
    lowStockThreshold: 'Low Stock Threshold',
    images: 'Images',
    'brand.name': 'Brand Name',
    'brand.website': 'Brand Website',
    'metadata.metaTitle': 'Meta Title',
    'metadata.metaDescription': 'Meta Description',
    'metadata.ogTitle': 'OG Title',
    'metadata.ogDescription': 'OG Description',
    variantAttributes: 'Variant Attributes',
    variantSKUs: 'Variant SKUs',
    tags: 'Tags',
    volumePricing: 'Volume Pricing',
    specifications: 'Specifications',
  };

  // Handle array notation
  const arrayMatch = field.match(/^(\w+)\[(\d+)\]/);
  if (arrayMatch) {
    const [, base, index] = arrayMatch;
    const baseLabel = labels[base] || base;
    const rest = field.slice(arrayMatch[0].length);
    if (rest) {
      const subField = rest.startsWith('.') ? rest.slice(1) : rest;
      return `${baseLabel} #${parseInt(index) + 1} - ${subField}`;
    }
    return `${baseLabel} #${parseInt(index) + 1}`;
  }

  return labels[field] || field;
};

