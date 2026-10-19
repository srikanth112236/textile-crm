import { Suspense } from 'react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Suspense fallback={<div className="container mx-auto px-4 py-8 text-sm text-muted-foreground">Loading…</div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
