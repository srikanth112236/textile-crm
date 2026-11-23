import { Suspense } from 'react';
import { StaffGuard } from '@/components/auth/StaffGuard';
import { StoreChrome } from '@/components/navigation/StoreChrome';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreChrome>
      <StaffGuard>
        <Suspense fallback={<div className="container mx-auto px-4 py-8 text-sm text-muted-foreground">Loading…</div>}>
          {children}
        </Suspense>
      </StaffGuard>
    </StoreChrome>
  );
}
