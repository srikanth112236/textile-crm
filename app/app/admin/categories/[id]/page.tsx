'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { categoriesApi } from '@/lib/api/categories';
import type { ICategory } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import CategoryImageUpload from '@/components/admin/CategoryImageUpload';

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

function collectDescendantIds(list: ICategory[], targetId: string): Set<string> {
  const ids = new Set<string>();

  const collect = (node: ICategory) => {
    for (const child of node.children || []) {
      ids.add(child._id);
      collect(child);
    }
  };

  const walk = (cats: ICategory[]) => {
    for (const cat of cats) {
      if (cat._id === targetId) collect(cat);
      if (cat.children) walk(cat.children);
    }
  };

  walk(list);
  return ids;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoryFormPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const isEdit = Boolean(categoryId) && categoryId !== 'new';
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
    status: 'active' as 'active' | 'inactive',
    image: '',
  });

  useEffect(() => {
    if (isEdit) fetchCategory();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getCategories();
      setCategories(Array.isArray(response?.data) ? response.data : []);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      toast({
        title: 'Could not load categories',
        description: error?.response?.data?.error || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await categoriesApi.getCategory(categoryId);
      const data = response.data;
      const parent = data.parent;
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        parent: typeof parent === 'object' && parent ? parent._id : parent || '',
        status: (data.status as 'active' | 'inactive') || 'active',
        image: data.image || '',
      });
      setSlugEdited(Boolean(data.slug));
    } catch (error: any) {
      console.error('Failed to fetch category:', error);
      toast({
        title: 'Category not found',
        description: 'Returning to the categories list.',
        variant: 'destructive',
      });
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const flatCategories = useMemo(() => flattenTree(categories), [categories]);

  // A category cannot be its own parent, nor nest under one of its descendants.
  const parentOptions = useMemo(() => {
    if (!isEdit) return flatCategories;
    const blocked = collectDescendantIds(categories, categoryId);
    return flatCategories.filter((cat) => cat._id !== categoryId && !blocked.has(cat._id));
  }, [categories, categoryId, flatCategories, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name.trim();
    const slug = slugify(formData.slug || formData.name);

    if (!name) {
      toast({ title: 'Name is required', variant: 'destructive' });
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

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        description: formData.description.trim(),
        parent: formData.parent || null,
        status: formData.status,
        image: formData.image || '',
      };

      if (isEdit) {
        await categoriesApi.updateCategory(categoryId, payload as any);
        toast({ title: 'Category updated', description: `"${name}" has been saved.` });
      } else {
        await categoriesApi.createCategory(payload as any);
        toast({ title: 'Category created', description: `"${name}" has been added.` });
      }

      router.push('/admin/categories');
      router.refresh();
    } catch (error: any) {
      const data = error?.response?.data;
      const description = data?.details?.length
        ? data.details.join(' • ')
        : data?.error || error?.message || 'Failed to save category. Please check the form and try again.';
      toast({ title: 'Failed to save category', description, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading category…</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.push('/admin/categories')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to categories
      </Button>

      <h1 className="text-2xl font-extrabold tracking-tight mb-6">{isEdit ? 'Edit Category' : 'Create Category'}</h1>

      <Card className="rounded-2xl shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">{formData.name || 'Untitled category'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: slugEdited ? prev.slug : slugify(name),
                    }));
                  }}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setFormData({ ...formData, slug: slugify(e.target.value) });
                  }}
                  required
                  className="h-11 rounded-xl font-mono text-sm"
                />
                <p className="text-[11px] text-slate-500">URL-friendly identifier (e.g. &quot;mens-shirts&quot;).</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Short description shown on category pages…"
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="parent" className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Parent Category</Label>
                <select
                  id="parent"
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">None (top-level category)</option>
                  {parentOptions.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {`${'— '.repeat(cat.depth)}${cat.name}`}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  {parentOptions.length === 0
                    ? 'No categories available as a parent yet.'
                    : `${parentOptions.length} existing categor${parentOptions.length === 1 ? 'y' : 'ies'} available.`}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="text-[11px] text-slate-500">Inactive categories are hidden from the storefront.</p>
              </div>
            </div>

            <CategoryImageUpload
              value={formData.image}
              onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
              disabled={saving}
              label="Category Image"
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="rounded-xl font-bold">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving…' : isEdit ? 'Update Category' : 'Create Category'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/categories')} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
