'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shopLookApi, ShopLook } from '@/lib/api/shopLook';
import { productsApi } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import {
  Trash2,
  Loader2,
  Plus,
  Search,
  X,
  Sparkles,
  Image as ImageIcon,
  Edit,
  ExternalLink,
  ShoppingBag,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import ShopLookHeroUpload, { toDisplaySrc } from '@/components/admin/ShopLookHeroUpload';
import { ShopLookShowcase } from '@/components/store/ShopLookShowcase';

interface ProductOption {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images?: Array<string | { url: string; altText?: string }>;
  stock?: number;
}

const EMPTY_FORM = { title: '', description: '', imageUrl: '', bundlePrice: '' };
const FALLBACK_IMG = '/placeholder-product.jpg';

function imageOf(images?: ProductOption['images']): string {
  const first = images?.[0];
  if (!first) return FALLBACK_IMG;
  return typeof first === 'string' ? first : first.url || FALLBACK_IMG;
}

function toOption(p: any): ProductOption {
  return {
    _id: p._id,
    name: p.name,
    price: p.price ?? 0,
    compareAtPrice: p.compareAtPrice,
    images: p.images || [],
    stock: p.stock,
  };
}

export default function ShopLookClient() {
  const { toast } = useToast();
  const [looks, setLooks] = useState<ShopLook[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formActive, setFormActive] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [popularProducts, setPopularProducts] = useState<ProductOption[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<ShopLook | null>(null);
  const [previewTarget, setPreviewTarget] = useState<ShopLook | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setLooks(await shopLookApi.adminList());
    } catch (e: any) {
      toast({
        title: 'Load failed',
        description: e.response?.data?.error || e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Search products (min 2 chars, debounced)
  const fetchSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await productsApi.getProducts({ search: q, limit: 8, status: 'active' });
      setSearchResults((res.data || []).map(toOption));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchSearch]);

  // Real products to show before typing (the old hardcoded demo IDs could
  // never be saved — the backend requires real ObjectIds).
  useEffect(() => {
    if (!dialogOpen || popularProducts.length > 0) return;
    let cancelled = false;
    setPopularLoading(true);
    productsApi
      .getProducts({ limit: 6, status: 'active' })
      .then((res) => {
        if (!cancelled) setPopularProducts((res.data || []).map(toOption));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPopularLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, popularProducts.length]);

  // Close the search dropdown on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [searchOpen]);

  const resetDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormActive(true);
    setSelectedProducts([]);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const openCreate = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const openEdit = (look: ShopLook) => {
    setEditingId(look._id);
    setForm({
      title: look.title,
      description: look.description || '',
      imageUrl: look.imageUrl,
      bundlePrice: look.bundlePrice ? String(look.bundlePrice) : '',
    });
    setFormActive(look.isActive !== false);
    setSelectedProducts(
      (look.productIds || [])
        .filter(Boolean)
        .map((p: any) =>
          typeof p === 'object'
            ? toOption(p)
            : { _id: p, name: String(p), price: 0, images: [] }
        )
    );
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    setDialogOpen(true);
  };

  const addProduct = (p: ProductOption) => {
    if (selectedProducts.some((sp) => sp._id === p._id)) return;
    if (selectedProducts.length >= 8) {
      toast({ title: 'Up to 8 products', description: 'Remove one before adding another.', variant: 'destructive' });
      return;
    }
    setSelectedProducts((prev) => [...prev, p]);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const removeProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((sp) => sp._id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      toast({ title: 'Hero image required', description: 'Upload or paste an image first.', variant: 'destructive' });
      return;
    }
    if (selectedProducts.length === 0) {
      toast({ title: 'Select at least one product', variant: 'destructive' });
      return;
    }
    if (selectedProducts.length > 8) {
      toast({ title: 'Too many products', description: 'A look can include up to 8 products.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const bundle = form.bundlePrice.trim() ? Number(form.bundlePrice) : undefined;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim(),
        productIds: selectedProducts.map((p) => p._id),
        bundlePrice: bundle && bundle > 0 ? bundle : undefined,
        isActive: formActive,
      };
      if (editingId) await shopLookApi.update(editingId, payload);
      else await shopLookApi.create(payload);
      setDialogOpen(false);
      resetDialog();
      toast({ title: editingId ? 'Look updated' : 'Look created' });
      load();
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description:
          err.response?.data?.details?.[0] || err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deletingId) return;
    setDeletingId(deleteTarget._id);
    try {
      await shopLookApi.remove(deleteTarget._id);
      toast({ title: 'Look deleted' });
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast({
        title: 'Delete failed',
        description: e.response?.data?.error || e.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (look: ShopLook) => {
    if (togglingId) return;
    setTogglingId(look._id);
    try {
      await shopLookApi.update(look._id, {
        title: look.title,
        imageUrl: look.imageUrl,
        productIds: (look.productIds || []).filter(Boolean).map((p: any) => (typeof p === 'object' ? p._id : p)),
        bundlePrice: look.bundlePrice ?? undefined,
        description: look.description ?? undefined,
        isActive: !look.isActive,
      });
      setLooks((prev) => prev.map((l) => (l._id === look._id ? { ...l, isActive: !look.isActive } : l)));
    } catch (e: any) {
      toast({
        title: 'Update failed',
        description: e.response?.data?.error || e.message,
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Live pricing for the form preview (mirrors the storefront logic exactly).
  const preview = useMemo(() => {
    const itemsTotal = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
    const parsed = Number(form.bundlePrice);
    const bundlePrice = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    const bundle = bundlePrice && bundlePrice < itemsTotal ? bundlePrice : itemsTotal;
    const savings = itemsTotal - bundle;
    const savingsPct = itemsTotal > 0 ? Math.round((savings / itemsTotal) * 100) : 0;
    return { itemsTotal, bundlePrice, bundle, savings, savingsPct };
  }, [selectedProducts, form.bundlePrice]);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading looks…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Shop the Look Combinations</h1>
          <p className="text-sm text-muted-foreground">
            {looks.length} combos · active ones render in the homepage “Shop the Complete Look” section.
          </p>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New Look
        </Button>
      </div>

      {/* ------------------------------- Editor ------------------------------- */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && !submitting) {
            setDialogOpen(false);
            resetDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-5xl rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              {editingId ? 'Edit Look' : 'New Look'}
            </DialogTitle>
            <DialogDescription>
              Build the outfit bundle — the preview on the right is exactly how it appears on the storefront.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Left: fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="look-title">Title *</Label>
                <Input
                  id="look-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="THE URBAN STREETSET"
                  maxLength={200}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="look-description">Description</Label>
                <Textarea
                  id="look-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Black heavyweight oversized tee paired with beige relaxed cargo joggers."
                  maxLength={500}
                  rows={2}
                  className="rounded-xl resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1">{form.description.length}/500</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 items-start">
                <div>
                  <Label htmlFor="look-bundle">Bundle price ₹ (optional)</Label>
                  <Input
                    id="look-bundle"
                    type="number"
                    min={0}
                    step={1}
                    value={form.bundlePrice}
                    onChange={(e) => setForm({ ...form, bundlePrice: e.target.value })}
                    placeholder={preview.itemsTotal > 0 ? String(preview.itemsTotal) : '1699'}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Leave empty to charge the full item total.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      {formActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                      Show on storefront
                    </p>
                    <p className="text-[11px] text-muted-foreground">Hidden looks stay saved but aren’t published.</p>
                  </div>
                  <Switch checked={formActive} onCheckedChange={setFormActive} aria-label="Show on storefront" />
                </div>
              </div>

              <ShopLookHeroUpload
                value={form.imageUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
                disabled={submitting}
              />

              <details className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <summary className="cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                  Or paste an image URL instead
                </summary>
                <div className="pt-2">
                  <Input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-…"
                    className="h-10 rounded-lg text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Use this only for images already hosted elsewhere. Uploading is recommended.
                  </p>
                </div>
              </details>

              <div className="relative" ref={searchBoxRef}>
                <Label htmlFor="look-product-search">
                  Products in this look *{' '}
                  <span className="font-normal text-muted-foreground">
                    ({selectedProducts.length}/8 selected
                    {preview.itemsTotal > 0 ? ` · ${formatPrice(preview.itemsTotal)}` : ''})
                  </span>
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="look-product-search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search active products by name…"
                    className="pl-9 h-11 rounded-xl"
                  />
                </div>

                {searchOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl max-h-72 overflow-y-auto p-2 space-y-1">
                    {searchQuery.length >= 2 ? (
                      <>
                        {searchLoading && (
                          <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                          </div>
                        )}
                        {!searchLoading && searchResults.length === 0 && (
                          <div className="px-2 py-1 text-xs text-muted-foreground">No active products match “{searchQuery}”.</div>
                        )}
                        {searchResults.map((p) => (
                          <ProductRow key={p._id} product={p} onAdd={() => addProduct(p)} selected={selectedProducts.some((sp) => sp._id === p._id)} />
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                          Suggested products
                        </div>
                        {popularLoading && (
                          <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                          </div>
                        )}
                        {!popularLoading && popularProducts.length === 0 && (
                          <div className="px-2 py-1 text-xs text-muted-foreground">Type 2+ characters to search.</div>
                        )}
                        {popularProducts.map((p) => (
                          <ProductRow key={p._id} product={p} onAdd={() => addProduct(p)} selected={selectedProducts.some((sp) => sp._id === p._id)} />
                        ))}
                      </>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProducts.map((p) => (
                    <span
                      key={p._id}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-700 dark:text-amber-300"
                    >
                      {p.name}
                      <button
                        type="button"
                        onClick={() => removeProduct(p._id)}
                        className="hover:text-red-500"
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedProducts.length === 0 && (
                    <span className="text-[11px] text-muted-foreground">No products selected yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: live preview */}
            <aside className="space-y-2 self-start lg:sticky lg:top-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Live storefront preview
                </span>
                <Badge
                  variant={formActive ? 'default' : 'outline'}
                  className={`text-[9px] font-extrabold ${formActive ? 'bg-emerald-600 text-white' : ''}`}
                >
                  {formActive ? 'PUBLISHED' : 'HIDDEN'}
                </Badge>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-xl">
                <div className="relative aspect-[4/3] bg-slate-800">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toDisplaySrc(form.imageUrl)}
                      alt="Look hero"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-[11px] font-semibold">Hero image preview</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  {preview.savings > 0 && (
                    <div className="absolute left-3 top-3">
                      <Badge className="bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-950">
                        SAVE {formatPrice(preview.savings)} · {preview.savingsPct}% OFF
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="truncate text-lg font-extrabold tracking-tight">
                      {form.title.trim() || 'Your look title'}
                    </h3>
                    <p className="line-clamp-2 text-[11px] text-slate-300">
                      {form.description.trim() || 'Add a short description of the outfit.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Tag className="h-3.5 w-3.5 text-amber-400" />
                    Items included ({selectedProducts.length})
                  </div>

                  {selectedProducts.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-700 p-3 text-center text-[11px] text-slate-500">
                      Select products to see the price breakdown.
                    </p>
                  ) : (
                    <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                      {selectedProducts.map((p) => (
                        <div key={p._id} className="flex items-center gap-2 border-b border-slate-800/70 py-1.5 last:border-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageOf(p.images)}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-md bg-slate-800 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-slate-200">{p.name}</p>
                            {p.stock === 0 && <p className="text-[9px] font-bold text-red-400">Out of stock</p>}
                          </div>
                          <span className="text-[11px] font-bold">{formatPrice(p.price || 0)}</span>
                          <button
                            type="button"
                            onClick={() => removeProduct(p._id)}
                            className="text-slate-500 hover:text-red-400"
                            aria-label={`Remove ${p.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">Bundle price</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-amber-400">
                          {preview.itemsTotal > 0 ? formatPrice(preview.bundle) : '—'}
                        </span>
                        {preview.savings > 0 && (
                          <span className="text-xs text-slate-500 line-through">{formatPrice(preview.itemsTotal)}</span>
                        )}
                      </div>
                    </div>
                    {preview.savings > 0 ? (
                      <p className="mt-1 text-[11px] font-semibold text-emerald-400">
                        Customer saves {formatPrice(preview.savings)} ({preview.savingsPct}% off the {formatPrice(preview.itemsTotal)} item total).
                      </p>
                    ) : preview.bundlePrice && preview.itemsTotal > 0 ? (
                      <p className="mt-1 text-[11px] font-semibold text-amber-300">
                        Bundle price is not below the item total, so no discount badge will show.
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {preview.itemsTotal > 0
                          ? `Set a bundle price under ${formatPrice(preview.itemsTotal)} to show savings.`
                          : 'Pick products to calculate pricing.'}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    disabled
                    className="w-full rounded-xl bg-amber-500 py-5 text-xs font-bold text-slate-950 opacity-90"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" /> ADD ALL TO CART
                  </Button>
                  <p className="text-center text-[9px] text-slate-500">
                    Preview only · matches the homepage Shop the Look section
                  </p>
                </div>
              </div>
            </aside>

            {/* Footer */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-800 lg:col-span-2">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md transition-all hover:brightness-110"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update Look' : 'Create Look'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetDialog();
                }}
                disabled={submitting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'} ·{' '}
                {preview.savings > 0 ? `${preview.savingsPct}% bundle saving` : 'no bundle discount'}
              </span>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------------------- Saved looks ---------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {looks.map((look) => {
          const items = ((look.productIds || []).filter(Boolean) as any[]);
          const total = items.reduce((sum, p) => sum + (p.price || 0), 0);
          const bundle = look.bundlePrice && look.bundlePrice < total ? look.bundlePrice : total;
          const savings = total - bundle;

          return (
            <Card
              key={look._id}
              className="group overflow-hidden rounded-2xl border-slate-200 bg-white shadow-md transition-all hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div
                className="relative h-44 cursor-pointer bg-gradient-to-br from-slate-900 to-amber-950"
                onClick={() => setPreviewTarget(look)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPreviewTarget(look);
                  }
                }}
                aria-label={`Preview ${look.title}`}
              >
                {look.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={toDisplaySrc(look.imageUrl)}
                    alt={look.title}
                    className="h-full w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl font-black text-white/20">LOOK</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute left-0 right-0 bottom-0 p-4">
                  <h3 className="truncate text-base font-extrabold tracking-tight text-white">{look.title}</h3>
                  <p className="truncate text-[11px] font-semibold text-amber-300">
                    {items.length} product{items.length === 1 ? '' : 's'}
                    {savings > 0 ? ` · save ${formatPrice(savings)}` : ''}
                  </p>
                </div>
                {savings > 0 && (
                  <div className="absolute left-2 top-2">
                    <Badge className="bg-amber-500 text-[9px] font-extrabold text-slate-950">
                      {Math.round((savings / total) * 100)}% OFF
                    </Badge>
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge
                    variant={look.isActive ? 'default' : 'outline'}
                    className="border-white/30 bg-white/20 text-[10px] font-extrabold text-white backdrop-blur-sm"
                  >
                    {look.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-slate-900 shadow-lg">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </span>
                </div>
              </div>

              <CardContent className="space-y-3 p-4">
                <p className="truncate text-xs text-muted-foreground">{look.description || 'No description.'}</p>

                <div className="space-y-1">
                  {items.slice(0, 3).map((p) => (
                    <div key={p._id} className="flex items-center gap-2 text-[11px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageOf(p.images)} alt="" className="h-6 w-6 shrink-0 rounded bg-slate-100 object-cover dark:bg-slate-800" />
                      <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                      <span className="font-bold">{formatPrice(p.price || 0)}</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-[10px] font-semibold text-muted-foreground">+{items.length - 3} more</p>
                  )}
                  {items.length === 0 && <p className="text-[11px] text-muted-foreground">No products linked.</p>}
                </div>

                <div className="flex items-end justify-between border-t pt-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bundle price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">{formatPrice(bundle)}</span>
                      {savings > 0 && <span className="text-[11px] text-muted-foreground line-through">{formatPrice(total)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {togglingId === look._id && <Loader2 className="h-3 w-3 animate-spin" />}
                    <Switch
                      checked={look.isActive}
                      disabled={togglingId === look._id}
                      onCheckedChange={() => toggleActive(look)}
                      aria-label={look.isActive ? 'Hide look' : 'Publish look'}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl text-[11px] font-extrabold shadow-sm hover:bg-amber-500/10"
                    onClick={() => openEdit(look)}
                  >
                    <Edit className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-[11px] font-extrabold"
                    onClick={() => setPreviewTarget(look)}
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-[11px] font-extrabold text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(look)}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {looks.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-amber-500" />
          <p className="mt-2 text-sm font-bold">No combos yet</p>
          <p className="text-xs text-muted-foreground">
            The homepage shows a static fallback until you create your first look.
          </p>
          <Button onClick={openCreate} size="sm" className="mt-3 bg-amber-500 font-extrabold text-slate-950 hover:bg-amber-600">
            <Plus className="mr-1.5 h-4 w-4" /> Create your first look
          </Button>
        </div>
      )}

      {/* Storefront preview modal */}
      <Dialog
        open={!!previewTarget}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950 sm:max-w-5xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
              <Eye className="h-4 w-4 text-amber-500" /> Storefront preview
            </DialogTitle>
            <DialogDescription>
              This is exactly how{' '}
              <span className="font-semibold text-foreground">
                {previewTarget?.title ? `“${previewTarget.title}”` : 'this look'}
              </span>{' '}
              appears in the homepage Shop the Look section.
            </DialogDescription>
          </DialogHeader>

          {previewTarget && (
            <ShopLookShowcase
              look={previewTarget}
              linkProducts={false}
              onAddAll={() =>
                toast({
                  title: 'Preview only',
                  description: 'Customers add this look to their cart from the storefront.',
                })
              }
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <p className="text-[11px] text-muted-foreground">
              {previewTarget?.isActive
                ? 'Published — visible on the homepage now.'
                : 'Hidden — not visible on the homepage yet.'}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl text-[11px] font-extrabold">
                <a href="/#shop-the-look" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open storefront
                </a>
              </Button>
              <Button size="sm" onClick={() => setPreviewTarget(null)} className="rounded-xl text-[11px] font-extrabold">
                Close preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the combo from the homepage Shop the Look section. The products themselves are not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** A search / suggested product row with price and a one-click add. */
function ProductRow({
  product,
  onAdd,
  selected,
}: {
  product: ProductOption;
  onAdd: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={selected}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-amber-500/10 disabled:cursor-default disabled:opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageOf(product.images)}
        alt=""
        className="h-8 w-8 shrink-0 rounded-md bg-slate-100 object-cover dark:bg-slate-800"
      />
      <div className="min-w-0">
        <div className="truncate font-bold">{product.name}</div>
        <div className="text-[10px] text-muted-foreground">
          {formatPrice(product.price || 0)}
          {product.stock === 0 ? ' · out of stock' : ''}
        </div>
      </div>
      {selected ? (
        <span className="ml-auto shrink-0 text-[10px] font-bold text-emerald-600">Added</span>
      ) : (
        <Plus className="ml-auto h-3 w-3 shrink-0 text-amber-500" />
      )}
    </button>
  );
}
