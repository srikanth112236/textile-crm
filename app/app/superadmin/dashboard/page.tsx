'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Settings, Users, ShoppingBag, BarChart3, Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SuperadminDashboard() {
  const { user } = useAuth();
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminData, setAdminData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateAdmin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await usersApi.createAdmin(adminData);
      setSuccess('Admin created successfully!');
      setAdminData({ email: '', password: '', name: '' });
      setShowCreateAdmin(false);
      setTimeout(() => setSuccess(''), 3001);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Superadmin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.email} - Full system access
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Admin Creation */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Create Admin</h3>
              <p className="text-sm text-muted-foreground">Create new admin users</p>
            </div>
          </div>
          <AlertDialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
            <AlertDialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create New Admin</AlertDialogTitle>
                <AlertDialogDescription>
                  Create a new admin user account. Only admins can be created (not superadmins).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Name (optional)</Label>
                  <Input
                    id="admin-name"
                    value={adminData.name}
                    onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                    placeholder="Admin name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password *</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateAdmin} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Admin'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Products Management */}
        <Link href="/admin/products">
          <div className="rounded-lg border bg-card p-6 hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Products</h3>
                <p className="text-sm text-muted-foreground">Manage all products</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Manage Products
            </Button>
          </div>
        </Link>

        {/* Categories Management */}
        <Link href="/admin/categories">
          <div className="rounded-lg border bg-card p-6 hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Categories</h3>
                <p className="text-sm text-muted-foreground">Manage categories</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Manage Categories
            </Button>
          </div>
        </Link>

        {/* Analytics */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-muted-foreground">View platform analytics</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>

        {/* Security */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-muted-foreground">Security settings & logs</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Role Info */}
      <div className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Role Information</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Role:</strong> Superadmin
          </p>
          <p>
            <strong>Permissions:</strong> Full CRUD access to all resources
          </p>
          <p>
            <strong>User ID:</strong> {user?.id}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}

