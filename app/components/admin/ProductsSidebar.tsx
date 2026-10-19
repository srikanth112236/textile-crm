'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Package, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Ban,
  LayoutGrid
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductsSidebarProps {
  statusCounts?: {
    all?: number;
    draft?: number;
    active?: number;
    inactive?: number;
    out_of_stock?: number;
    discontinued?: number;
  };
}

const filterItems = [
  {
    id: 'all',
    label: 'All Products',
    icon: LayoutGrid,
    status: undefined,
  },
  {
    id: 'draft',
    label: 'Drafts',
    icon: FileText,
    status: 'draft',
    color: 'text-gray-600 dark:text-gray-400',
  },
  {
    id: 'active',
    label: 'Active',
    icon: CheckCircle2,
    status: 'active',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'inactive',
    label: 'Inactive',
    icon: XCircle,
    status: 'inactive',
    color: 'text-gray-600 dark:text-gray-400',
  },
  {
    id: 'out_of_stock',
    label: 'Out of Stock',
    icon: AlertCircle,
    status: 'out_of_stock',
    color: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'discontinued',
    label: 'Discontinued',
    icon: Ban,
    status: 'discontinued',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
];

export default function ProductsSidebar({ statusCounts = {} }: ProductsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams?.get('status') || 'all';

  const handleFilterClick = (status?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.set('status', status);
    }
    // Preserve other query params
    const search = searchParams.get('search');
    const page = searchParams.get('page');
    if (search) params.set('search', search);
    if (page && page !== '1') params.set('page', page);
    
    router.push(`/admin/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="w-full lg:w-64 space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <nav className="space-y-1">
          {filterItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentStatus === item.id || (item.id === 'all' && !searchParams.get('status'));
            const count = statusCounts[item.id as keyof typeof statusCounts] || statusCounts.all;

            return (
              <button
                key={item.id}
                onClick={() => handleFilterClick(item.status)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  'hover:bg-muted',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon className={cn('h-4 w-4 flex-shrink-0', item.color || '')} />
                  <span className="truncate">{item.label}</span>
                </div>
                {count !== undefined && (
                  <Badge 
                    variant={isActive ? 'default' : 'secondary'} 
                    className="text-xs flex-shrink-0"
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

