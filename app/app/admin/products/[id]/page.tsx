'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { productsApi, IVariantAttribute, IVariantSKU } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { tagsApi, ITag } from '@/lib/api/tags';
import type { 
  ICategory, 
  IBrand, 
  ISpecification, 
  IShippingInfo, 
  IDigitalProduct, 
  IVolumePricing, 
  IProductIdentifiers, 
  IInventorySettings 
} from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Eye, Tag as TagIcon, Grid3X3, Settings2, Bug, AlertCircle, ChevronDown, ChevronUp, Copy, Check, Ruler } from 'lucide-react';
import ProductImageUpload, { ImageWithMetadata } from '@/components/products/ProductImageUpload';
import MetadataPreview from '@/components/products/MetadataPreview';
import ProductPreview from '@/components/products/ProductPreview';
import ProductVariantsManager from '@/components/products/ProductVariantsManager';
import { SizeChartEditor } from '@/components/products/SizeChartEditor';
import type { ISizeChartRow } from '@/lib/api/types';
import ProductAttributesForm from '@/components/products/ProductAttributesForm';
import { 
  validateProductData, 
  parseBackendErrors, 
  getFieldLabel,
  batchValidateVariantSKUs,
  ValidationResult 
} from '@/lib/validation/productValidation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Zod validation schema - Basic fields only (variants/attributes handled separately)
// Custom image URL validator that accepts full URLs, relative paths (/uploads/...), and data URLs
const imageUrlValidator = z.string().refine(
  (val) => {
    if (!val) return false;
    // Allow full URLs
    if (val.startsWith('http://') || val.startsWith('https://')) return true;
    // Allow relative paths
    if (val.startsWith('/')) return true;
    // Allow data URLs
    if (val.startsWith('data:')) return true;
    return false;
  },
  { message: 'Invalid image URL - must be a full URL, relative path, or data URL' }
);

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name cannot exceed 200 characters'),
  shortDescription: z.string().max(500, 'Short description cannot exceed 500 characters').optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required').max(10000, 'Description cannot exceed 10000 characters'),
  price: z.number().min(0, 'Price cannot be negative').positive('Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative'),
  sku: z.string().min(1, 'SKU is required').regex(/^[A-Z0-9\-_]+$/i, 'SKU must contain only letters, numbers, hyphens, and underscores'),
  status: z.enum(['draft', 'active', 'inactive', 'out_of_stock', 'discontinued', 'scheduled']),
  lowStockThreshold: z.number().int().min(0, 'Low stock threshold cannot be negative').default(10),
  images: z.array(
    z.union([
      imageUrlValidator,
      z.object({
        url: imageUrlValidator,
        altText: z.string().max(200).optional(),
      }),
    ])
  ).min(1, 'At least one image is required'),
  // Metadata fields
  metaTitle: z.string().max(60, 'Meta title cannot exceed 60 characters').optional().or(z.literal('')),
  metaDescription: z.string().max(160, 'Meta description cannot exceed 160 characters').optional().or(z.literal('')),
  metaKeywords: z.string().optional().or(z.literal('')),
  ogTitle: z.string().max(60, 'OG title cannot exceed 60 characters').optional().or(z.literal('')),
  ogDescription: z.string().max(200, 'OG description cannot exceed 200 characters').optional().or(z.literal('')),
  ogImage: imageUrlValidator.optional().or(z.literal('')),
  twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
  canonicalUrl: imageUrlValidator.optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const isEdit = productId && productId !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [tags, setTags] = useState<ITag[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Debug mode and field-level errors
  const [debugMode, setDebugMode] = useState(false);
  const [debugPayload, setDebugPayload] = useState<string>('');
  const [debugPayloadOpen, setDebugPayloadOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [copiedPayload, setCopiedPayload] = useState(false);
  
  // Advanced variant state
  const [hasVariants, setHasVariants] = useState(false);
  const [variantAttributes, setVariantAttributes] = useState<IVariantAttribute[]>([]);
  const [variantSKUs, setVariantSKUs] = useState<IVariantSKU[]>([]);
  
  // Advanced attributes state
  const [brand, setBrand] = useState<IBrand | undefined>(undefined);
  const [specifications, setSpecifications] = useState<ISpecification[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [condition, setCondition] = useState<'new' | 'refurbished' | 'used' | 'like_new'>('new');
  const [warranty, setWarranty] = useState('');
  const [fit, setFit] = useState('');
  const [fabric, setFabric] = useState('');
  const [pattern, setPattern] = useState('');
  const [occasion, setOccasion] = useState('');
  const [washCare, setWashCare] = useState('');
  const [sizeChart, setSizeChart] = useState<ISizeChartRow[]>([]);
  const [modelHeight, setModelHeight] = useState('');
  const [modelSizeWorn, setModelSizeWorn] = useState('');
  const [badges, setBadges] = useState<string[]>([]);
  const [shipping, setShipping] = useState<IShippingInfo | undefined>(undefined);
  const [digital, setDigital] = useState<IDigitalProduct | undefined>(undefined);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [costPrice, setCostPrice] = useState<number | undefined>(undefined);
  const [volumePricing, setVolumePricing] = useState<IVolumePricing[]>([]);
  const [identifiers, setIdentifiers] = useState<IProductIdentifiers | undefined>(undefined);
  const [inventory, setInventory] = useState<IInventorySettings | undefined>(undefined);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      sku: '',
      status: 'draft',
      lowStockThreshold: 10,
      images: [],
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      canonicalUrl: '',
      tags: [],
    },
  });

  const images = watch('images');

  useEffect(() => {
    fetchCategories();
    fetchTags(); // Phase 8: Fetch tags
    if (isEdit) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getCategories('active');
      setCategories(response.data);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await tagsApi.getTags(true, 1, 100); // Get all active tags
      if (response.success) {
        setTags(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      if (!productId || productId === 'new') {
        setLoading(false);
        return;
      }
      
      const response = await productsApi.getProduct(productId);
      const product = response.data;
      
      reset({
        name: product.name,
        shortDescription: product.shortDescription || '',
        description: product.description,
        price: product.price,
        category: typeof product.category === 'object' ? product.category._id : product.category,
        stock: product.stock,
        sku: product.sku,
        status: product.status,
        lowStockThreshold: product.lowStockThreshold || 10,
        images: product.images ? (typeof product.images[0] === 'string' 
          ? product.images 
          : product.images.map((img: any) => typeof img === 'string' ? img : { url: img.url, altText: img.altText })) 
          : [],
        metaTitle: product.metadata?.metaTitle || '',
        metaDescription: product.metadata?.metaDescription || '',
        metaKeywords: product.metadata?.metaKeywords?.join(', ') || '',
        ogTitle: product.metadata?.ogTitle || '',
        ogDescription: product.metadata?.ogDescription || '',
        ogImage: product.metadata?.ogImage || '',
        twitterCard: (product.metadata?.twitterCard as any) || 'summary_large_image',
        canonicalUrl: product.metadata?.canonicalUrl || '',
        tags: product.tags ? (product.tags as any[]).map((t: any) => typeof t === 'object' ? t._id : t) : [],
      });
      
      // Load advanced variant fields
      setHasVariants(product.hasVariants || false);
      setVariantAttributes(product.variantAttributes || []);
      setVariantSKUs(product.variantSKUs || []);
      
      // Load advanced attribute fields
      setBrand(product.brand);
      setSpecifications(product.specifications || []);
      setFeatures(product.features || []);
      setMaterials(product.materials || []);
      setCondition(product.condition || 'new');
      setWarranty(product.warranty || '');
      setFit((product as any).fit || '');
      setFabric((product as any).fabric || '');
      setPattern((product as any).pattern || '');
      setOccasion((product as any).occasion || '');
      setWashCare((product as any).washCare || '');
      setSizeChart(((product as any).sizeChart || []).filter((r: any) => r && r.size));
      setModelHeight((product as any).modelHeight || '');
      setModelSizeWorn((product as any).modelSizeWorn || '');
      setBadges((product as any).badges || []);
      setShipping(product.shipping);
      setDigital(product.digital);
      setCompareAtPrice(product.compareAtPrice);
      setCostPrice(product.costPrice);
      setVolumePricing(product.volumePricing || []);
      setIdentifiers(product.identifiers);
      setInventory(product.inventory);
    } catch (error: any) {
      console.error('Failed to fetch product:', error);
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S for save (works everywhere, including in inputs)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit((data) => onSubmit(data, false))();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize image URLs to ensure they're valid (convert relative paths to full URLs if needed)
  // Also decode any HTML entities that might have been encoded
  const decodeHtmlEntities = (str: string): string => {
    if (!str) return str;
    // Decode common HTML entities
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x2F;/g, '/')
      .replace(/&#39;/g, "'");
  };

  const normalizeImageUrl = (url: string | { url: string; altText?: string }): string | { url: string; altText?: string } => {
    if (typeof url === 'string') {
      // First, decode any HTML entities
      let cleanUrl = decodeHtmlEntities(url);
      
      // If it's already a full URL (http:// or https://), return as is
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        return cleanUrl;
      }
      // If it's a data URL, return as is
      if (cleanUrl.startsWith('data:')) {
        return cleanUrl;
      }
      // If it's a frontend proxy path (/api/images/uploads/...), keep it as is (don't convert to backend URL)
      if (cleanUrl.startsWith('/api/images/uploads/')) {
        return cleanUrl;
      }
      // If it's a relative path starting with /uploads/, convert to frontend proxy URL
      if (cleanUrl.startsWith('/uploads/')) {
        return `/api/images${cleanUrl}`;
      }
      // If it includes /uploads/ but doesn't start with /, try to extract and convert
      if (cleanUrl.includes('/uploads/')) {
        const match = cleanUrl.match(/\/uploads\/[^\/]+.*$/);
        if (match) {
          return `/api/images${match[0]}`;
        }
      }
      // If it's any other relative path starting with /, return as is
      if (cleanUrl.startsWith('/')) {
        return cleanUrl;
      }
      return cleanUrl;
    } else {
      // Handle object format
      const cleanUrl = decodeHtmlEntities(url.url);
      return {
        url: normalizeImageUrl(cleanUrl) as string,
        altText: url.altText,
      };
    }
  };

  const onSubmit = async (data: ProductFormData, saveAsDraft = false) => {
    try {
      setErrorMessage(null);
      setFieldErrors({});

      // Normalize image URLs before sending - backend expects /uploads/ format
      const normalizedImages = Array.isArray(data.images)
        ? data.images.map((img) => {
            if (typeof img === 'string') {
              // Convert frontend proxy URLs back to backend format
              if (img.startsWith('/api/images/uploads/')) {
                return img.replace('/api/images', '');
              }
              // Keep data URLs and other formats as-is
              return img;
            } else if (img && typeof img === 'object' && 'url' in img) {
              let url = img.url;
              if (url.startsWith('/api/images/uploads/')) {
                url = url.replace('/api/images', '');
              }
              return { url, altText: img.altText || '' };
            }
            return img;
          }).filter(Boolean)
        : [];
      
      // Validate we have at least one image
      if (normalizedImages.length === 0) {
        setErrorMessage('At least one product image is required.');
        setFieldErrors({ images: 'At least one product image is required' });
        return;
      }

      // Normalize metadata URLs
      const normalizedMetadata: any = {};
      if (data.metaTitle) normalizedMetadata.metaTitle = data.metaTitle;
      if (data.metaDescription) normalizedMetadata.metaDescription = data.metaDescription;
      if (data.metaKeywords) {
        normalizedMetadata.metaKeywords = data.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean);
      }
      if (data.ogTitle) normalizedMetadata.ogTitle = data.ogTitle;
      if (data.ogDescription) normalizedMetadata.ogDescription = data.ogDescription;
      if (data.ogImage) normalizedMetadata.ogImage = normalizeImageUrl(data.ogImage) as string;
      if (data.twitterCard) normalizedMetadata.twitterCard = data.twitterCard;
      if (data.canonicalUrl) normalizedMetadata.canonicalUrl = normalizeImageUrl(data.canonicalUrl) as string;

      // Calculate stock from variants if has variants
      let calculatedStock = data.stock || 0;
      if (hasVariants && variantSKUs.length > 0) {
        calculatedStock = variantSKUs.reduce((sum, v) => sum + (v.isEnabled ? (v.stock || 0) : 0), 0);
      }

      // Prepare product data
      const productData: any = {
        name: data.name,
        shortDescription: data.shortDescription || undefined,
        description: data.description,
        price: data.price,
        category: data.category,
        stock: calculatedStock,
        sku: data.sku.toUpperCase(),
        status: saveAsDraft ? 'draft' : data.status,
        lowStockThreshold: data.lowStockThreshold || 10,
        images: normalizedImages,
        tags: data.tags || [],
        
        // Advanced Variants
        hasVariants,
        variantAttributes: hasVariants && variantAttributes.length > 0 ? variantAttributes : undefined,
        variantSKUs: hasVariants && variantSKUs.length > 0 ? variantSKUs : undefined,
      };

      // Only add metadata if there's any
      if (Object.keys(normalizedMetadata).length > 0) {
        productData.metadata = normalizedMetadata;
      }

      // Add optional advanced attributes only if they have values
      if (brand?.name) productData.brand = brand;
      if (specifications.length > 0) productData.specifications = specifications;
      if (features.length > 0) productData.features = features;
      if (materials.length > 0) productData.materials = materials;
      if (condition && condition !== 'new') productData.condition = condition;
      if (warranty) productData.warranty = warranty;
      if (fit) productData.fit = fit;
      if (fabric) productData.fabric = fabric;
      if (pattern) productData.pattern = pattern;
      if (occasion) productData.occasion = occasion;
      if (washCare) productData.washCare = washCare;
      const cleanChart = sizeChart.filter((r) => r && String(r.size || '').trim() !== '');
      if (cleanChart.length > 0) productData.sizeChart = cleanChart;
      if (modelHeight.trim()) productData.modelHeight = modelHeight.trim();
      if (modelSizeWorn.trim()) productData.modelSizeWorn = modelSizeWorn.trim();
      if (badges.length > 0) productData.badges = badges;
      if (shipping?.requiresShipping !== undefined) productData.shipping = shipping;
      if (digital?.isDigital) productData.digital = digital;
      if (compareAtPrice) productData.compareAtPrice = compareAtPrice;
      if (costPrice) productData.costPrice = costPrice;
      if (volumePricing.length > 0) productData.volumePricing = volumePricing;
      if (identifiers?.gtin || identifiers?.upc || identifiers?.ean || identifiers?.isbn || identifiers?.mpn) {
        productData.identifiers = identifiers;
      }
      if (inventory?.trackInventory !== undefined) productData.inventory = inventory;

      // Clean variant attributes (ensure proper format)
      if (productData.variantAttributes) {
        productData.variantAttributes = productData.variantAttributes.map((attr: any) => ({
          name: attr.name,
          displayName: attr.displayName || '',
          type: attr.type || 'button',
          required: attr.required !== false,
          options: (attr.options || []).map((opt: any) => ({
            value: opt.value,
            label: opt.label || '',
            // Only include colorCode if it's a valid hex color
            ...(opt.colorCode && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(opt.colorCode) ? { colorCode: opt.colorCode } : {}),
            ...(opt.imageUrl ? { imageUrl: opt.imageUrl } : {}),
            sortOrder: opt.sortOrder || 0,
          })),
        }));
      }

      // Clean variant SKU images (convert to backend format)
      if (productData.variantSKUs) {
        productData.variantSKUs = productData.variantSKUs.map((sku: any) => ({
          sku: sku.sku,
          attributes: sku.attributes || {},
          price: sku.price || 0,
          ...(sku.compareAtPrice ? { compareAtPrice: sku.compareAtPrice } : {}),
          ...(sku.costPrice ? { costPrice: sku.costPrice } : {}),
          stock: sku.stock || 0,
          ...(sku.lowStockThreshold ? { lowStockThreshold: sku.lowStockThreshold } : {}),
          ...(sku.weight ? { weight: sku.weight } : {}),
          ...(sku.barcode ? { barcode: sku.barcode } : {}),
          images: (sku.images || []).map((img: string) => {
            if (img.startsWith('/api/images/uploads/')) {
              return img.replace('/api/images', '');
            }
            return img;
          }),
          isDefault: sku.isDefault || false,
          isEnabled: sku.isEnabled !== false,
          position: sku.position || 0,
        }));
      }

      // Store payload for debug mode
      if (debugMode) {
        setDebugPayload(JSON.stringify(productData, null, 2));
        setDebugPayloadOpen(true);
      }

      console.log('Submitting product data:', JSON.stringify(productData, null, 2));

      // Client-side validation before submitting
      const clientValidation = validateProductData(productData, Boolean(isEdit));
      
      // For large variant sets, use batch validation
      if (productData.variantSKUs && productData.variantSKUs.length > 50) {
        const variantValidation = await batchValidateVariantSKUs(productData.variantSKUs);
        if (!variantValidation.isValid) {
          clientValidation.errors.push(...variantValidation.errors);
          Object.assign(clientValidation.fieldErrors, variantValidation.fieldErrors);
        }
      }

      if (!clientValidation.isValid) {
        setFieldErrors(clientValidation.fieldErrors);
        const errorSummary = clientValidation.errors.slice(0, 5).map(e => 
          `${getFieldLabel(e.field)}: ${e.message}`
        ).join('\n• ');
        const moreErrors = clientValidation.errors.length > 5 
          ? `\n\n... and ${clientValidation.errors.length - 5} more errors` 
          : '';
        setErrorMessage(`Validation failed:\n• ${errorSummary}${moreErrors}`);
        return;
      }

      if (isEdit) {
        await productsApi.updateProduct(productId, productData);
      } else {
        await productsApi.createProduct(productData);
      }
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Failed to save product:', error);
      console.error('Error response:', error.response?.data);
      
      // Parse backend errors to field-level errors
      const backendFieldErrors = parseBackendErrors(error.response?.data);
      setFieldErrors(backendFieldErrors);
      
      // Build detailed error message
      let errorMsg = 'Failed to save product.';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        errorMsg += '\n\nValidation errors:\n• ' + error.response.data.details.join('\n• ');
      }
      setErrorMessage(errorMsg);
    }
  };

  // Helper to check if a field has an error
  const hasFieldError = (field: string): boolean => {
    return !!fieldErrors[field] || Object.keys(fieldErrors).some(key => key.startsWith(field));
  };

  // Helper to get field error message
  const getFieldError = (field: string): string | undefined => {
    return fieldErrors[field];
  };

  // Copy debug payload to clipboard
  const copyPayloadToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(debugPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading product...</span>
      </div>
    );
  }

  // Flatten categories for select
  const flatCategories: ICategory[] = [];
  const flattenCategories = (cats: ICategory[], level = 0) => {
    cats.forEach((cat) => {
      if (isEdit && cat._id === productId) return;
      flatCategories.push({ ...cat, name: `${'  '.repeat(level)}${cat.name}` } as ICategory);
      if (cat.children && cat.children.length > 0) {
        flattenCategories(cat.children, level + 1);
      }
    });
  };
  flattenCategories(categories);

  return (
    <TooltipProvider>
    <div className="max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Edit Product' : 'Create Product'}
          </h1>
        </div>
        
        {/* Debug Mode Toggle */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={debugMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
                className={debugMode ? 'bg-amber-500 hover:bg-amber-600' : ''}
              >
                <Bug className="h-4 w-4 mr-1" />
                Debug {debugMode ? 'ON' : 'OFF'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enable to view API payload before submission</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive mb-1">Error saving product</p>
              <pre className="text-xs text-destructive/90 whitespace-pre-wrap break-words">{errorMessage}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Field-Level Errors Summary */}
      {Object.keys(fieldErrors).length > 0 && (
        <Collapsible className="mb-4">
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {Object.keys(fieldErrors).length} field{Object.keys(fieldErrors).length > 1 ? 's' : ''} with validation errors
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-amber-600 transition-transform ui-expanded:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {Object.entries(fieldErrors).slice(0, 10).map(([field, message]) => (
                  <li key={field} className="flex gap-2">
                    <span className="font-mono text-amber-600">{getFieldLabel(field)}:</span>
                    <span>{message}</span>
                  </li>
                ))}
                {Object.keys(fieldErrors).length > 10 && (
                  <li className="text-amber-500">... and {Object.keys(fieldErrors).length - 10} more</li>
                )}
              </ul>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Debug Payload View */}
      {debugMode && debugPayload && (
        <Collapsible open={debugPayloadOpen} onOpenChange={setDebugPayloadOpen} className="mb-4">
          <div className="rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  API Payload Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); copyPayloadToClipboard(); }}
                  className="h-6 px-2"
                >
                  {copiedPayload ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
                {debugPayloadOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <pre className="text-xs bg-slate-50 dark:bg-slate-950 rounded p-3 overflow-x-auto max-h-96 overflow-y-auto font-mono">
                {debugPayload}
              </pre>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      <div className="grid gap-4 2xl:grid-cols-[1fr_380px]">
        {/* Left Side - Form */}
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-semibold">Basic Information</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm">Product Name *</Label>
              <Input
                id="name"
                {...register('name')}
                className={`h-9 ${errors.name || hasFieldError('name') ? 'border-destructive ring-1 ring-destructive/50' : ''}`}
              />
              {(errors.name || getFieldError('name')) && (
                <p className="text-xs text-destructive">{errors.name?.message || getFieldError('name')}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="sku" className="text-sm">SKU *</Label>
              <Input
                id="sku"
                {...register('sku', {
                  onChange: (e) => {
                    setValue('sku', e.target.value.toUpperCase());
                  },
                })}
                className={`h-9 ${errors.sku || hasFieldError('sku') ? 'border-destructive ring-1 ring-destructive/50' : ''}`}
              />
              {(errors.sku || getFieldError('sku')) && (
                <p className="text-xs text-destructive">{errors.sku?.message || getFieldError('sku')}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="shortDescription" className="text-sm">Short Description</Label>
            <textarea
              id="shortDescription"
              {...register('shortDescription')}
              rows={2}
              placeholder="Brief summary (max 500 chars)"
              maxLength={500}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background border-input resize-none"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm">Description *</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className={`w-full px-3 py-2 text-sm border rounded-md bg-background resize-none ${
                errors.description ? 'border-destructive' : 'border-input'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="category" className="text-sm">Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={`h-9 ${errors.category || hasFieldError('category') ? 'border-destructive ring-1 ring-destructive/50' : ''}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {flatCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {(errors.category || getFieldError('category')) && (
                <p className="text-xs text-destructive">{errors.category?.message || getFieldError('category')}</p>
              )}
            </div>

            {/* Phase 8: Tags Selection */}
            <div className="space-y-2">
              <Label>Tags (Optional)</Label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => {
                  const selectedTagIds = field.value || [];
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <TagIcon className="mr-2 h-4 w-4" />
                          {selectedTagIds.length > 0
                            ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? 's' : ''} selected`
                            : 'Select tags'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-y-auto">
                        {tags.length === 0 ? (
                          <div className="text-sm text-muted-foreground text-center py-4 px-2">
                            No tags available.
                            <br />
                            <a href="/admin/tags" className="text-primary hover:underline">
                              Create tags
                            </a>
                          </div>
                        ) : (
                          <div className="p-2 space-y-1">
                            {tags.map((tag) => {
                              const isSelected = selectedTagIds.includes(tag._id);
                              return (
                                <div
                                  key={tag._id}
                                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                  onClick={() => {
                                    const newTags = isSelected
                                      ? selectedTagIds.filter((id) => id !== tag._id)
                                      : [...selectedTagIds, tag._id];
                                    field.onChange(newTags);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      const newTags = isSelected
                                        ? selectedTagIds.filter((id) => id !== tag._id)
                                        : [...selectedTagIds, tag._id];
                                      field.onChange(newTags);
                                    }}
                                    className="rounded"
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color || '#6366f1' }}
                                  />
                                  <Label className="flex-1 cursor-pointer font-normal">
                                    {tag.name}
                                  </Label>
                                  {tag.usageCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      ({tag.usageCount})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }}
              />
              {watch('tags') && watch('tags')!.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {watch('tags')!.map((tagId) => {
                    const tag = tags.find((t) => t._id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge
                        key={tagId}
                        variant="outline"
                        className="gap-1"
                        style={tag.color ? { borderColor: tag.color, color: tag.color } : {}}
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => {
                            const currentTags = watch('tags') || [];
                            setValue('tags', currentTags.filter((t) => t !== tagId));
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                <a href="/admin/tags" className="text-primary hover:underline">
                  Manage tags
                </a>
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status" className="text-sm">Status *</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="price" className="text-sm">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
                className={`h-9 ${errors.price || hasFieldError('price') ? 'border-destructive ring-1 ring-destructive/50' : ''}`}
              />
              {(errors.price || getFieldError('price')) && (
                <p className="text-xs text-destructive">{errors.price?.message || getFieldError('price')}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="stock" className="text-sm">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register('stock', { valueAsNumber: true })}
                className={`h-9 ${errors.stock || hasFieldError('stock') ? 'border-destructive ring-1 ring-destructive/50' : ''}`}
              />
              {(errors.stock || getFieldError('stock')) && (
                <p className="text-xs text-destructive">{errors.stock?.message || getFieldError('stock')}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="lowStockThreshold" className="text-sm">Low Stock Alert</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                {...register('lowStockThreshold', { valueAsNumber: true })}
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className={`rounded-lg border bg-card p-4 ${hasFieldError('images') ? 'border-destructive' : ''}`}>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            Product Images
            {hasFieldError('images') && <AlertCircle className="h-4 w-4 text-destructive" />}
          </h2>
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ProductImageUpload
                images={field.value as ImageWithMetadata[]}
                onImagesChange={field.onChange}
              />
            )}
          />
          {(errors.images || getFieldError('images')) && (
            <p className="text-xs text-destructive mt-2">{errors.images?.message || getFieldError('images')}</p>
          )}
        </div>

        {/* SEO Metadata */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-base font-semibold mb-3">SEO & Metadata</h2>

            <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              {...register('metaTitle')}
              placeholder="Optimized title for search engines (max 60 characters)"
              maxLength={60}
              className={errors.metaTitle ? 'border-destructive' : ''}
            />
            {errors.metaTitle && (
              <p className="text-sm text-destructive">{errors.metaTitle.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {watch('metaTitle')?.length || 0}/60 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <textarea
              id="metaDescription"
              {...register('metaDescription')}
              rows={3}
              placeholder="Brief description for search engines (max 160 characters)"
              maxLength={160}
              className={`w-full px-3 py-2 border rounded-md bg-background ${
                errors.metaDescription ? 'border-destructive' : 'border-input'
              }`}
            />
            {errors.metaDescription && (
              <p className="text-sm text-destructive">{errors.metaDescription.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {watch('metaDescription')?.length || 0}/160 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaKeywords">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              {...register('metaKeywords')}
              placeholder="Comma-separated keywords (e.g., product, category, brand)"
            />
            <p className="text-xs text-muted-foreground">
              Separate keywords with commas
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ogTitle">Open Graph Title</Label>
              <Input
                id="ogTitle"
                {...register('ogTitle')}
                placeholder="Title for social media sharing"
                maxLength={60}
                className={errors.ogTitle ? 'border-destructive' : ''}
              />
              {errors.ogTitle && (
                <p className="text-sm text-destructive">{errors.ogTitle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogDescription">Open Graph Description</Label>
              <textarea
                id="ogDescription"
                {...register('ogDescription')}
                rows={3}
                placeholder="Description for social media sharing"
                maxLength={200}
                className={`w-full px-3 py-2 border rounded-md bg-background ${
                  errors.ogDescription ? 'border-destructive' : 'border-input'
                }`}
              />
              {errors.ogDescription && (
                <p className="text-sm text-destructive">{errors.ogDescription.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ogImage">Open Graph Image URL</Label>
              <Input
                id="ogImage"
                type="url"
                {...register('ogImage')}
                placeholder="https://example.com/og-image.jpg"
                className={errors.ogImage ? 'border-destructive' : ''}
              />
              {errors.ogImage && (
                <p className="text-sm text-destructive">{errors.ogImage.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterCard">Twitter Card Type</Label>
              <Controller
                name="twitterCard"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                      <SelectItem value="app">App</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonicalUrl">Canonical URL</Label>
            <Input
              id="canonicalUrl"
              type="url"
              {...register('canonicalUrl')}
              placeholder="https://example.com/product-url"
              className={errors.canonicalUrl ? 'border-destructive' : ''}
            />
            {errors.canonicalUrl && (
              <p className="text-sm text-destructive">{errors.canonicalUrl.message}</p>
            )}
          </div>
        </div>

        {/* Product Variants Section */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Grid3X3 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Product Variants</h2>
            {hasVariants && variantSKUs.length > 0 && (
              <Badge variant="secondary" className="text-xs">{variantSKUs.length}</Badge>
            )}
          </div>
          <ProductVariantsManager
            hasVariants={hasVariants}
            variantAttributes={variantAttributes}
            variantSKUs={variantSKUs}
            baseSku={watch('sku') || ''}
            basePrice={watch('price') || 0}
            productId={isEdit ? productId : undefined}
            productImages={(watch('images') || []).map((img: string | { url: string }) => 
              typeof img === 'string' ? img : img.url
            )}
            onHasVariantsChange={setHasVariants}
            onVariantAttributesChange={setVariantAttributes}
            onVariantSKUsChange={setVariantSKUs}
          />
        </div>

        {/* Advanced Attributes Section */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Advanced Attributes</h2>
          </div>
          <ProductAttributesForm
            brand={brand}
            onBrandChange={setBrand}
            specifications={specifications}
            onSpecificationsChange={setSpecifications}
            features={features}
            onFeaturesChange={setFeatures}
            materials={materials}
            onMaterialsChange={setMaterials}
            condition={condition}
            onConditionChange={setCondition}
            warranty={warranty}
            onWarrantyChange={setWarranty}
            fit={fit}
            onFitChange={setFit}
            fabric={fabric}
            onFabricChange={setFabric}
            pattern={pattern}
            onPatternChange={setPattern}
            occasion={occasion}
            onOccasionChange={setOccasion}
            washCare={washCare}
            onWashCareChange={setWashCare}
            badges={badges}
            onBadgesChange={setBadges}
            shipping={shipping}
            onShippingChange={setShipping}
            digital={digital}
            onDigitalChange={setDigital}
            compareAtPrice={compareAtPrice}
            onCompareAtPriceChange={setCompareAtPrice}
            costPrice={costPrice}
            onCostPriceChange={setCostPrice}
            volumePricing={volumePricing}
            onVolumePricingChange={setVolumePricing}
            identifiers={identifiers}
            onIdentifiersChange={setIdentifiers}
            inventory={inventory}
            onInventoryChange={setInventory}
          />
        </div>

        {/* Sizes & Fit Chart Section */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Ruler className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Sizes & Fit Chart</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Per-product measurements in inches. Empty = shoppers see the category table.</p>
          <SizeChartEditor
            rows={sizeChart}
            onChange={setSizeChart}
            modelHeight={modelHeight}
            onModelHeightChange={setModelHeight}
            modelSizeWorn={modelSizeWorn}
            onModelSizeWornChange={setModelSizeWorn}
            categoryName={categories.find((c) => c._id === watch('category'))?.name}
          />
        </div>

        {/* Form Actions */}
        <div className="flex flex-wrap gap-4">
          {/* Publish Product Button - Only show if status is draft or for new products */}
          {(watch('status') === 'draft' || !isEdit) && (
            <Button 
              type="button" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setValue('status', 'active');
                handleSubmit((data) => {
                  const publishData = { ...data, status: 'active' as const };
                  onSubmit(publishData, false);
                })();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Publish Product
                </>
              )}
            </Button>
          )}
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleSubmit((data) => onSubmit(data, true))()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save as Draft'
            )}
          </Button>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              'Update Product'
            ) : (
              'Create Product'
            )}
          </Button>
          
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
        </form>

        {/* Right Side - Real-time Preview (Sticky) - Hidden on smaller screens */}
        <div className="hidden 2xl:block 2xl:sticky 2xl:top-4 h-fit">
          <div className="space-y-3">
            {/* Product Card Preview */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Preview</h2>
              </div>
              <ProductPreview
                formData={{
                  name: watch('name') || '',
                  description: watch('description') || '',
                  price: watch('price') || 0,
                  stock: watch('stock') || 0,
                  status: watch('status') || 'draft',
                  images: watch('images') as ImageWithMetadata[] || [],
                }}
              />
            </div>

            {/* SEO Preview */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">SEO Preview</h2>
              </div>
              <MetadataPreview
                compact={true}
                formData={{
                  name: watch('name') || '',
                  metaTitle: watch('metaTitle'),
                  metaDescription: watch('metaDescription'),
                  ogTitle: watch('ogTitle'),
                  ogDescription: watch('ogDescription'),
                  ogImage: watch('ogImage'),
                  images: (watch('images') as ImageWithMetadata[])?.map(img => {
                    if (typeof img === 'string') {
                      return img;
                    }
                    if (img && typeof img === 'object' && 'url' in img) {
                      return img.url;
                    }
                    return '';
                  }).filter(Boolean) || [],
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
