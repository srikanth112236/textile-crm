'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  LayoutDashboard,
  UserCircle,
  Settings,
  Package,
  CreditCard,
  Heart,
  ChevronDown,
  ChevronRight,
  Truck,
  FileText,
  RotateCcw,
  Bell,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
      { title: 'Notifications', href: '/user/dashboard?tab=alerts', icon: Bell },
    ],
  },
  {
    label: 'Shopping',
    items: [
      {
        title: 'Orders',
        href: '/user/orders',
        icon: Package,
        children: [
          { title: 'My Orders', href: '/user/orders', icon: Package },
          { title: 'Track Order', href: '/track-order', icon: Truck },
          { title: 'Tax Invoices', href: '/user/invoices', icon: FileText },
        ],
      },
      {
        title: 'Returns & Refunds',
        href: '/user/returns',
        icon: RotateCcw,
        children: [
          { title: 'My Returns', href: '/user/returns', icon: RotateCcw },
          { title: 'Refunds', href: '/user/refunds', icon: CreditCard },
        ],
      },
      { title: 'Wishlist', href: '/user/wishlist', icon: Heart },
      {
        title: 'Payments',
        href: '/user/payments',
        icon: CreditCard,
        children: [{ title: 'All Payments', href: '/user/payments', icon: CreditCard }],
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Profile',
        href: '/user/profile',
        icon: UserCircle,
        children: [
          { title: 'My Profile', href: '/user/profile', icon: UserCircle },
          { title: 'Settings', href: '/user/settings', icon: Settings },
        ],
      },
    ],
  },
];

export function UserSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(['/user/orders', '/user/returns', '/user/profile', '/user/payments']);

  const toggle = (href: string) =>
    setExpanded((p) => (p.includes(href) ? p.filter((x) => x !== href) : [...p, href]));

  const active = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const itemCls = (isActive: boolean) =>
    cn(
      'flex items-center gap-2 px-2.5 h-8 rounded-lg text-[13px] font-medium transition-colors',
      isActive
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    );

  return (
    <div className="flex flex-col h-full">
      <Link href="/" className="flex items-center gap-1.5 px-3 h-12 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <span className="font-extrabold text-sm tracking-tighter">MENTOOS<span className="text-amber-500">.</span></span>
        <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1 py-px rounded border border-amber-500/20">ACCOUNT</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-2 space-y-4" aria-label="Account navigation">
        {sections.map((sec) => (
          <div key={sec.label}>
            <p className="px-2.5 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{sec.label}</p>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const hasKids = !!item.children?.length;
                const isOpen = expanded.includes(item.href);
                const isActive = active(item.href) || !!item.children?.some((c) => active(c.href));
                if (!hasKids) {
                  return (
                    <Link key={item.href} href={item.href} className={itemCls(isActive)} aria-current={isActive ? 'page' : undefined}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                }
                return (
                  <div key={item.href}>
                    <button onClick={() => toggle(item.href)} className={cn(itemCls(isActive), 'w-full justify-between')} aria-expanded={isOpen}>
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </span>
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    {isOpen && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-slate-800 pl-2">
                        {item.children!.map((c) => {
                          const CI = c.icon;
                          const a = active(c.href);
                          return (
                            <Link key={c.href} href={c.href} className={cn(itemCls(a), 'h-7 text-xs')} aria-current={a ? 'page' : undefined}>
                              <CI className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{c.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-bold border hover:bg-slate-50 dark:hover:bg-slate-800">
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
}
