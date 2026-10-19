'use client';

import { useEffect, useState, useCallback } from 'react';
import { shopLookApi, ShopLook } from '@/lib/api/shopLook';
import { productsApi, ProductFilters } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { Trash2, Loader2, Plus, Search, X, Sparkles, Image as ImageIcon, Edit } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

interface ProductOption {
  _id: string; name: string; price: number;
  images?: Array<string | { url: string; altText?: string }>;
}

const EMPTY_FORM = { title: '', description: '', imageUrl: '', productIds: '', bundlePrice: '' };

export default function ShopLookClient() {
  const { toast } = useToast();
  const [looks, setLooks] = useState<ShopLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);
  const [heroFile, setHeroFile] = useState<File | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); setLooks(await shopLookApi.adminList()); } catch (e: any) { toast({ title: 'Load failed', description: e.response?.data?.error || e.message, variant: 'destructive' }); } finally { setLoading(false); }
  };

  const fetchSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try { const res = await productsApi.getProducts({ search: q, limit: 8, status: 'active' }); setSearchResults((res.data || []).map((p: any) => ({ _id: p._id, name: p.name, price: p.price, images: p.images }))); } catch { setSearchResults([]); } finally { setSearchLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => fetchSearch(searchQuery), 250); return () => clearTimeout(timer); }, [searchQuery, fetchSearch]);

  const addProduct = (p: ProductOption) => {
    if (selectedProducts.find((sp) => sp._id === p._id)) return;
    setSelectedProducts((prev) => [...prev, p]);
    setForm({ ...form, productIds: [...selectedProducts.map((sp) => sp._id), p._id].join(', ') });
  };

  const removeProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((sp) => sp._id !== id));
    setForm({ ...form, productIds: selectedProducts.filter((sp) => sp._id !== id).map((sp) => sp._id).join(', ') });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroFile(file);
      const url = URL.createObjectURL(file);
      setForm({ ...form, imageUrl: url });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSelectedProducts([]);
    setHeroFile(null);
    setDialogOpen(true);
  };

  const openEdit = (look: ShopLook) => {
    setEditingId(look._id);
    const idsStr = look.productIds.map((p: any) => (typeof p === 'object' ? p._id : p)).join(', ');
    setForm({ title: look.title, description: look.description || '', imageUrl: look.imageUrl, productIds: idsStr, bundlePrice: look.bundlePrice ? String(look.bundlePrice) : '' });
    setSelectedProducts(look.productIds.map((p: any) => ({ _id: typeof p === 'object' ? p._id : p, name: typeof p === 'object' ? p.name : p, price: typeof p === 'object' ? (p.price || 0) : 0, images: typeof p === 'object' ? p.images : [] })));
    setHeroFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = selectedProducts.map((p) => p._id);
    if (ids.length === 0) { toast({ title: 'Select at least one product', variant: 'destructive' }); return; }
    try {
      const payload = { title: form.title, description: form.description || undefined, imageUrl: form.imageUrl, productIds: ids, bundlePrice: form.bundlePrice ? Number(form.bundlePrice) : undefined, isActive: true };
      if (editingId) await shopLookApi.update(editingId, payload); else await shopLookApi.create(payload);
      setForm(EMPTY_FORM); setEditingId(null); setSelectedProducts([]); setHeroFile(null); setDialogOpen(false);
      toast({ title: editingId ? 'Look updated' : 'Look created' }); load();
    } catch (err: any) { toast({ title: 'Save failed', description: err.response?.data?.error || err.message, variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => { if (!confirm('Delete this look?')) return; try { await shopLookApi.remove(id); toast({ title: 'Look deleted' }); load(); } catch (e: any) { toast({ title: 'Delete failed', description: e.response?.data?.error || e.message, variant: 'destructive' }); } };
  const toggleActive = async (look: ShopLook) => { try { await shopLookApi.update(look._id, { title: look.title, imageUrl: look.imageUrl, productIds: look.productIds.map((p: any) => (typeof p === 'object' ? p._id : p)), bundlePrice: look.bundlePrice ?? undefined, description: look.description ?? undefined, isActive: !look.isActive }); load(); } catch (e: any) { toast({ title: 'Update failed', description: e.response?.data?.error || e.message, variant: 'destructive' }); } };

  if (loading) return <div className="p-8 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading looks…</div>;

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Shop the Look Combinations</h1><p className="text-sm text-muted-foreground">{looks.length} combos · active ones render with ADD ALL TO CART.</p></div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-md"><Plus className="h-4 w-4 mr-1.5" /> New Look</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingId(null); setForm(EMPTY_FORM); setSelectedProducts([]); setHeroFile(null); } }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">{editingId ? 'Edit Look' : 'New Look'}</DialogTitle><DialogDescription>Find product IDs from Admin → Products. Search below for quick multi-select.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="THE URBAN STREETSET" required className="h-11 rounded-xl" /></div>
            <div><Label>Bundle price ₹ (optional)</Label><Input type="number" value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: e.target.value })} placeholder="1699" className="h-11 rounded-xl" /></div>
            <div className="sm:col-span-2"><Label>Hero image URL *</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://images.unsplash.com/photo-…" required className="h-11 rounded-xl" /></div>
            <div className="sm:col-span-2">
              <Label>Upload hero image</Label>
              <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setHeroFile(file); }} className="h-11 rounded-xl text-xs" />
              {heroFile && <p className="text-[11px] text-emerald-600 font-bold mt-1">Uploaded: {heroFile.name}</p>}
            </div>

            <div className="sm:col-span-2 relative">
              <Label>Search & Select Products *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder="Type 2+ chars to search products…" className="pl-9 h-11 rounded-xl" />
                {searchOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl max-h-72 overflow-y-auto p-2 space-y-1">
                    {searchLoading && <div className="text-xs text-muted-foreground px-2 py-1">Searching…</div>}
                    {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && <div className="text-xs text-muted-foreground px-2 py-1">No products found.</div>}
                    {!searchLoading && searchQuery.length < 2 && <div className="text-xs text-muted-foreground px-2 py-1">Type 2+ characters…</div>}
                    {!searchLoading && searchQuery.length === 0 && (
                      <div className="text-xs text-muted-foreground px-2 py-2 space-y-1">
                        <div className="font-bold">Popular products:</div>
                        {[
                          { _id: 'demo-1', name: 'Heavyweight Oversized Tee — Black', price: 1299, images: [{ url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80' }] },
                          { _id: 'demo-2', name: 'Casual Linen Shirt — Beige', price: 1499, images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80' }] },
                          { _id: 'demo-3', name: 'Cargo Joggers — Olive', price: 1199, images: [{ url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=200&q=80' }] },
                          { _id: 'demo-4', name: 'Formal Trousers — Navy', price: 1599, images: [{ url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=200&q=80' }] },
                          { _id: 'demo-5', name: 'Ethnic Kurta — White', price: 1399, images: [{ url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=200&q=80' }] },
                        ].map((demo) => (
                          <button type="button" key={demo._id} onClick={() => addProduct(demo)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-500/10 text-xs transition-colors">
                            <div className="w-7 h-7 rounded-md overflow-hidden bg-slate-100 shrink-0"><Image src={demo.images?.[0]?.url || ''} alt={demo.name} width={28} height={28} className="object-cover" /></div>
                            <span className="truncate font-medium">{demo.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{formatPrice(demo.price)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.map((p) => (
                      <button type="button" key={p._id} onClick={() => { addProduct(p); setSearchQuery(''); setSearchOpen(false); }} className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-amber-500/10 transition-colors text-xs">
                        <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 shrink-0"><Image src={(p.images && p.images.length > 0 ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url) : '/placeholder-product.jpg')} alt={p.name} width={32} height={32} className="object-cover" /></div>
                        <div className="min-w-0">
                          <div className="font-bold truncate">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">{formatPrice(p.price)}</div>
                        </div>
                        <Plus className="h-3 w-3 ml-auto text-amber-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Selected product tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProducts.map((p) => (
                  <span key={p._id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-700">
                    {p.name}
                    <button type="button" onClick={() => removeProduct(p._id)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {selectedProducts.length === 0 && <span className="text-[11px] text-muted-foreground">No products selected.</span>}
              </div>
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-2">
              <Button type="submit" size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-extrabold rounded-xl shadow-md transition-all">{editingId ? 'Update Look' : 'Create Look'}</Button>
              {editingId && <Button type="button" size="sm" variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); setForm(EMPTY_FORM); setSelectedProducts([]); setHeroFile(null); }} className="rounded-xl">Cancel</Button>}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Active Looks */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {looks.map((look) => (
          <Card key={look._id} className="rounded-2xl shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-2xl transition-all group">
            <div className="relative h-48 bg-gradient-to-br from-slate-900 to-amber-950">
              {look.imageUrl ? <Image src={look.imageUrl} alt={look.title} fill className="object-cover opacity-95 group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-white/20 font-black text-6xl">LOOK</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-base font-extrabold tracking-tight text-white truncate">{look.title}</h3>
                <p className="text-[11px] text-amber-300 font-semibold truncate">{look.productIds.length} products{look.bundlePrice ? ` · bundle ${formatPrice(look.bundlePrice)}` : ''}</p>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant={look.isActive ? 'default' : 'outline'} className="text-[10px] font-extrabold bg-white/20 backdrop-blur-sm text-white border-white/30">{look.isActive ? 'Active' : 'Hidden'}</Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground truncate">{look.description || 'No description.'}</p>
              <div className="flex flex-wrap gap-1.5">
                {look.productIds.map((p: any) => (
                  <span key={p._id || p} className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium truncate max-w-[100px]">{p.name || p}</span>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="text-[11px] font-extrabold rounded-xl shadow-sm hover:bg-amber-500/10" onClick={() => {
                  setEditingId(look._id);
                  const productIdsStr = look.productIds.map((p: any) => p._id || p).join(', ');
                  setForm({ title: look.title, description: look.description || '', imageUrl: look.imageUrl, productIds: productIdsStr, bundlePrice: look.bundlePrice ? String(look.bundlePrice) : '' });
                  setSelectedProducts(look.productIds.map((p: any) => ({ _id: p._id || p, name: p.name || p, price: p.price || 0, images: p.images || [] })));
                  setHeroFile(null);
                  setDialogOpen(true);
                }}>
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive text-[11px] font-extrabold rounded-xl hover:bg-destructive/10" onClick={() => handleDelete(look._id)}>
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {looks.length === 0 && <p className="text-sm text-muted-foreground">No combos yet — homepage shows static fallback until you create one.</p>}
    </div>
  );
}
