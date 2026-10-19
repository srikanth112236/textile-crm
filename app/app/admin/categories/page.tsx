'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { categoriesApi } from '@/lib/api/categories';
import type { ICategory } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';
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

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: ICategory | null }>({
    open: false,
    category: null,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesApi.getCategories();
      setCategories(response.data);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      await categoriesApi.deleteCategory(deleteDialog.category._id);
      setDeleteDialog({ open: false, category: null });
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const renderCategoryTree = (categoryList: ICategory[], parentId: string | null = null, level: number = 0): JSX.Element[] => {
    const children = categoryList.filter(
      (cat) => (parentId === null && !cat.parent) || (cat.parent && typeof cat.parent === 'object' && cat.parent._id === parentId) || (typeof cat.parent === 'string' && cat.parent === parentId)
    );

    return children.flatMap((category) => [
      <AdminTableRow key={category._id} className={level > 0 ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''}>
        <AdminTableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5 + 0.25}rem` }}>
            {level > 0 ? (
              <span className="text-amber-400 font-bold text-xs select-none">└</span>
            ) : (
              <span className="text-slate-300 font-bold text-xs select-none">●</span>
            )}
            <div>
              <span className={`font-medium truncate block text-[13px] ${level === 0 ? 'font-extrabold' : 'text-slate-700 dark:text-slate-200'}`}>
                {category.name}
              </span>
              {level === 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest">Parent Category</span>
              )}
            </div>
          </div>
        </AdminTableCell>
        <AdminTableCell className="text-muted-foreground font-mono text-xs max-w-[160px] truncate">{category.slug}</AdminTableCell>
        <AdminTableCell className="max-w-[240px] truncate">{category.description || '-'}</AdminTableCell>
        <AdminTableCell>
          <span
            className={`px-2 py-1 text-[11px] font-semibold rounded-full ${
              category.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {category.status.toUpperCase()}
          </span>
        </AdminTableCell>
        <AdminTableCell className="text-right">
          <RowActions
            label={`Actions for ${category.name}`}
            items={[
              {
                label: 'Edit category',
                icon: <Edit className="h-3.5 w-3.5 mr-2" />,
                onSelect: () => router.push(`/admin/categories/${category._id}`),
              },
              {
                label: 'Delete category',
                icon: <Trash2 className="h-3.5 w-3.5 mr-2" />,
                danger: true,
                onSelect: () => setDeleteDialog({ open: true, category }),
              },
            ]}
          />
        </AdminTableCell>
      </AdminTableRow>,
      ...renderCategoryTree(categoryList, category._id, level + 1),
    ]);
  };

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage product categories</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No categories found</p>
          <Link href="/admin/categories/new">
            <Button className="mt-4">Create your first category</Button>
          </Link>
        </div>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
                  <AdminTableHead>Name</AdminTableHead>
                  <AdminTableHead>Slug</AdminTableHead>
                  <AdminTableHead>Description</AdminTableHead>
                  <AdminTableHead>Status</AdminTableHead>
                  <AdminTableHead className="text-right">Actions</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>{renderCategoryTree(categories)}</AdminTableBody>
        </AdminTable>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, category: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.category?.name}&quot;? This action cannot be undone.
              {deleteDialog.category && ' If this category has child categories, you must delete or reassign them first.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

