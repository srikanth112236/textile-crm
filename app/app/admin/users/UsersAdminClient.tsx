'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi, User, UpdateUserData } from '@/lib/api/admin';
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
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Ban, Unlock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/utils';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';

export default function UsersAdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [bannedFilter, setBannedFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [banDialog, setBanDialog] = useState(false);
  const [unbanDialog, setUnbanDialog] = useState(false);
  const [editData, setEditData] = useState<UpdateUserData>({});
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (bannedFilter !== 'all') params.isBanned = bannedFilter === 'banned';

      const response = await adminApi.getUsers(params);
      if (response.success) {
        setUsers(response.data);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchQuery, roleFilter, bannedFilter]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditData({
      name: user.name,
      phone: user.phone,
      role: user.role,
      isBanned: user.isBanned,
      bannedReason: user.bannedReason,
    });
    setEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await adminApi.updateUser(selectedUser._id, editData);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
        setEditDialog(false);
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast({
        title: 'Error',
        description: 'Ban reason is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminApi.banUser(selectedUser._id, banReason);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'User banned successfully',
        });
        setBanDialog(false);
        setBanReason('');
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to ban user',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await adminApi.unbanUser(selectedUser._id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'User unbanned successfully',
        });
        setUnbanDialog(false);
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to unban user',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      superadmin: 'destructive',
      admin: 'default',
      user: 'secondary',
    };
    return (
      <Badge variant={variants[role] || 'secondary'} className="text-[11px]">
        {role.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="px-3 py-4 space-y-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage users, roles, and permissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => {
          setRoleFilter(value);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={bannedFilter} onValueChange={(value) => {
          setBannedFilter(value);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center p-8 rounded-xl border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground rounded-xl border bg-card">
          No users found
        </div>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHead>Email</AdminTableHead>
              <AdminTableHead>Name</AdminTableHead>
              <AdminTableHead>Role</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
              <AdminTableHead>Loyalty Points</AdminTableHead>
              <AdminTableHead>Joined</AdminTableHead>
              <AdminTableHead className="text-right">Actions</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {users.map((user) => (
              <AdminTableRow key={user._id}>
                <AdminTableCell className="truncate max-w-[220px] text-[13px]">{user.email}</AdminTableCell>
                <AdminTableCell className="truncate max-w-[160px] text-[13px]">{user.name || '-'}</AdminTableCell>
                <AdminTableCell>{getRoleBadge(user.role)}</AdminTableCell>
                <AdminTableCell>
                  {user.isBanned ? (
                    <Badge variant="destructive" className="text-[11px]">Banned</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[11px]">Active</Badge>
                  )}
                </AdminTableCell>
                <AdminTableCell className="whitespace-nowrap text-[13px]">{user.loyaltyPoints || 0}</AdminTableCell>
                <AdminTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString()}
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <RowActions
                    label={`Actions for ${user.email}`}
                    items={[
                      {
                        label: 'Edit',
                        icon: <Edit className="h-3.5 w-3.5 mr-2" />,
                        onSelect: () => handleEdit(user),
                      },
                      ...(user.isBanned
                        ? [
                            {
                              label: 'Unban',
                              icon: <Unlock className="h-3.5 w-3.5 mr-2" />,
                              onSelect: () => {
                                setSelectedUser(user);
                                setUnbanDialog(true);
                              },
                            },
                          ]
                        : [
                            {
                              label: 'Ban',
                              icon: <Ban className="h-3.5 w-3.5 mr-2" />,
                              danger: true,
                              onSelect: () => {
                                setSelectedUser(user);
                                setBanDialog(true);
                              },
                            },
                          ]),
                    ]}
                  />
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminTable>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center px-4 text-sm">
              Page {pagination.page} of {pagination.pages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editData.phone || ''}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={editData.role}
                onValueChange={(value) => setEditData({ ...editData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <AlertDialog open={banDialog} onOpenChange={setBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban this user? Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter ban reason..."
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              disabled={actionLoading || !banReason.trim()}
              className="bg-destructive text-destructive-foreground"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unban Dialog */}
      <AlertDialog open={unbanDialog} onOpenChange={setUnbanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban this user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnban}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

