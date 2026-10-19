'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Package, Users, BarChart3, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.email} — manage catalog, orders & shipments.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Package, t: 'Products', d: 'Manage products', href: '/admin/products' },
          { icon: ShoppingCart, t: 'Orders', d: 'Manage orders', href: '/admin/orders' },
          { icon: Users, t: 'Users', d: 'View users', href: '/admin/users' },
          { icon: BarChart3, t: 'Analytics', d: 'View reports', href: '/admin/analytics' },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10"><c.icon className="h-5 w-5 text-primary" /></div>
              <div><h3 className="font-semibold text-sm">{c.t}</h3><p className="text-xs text-muted-foreground">{c.d}</p></div>
            </div>
            <Link href={c.href}><Button variant="outline" size="sm" className="w-full h-8 text-xs">Open {c.t}</Button></Link>
          </div>
        ))}
      </div>
    </div>
  );
}
