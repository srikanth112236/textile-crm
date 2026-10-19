'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Edit,
  Grid3X3,
  Palette,
  Package,
  AlertTriangle,
  Check,
  X,
  Loader2,
  RefreshCw,
  Copy,
  Image as ImageIcon,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { productsApi, IVariantAttribute, IVariantSKU, IVariantAttributeOption } from '@/lib/api/products';
import { useToast } from '@/hooks/use-toast';
import VariantImageUpload from './VariantImageUpload';

interface ProductVariantsManagerProps {
  hasVariants: boolean;
  variantAttributes: IVariantAttribute[];
  variantSKUs: IVariantSKU[];
  baseSku: string;
  basePrice: number;
  productId?: string;
  productImages?: string[];
  onHasVariantsChange: (hasVariants: boolean) => void;
  onVariantAttributesChange: (attributes: IVariantAttribute[]) => void;
  onVariantSKUsChange: (skus: IVariantSKU[]) => void;
}

const ATTRIBUTE_TYPES: Array<{ value: IVariantAttribute['type']; label: string; icon: React.ReactNode }> = [
  { value: 'color', label: 'Color', icon: <Palette className="h-4 w-4" /> },
  { value: 'size', label: 'Size', icon: <Package className="h-4 w-4" /> },
  { value: 'button', label: 'Button', icon: <Grid3X3 className="h-4 w-4" /> },
  { value: 'text', label: 'Text', icon: <span className="text-xs font-bold">Aa</span> },
  { value: 'image', label: 'Image', icon: <span className="text-xs">🖼️</span> },
];

const VARIANTS_PER_PAGE = 10;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProductVariantsManager({
  hasVariants,
  variantAttributes,
  variantSKUs,
  baseSku,
  basePrice,
  productId,
  productImages = [],
  onHasVariantsChange,
  onVariantAttributesChange,
  onVariantSKUsChange,
}: ProductVariantsManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    duplicatesInList: string[];
    existingSkus: string[];
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(variantSKUs.length / VARIANTS_PER_PAGE);
  const paginatedVariants = variantSKUs.slice(
    (currentPage - 1) * VARIANTS_PER_PAGE,
    currentPage * VARIANTS_PER_PAGE
  );

  // Dialog states
  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<IVariantAttribute | null>(null);
  const [deleteAttributeDialog, setDeleteAttributeDialog] = useState<{
    open: boolean;
    attribute: IVariantAttribute | null;
  }>({ open: false, attribute: null });
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedVariantForImages, setSelectedVariantForImages] = useState<number | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // New attribute form state
  const [newAttribute, setNewAttribute] = useState<Partial<IVariantAttribute>>({
    name: '',
    displayName: '',
    type: 'button',
    options: [],
    required: true,
  });
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('#6366f1');

  // Bulk operations state
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkStock, setBulkStock] = useState<string>('');

  // SKU validation with debouncing
  const [skusToValidate, setSkusToValidate] = useState<string[]>([]);
  const debouncedSkus = useDebounce(skusToValidate, 500);

  // Trigger debounced validation
  useEffect(() => {
    if (debouncedSkus.length > 0 && !isValidating) {
      performValidation(debouncedSkus);
    }
  }, [debouncedSkus]);

  // Perform SKU validation
  const performValidation = async (skus: string[]) => {
    if (skus.length === 0) return;

    setIsValidating(true);
    try {
      const response = await productsApi.validateVariantSKUs({
        skus,
        productId,
      });

      setValidationResult(response.data);

      if (!response.data.isValid) {
        const issues: string[] = [];
        if (response.data.hasDuplicatesInList) {
          issues.push(`Duplicate SKUs: ${response.data.duplicatesInList.join(', ')}`);
        }
        if (response.data.existsInDatabase) {
          issues.push(`Already in use: ${response.data.existingSkus.join(', ')}`);
        }
        toast({
          title: 'SKU Validation Issues',
          description: issues.join('. '),
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Queue SKU validation with debouncing
  const queueValidation = useCallback(() => {
    const skus = variantSKUs.map((v) => v.sku);
    setSkusToValidate(skus);
  }, [variantSKUs]);

  // Add option to new attribute
  const addOptionToAttribute = () => {
    if (!newOptionValue.trim()) return;

    const option: IVariantAttributeOption = {
      value: newOptionValue.trim(),
      sortOrder: (newAttribute.options?.length || 0),
    };

    if (newAttribute.type === 'color') {
      option.colorCode = newOptionColor;
    }

    setNewAttribute((prev) => ({
      ...prev,
      options: [...(prev.options || []), option],
    }));
    setNewOptionValue('');
    setNewOptionColor('#6366f1');
  };

  // Remove option from new attribute
  const removeOptionFromAttribute = (index: number) => {
    setNewAttribute((prev) => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index),
    }));
  };

  // Save attribute (create or update)
  const saveAttribute = () => {
    if (!newAttribute.name?.trim()) {
      toast({
        title: 'Error',
        description: 'Attribute name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newAttribute.options || newAttribute.options.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one option is required',
        variant: 'destructive',
      });
      return;
    }

    const existingNames = variantAttributes
      .filter((a) => a.name !== editingAttribute?.name)
      .map((a) => a.name.toLowerCase());

    if (existingNames.includes(newAttribute.name.toLowerCase())) {
      toast({
        title: 'Error',
        description: 'An attribute with this name already exists',
        variant: 'destructive',
      });
      return;
    }

    const attribute: IVariantAttribute = {
      name: newAttribute.name.trim(),
      displayName: newAttribute.displayName?.trim() || newAttribute.name.trim(),
      type: newAttribute.type || 'button',
      options: newAttribute.options,
      required: newAttribute.required !== false,
    };

    if (editingAttribute) {
      const updatedAttributes = variantAttributes.map((a) =>
        a.name === editingAttribute.name ? attribute : a
      );
      onVariantAttributesChange(updatedAttributes);
      toast({ title: 'Success', description: 'Attribute updated successfully' });
    } else {
      onVariantAttributesChange([...variantAttributes, attribute]);
      toast({ title: 'Success', description: 'Attribute added successfully' });
    }

    setNewAttribute({
      name: '',
      displayName: '',
      type: 'button',
      options: [],
      required: true,
    });
    setEditingAttribute(null);
    setAttributeDialogOpen(false);
  };

  // Delete attribute
  const handleDeleteAttribute = () => {
    if (!deleteAttributeDialog.attribute) return;

    const updatedAttributes = variantAttributes.filter(
      (a) => a.name !== deleteAttributeDialog.attribute?.name
    );
    onVariantAttributesChange(updatedAttributes);

    if (variantSKUs.length > 0) {
      onVariantSKUsChange([]);
      toast({
        title: 'Note',
        description: 'Variant SKUs have been cleared due to attribute change. Please regenerate.',
      });
    }

    setDeleteAttributeDialog({ open: false, attribute: null });
  };

  // Generate variant combinations
  const generateCombinations = async () => {
    if (variantAttributes.length === 0) {
      toast({
        title: 'Error',
        description: 'Add at least one variant attribute first',
        variant: 'destructive',
      });
      return;
    }

    if (!baseSku) {
      toast({
        title: 'Error',
        description: 'Please set a base SKU first',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await productsApi.generateVariantCombinations({
        variantAttributes,
        basePrice,
        baseSku,
      });

      if (response.success) {
        onVariantSKUsChange(response.data.variantSKUs);
        setCurrentPage(1);
        toast({
          title: 'Success',
          description: `Generated ${response.data.totalCombinations} variant combinations`,
        });
        
        // Queue validation with debounce
        setSkusToValidate(response.data.variantSKUs.map((v) => v.sku));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate variant combinations',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual validate button
  const handleManualValidate = () => {
    const skus = variantSKUs.map((v) => v.sku);
    performValidation(skus);
  };

  // Update variant SKU (with pagination offset)
  const updateVariantSKU = (pageIndex: number, updates: Partial<IVariantSKU>) => {
    const actualIndex = (currentPage - 1) * VARIANTS_PER_PAGE + pageIndex;
    const updatedSKUs = [...variantSKUs];
    updatedSKUs[actualIndex] = { ...updatedSKUs[actualIndex], ...updates };
    onVariantSKUsChange(updatedSKUs);
    
    // Queue validation if SKU changed
    if (updates.sku) {
      queueValidation();
    }
  };

  // Delete variant SKU
  const deleteVariantSKU = (pageIndex: number) => {
    const actualIndex = (currentPage - 1) * VARIANTS_PER_PAGE + pageIndex;
    const updatedSKUs = variantSKUs.filter((_, i) => i !== actualIndex);
    onVariantSKUsChange(updatedSKUs);
    
    // Adjust page if needed
    if (paginatedVariants.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Set default variant
  const setDefaultVariant = (pageIndex: number) => {
    const actualIndex = (currentPage - 1) * VARIANTS_PER_PAGE + pageIndex;
    const updatedSKUs = variantSKUs.map((v, i) => ({
      ...v,
      isDefault: i === actualIndex,
    }));
    onVariantSKUsChange(updatedSKUs);
  };

  // Bulk operations
  const applyBulkPrice = () => {
    const price = parseFloat(bulkPrice);
    if (isNaN(price) || price < 0) {
      toast({ title: 'Error', description: 'Please enter a valid price', variant: 'destructive' });
      return;
    }
    const updatedSKUs = variantSKUs.map((v) => ({ ...v, price }));
    onVariantSKUsChange(updatedSKUs);
    setBulkPrice('');
    toast({ title: 'Success', description: 'Bulk price applied' });
  };

  const applyBulkStock = () => {
    const stock = parseInt(bulkStock, 10);
    if (isNaN(stock) || stock < 0) {
      toast({ title: 'Error', description: 'Please enter a valid stock number', variant: 'destructive' });
      return;
    }
    const updatedSKUs = variantSKUs.map((v) => ({ ...v, stock }));
    onVariantSKUsChange(updatedSKUs);
    setBulkStock('');
    toast({ title: 'Success', description: 'Bulk stock applied' });
  };

  // CSV Export
  const exportToCSV = () => {
    if (variantSKUs.length === 0) {
      toast({ title: 'Error', description: 'No variants to export', variant: 'destructive' });
      return;
    }

    const headers = ['SKU', ...variantAttributes.map((a) => a.name), 'Price', 'Compare At Price', 'Stock', 'Enabled', 'Default', 'Images'];
    const rows = variantSKUs.map((v) => [
      v.sku,
      ...variantAttributes.map((a) => v.attributes[a.name] || ''),
      v.price.toString(),
      v.compareAtPrice?.toString() || '',
      v.stock.toString(),
      v.isEnabled ? 'true' : 'false',
      v.isDefault ? 'true' : 'false',
      (v.images || []).join(';'),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `variants_${baseSku || 'product'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({ title: 'Success', description: `Exported ${variantSKUs.length} variants to CSV` });
  };

  // CSV Import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        if (lines.length < 2) {
          toast({ title: 'Error', description: 'CSV file is empty or invalid', variant: 'destructive' });
          return;
        }

        const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
        const skuIndex = headers.findIndex((h) => h.toLowerCase() === 'sku');
        const priceIndex = headers.findIndex((h) => h.toLowerCase() === 'price');
        const stockIndex = headers.findIndex((h) => h.toLowerCase() === 'stock');
        const enabledIndex = headers.findIndex((h) => h.toLowerCase() === 'enabled');
        const defaultIndex = headers.findIndex((h) => h.toLowerCase() === 'default');
        const compareAtIndex = headers.findIndex((h) => h.toLowerCase().includes('compare'));
        const imagesIndex = headers.findIndex((h) => h.toLowerCase() === 'images');

        if (skuIndex === -1 || priceIndex === -1) {
          toast({ title: 'Error', description: 'CSV must have SKU and Price columns', variant: 'destructive' });
          return;
        }

        const importedVariants: IVariantSKU[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.replace(/"/g, '').trim());
          if (!values[skuIndex]) continue;

          const attributes: { [key: string]: string } = {};
          variantAttributes.forEach((attr) => {
            const attrIndex = headers.findIndex((h) => h.toLowerCase() === attr.name.toLowerCase());
            if (attrIndex !== -1 && values[attrIndex]) {
              attributes[attr.name] = values[attrIndex];
            }
          });

          importedVariants.push({
            sku: values[skuIndex].toUpperCase(),
            attributes,
            price: parseFloat(values[priceIndex]) || basePrice,
            compareAtPrice: compareAtIndex !== -1 ? parseFloat(values[compareAtIndex]) || undefined : undefined,
            stock: stockIndex !== -1 ? parseInt(values[stockIndex], 10) || 0 : 0,
            isEnabled: enabledIndex !== -1 ? values[enabledIndex].toLowerCase() === 'true' : true,
            isDefault: defaultIndex !== -1 ? values[defaultIndex].toLowerCase() === 'true' : false,
            images: imagesIndex !== -1 && values[imagesIndex] ? values[imagesIndex].split(';').filter(Boolean) : [],
          });
        }

        if (importedVariants.length === 0) {
          toast({ title: 'Error', description: 'No valid variants found in CSV', variant: 'destructive' });
          return;
        }

        // Ensure at least one default
        if (!importedVariants.some((v) => v.isDefault)) {
          importedVariants[0].isDefault = true;
        }

        onVariantSKUsChange(importedVariants);
        setCurrentPage(1);
        toast({ title: 'Success', description: `Imported ${importedVariants.length} variants` });
        
        // Queue validation
        setSkusToValidate(importedVariants.map((v) => v.sku));
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to parse CSV file', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Image association for variant
  const openImageDialog = (pageIndex: number) => {
    const actualIndex = (currentPage - 1) * VARIANTS_PER_PAGE + pageIndex;
    setSelectedVariantForImages(actualIndex);
    setImageDialogOpen(true);
  };

  // Calculate stats
  const totalStock = variantSKUs.reduce((sum, v) => sum + (v.isEnabled ? v.stock : 0), 0);
  const enabledVariants = variantSKUs.filter((v) => v.isEnabled).length;
  const priceRange = variantSKUs.length > 0
    ? {
        min: Math.min(...variantSKUs.filter((v) => v.isEnabled).map((v) => v.price)),
        max: Math.max(...variantSKUs.filter((v) => v.isEnabled).map((v) => v.price)),
      }
    : { min: 0, max: 0 };

  return (
    <div className="space-y-6">
      {/* Enable Variants Toggle */}
      <div className="flex items-center justify-between rounded-md border p-3 bg-muted/10">
        <div>
          <Label className="text-sm font-medium">Enable Variants</Label>
          <p className="text-xs text-muted-foreground">
            Create variations (size, color, etc.)
          </p>
        </div>
        <Switch checked={hasVariants} onCheckedChange={onHasVariantsChange} />
      </div>

      {hasVariants && (
        <>
          {/* Variant Attributes Section */}
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Variant Attributes</h3>
                <p className="text-xs text-muted-foreground">
                  Define options like Color, Size
                </p>
              </div>
              <Dialog open={attributeDialogOpen} onOpenChange={setAttributeDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingAttribute(null);
                    setNewAttribute({ name: '', displayName: '', type: 'button', options: [], required: true });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Attribute
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingAttribute ? 'Edit Attribute' : 'Add Variant Attribute'}</DialogTitle>
                    <DialogDescription>
                      Define a variant attribute type (like Color, Size) and its available options.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="attrName">Attribute Type *</Label>
                      <Input
                        id="attrName"
                        value={newAttribute.name || ''}
                        onChange={(e) => setNewAttribute((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Color, Size, Material, Storage"
                      />
                      <p className="text-xs text-muted-foreground">
                        This is the category name (e.g., &quot;Color&quot;), not a value (e.g., not &quot;Red&quot;)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attrDisplayName">Display Name</Label>
                      <Input
                        id="attrDisplayName"
                        value={newAttribute.displayName || ''}
                        onChange={(e) => setNewAttribute((prev) => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Leave empty to use attribute name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Type</Label>
                      <Select
                        value={newAttribute.type}
                        onValueChange={(value: IVariantAttribute['type']) =>
                          setNewAttribute((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ATTRIBUTE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">{type.icon}<span>{type.label}</span></div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Required</Label>
                      <Switch
                        checked={newAttribute.required !== false}
                        onCheckedChange={(checked) => setNewAttribute((prev) => ({ ...prev, required: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Available Options *</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Add the values for this attribute (e.g., for &quot;Color&quot;: Red, Blue, Green)
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={newOptionValue}
                          onChange={(e) => setNewOptionValue(e.target.value)}
                          placeholder={newAttribute.name ? `e.g., values for ${newAttribute.name}` : 'e.g., Red, Large, 64GB'}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOptionToAttribute())}
                        />
                        {newAttribute.type === 'color' && (
                          <Input
                            type="color"
                            value={newOptionColor}
                            onChange={(e) => setNewOptionColor(e.target.value)}
                            className="w-14 p-1 h-10"
                            title="Pick color for swatch"
                          />
                        )}
                        <Button type="button" size="icon" onClick={addOptionToAttribute} title="Add option">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {newAttribute.options && newAttribute.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newAttribute.options.map((option, index) => (
                            <Badge key={index} variant="secondary" className="gap-1 pr-1">
                              {option.colorCode && (
                                <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: option.colorCode }} />
                              )}
                              {option.value}
                              <button type="button" onClick={() => removeOptionFromAttribute(index)} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAttributeDialogOpen(false)}>Cancel</Button>
                    <Button onClick={saveAttribute}>{editingAttribute ? 'Update' : 'Add'} Attribute</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Attributes List */}
            {variantAttributes.length > 0 ? (
              <div className="space-y-1.5">
                {variantAttributes.map((attr) => (
                  <div key={attr.name} className="flex items-center justify-between rounded border p-2 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{ATTRIBUTE_TYPES.find((t) => t.value === attr.type)?.icon}</span>
                        <span className="text-sm font-medium">{attr.displayName || attr.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {attr.options.slice(0, 5).map((opt) => (
                          <Badge key={opt.value} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            {opt.colorCode && <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: opt.colorCode }} />}
                            {opt.value}
                          </Badge>
                        ))}
                        {attr.options.length > 5 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">+{attr.options.length - 5}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAttribute(attr); setNewAttribute({ ...attr }); setAttributeDialogOpen(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteAttributeDialog({ open: true, attribute: attr })}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Grid3X3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No attributes defined</p>
                <p className="text-xs">Add Color, Size, etc.</p>
              </div>
            )}
          </div>

          {/* Action Buttons - Compact */}
          {variantAttributes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center p-2 bg-muted/20 rounded-md border">
              <Button onClick={generateCombinations} disabled={isGenerating} size="sm" className="h-7 text-xs px-2">
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <><RefreshCw className="h-3 w-3 mr-1" />Generate</>
                )}
              </Button>
              {variantSKUs.length > 0 && (
                <>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={handleManualValidate} disabled={isValidating}>
                    {isValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Validate</>}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={exportToCSV}>
                    <Download className="h-3 w-3 mr-1" />Export
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3 w-3 mr-1" />Import
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setPreviewDialogOpen(true)}>
                    <Eye className="h-3 w-3 mr-1" />Preview
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </>
              )}
              {validationResult && (
                <Badge variant={validationResult.isValid ? 'default' : 'destructive'} className="ml-auto text-[10px] px-1.5 py-0">
                  {validationResult.isValid ? '✓ Valid' : '⚠ Issues'}
                </Badge>
              )}
            </div>
          )}

          {/* Variant SKUs Table with Pagination */}
          {variantSKUs.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              {/* Header with stats and bulk actions */}
              <div className="p-3 border-b bg-muted/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-semibold">Variants</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 bg-background rounded">{enabledVariants}/{variantSKUs.length} active</span>
                      <span className="px-2 py-0.5 bg-background rounded">Stock: {totalStock}</span>
                      {enabledVariants > 0 && (
                        <span className="px-2 py-0.5 bg-background rounded">
                          ${priceRange.min.toFixed(0)}-${priceRange.max.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      placeholder="Price" 
                      value={bulkPrice} 
                      onChange={(e) => setBulkPrice(e.target.value)} 
                      className="w-20 h-8 text-xs" 
                    />
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={applyBulkPrice}>Set</Button>
                    <Input 
                      type="number" 
                      placeholder="Stock" 
                      value={bulkStock} 
                      onChange={(e) => setBulkStock(e.target.value)} 
                      className="w-20 h-8 text-xs" 
                    />
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={applyBulkStock}>Set</Button>
                  </div>
                </div>
              </div>

              {/* Compact scrollable table */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table className="text-sm">
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-10 p-2 text-center text-xs">⭐</TableHead>
                      <TableHead className="p-2 text-xs min-w-[100px]">SKU</TableHead>
                      {variantAttributes.map((attr) => (
                        <TableHead key={attr.name} className="p-2 text-xs min-w-[60px]">
                          {(attr.displayName || attr.name).slice(0, 8)}
                        </TableHead>
                      ))}
                      <TableHead className="w-20 p-2 text-xs text-right">Price</TableHead>
                      <TableHead className="w-16 p-2 text-xs text-right">Stock</TableHead>
                      <TableHead className="w-10 p-2 text-xs text-center">📷</TableHead>
                      <TableHead className="w-12 p-2 text-xs text-center">On</TableHead>
                      <TableHead className="w-10 p-2 text-xs"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVariants.map((variant, pageIndex) => (
                      <TableRow 
                        key={variant.sku} 
                        className={`${!variant.isEnabled ? 'opacity-40 bg-muted/10' : 'hover:bg-muted/20'} transition-colors`}
                      >
                        <TableCell className="p-2 text-center">
                          <input 
                            type="radio" 
                            name="defaultVariant" 
                            checked={variant.isDefault} 
                            onChange={() => setDefaultVariant(pageIndex)} 
                            className="h-3 w-3 cursor-pointer accent-primary" 
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="flex items-center gap-1">
                            <code className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[90px]" title={variant.sku}>
                              {variant.sku}
                            </code>
                            {validationResult?.duplicatesInList.includes(variant.sku) && (
                              <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                            )}
                          </div>
                        </TableCell>
                        {variantAttributes.map((attr) => {
                          const attrValue = variant.attributes[attr.name];
                          const colorCode = attr.type === 'color' 
                            ? attr.options.find((o) => o.value === attrValue)?.colorCode 
                            : null;
                          return (
                            <TableCell key={attr.name} className="p-2">
                              <div className="flex items-center gap-1">
                                {colorCode && (
                                  <span 
                                    className="w-4 h-4 rounded-full border flex-shrink-0" 
                                    style={{ backgroundColor: colorCode }} 
                                  />
                                )}
                                <span className="text-xs truncate max-w-[50px]" title={attrValue}>{attrValue || '-'}</span>
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="p-1">
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            value={variant.price} 
                            onChange={(e) => updateVariantSKU(pageIndex, { price: parseFloat(e.target.value) || 0 })} 
                            className="w-full h-7 text-xs text-right tabular-nums px-1" 
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                            type="number" 
                            min="0" 
                            value={variant.stock} 
                            onChange={(e) => updateVariantSKU(pageIndex, { stock: parseInt(e.target.value, 10) || 0 })} 
                            className="w-full h-7 text-xs text-right tabular-nums px-1" 
                          />
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openImageDialog(pageIndex)} 
                            className="relative h-7 w-7 p-0"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            {variant.images && variant.images.length > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 text-[8px] font-bold flex items-center justify-center">
                                {variant.images.length}
                              </span>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Switch 
                            checked={variant.isEnabled} 
                            onCheckedChange={(checked) => updateVariantSKU(pageIndex, { isEnabled: checked })}
                            className="scale-75"
                          />
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteVariantSKU(pageIndex)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Compact Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20 text-xs">
                  <span className="text-muted-foreground">
                    {(currentPage - 1) * VARIANTS_PER_PAGE + 1}-{Math.min(currentPage * VARIANTS_PER_PAGE, variantSKUs.length)} of {variantSKUs.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="px-2">{currentPage}/{totalPages}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Attribute Confirmation */}
      <AlertDialog open={deleteAttributeDialog.open} onOpenChange={(open) => setDeleteAttributeDialog({ open, attribute: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the &quot;{deleteAttributeDialog.attribute?.name}&quot; attribute?
              {variantSKUs.length > 0 && (
                <span className="block mt-2 text-destructive">Warning: This will clear all {variantSKUs.length} variant SKUs.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAttribute} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Variant Image Upload Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Variant Images</DialogTitle>
            <DialogDescription>
              Upload new images or select from product images for this variant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedVariantForImages !== null && variantSKUs[selectedVariantForImages] && (
              <VariantImageUpload
                variantSku={variantSKUs[selectedVariantForImages].sku}
                variantImages={variantSKUs[selectedVariantForImages].images || []}
                productImages={productImages}
                onImagesChange={(images) => {
                  const updatedSKUs = [...variantSKUs];
                  updatedSKUs[selectedVariantForImages] = {
                    ...updatedSKUs[selectedVariantForImages],
                    images,
                  };
                  onVariantSKUsChange(updatedSKUs);
                }}
                maxImages={5}
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setImageDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visual Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Variant Preview</DialogTitle>
            <DialogDescription>See how variants will appear on the storefront</DialogDescription>
          </DialogHeader>
          <VariantPreview
            variantAttributes={variantAttributes}
            variantSKUs={variantSKUs}
            productImages={productImages}
          />
          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Visual Variant Preview Component
function VariantPreview({
  variantAttributes,
  variantSKUs,
  productImages,
}: {
  variantAttributes: IVariantAttribute[];
  variantSKUs: IVariantSKU[];
  productImages: string[];
}) {
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  
  // Initialize with default variant options
  useEffect(() => {
    const defaultVariant = variantSKUs.find((v) => v.isDefault && v.isEnabled) || variantSKUs.find((v) => v.isEnabled);
    if (defaultVariant) {
      setSelectedOptions(defaultVariant.attributes);
    }
  }, [variantSKUs]);

  // Find matching variant
  const selectedVariant = variantSKUs.find((v) =>
    v.isEnabled && Object.entries(selectedOptions).every(([key, value]) => v.attributes[key] === value)
  );

  // Get images for selected variant
  const displayImages = selectedVariant?.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : productImages.slice(0, 1);

  const handleOptionSelect = (attrName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [attrName]: value }));
  };

  // Helper to get display URL
  const getImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.includes('/uploads/')) {
      if (url.startsWith('/api/images')) return url;
      const path = url.split('/uploads/')[1];
      return `/api/images/uploads/${path}`;
    }
    return url;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 py-4">
      {/* Image Preview */}
      <div className="space-y-3">
        <div className="aspect-square rounded-lg border bg-muted/30 overflow-hidden">
          {displayImages.length > 0 ? (
            <img
              src={getImageUrl(displayImages[0])}
              alt="Product preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-16 w-16 opacity-30" />
            </div>
          )}
        </div>
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {displayImages.slice(0, 4).map((img, idx) => (
              <div key={idx} className="w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                <img src={getImageUrl(img)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Options Preview */}
      <div className="space-y-4">
        {variantAttributes.map((attr) => (
          <div key={attr.name} className="space-y-2">
            <Label className="font-medium">{attr.displayName || attr.name}</Label>
            <div className="flex flex-wrap gap-2">
              {attr.options.map((opt) => {
                const isSelected = selectedOptions[attr.name] === opt.value;
                const isAvailable = variantSKUs.some(
                  (v) => v.isEnabled && v.attributes[attr.name] === opt.value
                );
                
                if (attr.type === 'color' && opt.colorCode) {
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleOptionSelect(attr.name, opt.value)}
                      disabled={!isAvailable}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                      } ${!isAvailable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                      style={{ backgroundColor: opt.colorCode }}
                      title={opt.value}
                    />
                  );
                }
                
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(attr.name, opt.value)}
                    disabled={!isAvailable}
                    className={`px-4 py-2 rounded-md border text-sm transition-all ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-muted'
                    } ${!isAvailable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {opt.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Selected Variant Info */}
        {selectedVariant && (
          <div className="mt-6 p-4 rounded-lg border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SKU:</span>
              <span className="font-mono text-sm">{selectedVariant.sku}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="font-semibold text-lg">
                ${selectedVariant.price.toFixed(2)}
                {selectedVariant.compareAtPrice && (
                  <span className="ml-2 text-sm text-muted-foreground line-through">
                    ${selectedVariant.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Stock:</span>
              <span className={selectedVariant.stock > 0 ? 'text-green-600' : 'text-destructive'}>
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} available` : 'Out of stock'}
              </span>
            </div>
          </div>
        )}

        {!selectedVariant && Object.keys(selectedOptions).length > 0 && (
          <div className="mt-6 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            This combination is not available
          </div>
        )}
      </div>
    </div>
  );
}
