'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, Plus, Loader2, Warehouse as WarehouseIcon, Info,
  MapPin, User, Settings2, ShieldCheck,
} from 'lucide-react';
import { createWarehouse, getWarehouses } from '@/lib/api/inventory';

interface FormData {
  name: string;
  code: string;
  address: { street: string; city: string; state: string; zip: string; country: string };
  contact: { name: string; email: string; phone: string };
  settings: { priority: number; maxCapacity: number; handlingTime: number };
  isActive: boolean;
  isDefault: boolean;
}

const initialFormData: FormData = {
  name: '',
  code: '',
  address: { street: '', city: '', state: '', zip: '', country: 'India' },
  contact: { name: '', email: '', phone: '' },
  settings: { priority: 1, maxCapacity: 10000, handlingTime: 1 },
  isActive: true,
  isDefault: false,
};

// India-first state list (matches the rest of the admin forms)
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function NewWarehousePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [existingCount, setExistingCount] = useState<number | null>(null);

  // Check existing warehouses so we know whether this will become the default.
  useEffect(() => {
    getWarehouses({ limit: 100 })
      .then((res) => setExistingCount(res?.warehouses?.length ?? 0))
      .catch(() => setExistingCount(0));
  }, []);

  const willBeDefault = formData.isDefault || existingCount === 0;

  const update = (patch: Partial<FormData>) => setFormData((p) => ({ ...p, ...patch }));
  const updateNested = (group: 'address' | 'contact' | 'settings', key: string, value: any) =>
    setFormData((p) => ({ ...p, [group]: { ...(p[group] as any), [key]: value } }));

  const generateCode = () => {
    const base = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 5);
    if (!base) {
      toast({ title: 'Enter a name first', description: 'Warehouse name is used to generate the code.', variant: 'destructive' });
      return;
    }
    const suffix = String((existingCount ?? 0) + 1).padStart(2, '0');
    setFormData((p) => ({ ...p, code: `${base}${suffix}`.slice(0, 8) }));
  };

  const validate = (): string | null => {
    if (!formData.name.trim()) return 'Warehouse name is required.';
    if (formData.name.trim().length < 3) return 'Warehouse name must be at least 3 characters.';
    if (!formData.code.trim()) return 'Warehouse code is required.';
    if (!/^[A-Z0-9_-]+$/.test(formData.code)) return 'Code may only contain A-Z, 0-9, hyphens and underscores.';
    if (!formData.address.street.trim()) return 'Street address is required.';
    if (!formData.address.city.trim()) return 'City is required.';
    if (!formData.address.country.trim()) return 'Country is required.';
    if (formData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) return 'Enter a valid contact email.';
    if (formData.contact.phone && !/^[\d+\-\s()]{6,20}$/.test(formData.contact.phone)) return 'Enter a valid contact phone number.';
    if (formData.settings.priority < 1) return 'Priority must be at least 1 (lower = higher priority).';
    if (formData.settings.maxCapacity < 0) return 'Max capacity cannot be negative.';
    if (formData.settings.handlingTime < 0) return 'Handling time cannot be negative.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      toast({ title: 'Check the form', description: problem, variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      await createWarehouse({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zip: formData.address.zip.trim(),
          country: formData.address.country.trim(),
        },
        contact: formData.contact.name || formData.contact.email || formData.contact.phone
          ? {
              name: formData.contact.name.trim(),
              email: formData.contact.email.trim(),
              phone: formData.contact.phone.trim(),
            }
          : undefined,
        settings: {
          priority: formData.settings.priority,
          maxCapacity: formData.settings.maxCapacity,
          handlingTime: formData.settings.handlingTime,
        },
        isActive: formData.isActive,
        isDefault: willBeDefault,
      });

      toast({
        title: 'Warehouse created',
        description: willBeDefault
          ? `${formData.name.trim()} is now your default warehouse.`
          : `${formData.name.trim()} is ready to receive stock.`,
      });
      router.push('/admin/inventory/warehouses');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to create warehouse',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto space-y-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <WarehouseIcon className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Add Warehouse</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              Create a fulfilment location for stock, transfers and shipping.
            </p>
          </div>
        </div>
        <Link href="/admin/inventory/warehouses">
          <Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to List
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Basic Information */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <WarehouseIcon className="h-3.5 w-3.5 text-amber-500" />
            <h2 className="text-sm font-extrabold tracking-tight">Identity</h2>
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 1 of 4</span>
          </div>
          <CardContent className="p-3.5 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="name" className="text-[11px] font-bold">Warehouse Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => update({ name: e.target.value })}
                  onBlur={() => { if (!formData.code) generateCode(); }}
                  placeholder="e.g. Hyderabad Central"
                  className="h-9 rounded-lg text-xs mt-1"
                />
                <p className="text-[9px] text-muted-foreground mt-1">Shown to customers on shipping estimates and returns</p>
              </div>
              <div>
                <Label htmlFor="code" className="text-[11px] font-bold">Code *</Label>
                <div className="flex gap-1.5 mt-1">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => update({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                    placeholder="HYD01"
                    className="h-9 rounded-lg text-xs font-mono flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateCode}
                    className="h-9 rounded-lg text-[10px] font-extrabold shrink-0"
                  >
                    Auto
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Unique · used in stock transfers</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-2">
                <Switch
                  className="h-4 w-7"
                  checked={formData.isActive}
                  onCheckedChange={(c) => update({ isActive: c })}
                />
                <div className="min-w-0">
                  <Label className="text-[11px] font-bold leading-tight block">Active</Label>
                  <span className="text-[9px] text-muted-foreground">Can receive and ship stock</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 px-2.5 py-2">
                <Switch
                  className="h-4 w-7"
                  checked={willBeDefault}
                  onCheckedChange={(c) => update({ isDefault: c })}
                />
                <div className="min-w-0">
                  <Label className="text-[11px] font-bold leading-tight block flex items-center gap-1">
                    Default warehouse
                    <ShieldCheck className="h-3 w-3 text-amber-600" />
                  </Label>
                  <span className="text-[9px] text-muted-foreground">
                    {existingCount === 0 ? 'Auto — first warehouse' : 'Used for new products & orders'}
                  </span>
                </div>
              </div>
            </div>

            {willBeDefault && existingCount !== 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-800 px-2.5 py-2">
                <Info className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                  The current default warehouse will be unset. The default warehouse cannot be deleted — promote another one to delete it.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <MapPin className="h-3.5 w-3.5 text-amber-500" />
            <h2 className="text-sm font-extrabold tracking-tight">Location</h2>
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 2 of 4</span>
          </div>
          <CardContent className="p-3.5 grid sm:grid-cols-6 gap-3">
            <div className="sm:col-span-6">
              <Label htmlFor="street" className="text-[11px] font-bold">Street Address *</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => updateNested('address', 'street', e.target.value)}
                placeholder="12-4-9, Survey 44"
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="city" className="text-[11px] font-bold">City *</Label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) => updateNested('address', 'city', e.target.value)}
                placeholder="Vijayawada"
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="state" className="text-[11px] font-bold">State</Label>
              <select
                id="state"
                value={formData.address.state}
                onChange={(e) => updateNested('address', 'state', e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs mt-1 px-2 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select state…</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="zip" className="text-[11px] font-bold">PIN Code</Label>
              <Input
                id="zip"
                value={formData.address.zip}
                onChange={(e) => updateNested('address', 'zip', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="520010"
                inputMode="numeric"
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
            <div className="sm:col-span-6">
              <Label htmlFor="country" className="text-[11px] font-bold">Country *</Label>
              <Input
                id="country"
                value={formData.address.country}
                onChange={(e) => updateNested('address', 'country', e.target.value)}
                placeholder="India"
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <User className="h-3.5 w-3.5 text-amber-500" />
            <h2 className="text-sm font-extrabold tracking-tight">Contact</h2>
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Optional · Step 3 of 4</span>
          </div>
          <CardContent className="p-3.5 grid sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="cname" className="text-[11px] font-bold">Contact Name</Label>
              <Input
                id="cname"
                value={formData.contact.name}
                onChange={(e) => updateNested('contact', 'name', e.target.value)}
                placeholder="Warehouse Manager"
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cemail" className="text-[11px] font-bold">Email</Label>
              <Input
                id="cemail"
                type="email"
                value={formData.contact.email}
                onChange={(e) => updateNested('contact', 'email', e.target.value)}
                placeholder="hyd@mentoos.in"
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cphone" className="text-[11px] font-bold">Phone</Label>
              <Input
                id="cphone"
                value={formData.contact.phone}
                onChange={(e) => updateNested('contact', 'phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <Settings2 className="h-3.5 w-3.5 text-amber-500" />
            <h2 className="text-sm font-extrabold tracking-tight">Fulfilment Settings</h2>
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 4 of 4</span>
          </div>
          <CardContent className="p-3.5 grid sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="priority" className="text-[11px] font-bold">Priority</Label>
              <Input
                id="priority"
                type="number"
                min={1}
                value={formData.settings.priority}
                onChange={(e) => updateNested('settings', 'priority', parseInt(e.target.value) || 1)}
                className="h-9 rounded-lg text-xs mt-1"
              />
              <p className="text-[9px] text-muted-foreground mt-1">Lower = picked first at checkout</p>
            </div>
            <div>
              <Label htmlFor="capacity" className="text-[11px] font-bold">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={0}
                value={formData.settings.maxCapacity}
                onChange={(e) => updateNested('settings', 'maxCapacity', parseInt(e.target.value) || 0)}
                className="h-9 rounded-lg text-xs mt-1"
              />
              <p className="text-[9px] text-muted-foreground mt-1">Units before the dashboard warns</p>
            </div>
            <div>
              <Label htmlFor="handling" className="text-[11px] font-bold">Handling Time</Label>
              <div className="relative mt-1">
                <Input
                  id="handling"
                  type="number"
                  min={0}
                  value={formData.settings.handlingTime}
                  onChange={(e) => updateNested('settings', 'handlingTime', parseInt(e.target.value) || 0)}
                  className="h-9 rounded-lg text-xs pr-14"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">days</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">Dispatch lead time</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-muted-foreground">
            Fields marked <span className="font-extrabold text-slate-500">*</span> are required. You can edit everything later.
          </p>
          <div className="flex gap-2">
            <Link href="/admin/inventory/warehouses">
              <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl text-[11px] font-extrabold">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              size="sm"
              className="h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shadow-sm"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
              {willBeDefault ? 'Create as Default' : 'Create Warehouse'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}