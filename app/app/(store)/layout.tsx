import { Suspense } from 'react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { StaffGuard } from '@/components/auth/StaffGuard';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        <StaffGuard>
          <Suspense fallback={<div className="container mx-auto px-4 py-8 text-sm text-muted-foreground">Loading…</div>}>
            {children}
          </Suspense>
        </StaffGuard>
      </main>
      <Footer />
    </>
  );
}
