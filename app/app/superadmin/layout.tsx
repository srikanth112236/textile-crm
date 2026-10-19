import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { AuthWrapper } from '@/components/AuthWrapper';
import { UserRole } from '@/lib/types/roles';

export const metadata: Metadata = {
  title: 'Superadmin Dashboard | Mentoos',
  description: 'Full platform control',
};

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper requiredRole={UserRole.SUPERADMIN}>
      <DashboardShell
        title="Superadmin Console"
        subtitle="Full platform control"
        sidebar={<AdminSidebar />}
      >
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
          {children}
        </Suspense>
      </DashboardShell>
    </AuthWrapper>
  );
}
