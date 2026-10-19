import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { AuthWrapper } from '@/components/AuthWrapper';
import { UserRole } from '@/lib/types/roles';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Mentoos',
  description: 'Catalog, orders, shipments, payments and insights',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper requiredRole={[UserRole.ADMIN, UserRole.SUPERADMIN]}>
      <DashboardShell
        title="Admin Console"
        subtitle="Catalog, orders, shipments, payments & insights"
        sidebar={
          <Suspense fallback={<div className="p-3 text-xs text-muted-foreground">Loading…</div>}>
            <AdminSidebar />
          </Suspense>
        }
      >
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
          {children}
        </Suspense>
      </DashboardShell>
    </AuthWrapper>
  );
}
