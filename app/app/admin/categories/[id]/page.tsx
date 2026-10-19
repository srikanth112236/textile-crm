'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { categoriesApi } from '@/lib/api/categories';
import type { ICategory } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function CategoryFormPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const isEdit = categoryId && categoryId !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [formData, setFormData] = useState<Partial<ICategory>>({
    name: '',
    slug: '',
    description: '',
    parent: undefined,
    status: 'active',
  });

  useEffect(() => {
    if (isEdit) {
      fetchCategory();
    }
    fetchCategories();
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getCategories();
      setCategories(response.data);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await categoriesApi.getCategory(categoryId);
      setFormData({
        name: response.data.name,
        slug: response.data.slug,
        description: response.data.description || '',
        parent: typeof response.data.parent === 'object' ? response.data.parent._id : response.data.parent,
        status: response.data.status,
      });
    } catch (error: any) {
      console.error('Failed to fetch category:', error);
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Generate slug from name if not provided
      if (!formData.slug && formData.name) {
        formData.slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      if (isEdit) {
        await categoriesApi.updateCategory(categoryId, formData);
      } else {
        await categoriesApi.createCategory(formData);
      }
      router.push('/admin/categories');
    } catch (error: any) {
      console.error('Failed to save category:', error);
      alert(error.response?.data?.error || 'Failed to save category. Please check the form and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading category...</div>;
  }

  // Flatten categories for dropdown (excluding current category if editing)
  const flatCategories: ICategory[] = [];
  const flattenCategories = (cats: ICategory[], level = 0) => {
    cats.forEach((cat) => {
      if (isEdit && cat._id === categoryId) return; // Skip self
      flatCategories.push({ ...cat, name: `${'  '.repeat(level)}${cat.name}` } as ICategory);
      if (cat.children && cat.children.length > 0) {
        flattenCategories(cat.children, level + 1);
      }
    });
  };
  flattenCategories(categories);

  return (
    <div>
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Edit Category' : 'Create Category'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              // Auto-generate slug if not manually edited
              if (!isEdit || !formData.slug) {
                const slug = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '');
                setFormData((prev) => ({ ...prev, slug }));
              }
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '-') })}
            required
            pattern="[a-z0-9\-]+"
          />
          <p className="text-sm text-muted-foreground">URL-friendly identifier (e.g., "electronics-mobile")</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Category (optional)</Label>
            <select
              id="parent"
              value={typeof formData.parent === 'object' ? formData.parent._id : formData.parent || ''}
              onChange={(e) => setFormData({ ...formData, parent: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">None (Root Category)</option>
              {flatCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

