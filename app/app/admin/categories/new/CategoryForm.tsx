'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { categoriesApi } from '@/lib/api/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, ChevronDown, FolderTree, Sparkles, Check } from 'lucide-react';
import CategoryImageUpload from '@/components/admin/CategoryImageUpload';
import type { ICategory } from '@/lib/api/types';

interface FlatCategory {
  _id: string;
  name: string;
  slug: string;
  depth: number;
}

function flattenTree(list: ICategory[], depth = 0, out: FlatCategory[] = []): FlatCategory[] {
  for (const cat of list) {
    out.push({ _id: cat._id, name: cat.name, slug: cat.slug, depth });
    if (cat.children && cat.children.length > 0) {
      flattenTree(cat.children, depth + 1, out);
    }
  }
  return out;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoryForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchParent, setSearchParent] = useState('');
  const [openSelect, setOpenSelect] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
    status: 'active' as 'active' | 'inactive',
    image: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesApi.getCategories();
        // The API returns { success, data: tree[] }
        setCategories(Array.isArray(res?.data) ? res.data : []);
      } catch (error: any) {
        setCategories([]);
        toast({
          title: 'Could not load parent categories',
          description: error?.response?.data?.error || error?.message || 'Please refresh the page and try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  const flatCategories = useMemo(() => flattenTree(categories), [categories]);
  const totalCategories = flatCategories.length;

  const parentOptions = useMemo(() => {
    const q = searchParent.trim().toLowerCase();
    if (!q) return flatCategories;
    return flatCategories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [flatCategories, searchParent]);

  const selectedParent = flatCategories.find((c) => c._id === form.parent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const slug = slugify(form.slug || form.name);

    if (!name) {
      toast({ title: 'Name is required', description: 'Give the category a name before saving.', variant: 'destructive' });
      return;
    }
    if (!slug) {
      toast({
        title: 'Invalid slug',
        description: 'Use letters, numbers and hyphens only (e.g. "mens-shirts").',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await categoriesApi.createCategory({
        name,
        slug,
        description: form.description.trim(),
        parent: form.parent || null,
        status: form.status,
        image: form.image || undefined,
      } as any);

      toast({ title: 'Category created', description: `"${name}" has been added to the catalog.` });
      router.push('/admin/categories');
      router.refresh();
    } catch (err: any) {
      const data = err?.response?.data;
      const description = data?.details?.length
        ? data.details.join(' • ')
        : data?.error || err?.message || 'Could not create the category.';
      toast({ title: 'Failed to create category', description, variant: 'destructive' });
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
              <Input
                id="name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: slugEdited ? prev.slug : slugify(name),
                  }));
                }}
                placeholder="T-Shirts"
                required
                className="h-11 rounded-xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <div>
              <Label htmlFor="slug" className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm({ ...form, slug: slugify(e.target.value) });
                }}
                placeholder="t-shirts"
                required
                className="h-11 rounded-xl text-sm font-mono shadow-sm focus:ring-2 focus:ring-amber-500/30"
              />
              <p className="mt-1 text-[11px] text-slate-500">Used in the storefront URL.</p>
            </div>
          </div>

          <div>
            <Label className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Parent Category (optional)</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenSelect(!openSelect)}
                disabled={loadingCategories}
                className="w-full text-left flex items-center justify-between h-11 rounded-xl border border-slate-300 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-950 shadow-sm hover:border-amber-400 transition-colors disabled:opacity-60"
              >
                <span className="truncate font-medium">
                  {loadingCategories
                    ? 'Loading categories…'
                    : selectedParent
                      ? `${'— '.repeat(selectedParent.depth)}${selectedParent.name}`
                      : `Select parent category… (${totalCategories} available)`}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${openSelect ? 'rotate-180' : ''}`} />
              </button>

              {openSelect && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl max-h-72 overflow-y-auto p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={searchParent}
                      onChange={(e) => setSearchParent(e.target.value)}
                      placeholder="Search categories…"
                      className="h-8 pl-8 text-xs rounded-lg"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => { setForm({ ...form, parent: '' }); setOpenSelect(false); }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/10 text-xs font-medium transition-colors flex items-center gap-2 ${!form.parent ? 'bg-amber-500/10' : ''}`}
                  >
                    {!form.parent ? <Check className="h-3.5 w-3.5 text-amber-600" /> : <span className="w-3.5" />}
                    — No parent (top-level category)
                  </button>

                  {parentOptions.length === 0 && (
                    <p className="px-2.5 py-3 text-xs text-slate-500">
                      {loadingCategories ? 'Loading…' : searchParent ? 'No categories match your search.' : 'No categories yet — this will be your first.'}
                    </p>
                  )}

                  {parentOptions.map((cat) => (
                    <button
                      type="button"
                      key={cat._id}
                      onClick={() => { setForm({ ...form, parent: cat._id }); setOpenSelect(false); setSearchParent(''); }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/10 text-xs font-medium transition-colors flex items-center gap-2 ${form.parent === cat._id ? 'bg-amber-500/10' : ''}`}
                      style={{ paddingLeft: `${0.625 + cat.depth * 0.9}rem` }}
                    >
                      {form.parent === cat._id ? (
                        <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <span className={`shrink-0 ${cat.depth === 0 ? 'text-amber-500' : 'text-slate-400'}`}>●</span>
                      )}
                      <span className="truncate">{cat.name}</span>
                      <Badge variant="outline" className="text-[9px] ml-auto shrink-0">{cat.slug}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="desc" className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Description</Label>
            <textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Handcrafted linen shirts for daily wear…"
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="status" className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 flex items-end pb-2">
              Inactive categories stay hidden from the storefront navigation.
            </div>
          </div>

          <CategoryImageUpload
            value={form.image}
            onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
            disabled={loading}
            label="Category Image"
          />

          <div className="flex gap-2 pt-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-extrabold rounded-xl shadow-md transition-all"
            >
              <Sparkles className="h-4 w-4 mr-2" /> {loading ? 'Saving…' : 'Create Category'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/categories')} className="rounded-xl">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
