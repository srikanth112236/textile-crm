import { Suspense } from 'react';
import type { Metadata } from 'next';
import { UserSidebar } from '@/components/user/UserSidebar';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { AuthWrapper } from '@/components/AuthWrapper';
import { UserRole } from '@/lib/types/roles';

export const metadata: Metadata = {
  title: 'My Account | Mentoos',
  description: 'Orders, payments, wishlist and settings',
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper requiredRole={UserRole.USER}>
      <DashboardShell
        title="My Account"
        subtitle="Orders, payments, wishlist & settings"
        sidebar={
          <Suspense fallback={<div className="p-3 text-xs text-muted-foreground">Loading…</div>}>
            <UserSidebar />
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
