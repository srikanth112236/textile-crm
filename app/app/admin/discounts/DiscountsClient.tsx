'use client';

import { useEffect, useState } from 'react';
import { discountsApi, Discount, CreateDiscountData, UpdateDiscountData } from '@/lib/api/discounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Tag, Info, Search, X, ChevronLeft, ChevronRight, Copy, Check, Power } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getErrorMessage, formatPrice } from '@/lib/utils';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ValidationErrors {
  code?: string;
  value?: string;
  expiry?: string;
  usageLimit?: string;
  minPurchase?: string;
  maxDiscount?: string;
  general?: string;
}

// Shared advanced-rule fields (first-order / combo / category scope / free
// shipping) used by both create and edit dialogs — one implementation.
function DiscountScopeFields({
  formData,
  setFormData,
  allCategories,
}: {
  formData: CreateDiscountData;
  setFormData: (v: CreateDiscountData) => void;
  allCategories: Array<{ _id: string; name: string; slug: string }>;
}) {
  const toggleCat = (id: string) => {
    const cur = formData.applicableCategories || [];
    setFormData({
      ...formData,
      applicableCategories: cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id],
    });
  };
  return (
    <div className="space-y-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 p-3">
      <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Advanced rules</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Switch
            className="h-4 w-7"
            checked={!!formData.firstOrderOnly}
            onCheckedChange={(checked) => setFormData({ ...formData, firstOrderOnly: checked })}
          />
          <Label className="text-[11px] font-semibold leading-tight">First order only <span className="text-[9px] text-muted-foreground font-normal">(MENTOOS15)</span></Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            className="h-4 w-7"
            checked={!!formData.freeShipping}
            onCheckedChange={(checked) => setFormData({ ...formData, freeShipping: checked, value: checked ? 0 : formData.value })}
          />
          <Label className="text-[11px] font-semibold leading-tight">Free shipping <span className="text-[9px] text-muted-foreground font-normal">(FREESHIP)</span></Label>
        </div>
        <div className="col-span-2">
          <Label className="text-[11px] font-semibold">Min items in cart <span className="text-[9px] text-muted-foreground font-normal">(2 for BUY2GET10)</span></Label>
          <Input
            className="h-8 mt-1 text-xs rounded-lg"
            type="number"
            value={formData.minItems ?? ''}
            onChange={(e) => setFormData({ ...formData, minItems: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0) })}
            min={0}
            placeholder="No minimum"
          />
        </div>
      </div>
      <div>
        <Label className="text-[11px] font-semibold">Limit to categories <span className="text-[9px] text-muted-foreground font-normal">(empty = whole store)</span></Label>
        <div className="mt-1 grid max-h-24 grid-cols-3 gap-x-2 gap-y-0.5 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
          {allCategories.length === 0 && <p className="text-[10px] text-muted-foreground col-span-3">Loading categories…</p>}
          {allCategories.map((c) => (
            <label key={c._id} className="flex items-center gap-1.5 text-[10px] cursor-pointer rounded px-1 py-0.5 hover:bg-muted">
              <input
                type="checkbox"
                checked={(formData.applicableCategories || []).includes(c._id)}
                onChange={() => toggleCat(c._id)}
                className="h-3 w-3 accent-amber-500"
              />
              <span className="truncate">{c.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DiscountsClient() {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [infoDialog, setInfoDialog] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<CreateDiscountData>({
    code: '',
    type: 'percentage',
    value: 0,
    minPurchase: undefined,
    maxDiscount: undefined,
    expiry: '',
    usageLimit: undefined,
    description: '',
    isActive: true,
    firstOrderOnly: false,
    minItems: undefined,
    applicableCategories: [],
    freeShipping: false,
  });
  const [allCategories, setAllCategories] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [search, statusFilter, perPage]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await discountsApi.getDiscounts({});
      if (response.success) {
        setDiscounts(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to fetch discounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
    import('@/lib/api/categories')
      .then((m) => m.categoriesApi.getCategories())
      .then((r) => setAllCategories(((r as any).data || []) as any))
      .catch(() => {});
  }, []);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Code validation
    if (!formData.code || formData.code.trim().length === 0) {
      errors.code = 'Discount code is required';
    } else if (formData.code.length < 3) {
      errors.code = 'Discount code must be at least 3 characters';
    } else if (!/^[A-Z0-9-_]+$/.test(formData.code)) {
      errors.code = 'Code can only contain uppercase letters, numbers, hyphens, and underscores';
    }

    // Value validation (0 allowed for free-shipping coupons)
    if (formData.value === undefined || formData.value === null) {
      errors.value = 'Discount value is required';
    } else if (formData.value <= 0 && !formData.freeShipping) {
      errors.value = 'Discount value must be greater than 0';
    } else if (formData.type === 'percentage' && formData.value > 100) {
      errors.value = 'Percentage discount cannot exceed 100%';
    } else if (formData.type === 'percentage' && formData.value < 0) {
      errors.value = 'Percentage cannot be negative';
    } else if (formData.type === 'fixed' && formData.value < 0) {
      errors.value = 'Fixed discount cannot be negative';
    }

    // Expiry validation
    if (!formData.expiry) {
      errors.expiry = 'Expiry date is required';
    } else {
      const expiryDate = new Date(formData.expiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate <= today) {
        errors.expiry = 'Expiry date must be in the future';
      }
    }

    // Usage limit validation
    if (formData.usageLimit !== undefined && formData.usageLimit !== null) {
      if (formData.usageLimit < 1) {
        errors.usageLimit = 'Usage limit must be at least 1';
      }
    }

    // Min purchase validation
    if (formData.minPurchase !== undefined && formData.minPurchase !== null) {
      if (formData.minPurchase < 0) {
        errors.minPurchase = 'Minimum purchase cannot be negative';
      }
    }

    // Max discount validation (for percentage)
    if (formData.type === 'percentage' && formData.maxDiscount !== undefined && formData.maxDiscount !== null) {
      if (formData.maxDiscount < 0) {
        errors.maxDiscount = 'Maximum discount cannot be negative';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    // Clear previous errors
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await discountsApi.createDiscount(formData);
      if (response.success) {
        toast({
          title: 'Success',
          description: `Discount code "${formData.code}" created successfully`,
        });
        setCreateDialog(false);
        resetForm();
        fetchDiscounts();
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      
      // Check if it's a validation error from the API
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        const apiErrors: ValidationErrors = {};
        error.response.data.details.forEach((detail: string) => {
          if (detail.includes('code')) apiErrors.code = detail;
          if (detail.includes('value')) apiErrors.value = detail;
          if (detail.includes('expiry')) apiErrors.expiry = detail;
        });
        setValidationErrors(apiErrors);
      } else {
        setValidationErrors({ general: errorMessage });
      }

      toast({
        title: 'Error',
        description: errorMessage || 'Failed to create discount',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDiscount) return;

    setValidationErrors({});

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      const updateData: UpdateDiscountData = { ...formData };
      const response = await discountsApi.updateDiscount(selectedDiscount._id, updateData);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Discount updated successfully',
        });
        setEditDialog(false);
        resetForm();
        fetchDiscounts();
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        const apiErrors: ValidationErrors = {};
        error.response.data.details.forEach((detail: string) => {
          if (detail.includes('code')) apiErrors.code = detail;
          if (detail.includes('value')) apiErrors.value = detail;
          if (detail.includes('expiry')) apiErrors.expiry = detail;
        });
        setValidationErrors(apiErrors);
      } else {
        setValidationErrors({ general: errorMessage });
      }

      toast({
        title: 'Error',
        description: errorMessage || 'Failed to update discount',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDiscount) return;

    try {
      setActionLoading(true);
      const response = await discountsApi.deleteDiscount(selectedDiscount._id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Discount deleted successfully',
        });
        setDeleteDialog(false);
        fetchDiscounts();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to delete discount',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      minPurchase: undefined,
      maxDiscount: undefined,
      expiry: '',
      usageLimit: undefined,
      description: '',
      isActive: true,
      firstOrderOnly: false,
      minItems: undefined,
      applicableCategories: [],
      freeShipping: false,
    });
    setValidationErrors({});
  };

  const openEditDialog = (discount: Discount) => {
    setSelectedDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minPurchase: discount.minPurchase,
      maxDiscount: discount.maxDiscount,
      expiry: new Date(discount.expiry).toISOString().split('T')[0],
      usageLimit: discount.usageLimit,
      description: discount.description || '',
      isActive: discount.isActive,
      firstOrderOnly: !!discount.firstOrderOnly,
      minItems: discount.minItems,
      applicableCategories: (discount.applicableCategories || []).map((c: any) => (typeof c === 'string' ? c : c._id || c)),
      freeShipping: !!discount.freeShipping,
    });
    setValidationErrors({});
    setEditDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialog(true);
  };

  const isExpired = (expiry: string) => new Date(expiry) < new Date();

  const handleToggleActive = async (d: Discount) => {
    try {
      await discountsApi.updateDiscount(d._id, { isActive: !d.isActive });
      toast({ title: d.isActive ? `${d.code} disabled` : `${d.code} enabled` });
      fetchDiscounts();
    } catch (error: any) {
      toast({ title: 'Error', description: getErrorMessage(error) || 'Update failed', variant: 'destructive' });
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* clipboard blocked */ }
  };

  const statusOf = (d: Discount): 'active' | 'inactive' | 'expired' =>
    !d.isActive ? 'inactive' : isExpired(d.expiry) ? 'expired' : 'active';

  const filtered = discounts.filter((d) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      d.code.toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q);
    const s = statusOf(d);
    const matchStatus = statusFilter === 'all' || s === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const stats = {
    total: discounts.length,
    active: discounts.filter((d) => statusOf(d) === 'active').length,
    inactive: discounts.filter((d) => statusOf(d) === 'inactive').length,
    expired: discounts.filter((d) => statusOf(d) === 'expired').length,
    uses: discounts.reduce((s, d) => s + (d.usedCount || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Tag className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Discounts &amp; Coupons</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              {filtered.length} of {discounts.length} codes · {stats.uses} total redemptions
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInfoDialog(true)}
            className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm"
          >
            <Info className="h-3.5 w-3.5 mr-1.5" /> Guide
          </Button>
          <Button
            onClick={openCreateDialog}
            size="sm"
            className="h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Discount
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Total codes', value: stats.total, tone: 'text-slate-900 dark:text-white', ring: 'border-slate-200 dark:border-slate-800' },
          { label: 'Live', value: stats.active, tone: 'text-emerald-600', ring: 'border-emerald-200 dark:border-emerald-800' },
          { label: 'Disabled', value: stats.inactive, tone: 'text-slate-500', ring: 'border-slate-200 dark:border-slate-800' },
          { label: 'Expired', value: stats.expired, tone: 'text-rose-600', ring: 'border-rose-200 dark:border-rose-800' },
          { label: 'Redemptions', value: stats.uses, tone: 'text-violet-600', ring: 'border-violet-200 dark:border-violet-800' },
        ].map((k) => (
          <Card key={k.label} className={`rounded-xl border ${k.ring} shadow-sm`}>
            <CardContent className="p-2.5">
              <div className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">{k.label}</div>
              <div className={`text-xl font-black tracking-tight mt-0.5 ${k.tone}`}>{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-3 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative w-full lg:w-80">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or description…"
              className="pl-9 pr-8 h-9 rounded-xl text-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 lg:ml-auto">
            {([
              { k: 'all', n: 'All', c: stats.total },
              { k: 'active', n: 'Live', c: stats.active },
              { k: 'inactive', n: 'Disabled', c: stats.inactive },
              { k: 'expired', n: 'Expired', c: stats.expired },
            ] as const).map((f) => (
              <Button
                key={f.k}
                variant={statusFilter === f.k ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(f.k)}
                className={`rounded-full text-[10px] uppercase font-extrabold h-8 px-3 ${statusFilter === f.k ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : ''}`}
              >
                {f.n}
                <span className={`ml-1.5 text-[9px] ${statusFilter === f.k ? 'text-slate-800' : 'text-slate-400'}`}>{f.c}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Per page</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold px-2 outline-none focus:ring-2 focus:ring-amber-500"
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Discounts Table */}
      {loading ? (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : discounts.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No discounts yet — click <span className="font-bold text-amber-600">Create Discount</span> to add your first code.
          </CardContent>
        </Card>
      ) : paged.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No codes match your filters.
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Code</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Discount</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Conditions</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Usage</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Expires</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {paged.map((d) => {
                const s = statusOf(d);
                const pctUsed = d.usageLimit ? Math.min(100, Math.round(((d.usedCount || 0) / d.usageLimit) * 100)) : 0;
                const daysLeft = Math.ceil((new Date(d.expiry).getTime() - Date.now()) / 86400000);
                const chips: string[] = [];
                if (d.firstOrderOnly) chips.push('1st order');
                if (d.minItems) chips.push(`${d.minItems}+ items`);
                if (d.freeShipping) chips.push('Free ship');
                if ((d.applicableCategories || []).length) chips.push(`${d.applicableCategories!.length} cat`);

                return (
                  <AdminTableRow key={d._id} className="hover:bg-amber-500/[0.03] transition-colors">
                    <AdminTableCell>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyCode(d.code)}
                          title="Copy code"
                          className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          {d.code}
                          {copied === d.code ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-2.5 w-2.5 opacity-40" />}
                        </button>
                      </div>
                      {d.description && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[160px] mt-0.5">{d.description}</div>
                      )}
                    </AdminTableCell>

                    <AdminTableCell>
                      <Badge className="bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-md px-1.5 whitespace-nowrap">
                        {d.type === 'percentage' ? `${d.value}% OFF` : `${formatPrice(d.value)} OFF`}
                      </Badge>
                    </AdminTableCell>

                    <AdminTableCell>
                      <div className="flex flex-wrap gap-1">
                        {d.minPurchase ? (
                          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Min {formatPrice(d.minPurchase)}</span>
                        ) : (
                          <span className="text-[9px] text-slate-400">No min</span>
                        )}
                        {d.maxDiscount ? (
                          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Cap {formatPrice(d.maxDiscount)}</span>
                        ) : null}
                        {chips.map((c) => (
                          <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-300 whitespace-nowrap">
                            {c}
                          </span>
                        ))}
                      </div>
                    </AdminTableCell>

                    <AdminTableCell className="whitespace-nowrap">
                      <div className="text-[11px] font-extrabold">
                        {d.usedCount || 0}
                        <span className="text-muted-foreground font-medium">/{d.usageLimit ?? '∞'}</span>
                      </div>
                      {d.usageLimit ? (
                        <div className="h-1 w-16 rounded-full bg-slate-200 dark:bg-slate-800 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pctUsed >= 100 ? 'bg-rose-500' : pctUsed >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pctUsed}%` }}
                          />
                        </div>
                      ) : null}
                    </AdminTableCell>

                    <AdminTableCell className="whitespace-nowrap">
                      <div className="text-[11px] font-semibold">
                        {new Date(d.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                      {s === 'active' && daysLeft <= 30 && (
                        <div className="text-[9px] font-bold text-amber-600">{daysLeft}d left</div>
                      )}
                      {s === 'expired' && (
                        <div className="text-[9px] font-bold text-rose-500">expired</div>
                      )}
                    </AdminTableCell>

                    <AdminTableCell>
                      <Badge className={
                        s === 'active' ? 'bg-emerald-500 text-white text-[9px] font-extrabold rounded-full px-2'
                        : s === 'expired' ? 'bg-rose-500 text-white text-[9px] font-extrabold rounded-full px-2'
                        : 'bg-slate-400 text-white text-[9px] font-extrabold rounded-full px-2'
                      }>
                        {s.toUpperCase()}
                      </Badge>
                    </AdminTableCell>

                    <AdminTableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title={d.isActive ? 'Disable code' : 'Enable code'}
                          onClick={() => handleToggleActive(d)}
                          className="h-7 w-7 p-0 rounded-lg hover:bg-amber-500/10"
                        >
                          <Power className={`h-3.5 w-3.5 ${d.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(d)}
                          className="h-7 px-2 rounded-lg text-[10px] font-extrabold hover:bg-amber-500/10"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedDiscount(d); setDeleteDialog(true); }}
                          className="h-7 px-2 rounded-lg text-[10px] font-extrabold text-destructive hover:bg-destructive/10"
                        >
                          Delete
                        </Button>
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </AdminTableBody>
          </AdminTable>
        </Card>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-muted-foreground font-medium">
            Showing <span className="font-extrabold text-slate-700 dark:text-slate-200">{(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)}</span> of <span className="font-extrabold text-slate-700 dark:text-slate-200">{filtered.length}</span> codes
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className="h-8 rounded-lg text-[11px] font-extrabold">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400 text-[10px]">…</span>}
                  <Button
                    variant={safePage === p ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 p-0 rounded-lg text-[11px] font-extrabold ${safePage === p ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : ''}`}
                  >
                    {p}
                  </Button>
                </span>
              ))}
            <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} className="h-8 rounded-lg text-[11px] font-extrabold">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={(open) => {
        setCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="space-y-0.5 pb-3">
            <DialogTitle className="text-base font-extrabold">Create Discount</DialogTitle>
            <DialogDescription className="text-[11px]">New promo code — fields marked * are required.</DialogDescription>
          </DialogHeader>
          
          {validationErrors.general && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-[11px] font-semibold text-destructive">{validationErrors.general}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label htmlFor="code" className="text-[11px] font-bold">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
                    setFormData({ ...formData, code: value });
                    if (validationErrors.code) setValidationErrors({ ...validationErrors, code: undefined });
                  }}
                  placeholder="SUMMER2024"
                  className={`h-9 rounded-lg text-xs font-mono mt-1 ${validationErrors.code ? 'border-destructive' : ''}`}
                />
                {validationErrors.code ? (
                  <p className="text-[10px] text-destructive mt-0.5">{validationErrors.code}</p>
                ) : (
                  <p className="text-[9px] text-muted-foreground mt-0.5">A-Z, 0-9, - and _</p>
                )}
              </div>
              <div>
                <Label htmlFor="type" className="text-[11px] font-bold">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'percentage' | 'fixed') => {
                    setFormData({ ...formData, type: value });
                    if (validationErrors.value) setValidationErrors({ ...validationErrors, value: undefined });
                  }}
                >
                  <SelectTrigger id="type" className="h-9 rounded-lg text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage" className="text-xs">Percentage</SelectItem>
                    <SelectItem value="fixed" className="text-xs">Fixed ₹</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value" className="text-[11px] font-bold">Value *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, value });
                    if (validationErrors.value) setValidationErrors({ ...validationErrors, value: undefined });
                  }}
                  min={0}
                  max={formData.type === 'percentage' ? 100 : undefined}
                  step={formData.type === 'percentage' ? 1 : 0.01}
                  className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.value ? 'border-destructive' : ''}`}
                />
                {validationErrors.value && (
                  <p className="text-[10px] text-destructive mt-0.5">{validationErrors.value}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="expiry" className="text-[11px] font-bold">Expiry *</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={formData.expiry}
                  onChange={(e) => {
                    setFormData({ ...formData, expiry: e.target.value });
                    if (validationErrors.expiry) setValidationErrors({ ...validationErrors, expiry: undefined });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.expiry ? 'border-destructive' : ''}`}
                />
                {validationErrors.expiry && (
                  <p className="text-[10px] text-destructive mt-0.5">{validationErrors.expiry}</p>
                )}
              </div>
              <div>
                <Label htmlFor="minPurchase" className="text-[11px] font-bold">Min purchase ₹</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  value={formData.minPurchase || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setFormData({ ...formData, minPurchase: value });
                    if (validationErrors.minPurchase) setValidationErrors({ ...validationErrors, minPurchase: undefined });
                  }}
                  min={0}
                  step="0.01"
                  placeholder="None"
                  className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.minPurchase ? 'border-destructive' : ''}`}
                />
              </div>
              {formData.type === 'percentage' ? (
                <div>
                  <Label htmlFor="maxDiscount" className="text-[11px] font-bold">Max discount ₹</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={formData.maxDiscount || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setFormData({ ...formData, maxDiscount: value });
                      if (validationErrors.maxDiscount) setValidationErrors({ ...validationErrors, maxDiscount: undefined });
                    }}
                    min={0}
                    step="0.01"
                    placeholder="No cap"
                    className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.maxDiscount ? 'border-destructive' : ''}`}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="usageLimit" className="text-[11px] font-bold">Usage limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={formData.usageLimit || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setFormData({ ...formData, usageLimit: value });
                      if (validationErrors.usageLimit) setValidationErrors({ ...validationErrors, usageLimit: undefined });
                    }}
                    min={1}
                    placeholder="Unlimited"
                    className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.usageLimit ? 'border-destructive' : ''}`}
                  />
                </div>
              )}
            </div>

            {formData.type === 'percentage' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <Label htmlFor="usageLimit-2" className="text-[11px] font-bold">Usage limit</Label>
                  <Input
                    id="usageLimit-2"
                    type="number"
                    value={formData.usageLimit || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setFormData({ ...formData, usageLimit: value });
                      if (validationErrors.usageLimit) setValidationErrors({ ...validationErrors, usageLimit: undefined });
                    }}
                    min={1}
                    placeholder="Unlimited uses"
                    className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.usageLimit ? 'border-destructive' : ''}`}
                  />
                </div>
              </div>
            )}

            <DiscountScopeFields formData={formData} setFormData={setFormData} allCategories={allCategories} />

            <div>
              <Label htmlFor="description" className="text-[11px] font-bold">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Optional internal note"
                maxLength={500}
                className="text-xs rounded-lg mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                className="h-4 w-7"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="active" className="text-[11px] font-semibold">Active — available for use at checkout</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setCreateDialog(false); resetForm(); }} className="h-9 rounded-xl text-[11px] font-extrabold">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading} size="sm" className="h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold">
              {actionLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Create Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure with validation */}
      <Dialog open={editDialog} onOpenChange={(open) => {
        setEditDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="space-y-0.5 pb-3">
            <DialogTitle className="text-base font-extrabold">Edit Discount</DialogTitle>
            <DialogDescription className="text-[11px]">Updating <span className="font-mono font-bold text-amber-600">{formData.code}</span></DialogDescription>
          </DialogHeader>
          
          {validationErrors.general && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-[11px] font-semibold text-destructive">{validationErrors.general}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="edit-code" className="text-[11px] font-bold">Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
                    setFormData({ ...formData, code: value });
                    if (validationErrors.code) setValidationErrors({ ...validationErrors, code: undefined });
                  }}
                  className={`h-9 rounded-lg text-xs font-mono mt-1 ${validationErrors.code ? 'border-destructive' : ''}`}
                />
              </div>
              <div>
                <Label htmlFor="edit-type" className="text-[11px] font-bold">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'percentage' | 'fixed') => {
                    setFormData({ ...formData, type: value });
                    if (validationErrors.value) setValidationErrors({ ...validationErrors, value: undefined });
                  }}
                >
                  <SelectTrigger id="edit-type" className="h-9 rounded-lg text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage" className="text-xs">Percentage</SelectItem>
                    <SelectItem value="fixed" className="text-xs">Fixed ₹</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-value" className="text-[11px] font-bold">Value *</Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, value });
                    if (validationErrors.value) setValidationErrors({ ...validationErrors, value: undefined });
                  }}
                  min={0}
                  max={formData.type === 'percentage' ? 100 : undefined}
                  step={formData.type === 'percentage' ? 1 : 0.01}
                  className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.value ? 'border-destructive' : ''}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="edit-expiry" className="text-[11px] font-bold">Expiry *</Label>
                <Input
                  id="edit-expiry"
                  type="date"
                  value={formData.expiry}
                  onChange={(e) => {
                    setFormData({ ...formData, expiry: e.target.value });
                    if (validationErrors.expiry) setValidationErrors({ ...validationErrors, expiry: undefined });
                  }}
                  className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.expiry ? 'border-destructive' : ''}`}
                />
              </div>
              <div>
                <Label htmlFor="edit-minPurchase" className="text-[11px] font-bold">Min purchase ₹</Label>
                <Input
                  id="edit-minPurchase"
                  type="number"
                  value={formData.minPurchase || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setFormData({ ...formData, minPurchase: value });
                    if (validationErrors.minPurchase) setValidationErrors({ ...validationErrors, minPurchase: undefined });
                  }}
                  min={0}
                  step="0.01"
                  placeholder="None"
                  className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.minPurchase ? 'border-destructive' : ''}`}
                />
              </div>
              <div>
                <Label htmlFor="edit-maxDiscount" className="text-[11px] font-bold">
                  {formData.type === 'percentage' ? 'Max discount ₹' : 'Usage limit'}
                </Label>
                {formData.type === 'percentage' ? (
                  <Input
                    id="edit-maxDiscount"
                    type="number"
                    value={formData.maxDiscount || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setFormData({ ...formData, maxDiscount: value });
                      if (validationErrors.maxDiscount) setValidationErrors({ ...validationErrors, maxDiscount: undefined });
                    }}
                    min={0}
                    step="0.01"
                    placeholder="No cap"
                    className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.maxDiscount ? 'border-destructive' : ''}`}
                  />
                ) : (
                  <Input
                    id="edit-maxDiscount"
                    type="number"
                    value={formData.usageLimit || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setFormData({ ...formData, usageLimit: value });
                      if (validationErrors.usageLimit) setValidationErrors({ ...validationErrors, usageLimit: undefined });
                    }}
                    min={1}
                    placeholder="Unlimited"
                    className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.usageLimit ? 'border-destructive' : ''}`}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <Label htmlFor="edit-usageLimit" className="text-[11px] font-bold">Usage limit</Label>
                <Input
                  id="edit-usageLimit"
                  type="number"
                  value={formData.usageLimit || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    setFormData({ ...formData, usageLimit: value });
                    if (validationErrors.usageLimit) setValidationErrors({ ...validationErrors, usageLimit: undefined });
                  }}
                  min={1}
                  placeholder="Unlimited uses"
                  className={`h-9 rounded-lg text-xs mt-1 ${validationErrors.usageLimit ? 'border-destructive' : ''}`}
                />
              </div>
            </div>

            <DiscountScopeFields formData={formData} setFormData={setFormData} allCategories={allCategories} />

            <div>
              <Label htmlFor="edit-description" className="text-[11px] font-bold">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                maxLength={500}
                className="text-xs rounded-lg mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                className="h-4 w-7"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label className="text-[11px] font-semibold">Active — available for use at checkout</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setEditDialog(false); resetForm(); }} className="h-9 rounded-xl text-[11px] font-extrabold">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={actionLoading} size="sm" className="h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold">
              {actionLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialog} onOpenChange={setInfoDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Discount Creation Guide
            </DialogTitle>
            <DialogDescription>Learn how to create effective discount coupons</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">How Discount Codes Work</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Customers enter the code during checkout</li>
                <li>Discount is automatically applied to their order total</li>
                <li>Discount can be combined with loyalty points redemption</li>
                <li>Usage is tracked and limited based on your settings</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Discount Types</h3>
              <div className="space-y-2">
                <div>
                  <strong>Percentage Discount:</strong>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground">
                    <li>Enter percentage (0-100), e.g., 25 for 25% off</li>
                    <li>Recommended: Set a max discount cap to limit large orders</li>
                    <li>Example: 20% off with max ₹50 = max ₹50 discount even if order is ₹500</li>
                  </ul>
                </div>
                <div>
                  <strong>Fixed Amount Discount:</strong>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground">
                    <li>Enter rupee amount, e.g., 200 for ₹200 off</li>
                    <li>Best for: Flat discounts regardless of order size</li>
                    <li>Example: $10 off any order over $50</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Best Practices</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Code Format:</strong> Use uppercase, memorable codes (e.g., SUMMER2024, NEWUSER10)</li>
                <li><strong>Minimum Purchase:</strong> Set minimum to encourage larger orders</li>
                <li><strong>Usage Limit:</strong> Limit usage for exclusivity (e.g., first 100 customers)</li>
                <li><strong>Expiry Date:</strong> Create urgency with limited-time offers</li>
                <li><strong>Max Discount (Percentage):</strong> Protect margins on large orders</li>
                <li><strong>Description:</strong> Add clear description for internal reference</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Example Scenarios</h3>
              <div className="space-y-2 bg-muted p-3 rounded-lg">
                <div>
                  <strong>Flash Sale:</strong> 30% off, ₹100 max, min ₹50, expires in 24 hours, unlimited uses
                </div>
                <div>
                  <strong>New Customer:</strong> $10 off, min $25, first 500 uses, expires in 30 days
                </div>
                <div>
                  <strong>VIP Exclusive:</strong> 25% off, no max, no min, unlimited uses, long expiry
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">💡 Tip</p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Test your discount code before launching campaigns. Deactivate codes when not in use to prevent unauthorized use.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setInfoDialog(false)}>Got it!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this discount? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
