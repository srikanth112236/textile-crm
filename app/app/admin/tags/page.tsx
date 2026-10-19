'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { tagsApi, ITag } from '@/lib/api/tags';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';

export default function TagsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tags, setTags] = useState<ITag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ITag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchTags();
    } else {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await tagsApi.getTags(undefined, 1, 100);
      if (response.success) {
        setTags(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tag?: ITag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        description: tag.description || '',
        color: tag.color || '#6366f1',
        isActive: tag.isActive,
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        description: '',
        color: '#6366f1',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Tag name is required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingTag) {
        await tagsApi.updateTag(editingTag._id, formData);
        toast({
          title: 'Success',
          description: 'Tag updated successfully',
        });
      } else {
        await tagsApi.createTag(formData);
        toast({
          title: 'Success',
          description: 'Tag created successfully',
        });
      }
      handleCloseDialog();
      fetchTags();
    } catch (error: any) {
      console.error('Failed to save tag:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save tag',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tag: ITag) => {
    if (!confirm(`Are you sure you want to delete "${tag.name}"? This will remove it from all products.`)) {
      return;
    }

    try {
      await tagsApi.deleteTag(tag._id);
      toast({
        title: 'Success',
        description: 'Tag deleted successfully',
      });
      fetchTags();
    } catch (error: any) {
      console.error('Failed to delete tag:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete tag',
        variant: 'destructive',
      });
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tags Management</h1>
          <p className="text-muted-foreground mt-1">
            Organize products with tags for better discoverability
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <AdminTable>
        <AdminTableHeader>
          <AdminTableRow>
            <AdminTableHead>Tag</AdminTableHead>
            <AdminTableHead>Description</AdminTableHead>
            <AdminTableHead>Usage</AdminTableHead>
            <AdminTableHead>Status</AdminTableHead>
            <AdminTableHead className="text-right">Actions</AdminTableHead>
          </AdminTableRow>
        </AdminTableHeader>
        <AdminTableBody>
          {filteredTags.length === 0 ? (
            <AdminTableRow>
              <AdminTableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No tags found matching your search' : 'No tags yet. Create your first tag!'}
              </AdminTableCell>
            </AdminTableRow>
          ) : (
            filteredTags.map((tag) => (
              <AdminTableRow key={tag._id}>
                <AdminTableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color || '#6366f1' }}
                    />
                    <span className="font-medium truncate max-w-[180px]">{tag.name}</span>
                  </div>
                </AdminTableCell>
                <AdminTableCell className="max-w-md truncate text-[13px]">
                  {tag.description || <span className="text-muted-foreground">No description</span>}
                </AdminTableCell>
                <AdminTableCell>
                  <Badge variant="outline" className="text-[11px] whitespace-nowrap">{tag.usageCount} products</Badge>
                </AdminTableCell>
                <AdminTableCell>
                  <Badge variant={tag.isActive ? 'default' : 'secondary'} className="text-[11px]">
                    {tag.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <RowActions
                    label={`Actions for ${tag.name}`}
                    items={[
                      {
                        label: 'Edit',
                        icon: <Edit className="h-3.5 w-3.5 mr-2" />,
                        onSelect: () => handleOpenDialog(tag),
                      },
                      {
                        label: 'Delete',
                        icon: <Trash2 className="h-3.5 w-3.5 mr-2" />,
                        danger: true,
                        onSelect: () => handleDelete(tag),
                      },
                    ]}
                  />
                </AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </AdminTableBody>
      </AdminTable>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogDescription>
              {editingTag
                ? 'Update tag information below'
                : 'Create a new tag to organize your products'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tag Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Featured, New Arrival, Sale"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1"
                />
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible to users)
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

