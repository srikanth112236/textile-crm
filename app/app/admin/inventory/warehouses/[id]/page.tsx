'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getWarehouse, updateWarehouse, type Warehouse } from '@/lib/api/inventory';

interface FormData {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  settings: {
    priority: number;
    maxCapacity: number;
    handlingTime: number;
  };
  isActive: boolean;
  isDefault: boolean;
}

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = params.id as string;
  const { toast } = useToast();
  
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: { street: '', city: '', state: '', zip: '', country: '' },
    contact: { name: '', email: '', phone: '' },
    settings: { priority: 1, maxCapacity: 10000, handlingTime: 1 },
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    if (warehouseId) {
      fetchWarehouse();
    }
  }, [warehouseId]);

  const fetchWarehouse = async () => {
    try {
      setLoading(true);
      const data = await getWarehouse(warehouseId);
      setWarehouse(data);
      setFormData({
        name: data.name,
        address: data.address,
        contact: {
          name: data.contact?.name || '',
          email: data.contact?.email || '',
          phone: data.contact?.phone || '',
        },
        settings: {
          priority: data.settings?.priority ?? 1,
          maxCapacity: data.settings?.maxCapacity ?? 10000,
          handlingTime: data.settings?.handlingTime ?? 1,
        },
        isActive: data.isActive,
        isDefault: data.isDefault,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load warehouse',
        variant: 'destructive',
      });
      router.push('/admin/inventory/warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as Record<string, any>),
          [child]: type === 'number' ? (value ? parseInt(value) : 0) : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? (value ? parseInt(value) : 0) : value,
      }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Warehouse name is required', variant: 'destructive' });
      return;
    }
    if (!formData.address.street || !formData.address.city || !formData.address.country) {
      toast({ title: 'Error', description: 'Please fill in required address fields', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      await updateWarehouse(warehouseId, {
        name: formData.name,
        address: formData.address,
        contact: formData.contact.name || formData.contact.email || formData.contact.phone 
          ? formData.contact 
          : undefined,
        settings: formData.settings,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
      });

      toast({
        title: 'Success',
        description: 'Warehouse updated successfully',
      });
      router.push('/admin/inventory/warehouses');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update warehouse',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Warehouse not found</p>
        <Link href="/admin/inventory/warehouses">
          <Button className="mt-4">Back to Warehouses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/inventory/warehouses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Warehouse</h1>
          <p className="text-muted-foreground">
            {warehouse.name} ({warehouse.code})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Warehouse Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Main Warehouse"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Warehouse Code</Label>
              <Input
                id="code"
                value={warehouse.code}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Code cannot be changed</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleCheckboxChange('isActive', !!checked)}
              />
              <Label htmlFor="isActive" className="text-sm font-normal">
                Active (can receive and ship stock)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => handleCheckboxChange('isDefault', !!checked)}
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                Set as default warehouse
              </Label>
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Address</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address.street">Street Address *</Label>
              <Input
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                placeholder="123 Warehouse Lane"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address.city">City *</Label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.state">State/Province</Label>
                <Input
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address.zip">ZIP/Postal Code</Label>
                <Input
                  id="address.zip"
                  name="address.zip"
                  value={formData.address.zip}
                  onChange={handleInputChange}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.country">Country *</Label>
                <Input
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact.name">Contact Name</Label>
              <Input
                id="contact.name"
                name="contact.name"
                value={formData.contact.name}
                onChange={handleInputChange}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact.email">Email</Label>
              <Input
                id="contact.email"
                name="contact.email"
                type="email"
                value={formData.contact.email}
                onChange={handleInputChange}
                placeholder="warehouse@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact.phone">Phone</Label>
              <Input
                id="contact.phone"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleInputChange}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Warehouse Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="settings.priority">Priority</Label>
              <Input
                id="settings.priority"
                name="settings.priority"
                type="number"
                min="1"
                max="100"
                value={formData.settings.priority}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">Lower = higher priority</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings.maxCapacity">Max Capacity (units)</Label>
              <Input
                id="settings.maxCapacity"
                name="settings.maxCapacity"
                type="number"
                min="0"
                value={formData.settings.maxCapacity}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings.handlingTime">Handling Time (days)</Label>
              <Input
                id="settings.handlingTime"
                name="settings.handlingTime"
                type="number"
                min="0"
                value={formData.settings.handlingTime}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

