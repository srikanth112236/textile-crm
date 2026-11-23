'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { SmartSearchModal } from '@/components/search/SmartSearchModal';
import { DemoFloatingSwitcher } from '@/components/navigation/DemoFloatingSwitcher';

export function StoreChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDemo = pathname ? pathname.startsWith('/demo-') : false;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open-mentoos-search', handleOpenSearch);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-mentoos-search', handleOpenSearch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isDemo) {
    return (
      <>
        {children}
        <DemoFloatingSwitcher />
        <SmartSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
