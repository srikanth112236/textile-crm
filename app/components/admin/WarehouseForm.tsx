'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Plus, Loader2, Warehouse as WarehouseIcon, Info, Check,
  MapPin, User, Settings2, ShieldCheck, Mail, Phone, Globe, Boxes,
  Lock, AlertTriangle, Save, Sparkles,
} from 'lucide-react';
import {
  createWarehouse,
  updateWarehouse,
  type Warehouse,
} from '@/lib/api/inventory';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

interface Values {
  name: string;
  code: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  priority: string;
  maxCapacity: string;
  handlingTime: string;
  isActive: boolean;
  isDefault: boolean;
}

type ErrorKey =
  | 'name' | 'code' | 'street' | 'city' | 'state' | 'zip' | 'country'
  | 'contactEmail' | 'contactPhone'
  | 'priority' | 'maxCapacity' | 'handlingTime';

type Errors = Partial<Record<ErrorKey, string>>;

const EMPTY: Values = {
  name: '',
  code: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'India',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  priority: '1',
  maxCapacity: '10000',
  handlingTime: '1',
  isActive: true,
  isDefault: false,
};

function fromWarehouse(w: Warehouse): Values {
  return {
    name: w.name ?? '',
    code: w.code ?? '',
    street: w.address?.street ?? '',
    city: w.address?.city ?? '',
    state: w.address?.state ?? '',
    zip: w.address?.zip ?? '',
    country: w.address?.country ?? 'India',
    contactName: w.contact?.name ?? '',
    contactEmail: w.contact?.email ?? '',
    contactPhone: w.contact?.phone ?? '',
    priority: String(w.settings?.priority ?? 1),
    maxCapacity: String(w.settings?.maxCapacity ?? 10000),
    handlingTime: String(w.settings?.handlingTime ?? 1),
    isActive: w.isActive ?? true,
    isDefault: w.isDefault ?? false,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d+\-\s()]{6,20}$/;

function validate(v: Values, isEdit: boolean): Errors {
  const errors: Errors = {};
  if (!v.name.trim()) errors.name = 'Warehouse name is required.';
  else if (v.name.trim().length < 3) errors.name = 'Use at least 3 characters.';

  if (!isEdit) {
    if (!v.code.trim()) errors.code = 'Warehouse code is required.';
    else if (!/^[A-Z0-9-]{2,}$/.test(v.code.trim())) errors.code = 'Use A-Z, 0-9 or a hyphen (2+ chars).';
  }

  if (!v.street.trim()) errors.street = 'Street address is required.';
  if (!v.city.trim()) errors.city = 'City is required.';
  if (!v.state.trim()) errors.state = 'State is required.';
  if (!v.zip.trim()) errors.zip = 'PIN code is required.';
  else if (!/^\d{6}$/.test(v.zip.trim())) errors.zip = 'Enter a 6-digit PIN code.';
  if (!v.country.trim()) errors.country = 'Country is required.';
  if (v.contactEmail && !EMAIL_RE.test(v.contactEmail)) errors.contactEmail = 'Enter a valid email address.';
  if (v.contactPhone && !PHONE_RE.test(v.contactPhone)) errors.contactPhone = 'Enter a valid phone number.';

  const priority = Number(v.priority);
  if (!v.priority.trim() || !Number.isFinite(priority) || priority < 1) errors.priority = 'Priority must be 1 or higher.';

  const capacity = Number(v.maxCapacity);
  if (v.maxCapacity.trim() && (!Number.isFinite(capacity) || capacity < 0)) errors.maxCapacity = 'Capacity cannot be negative.';

  const handling = Number(v.handlingTime);
  if (v.handlingTime.trim() && (!Number.isFinite(handling) || handling < 0)) errors.handlingTime = 'Handling time cannot be negative.';

  return errors;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-start gap-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
        <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold tracking-tight leading-tight">{title}</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <span className="ml-auto shrink-0 text-[8px] uppercase tracking-widest font-extrabold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-2 py-0.5">
          {badge}
        </span>
      </div>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[10px] font-bold text-rose-600 mt-1">{message}</p>;
}

export interface WarehouseFormProps {
  mode: 'create' | 'edit';
  warehouse?: Warehouse;
  existingCount?: number | null;
}

export function WarehouseForm({ mode, warehouse, existingCount = null }: WarehouseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<Values>(() => (warehouse ? fromWarehouse(warehouse) : EMPTY));
  const [initialSnapshot] = useState(() => JSON.stringify(warehouse ? fromWarehouse(warehouse) : EMPTY));
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const dirty = useMemo(() => JSON.stringify(values) !== initialSnapshot, [values, initialSnapshot]);

  const forcedDefault = isEdit
    ? !!warehouse?.isDefault
    : existingCount === 0;
  const willBeDefault = forcedDefault || values.isDefault;

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const generateCode = () => {
    const base = values.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    if (!base) {
      toast({
        title: 'Enter a name first',
        description: 'The warehouse name is used to generate the code.',
        variant: 'destructive',
      });
      return;
    }
    const suffix = String((existingCount ?? 0) + 1).padStart(2, '0');
    set('code', `${base}${suffix}`.slice(0, 8));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(values, isEdit);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(firstKey)?.focus();
      toast({
        title: 'Check the highlighted fields',
        description: nextErrors[firstKey as ErrorKey],
        variant: 'destructive',
      });
      return;
    }

    const address = {
      street: values.street.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      zip: values.zip.trim(),
      country: values.country.trim(),
    };
    const contact = values.contactName || values.contactEmail || values.contactPhone
      ? {
          ...(values.contactName.trim() ? { name: values.contactName.trim() } : {}),
          ...(values.contactEmail.trim() ? { email: values.contactEmail.trim() } : {}),
          ...(values.contactPhone.trim() ? { phone: values.contactPhone.trim() } : {}),
        }
      : undefined;
    const settings = {
      priority: Number(values.priority) || 1,
      maxCapacity: Number(values.maxCapacity) || 0,
      handlingTime: Number(values.handlingTime) || 0,
    };

    try {
      setSubmitting(true);

      if (isEdit && warehouse) {
        await updateWarehouse(warehouse._id, {
          name: values.name.trim(),
          address,
          contact,
          settings,
          isActive: values.isActive,
          isDefault: willBeDefault,
        });
        toast({
          title: 'Warehouse updated',
          description: `${values.name.trim()} saved successfully.`,
        });
      } else {
        await createWarehouse({
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
          address,
          contact,
          settings,
          isActive: values.isActive,
          isDefault: willBeDefault,
        });
        toast({
          title: 'Warehouse created',
          description: willBeDefault
            ? `${values.name.trim()} is now your default warehouse.`
            : `${values.name.trim()} is ready to receive stock.`,
        });
      }

      router.push('/admin/inventory/warehouses');
      router.refresh();
    } catch (error: any) {
      const details = error.response?.data?.details;
      const rawMessage =
        (Array.isArray(details) && details[0])
        || error.response?.data?.error
        || error.message
        || 'Please try again.';
      const isDuplicate = /E11000|duplicate key/i.test(String(rawMessage));

      toast({
        title: isDuplicate ? 'That code is already taken' : 'Could not save warehouse',
        description: isDuplicate
          ? 'Warehouse codes must be unique. Choose a different code and try again.'
          : rawMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (values.name.trim() || 'WH')
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const checklist = [
    { label: 'Warehouse name', ok: values.name.trim().length >= 3 },
    { label: 'Unique code', ok: isEdit ? !!values.code : /^[A-Z0-9-]{2,}$/.test(values.code) },
    { label: 'Street address', ok: !!values.street.trim() },
    { label: 'City', ok: !!values.city.trim() },
    { label: 'State', ok: !!values.state.trim() },
    { label: 'PIN code', ok: /^\d{6}$/.test(values.zip.trim()) },
    { label: 'Country', ok: !!values.country.trim() },
  ];
  const readyCount = checklist.filter((c) => c.ok).length;
  const readyPct = Math.round((readyCount / checklist.length) * 100);
  const requiredReady = readyCount === checklist.length;

  const stockUnits = warehouse?.stock?.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const stockSkus = warehouse?.stock?.length ?? 0;

  return (
    <div className="px-3 py-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <WarehouseIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight leading-none">
                {isEdit ? 'Edit Warehouse' : 'Add Warehouse'}
              </h1>
              {isEdit && warehouse && (
                <>
                  <code className="text-[10px] font-mono font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-md px-1.5 py-0.5">
                    {warehouse.code}
                  </code>
                  <Badge className={warehouse.isActive
                    ? 'bg-emerald-500 text-white text-[8px] font-extrabold rounded-full px-1.5'
                    : 'bg-slate-400 text-white text-[8px] font-extrabold rounded-full px-1.5'}>
                    {warehouse.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                  {warehouse.isDefault && (
                    <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded-full px-1.5 flex items-center gap-0.5">
                      <ShieldCheck className="h-2 w-2" /> DEFAULT
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isEdit
                ? 'Update fulfilment details, address and dispatch settings.'
                : 'Create a fulfilment location for stock, transfers and shipping.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:shrink-0">
          {isEdit && dirty && (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved changes
            </span>
          )}
          <Link href="/admin/inventory/warehouses">
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to List
            </Button>
          </Link>
          <Button
            type="submit"
            form="warehouse-form"
            disabled={submitting || (isEdit && !dirty)}
            size="sm"
            className="hidden lg:inline-flex h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shadow-sm disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : isEdit ? (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Plus className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </div>

      <form id="warehouse-form" onSubmit={handleSubmit}>
        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
          {/* Main column */}
          <div className="space-y-3 min-w-0">
            {/* Identity */}
            <SectionCard
              icon={WarehouseIcon}
              title="Identity"
              description="Name, unique code and availability."
              badge="01 · Required"
            >
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 min-w-0">
                  <Label htmlFor="name" className="text-[11px] font-bold">
                    Warehouse Name <span className="text-amber-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={values.name}
                    onChange={(e) => set('name', e.target.value)}
                    onBlur={() => { if (!isEdit && !values.code) generateCode(); }}
                    placeholder="e.g. Hyderabad Central"
                    aria-invalid={!!errors.name}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.name ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.name} />
                  {!errors.name && (
                    <p className="text-[9px] text-muted-foreground mt-1">Shown to customers on shipping estimates and returns.</p>
                  )}
                </div>

                <div className="min-w-0">
                  <Label htmlFor="code" className="text-[11px] font-bold">
                    Code {!isEdit && <span className="text-amber-600">*</span>}
                  </Label>
                  <div className="flex gap-1.5 mt-1">
                    <Input
                      id="code"
                      value={values.code}
                      disabled={isEdit}
                      onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                      placeholder="HYD01"
                      aria-invalid={!!errors.code}
                      className={`h-10 rounded-xl text-sm font-mono flex-1 ${isEdit ? 'bg-muted' : ''} ${errors.code ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                    />
                    {isEdit ? (
                      <div className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateCode}
                        className="h-10 rounded-xl text-[10px] font-extrabold shrink-0 px-2.5"
                      >
                        Auto
                      </Button>
                    )}
                  </div>
                  <FieldError message={errors.code} />
                  {!errors.code && (
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {isEdit ? 'Codes are permanent once created.' : 'Unique · used in stock transfers.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5">
                  <Switch
                    id="isActive"
                    checked={values.isActive}
                    onCheckedChange={(checked) => set('isActive', checked)}
                  />
                  <div className="min-w-0">
                    <Label htmlFor="isActive" className="text-[11px] font-bold leading-tight block">Active</Label>
                    <span className="text-[9px] text-muted-foreground">Can receive and ship stock</span>
                  </div>
                </div>

                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                  willBeDefault
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <Switch
                    id="isDefault"
                    checked={willBeDefault}
                    disabled={forcedDefault}
                    onCheckedChange={(checked) => set('isDefault', checked)}
                  />
                  <div className="min-w-0">
                    <Label htmlFor="isDefault" className="text-[11px] font-bold leading-tight flex items-center gap-1">
                      Default warehouse
                      <ShieldCheck className={`h-3 w-3 ${willBeDefault ? 'text-amber-600' : 'text-slate-400'}`} />
                    </Label>
                    <span className="text-[9px] text-muted-foreground">
                      {isEdit && warehouse?.isDefault
                        ? 'Protected — promote another to change'
                        : existingCount === 0 && !isEdit
                          ? 'Auto — first warehouse'
                          : 'Used for new products & orders'}
                    </span>
                  </div>
                </div>
              </div>

              {willBeDefault && !forcedDefault && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-800 px-3 py-2">
                  <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium leading-snug">
                    The current default warehouse will be unset. The default cannot be deleted — promote
                    another warehouse before removing it.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Location */}
            <SectionCard
              icon={MapPin}
              title="Location"
              description="Where stock physically lives and ships from."
              badge="02 · Required"
            >
              <div className="grid sm:grid-cols-6 gap-3">
                <div className="sm:col-span-6 min-w-0">
                  <Label htmlFor="street" className="text-[11px] font-bold">
                    Street Address <span className="text-amber-600">*</span>
                  </Label>
                  <Input
                    id="street"
                    value={values.street}
                    onChange={(e) => set('street', e.target.value)}
                    placeholder="12-4-9, Survey 44"
                    aria-invalid={!!errors.street}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.street ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.street} />
                </div>

                <div className="sm:col-span-2 min-w-0">
                  <Label htmlFor="city" className="text-[11px] font-bold">
                    City <span className="text-amber-600">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={values.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Vijayawada"
                    aria-invalid={!!errors.city}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.city ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.city} />
                </div>

                <div className="sm:col-span-2 min-w-0">
                  <Label htmlFor="state" className="text-[11px] font-bold">
                    State <span className="text-amber-600">*</span>
                  </Label>
                  <select
                    id="state"
                    value={values.state}
                    onChange={(e) => set('state', e.target.value)}
                    aria-invalid={!!errors.state}
                    className={`w-full h-10 rounded-xl border bg-white dark:bg-slate-950 text-sm mt-1 px-2.5 outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.state
                        ? 'border-rose-400 dark:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Select state…</option>
                    {values.state && !STATES.includes(values.state) && (
                      <option value={values.state}>{values.state}</option>
                    )}
                    {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                  <FieldError message={errors.state} />
                </div>

                <div className="sm:col-span-2 min-w-0">
                  <Label htmlFor="zip" className="text-[11px] font-bold">
                    PIN Code <span className="text-amber-600">*</span>
                  </Label>
                  <Input
                    id="zip"
                    value={values.zip}
                    onChange={(e) => set('zip', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="520010"
                    inputMode="numeric"
                    aria-invalid={!!errors.zip}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.zip ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.zip} />
                </div>

                <div className="sm:col-span-6 min-w-0">
                  <Label htmlFor="country" className="text-[11px] font-bold">
                    Country <span className="text-amber-600">*</span>
                  </Label>
                  <Input
                    id="country"
                    value={values.country}
                    onChange={(e) => set('country', e.target.value)}
                    placeholder="India"
                    aria-invalid={!!errors.country}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.country ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.country} />
                </div>
              </div>
            </SectionCard>

            {/* Contact */}
            <SectionCard
              icon={User}
              title="Contact"
              description="Who to call when something goes wrong at this location."
              badge="03 · Optional"
            >
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="min-w-0">
                  <Label htmlFor="contactName" className="text-[11px] font-bold">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={values.contactName}
                    onChange={(e) => set('contactName', e.target.value)}
                    placeholder="Warehouse Manager"
                    className="h-10 rounded-xl text-sm mt-1"
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="contactEmail" className="text-[11px] font-bold">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={values.contactEmail}
                    onChange={(e) => set('contactEmail', e.target.value)}
                    placeholder="hyd@mentoos.in"
                    aria-invalid={!!errors.contactEmail}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.contactEmail ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.contactEmail} />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="contactPhone" className="text-[11px] font-bold">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={values.contactPhone}
                    onChange={(e) => set('contactPhone', e.target.value)}
                    placeholder="+91 98765 43210"
                    aria-invalid={!!errors.contactPhone}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.contactPhone ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.contactPhone} />
                </div>
              </div>
            </SectionCard>

            {/* Settings */}
            <SectionCard
              icon={Settings2}
              title="Fulfilment Settings"
              description="How orders are allocated and how much this location can hold."
              badge="04 · Tuning"
            >
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="min-w-0">
                  <Label htmlFor="priority" className="text-[11px] font-bold">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={1}
                    value={values.priority}
                    onChange={(e) => set('priority', e.target.value)}
                    aria-invalid={!!errors.priority}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.priority ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.priority} />
                  {!errors.priority && <p className="text-[9px] text-muted-foreground mt-1">Lower = picked first at checkout.</p>}
                </div>

                <div className="min-w-0">
                  <Label htmlFor="maxCapacity" className="text-[11px] font-bold">Max Capacity</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min={0}
                    value={values.maxCapacity}
                    onChange={(e) => set('maxCapacity', e.target.value)}
                    aria-invalid={!!errors.maxCapacity}
                    className={`h-10 rounded-xl text-sm mt-1 ${errors.maxCapacity ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <FieldError message={errors.maxCapacity} />
                  {!errors.maxCapacity && <p className="text-[9px] text-muted-foreground mt-1">Units before the dashboard warns.</p>}
                </div>

                <div className="min-w-0">
                  <Label htmlFor="handlingTime" className="text-[11px] font-bold">Handling Time</Label>
                  <div className="relative mt-1">
                    <Input
                      id="handlingTime"
                      type="number"
                      min={0}
                      value={values.handlingTime}
                      onChange={(e) => set('handlingTime', e.target.value)}
                      aria-invalid={!!errors.handlingTime}
                      className={`h-10 rounded-xl text-sm pr-14 ${errors.handlingTime ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">days</span>
                  </div>
                  <FieldError message={errors.handlingTime} />
                  {!errors.handlingTime && <p className="text-[9px] text-muted-foreground mt-1">Dispatch lead time.</p>}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar */}
          <aside className="space-y-3 min-w-0 xl:sticky xl:top-4">
            {/* Live preview */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 px-4 py-4 text-slate-950">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-white/30 border border-white/40 flex items-center justify-center text-sm font-black shrink-0 backdrop-blur-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold leading-tight truncate">
                      {values.name.trim() || (isEdit ? 'Warehouse' : 'New warehouse')}
                    </p>
                    <p className="text-[10px] font-bold opacity-80 mt-0.5">
                      {values.code.trim() || 'CODE NOT SET'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <span className={`text-[8px] font-extrabold rounded-full px-2 py-0.5 ${values.isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-950/70 text-white'}`}>
                    {values.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  {willBeDefault && (
                    <span className="text-[8px] font-extrabold rounded-full px-2 py-0.5 bg-white/80 text-amber-800 flex items-center gap-0.5">
                      <ShieldCheck className="h-2 w-2" /> DEFAULT
                    </span>
                  )}
                </div>
              </div>

              <CardContent className="p-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 text-[11px] leading-snug">
                    <p className="font-bold truncate">{values.street.trim() || 'Street address'}</p>
                    <p className="text-muted-foreground truncate">
                      {[values.city.trim(), values.state.trim()].filter(Boolean).join(', ') || 'City, state'}
                      {values.zip.trim() ? ` — ${values.zip.trim()}` : ''}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1 truncate">
                      <Globe className="h-2.5 w-2.5 shrink-0" /> {values.country.trim() || 'Country'}
                    </p>
                  </div>
                </div>

                {(values.contactName || values.contactEmail || values.contactPhone) && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-2.5 py-2 space-y-1">
                    {values.contactName && <p className="text-[10px] font-bold truncate">{values.contactName}</p>}
                    {values.contactEmail && (
                      <p className="flex items-center gap-1.5 text-[9px] text-muted-foreground truncate">
                        <Mail className="h-2.5 w-2.5 shrink-0" /> {values.contactEmail}
                      </p>
                    )}
                    {values.contactPhone && (
                      <p className="flex items-center gap-1.5 text-[9px] text-muted-foreground truncate">
                        <Phone className="h-2.5 w-2.5 shrink-0" /> {values.contactPhone}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { label: 'Priority', value: values.priority || '—' },
                    { label: 'Capacity', value: values.maxCapacity ? Number(values.maxCapacity).toLocaleString('en-IN') : '—' },
                    { label: 'Handling', value: `${values.handlingTime || 0}d` },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-1.5">
                      <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">{stat.label}</p>
                      <p className="text-[11px] font-black truncate mt-0.5">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {isEdit && (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-900 px-2.5 py-2">
                    <Boxes className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <p className="text-[10px] font-bold">
                      {stockUnits.toLocaleString('en-IN')} units
                      <span className="font-medium text-muted-foreground"> · {stockSkus} SKUs held here</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Readiness */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Setup readiness</p>
                  <span className={`text-[10px] font-black ${requiredReady ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {readyCount}/{checklist.length}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${requiredReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${readyPct}%` }}
                  />
                </div>
                <ul className="space-y-1.5 pt-1">
                  {checklist.map((item) => (
                    <li key={item.label} className="flex items-center gap-2">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                        item.ok ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {item.ok ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-current" />}
                      </span>
                      <span className={`text-[10px] font-semibold ${item.ok ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground'}`}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
                {!requiredReady && (
                  <p className="text-[9px] text-muted-foreground pt-1 flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                    Complete the required fields to enable saving.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-3.5 space-y-2">
                <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Good to know
                </p>
                <div className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Priority decides which warehouse is tried first when an order is placed — 1 is highest.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Inactive warehouses keep their stock but stop receiving new orders.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Stock can be received right after saving from Inventory → Add / Adjust Stock.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-2 z-30 mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-2.5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <p className="text-[10px] text-muted-foreground flex-1">
              <span className="font-extrabold text-slate-500">*</span> Required fields.
              {isEdit ? ' Changes are visible to customers immediately.' : ' Everything can be edited later.'}
            </p>
            <div className="flex items-center gap-2 sm:shrink-0">
              <Link href="/admin/inventory/warehouses" className="flex-1 sm:flex-none">
                <Button type="button" variant="outline" size="sm" className="w-full h-9 rounded-xl text-[11px] font-extrabold">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting || (isEdit && !dirty)}
                size="sm"
                className="flex-1 sm:flex-none h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shadow-sm disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : isEdit ? (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isEdit ? (dirty ? 'Save Changes' : 'No Changes') : willBeDefault ? 'Create as Default' : 'Create Warehouse'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
