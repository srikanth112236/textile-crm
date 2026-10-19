'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { categoriesApi } from '@/lib/api/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Check, ChevronDown, FolderTree, Sparkles } from 'lucide-react';
import type { ICategory } from '@/lib/api/types';

export default function CategoryForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [searchParent, setSearchParent] = useState('');
  const [openSelect, setOpenSelect] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parent: '', status: 'active' as 'active' | 'inactive', imageUrl: '' });

  useEffect(() => { (async () => { try { const res = await categoriesApi.getCategories(); setCategories((res as any)?.categories || (Array.isArray(res) ? res : []) || []); } catch { setCategories([]); } })(); }, []);

  const parentOptions = categories.filter((c) => !c.parent || (typeof c.parent === 'string' ? c.parent === '' : true)).filter((c) => c.name.toLowerCase().includes(searchParent.toLowerCase()) || c.slug.includes(searchParent.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await categoriesApi.createCategory({ ...form, parent: form.parent || undefined });
      toast({ title: 'Category created', description: 'New category added to catalog.' });
      router.push('/admin/categories');
    } catch (err: any) {
      toast({ title: 'Failed', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950">
            <FolderTree className="w-4 h-4" />
          </span>
          <CardTitle className="text-xl font-extrabold tracking-tight">New Category</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => { const n = e.target.value; setForm({ ...form, name: n, slug: n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }); }} placeholder="T-Shirts" required className="h-11 rounded-xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-amber-500/30" />
            </div>
            <div>
              <Label htmlFor="slug" className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="t-shirts" className="h-11 rounded-xl text-sm font-mono shadow-sm focus:ring-2 focus:ring-amber-500/30" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Parent Category (optional)</Label>
            <div className="relative">
              <button type="button" onClick={() => setOpenSelect(!openSelect)} className="w-full text-left flex items-center justify-between h-11 rounded-xl border border-slate-300 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-950 shadow-sm hover:border-amber-400 transition-colors">
                <span className="truncate font-medium">{form.parent ? categories.find((c) => c._id === form.parent)?.name || 'Select parent…' : 'Select parent category…'}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSelect ? 'rotate-180' : ''}`} />
              </button>
              {openSelect && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl max-h-72 overflow-y-auto p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={searchParent} onChange={(e) => setSearchParent(e.target.value)} placeholder="Search parent categories…" className="h-8 pl-8 text-xs rounded-lg" />
                  </div>
                  <button type="button" onClick={() => { setForm({ ...form, parent: '' }); setOpenSelect(false); }} className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 text-xs font-medium transition-colors">
                    — No parent (top-level)
                  </button>
                  {parentOptions.map((cat) => (
                    <button type="button" key={cat._id} onClick={() => { setForm({ ...form, parent: cat._id }); setOpenSelect(false); }} className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 text-xs font-medium transition-colors flex items-center gap-2">
                      <span className="text-amber-500">●</span>
                      <span className="truncate">{cat.name}</span>
                      <Badge variant="outline" className="text-[9px] ml-auto">{cat.slug}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="desc" className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Description</Label>
            <Input id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Handcrafted linen shirts for daily wear…" className="h-11 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-amber-500/30" />
          </div>

          <div>
            <Label htmlFor="imageUrl" className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Hero Image URL</Label>
            <Input id="imageUrl" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://images.unsplash.com/photo-…" className="h-11 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-amber-500/30" />
          </div>

          <div className="flex gap-2 pt-3">
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-extrabold rounded-xl shadow-md transition-all">
              <Sparkles className="h-4 w-4 mr-2" /> {loading ? 'Saving…' : 'Create Category'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
