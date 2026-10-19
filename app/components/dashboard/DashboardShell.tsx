'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DashboardTopbar } from './DashboardTopbar';

export function DashboardShell({
  sidebar,
  title,
  subtitle,
  children,
}: {
  sidebar: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {/* Sidebar: fixed on desktop, drawer on mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex-1 overflow-y-auto" onClick={() => setMobileOpen(false)}>
          {sidebar}
        </div>
      </div>
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <DashboardTopbar
          title={title}
          subtitle={subtitle}
          onMenuToggle={() => setMobileOpen((v) => !v)}
        />
        <main className="flex-1 w-full max-w-full mx-auto px-0 py-4 sm:px-4 sm:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
