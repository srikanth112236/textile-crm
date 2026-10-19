'use client';

import { useState } from 'react';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Trash2,
  Building2,
  Package,
  Truck,
  Download,
  BarChart3,
  Barcode,
  Scale,
  Box,
  FileText,
  X,
} from 'lucide-react';
import {
  IBrand,
  ISpecification,
  IShippingInfo,
  IDigitalProduct,
  IVolumePricing,
  IProductIdentifiers,
  IInventorySettings,
} from '@/lib/api/types';

interface ProductAttributesFormProps {
  // Brand
  brand?: IBrand;
  onBrandChange: (brand: IBrand | undefined) => void;
  
  // Specifications
  specifications?: ISpecification[];
  onSpecificationsChange: (specs: ISpecification[]) => void;
  
  // Features
  features?: string[];
  onFeaturesChange: (features: string[]) => void;
  
  // Materials
  materials?: string[];
  onMaterialsChange: (materials: string[]) => void;
  
  // Condition & Warranty
  condition?: 'new' | 'refurbished' | 'used' | 'like_new';
  onConditionChange: (condition: 'new' | 'refurbished' | 'used' | 'like_new') => void;
  warranty?: string;
  onWarrantyChange: (warranty: string) => void;
  
  // Shipping
  shipping?: IShippingInfo;
  onShippingChange: (shipping: IShippingInfo | undefined) => void;
  
  // Digital Product
  digital?: IDigitalProduct;
  onDigitalChange: (digital: IDigitalProduct | undefined) => void;
  
  // Pricing
  compareAtPrice?: number;
  onCompareAtPriceChange: (price: number | undefined) => void;
  costPrice?: number;
  onCostPriceChange: (price: number | undefined) => void;
  volumePricing?: IVolumePricing[];
  onVolumePricingChange: (pricing: IVolumePricing[]) => void;
  
  // Identifiers
  identifiers?: IProductIdentifiers;
  onIdentifiersChange: (identifiers: IProductIdentifiers | undefined) => void;
  
  // Inventory
  inventory?: IInventorySettings;
  onInventoryChange: (inventory: IInventorySettings | undefined) => void;

  // Merchandising (filters + PDP accordions + badges)
  fit?: string;
  onFitChange: (fit: string) => void;
  fabric?: string;
  onFabricChange: (fabric: string) => void;
  pattern?: string;
  onPatternChange: (pattern: string) => void;
  occasion?: string;
  onOccasionChange: (occasion: string) => void;
  washCare?: string;
  onWashCareChange: (washCare: string) => void;
  badges?: string[];
  onBadgesChange: (badges: string[]) => void;
}

export default function ProductAttributesForm({
  brand,
  onBrandChange,
  specifications,
  onSpecificationsChange,
  features,
  onFeaturesChange,
  materials,
  onMaterialsChange,
  condition,
  onConditionChange,
  warranty,
  onWarrantyChange,
  shipping,
  onShippingChange,
  digital,
  onDigitalChange,
  compareAtPrice,
  onCompareAtPriceChange,
  costPrice,
  onCostPriceChange,
  volumePricing,
  onVolumePricingChange,
  identifiers,
  onIdentifiersChange,
  inventory,
  onInventoryChange,
  fit,
  onFitChange,
  fabric,
  onFabricChange,
  pattern,
  onPatternChange,
  occasion,
  onOccasionChange,
  washCare,
  onWashCareChange,
  badges,
  onBadgesChange,
}: ProductAttributesFormProps) {
  // Local state for adding new items
  const [newFeature, setNewFeature] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newSpec, setNewSpec] = useState<Partial<ISpecification>>({});
  const [newVolumeTier, setNewVolumeTier] = useState<Partial<IVolumePricing>>({});
  const [newFile, setNewFile] = useState<{ name: string; url: string }>({ name: '', url: '' });

  // Add feature
  const addFeature = () => {
    if (!newFeature.trim()) return;
    onFeaturesChange([...(features || []), newFeature.trim()]);
    setNewFeature('');
  };

  // Remove feature
  const removeFeature = (index: number) => {
    onFeaturesChange((features || []).filter((_, i) => i !== index));
  };

  // Add material
  const addMaterial = () => {
    if (!newMaterial.trim()) return;
    onMaterialsChange([...(materials || []), newMaterial.trim()]);
    setNewMaterial('');
  };

  // Remove material
  const removeMaterial = (index: number) => {
    onMaterialsChange((materials || []).filter((_, i) => i !== index));
  };

  // Add specification
  const addSpecification = () => {
    if (!newSpec.name?.trim() || !newSpec.value?.trim()) return;
    onSpecificationsChange([
      ...(specifications || []),
      {
        group: newSpec.group?.trim() || undefined,
        name: newSpec.name.trim(),
        value: newSpec.value.trim(),
        unit: newSpec.unit?.trim() || undefined,
      },
    ]);
    setNewSpec({});
  };

  // Remove specification
  const removeSpecification = (index: number) => {
    onSpecificationsChange((specifications || []).filter((_, i) => i !== index));
  };

  // Add volume pricing tier
  const addVolumeTier = () => {
    if (!newVolumeTier.minQuantity || !newVolumeTier.price) return;
    onVolumePricingChange([
      ...(volumePricing || []),
      {
        minQuantity: newVolumeTier.minQuantity,
        maxQuantity: newVolumeTier.maxQuantity || undefined,
        price: newVolumeTier.price,
        discountPercent: newVolumeTier.discountPercent || undefined,
      },
    ]);
    setNewVolumeTier({});
  };

  // Remove volume tier
  const removeVolumeTier = (index: number) => {
    onVolumePricingChange((volumePricing || []).filter((_, i) => i !== index));
  };

  // Add digital file
  const addDigitalFile = () => {
    if (!newFile.name.trim() || !newFile.url.trim()) return;
    const currentFiles = digital?.files || [];
    onDigitalChange({
      ...digital,
      isDigital: true,
      files: [...currentFiles, { name: newFile.name.trim(), url: newFile.url.trim() }],
    });
    setNewFile({ name: '', url: '' });
  };

  // Remove digital file
  const removeDigitalFile = (index: number) => {
    const currentFiles = digital?.files || [];
    onDigitalChange({
      ...digital,
      isDigital: true,
      files: currentFiles.filter((_, i) => i !== index),
    });
  };

  return (
    <Accordion type="multiple" className="w-full space-y-2">
      {/* Brand Information */}
      <AccordionItem value="brand" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Brand Information</span>
            {brand?.name && <Badge variant="secondary" className="ml-2">{brand.name}</Badge>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={brand?.name || ''}
                onChange={(e) => onBrandChange(e.target.value ? { ...brand, name: e.target.value } : undefined)}
                placeholder="e.g., Apple, Nike, Samsung"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandWebsite">Brand Website</Label>
              <Input
                id="brandWebsite"
                type="url"
                value={brand?.website || ''}
                onChange={(e) => onBrandChange(brand?.name ? { ...brand, website: e.target.value } : undefined)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandLogo">Brand Logo URL</Label>
            <Input
              id="brandLogo"
              value={brand?.logo || ''}
              onChange={(e) => onBrandChange(brand?.name ? { ...brand, logo: e.target.value } : undefined)}
              placeholder="https://..."
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Pricing Options */}
      <AccordionItem value="pricing" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Pricing Options</span>
            {compareAtPrice && <Badge variant="secondary" className="ml-2">Sale Price Set</Badge>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare At Price (Original)</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice || ''}
                onChange={(e) => onCompareAtPriceChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">Shows as strikethrough price</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (For Profit Calc)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={costPrice || ''}
                onChange={(e) => onCostPriceChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">Not shown to customers</p>
            </div>
          </div>

          {/* Volume Pricing */}
          <div className="space-y-2">
            <Label>Volume Pricing (Quantity Discounts)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              <Input
                type="number"
                min="1"
                placeholder="Min Qty"
                value={newVolumeTier.minQuantity || ''}
                onChange={(e) => setNewVolumeTier({ ...newVolumeTier, minQuantity: parseInt(e.target.value, 10) || undefined })}
                className="w-24"
              />
              <Input
                type="number"
                min="1"
                placeholder="Max Qty"
                value={newVolumeTier.maxQuantity || ''}
                onChange={(e) => setNewVolumeTier({ ...newVolumeTier, maxQuantity: parseInt(e.target.value, 10) || undefined })}
                className="w-24"
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                value={newVolumeTier.price || ''}
                onChange={(e) => setNewVolumeTier({ ...newVolumeTier, price: parseFloat(e.target.value) || undefined })}
                className="w-28"
              />
              <Button type="button" size="sm" onClick={addVolumeTier}>
                <Plus className="h-4 w-4 mr-1" />
                Add Tier
              </Button>
            </div>
            {volumePricing && volumePricing.length > 0 && (
              <div className="space-y-1 p-2 bg-muted/30 rounded">
                {volumePricing.map((tier, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>
                      {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} units: ${tier.price.toFixed(2)}
                      {tier.discountPercent && <span className="text-green-600 ml-2">({tier.discountPercent}% off)</span>}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVolumeTier(index)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Specifications */}
      <AccordionItem value="specifications" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold">Specifications</span>
            {specifications && specifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">{specifications.length} specs</Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
          {/* Add new spec */}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Group (optional)"
              value={newSpec.group || ''}
              onChange={(e) => setNewSpec({ ...newSpec, group: e.target.value })}
              className="w-32"
            />
            <Input
              placeholder="Name *"
              value={newSpec.name || ''}
              onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
              className="flex-1 min-w-[120px]"
            />
            <Input
              placeholder="Value *"
              value={newSpec.value || ''}
              onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
              className="flex-1 min-w-[120px]"
            />
            <Input
              placeholder="Unit"
              value={newSpec.unit || ''}
              onChange={(e) => setNewSpec({ ...newSpec, unit: e.target.value })}
              className="w-20"
            />
            <Button type="button" size="sm" onClick={addSpecification}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Specs list */}
          {specifications && specifications.length > 0 && (
            <div className="space-y-1 p-2 bg-muted/30 rounded">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-center justify-between text-sm py-1">
                  <span>
                    {spec.group && <span className="text-muted-foreground">[{spec.group}] </span>}
                    <strong>{spec.name}:</strong> {spec.value}{spec.unit && ` ${spec.unit}`}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSpecification(index)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Features & Materials */}
      <AccordionItem value="features" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-semibold">Features & Materials</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
          {/* Features */}
          <div className="space-y-2">
            <Label>Key Features</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a feature (e.g., Waterproof, Wireless)"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" size="sm" onClick={addFeature}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {features && features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    {feature}
                    <button onClick={() => removeFeature(index)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <Label>Materials</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a material (e.g., Cotton, Stainless Steel)"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
              />
              <Button type="button" size="sm" onClick={addMaterial}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {materials && materials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {materials.map((material, index) => (
                  <Badge key={index} variant="outline" className="gap-1 pr-1">
                    {material}
                    <button onClick={() => removeMaterial(index)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Condition & Warranty */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition || 'new'} onValueChange={(v) => onConditionChange(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="refurbished">Refurbished</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warranty">Warranty</Label>
              <Input
                id="warranty"
                value={warranty || ''}
                onChange={(e) => onWarrantyChange(e.target.value)}
                placeholder="e.g., 1 Year Manufacturer Warranty"
              />
            </div>
          </div>

          {/* Merchandising: Fit / Fabric / Pattern / Occasion / Wash / Badges */}
          <div className="space-y-3 pt-3 border-t">
            <Label className="font-semibold">Merchandising — filters, PDP accordions & badges</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fit (filter + PDP)</Label>
                <Select value={fit || ''} onValueChange={(v) => onFitChange(v === '__none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select fit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Oversized', 'Loose Fit', 'Skinny', 'Straight'].map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fabric</Label>
                <Input value={fabric || ''} onChange={(e) => onFabricChange(e.target.value)} placeholder="e.g., Pure Cotton, Linen" />
              </div>
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Input value={pattern || ''} onChange={(e) => onPatternChange(e.target.value)} placeholder="e.g., Solid, Printed, Striped" />
              </div>
              <div className="space-y-2">
                <Label>Occasion</Label>
                <Select value={occasion || ''} onValueChange={(v) => onOccasionChange(v === '__none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select occasion" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {['Casual', 'Formal', 'Festive', 'Gym', 'Party', 'Travel'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="washCare">Wash care (PDP accordion)</Label>
              <Input id="washCare" value={washCare || ''} onChange={(e) => onWashCareChange(e.target.value)} placeholder="Machine wash cold…" />
            </div>
            <div className="space-y-2">
              <Label>Badges (New/Sale auto-derive; pick Bestseller/Trending/Limited)</Label>
              <div className="flex flex-wrap gap-2">
                {['bestseller', 'trending', 'limited'].map((b) => {
                  const on = (badges || []).includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => onBadgesChange(on ? (badges || []).filter((x) => x !== b) : [...(badges || []), b])}
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${on ? 'bg-amber-500 text-slate-950 border-amber-500' : 'border-slate-300'}`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Shipping Information */}
      <AccordionItem value="shipping" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="font-semibold">Shipping Information *</span>
            {shipping?.freeShipping && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">Free Shipping</Badge>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
            Required for Shiprocket (Phase 0): weight in grams + L×W×H in cm. Active products without these will be rejected by the API. Defaults 500g, 30×25×3cm apply if left blank.
          </p>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Requires Shipping</Label>
              <p className="text-xs text-muted-foreground">Physical product that needs shipping</p>
            </div>
            <Switch
              checked={shipping?.requiresShipping !== false}
              onCheckedChange={(checked) => onShippingChange({ ...shipping, requiresShipping: checked })}
            />
          </div>

          {shipping?.requiresShipping !== false && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Free Shipping</Label>
                  <p className="text-xs text-muted-foreground">No shipping charge for this product</p>
                </div>
                <Switch
                  checked={shipping?.freeShipping || false}
                  onCheckedChange={(checked) => onShippingChange({ ...shipping, requiresShipping: true, freeShipping: checked })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Scale className="h-4 w-4" /> Weight * (Shiprocket)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shipping?.weight || ''}
                      onChange={(e) => onShippingChange({ ...shipping, requiresShipping: true, weight: parseFloat(e.target.value) || undefined })}
                      placeholder="0"
                      className="flex-1"
                    />
                    <Select
                      value={shipping?.weightUnit || 'g'}
                      onValueChange={(v) => onShippingChange({ ...shipping, requiresShipping: true, weightUnit: v as any })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Shipping Class</Label>
                  <Input
                    value={shipping?.shippingClass || ''}
                    onChange={(e) => onShippingChange({ ...shipping, requiresShipping: true, shippingClass: e.target.value })}
                    placeholder="e.g., Standard, Oversized"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Box className="h-4 w-4" /> Dimensions * (L×W×H for Shiprocket)
                </Label>
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Length"
                    value={shipping?.length || ''}
                    onChange={(e) => onShippingChange({ ...shipping, requiresShipping: true, length: parseFloat(e.target.value) || undefined })}
                    className="w-24"
                  />
                  <span>×</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Width"
                    value={shipping?.width || ''}
                    onChange={(e) => onShippingChange({ ...shipping, requiresShipping: true, width: parseFloat(e.target.value) || undefined })}
                    className="w-24"
                  />
                  <span>×</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Height"
                    value={shipping?.height || ''}
                    onChange={(e) => onShippingChange({ ...shipping, requiresShipping: true, height: parseFloat(e.target.value) || undefined })}
                    className="w-24"
                  />
                  <Select
                    value={shipping?.dimensionUnit || 'cm'}
                    onValueChange={(v) => onShippingChange({ ...shipping, requiresShipping: true, dimensionUnit: v as any })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Digital Product */}
      <AccordionItem value="digital" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <span className="font-semibold">Digital Product</span>
            {digital?.isDigital && <Badge variant="secondary" className="ml-2">Digital</Badge>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Is Digital Product</Label>
              <p className="text-xs text-muted-foreground">Product is delivered digitally (no shipping)</p>
            </div>
            <Switch
              checked={digital?.isDigital || false}
              onCheckedChange={(checked) => onDigitalChange(checked ? { ...digital, isDigital: true } : undefined)}
            />
          </div>

          {digital?.isDigital && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="downloadLimit">Download Limit</Label>
                  <Input
                    id="downloadLimit"
                    type="number"
                    min="0"
                    value={digital.downloadLimit || ''}
                    onChange={(e) => onDigitalChange({ ...digital, isDigital: true, downloadLimit: parseInt(e.target.value, 10) || undefined })}
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="downloadExpiry">Download Expiry (Days)</Label>
                  <Input
                    id="downloadExpiry"
                    type="number"
                    min="0"
                    value={digital.downloadExpiry || ''}
                    onChange={(e) => onDigitalChange({ ...digital, isDigital: true, downloadExpiry: parseInt(e.target.value, 10) || undefined })}
                    placeholder="Never expires"
                  />
                  <p className="text-xs text-muted-foreground">Days until download link expires</p>
                </div>
              </div>

              {/* Downloadable files */}
              <div className="space-y-2">
                <Label>Downloadable Files</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="File name"
                    value={newFile.name}
                    onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="File URL"
                    value={newFile.url}
                    onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={addDigitalFile}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {digital.files && digital.files.length > 0 && (
                  <div className="space-y-1 p-2 bg-muted/30 rounded">
                    {digital.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          {file.name}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDigitalFile(index)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Product Identifiers */}
      <AccordionItem value="identifiers" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-primary" />
            <span className="font-semibold">Product Identifiers</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="gtin">GTIN</Label>
              <Input
                id="gtin"
                value={identifiers?.gtin || ''}
                onChange={(e) => onIdentifiersChange({ ...identifiers, gtin: e.target.value })}
                placeholder="Global Trade Item Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upc">UPC</Label>
              <Input
                id="upc"
                value={identifiers?.upc || ''}
                onChange={(e) => onIdentifiersChange({ ...identifiers, upc: e.target.value })}
                placeholder="Universal Product Code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ean">EAN</Label>
              <Input
                id="ean"
                value={identifiers?.ean || ''}
                onChange={(e) => onIdentifiersChange({ ...identifiers, ean: e.target.value })}
                placeholder="European Article Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={identifiers?.isbn || ''}
                onChange={(e) => onIdentifiersChange({ ...identifiers, isbn: e.target.value })}
                placeholder="International Standard Book Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mpn">MPN</Label>
              <Input
                id="mpn"
                value={identifiers?.mpn || ''}
                onChange={(e) => onIdentifiersChange({ ...identifiers, mpn: e.target.value })}
                placeholder="Manufacturer Part Number"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Advanced Inventory Settings */}
      <AccordionItem value="inventory" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-semibold">Advanced Inventory</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Track Inventory</Label>
              <p className="text-xs text-muted-foreground">Monitor stock levels for this product</p>
            </div>
            <Switch
              checked={inventory?.trackInventory !== false}
              onCheckedChange={(checked) => onInventoryChange({ ...inventory, trackInventory: checked, allowBackorder: inventory?.allowBackorder || false })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Backorders</Label>
              <p className="text-xs text-muted-foreground">Accept orders when out of stock</p>
            </div>
            <Switch
              checked={inventory?.allowBackorder || false}
              onCheckedChange={(checked) => onInventoryChange({ ...inventory, trackInventory: inventory?.trackInventory !== false, allowBackorder: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sold Individually</Label>
              <p className="text-xs text-muted-foreground">Limit to one per order</p>
            </div>
            <Switch
              checked={inventory?.soldIndividually || false}
              onCheckedChange={(checked) => onInventoryChange({ ...inventory, trackInventory: inventory?.trackInventory !== false, allowBackorder: inventory?.allowBackorder || false, soldIndividually: checked })}
            />
          </div>
          {inventory?.allowBackorder && (
            <div className="space-y-2">
              <Label htmlFor="backorderLimit">Backorder Limit</Label>
              <Input
                id="backorderLimit"
                type="number"
                min="0"
                value={inventory.backorderLimit || ''}
                onChange={(e) => onInventoryChange({ ...inventory, trackInventory: inventory.trackInventory !== false, allowBackorder: true, backorderLimit: parseInt(e.target.value, 10) || undefined })}
                placeholder="Unlimited"
              />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

