'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { WarehouseForm } from '@/components/admin/WarehouseForm';
import { getWarehouse, type Warehouse } from '@/lib/api/inventory';
import { Loader2 } from 'lucide-react';

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = params.id as string;
  const { toast } = useToast();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await getWarehouse(warehouseId);
        if (!cancelled) setWarehouse(data);
      } catch (error: any) {
        if (cancelled) return;
        toast({
          title: 'Could not load warehouse',
          description: error.response?.data?.error || error.message || 'Please try again.',
          variant: 'destructive',
        });
        router.push('/admin/inventory/warehouses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [warehouseId, router, toast]);

  if (loading) {
    return (
      <div className="px-3 py-4 max-w-7xl mx-auto space-y-3 animate-pulse">
        <div className="h-14 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
          <div className="space-y-3">
            {[180, 220, 150, 160].map((height, i) => (
              <div key={i} className="rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" style={{ height }} />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        </div>
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" /> Loading warehouse…
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-bold">Warehouse not found</p>
        <p className="text-[11px] text-muted-foreground mt-1">It may have been deleted or you may not have access.</p>
        <Link href="/admin/inventory/warehouses">
          <Button size="sm" className="mt-4 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold">
            Back to Warehouses
          </Button>
        </Link>
      </div>
    );
  }

  return <WarehouseForm mode="edit" warehouse={warehouse} />;
}
