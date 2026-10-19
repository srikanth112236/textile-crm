'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  FolderTree,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutGrid,
  AlertTriangle,
  Clock,
  Warehouse,
  CreditCard,
  Shield,
  Tag,
  MessageSquare,
  ArrowLeftRight,
  History,
  TrendingUp,
  PieChart,
  Truck,
  CheckCircle2,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { productsApi } from '@/lib/api/products';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  countKey?: string;
}
interface NavSection { label: string; items: NavItem[] }

const sections: NavSection[] = [
  { label: 'Overview', items: [{ title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }] },
  {
    label: 'Catalog', items: [
      {
        title: 'Products', href: '/admin/products', icon: Package,
        children: [
          { title: 'All Products', href: '/admin/products', icon: LayoutGrid, countKey: 'all' },
          { title: 'Drafts', href: '/admin/products?status=draft', icon: FileText, countKey: 'draft' },
          { title: 'Low Stock', href: '/admin/products?lowStock=true', icon: AlertTriangle, countKey: 'lowStock' },
          { title: 'Recently Added', href: '/admin/products?recent=true', icon: Clock, countKey: 'recent' },
        ],
      },
      { title: 'Categories', href: '/admin/categories', icon: FolderTree },
      { title: 'Tags', href: '/admin/tags', icon: Tag },
      { title: 'Reviews', href: '/admin/reviews', icon: MessageSquare, countKey: 'pendingReviews' },
      { title: 'Shop the Look', href: '/admin/shop-look', icon: LayoutGrid },
      { title: 'UGC & Social', href: '/admin/ugc', icon: Sparkles },
    ],
  },
  {
    label: 'Sales', items: [
      {
        title: 'Orders', href: '/admin/orders', icon: ShoppingCart,
        children: [
          { title: 'All Orders', href: '/admin/orders', icon: ShoppingCart },
          { title: 'Pending', href: '/admin/orders?status=pending', icon: Clock },
          { title: 'Processing', href: '/admin/orders?status=processing', icon: Package },
          { title: 'Delivered', href: '/admin/orders?status=delivered', icon: CheckCircle2 },
          { title: 'Returns & Exchange', href: '/admin/returns', icon: ArrowLeftRight },
        ],
      },
      { title: 'Shipments & Deliveries', href: '/admin/deliveries', icon: Truck },
      {
        title: 'Payments', href: '/admin/payments', icon: CreditCard,
        children: [
          { title: 'All Payments', href: '/admin/payments', icon: CreditCard },
          { title: 'Refunds', href: '/admin/payments/refunds', icon: AlertTriangle },
        ],
      },
      { title: 'Tax Invoices', href: '/admin/invoices', icon: FileText },
      { title: 'Discounts', href: '/admin/discounts', icon: Tag },
    ],
  },
  {
    label: 'Operations', items: [
      {
        title: 'Inventory', href: '/admin/inventory', icon: Warehouse,
        children: [
          { title: 'Dashboard', href: '/admin/inventory', icon: LayoutDashboard },
          { title: 'Add / Adjust Stock', href: '/admin/inventory/stock', icon: Package },
          { title: 'Warehouses', href: '/admin/inventory/warehouses', icon: Warehouse },
          { title: 'Stock Transfer', href: '/admin/inventory/transfer', icon: ArrowLeftRight },
          { title: 'Movement History', href: '/admin/inventory/movements', icon: History },
        ],
      },
      { title: 'Stock Alerts', href: '/admin/stock-alerts', icon: MessageSquare },
      { title: 'Users', href: '/admin/users', icon: Users },
    ],
  },
  {
    label: 'Insights & System', items: [
      {
        title: 'Analytics', href: '/admin/analytics', icon: BarChart3,
        children: [
          { title: 'Overview', href: '/admin/analytics', icon: PieChart },
          { title: 'Advanced', href: '/admin/analytics/advanced', icon: TrendingUp },
        ],
      },
      { title: 'Audit Logs', href: '/admin/logs', icon: FileText },
      { title: 'Permissions', href: '/admin/permissions', icon: Shield },
      { title: 'Store Settings', href: '/admin/settings', icon: Settings2 },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const c: Record<string, number> = {};
        const all = await productsApi.getProducts({ limit: 1 });
        c.all = all.pagination.total;
        try { c.draft = (await productsApi.getProducts({ status: 'draft', limit: 1 })).pagination.total; } catch { c.draft = 0; }
        try { c.lowStock = (await productsApi.getProducts({ lowStock: true, limit: 1 })).pagination.total; } catch { c.lowStock = 0; }
        try { c.recent = (await productsApi.getProducts({ recent: true, limit: 1 })).pagination.total; } catch { c.recent = 0; }
        setCounts(c);
        try { setPendingReviews((await productsApi.getAllReviews('pending', 1, 1)).pagination.total); } catch { setPendingReviews(0); }
      } catch { /* ignore */ }
    })();
  }, []);

  const toggle = (href: string) =>
    setExpanded((p) => {
      if (p.includes(href)) return [];
      return [href];
    });

  const isChildActive = (child: NavItem): boolean => {
    if (!pathname) return false;
    if (child.href.includes('?')) {
      const [base, query] = child.href.split('?');
      if (pathname === base || pathname.startsWith(base)) {
        const params = new URLSearchParams(query);
        const status = params.get('status');
        const lowStock = params.get('lowStock');
        const recent = params.get('recent');
        if (status) return searchParams?.get('status') === status && !searchParams?.get('lowStock') && !searchParams?.get('recent');
        if (lowStock) return searchParams?.get('lowStock') === lowStock;
        if (recent) return searchParams?.get('recent') === recent;
      }
      return false;
    }
    if (child.href === '/admin/products' && pathname === '/admin/products') {
      return !searchParams?.get('status') && !searchParams?.get('lowStock') && !searchParams?.get('recent');
    }
    return pathname === child.href || pathname.startsWith(`${child.href}/`);
  };

  const isActive = (item: NavItem): boolean => {
    if (!pathname) return false;
    if (item.children) return item.children.some(isChildActive) || pathname === item.href;
    if (item.href === '/admin/products' && pathname === '/admin/products') return true;
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  };

  const itemCls = (on: boolean) =>
    cn(
      'flex items-center gap-2 px-2.5 h-8 rounded-lg text-[13px] font-medium transition-colors',
      on ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    );

  return (
    <div className="flex flex-col h-full">
      <Link href="/admin/dashboard" className="flex items-center gap-1.5 px-3 h-12 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <span className="font-extrabold text-sm tracking-tighter">MENTOOS<span className="text-amber-500">.</span></span>
        <span className="text-[9px] font-bold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 px-1 py-px rounded">ADMIN</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-2 space-y-4" aria-label="Admin navigation">
        {sections.map((sec) => (
          <div key={sec.label}>
            <p className="px-2.5 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{sec.label}</p>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const hasKids = !!item.children?.length;
                const open = expanded.includes(item.href);
                const on = isActive(item);
                if (!hasKids) {
                  const count = item.countKey === 'pendingReviews' ? pendingReviews : undefined;
                  return (
                    <Link key={item.href} href={item.href} className={cn(itemCls(on), 'justify-between')} aria-current={on ? 'page' : undefined}>
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </span>
                      {!!count && <Badge variant={on ? 'default' : 'destructive'} className="text-[10px] h-4 px-1">{count}</Badge>}
                    </Link>
                  );
                }
                return (
                  <div key={item.href}>
                    <button onClick={() => toggle(item.href)} className={cn(itemCls(on), 'w-full justify-between')} aria-expanded={open}>
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </span>
                      {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    {open && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-slate-800 pl-2">
                        {item.children!.map((c) => {
                          const CI = c.icon;
                          const a = isChildActive(c);
                          const count = c.countKey ? counts[c.countKey] : undefined;
                          return (
                            <Link key={c.href} href={c.href} className={cn(itemCls(a), 'h-7 text-xs justify-between')} aria-current={a ? 'page' : undefined}>
                              <span className="flex items-center gap-2 min-w-0">
                                <CI className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{c.title}</span>
                              </span>
                              {count !== undefined && <Badge variant="secondary" className="text-[10px] h-4 px-1">{count}</Badge>}
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
          ← Back to Shopping
        </Link>
      </div>
    </div>
  );
}
