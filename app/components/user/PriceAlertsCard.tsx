'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, Loader2, Trash2 } from 'lucide-react';
import { alertsApi } from '@/lib/api/alerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PriceAlertRow {
  _id: string;
  targetPrice: number;
  active: boolean;
  productId?: {
    _id: string;
    name: string;
    price: number;
  } | string;
}

export function PriceAlertsCard() {
  const [alerts, setAlerts] = useState<PriceAlertRow[] | null>(null);
  const { toast } = useToast();

  const load = () => {
    alertsApi.myPriceAlerts()
      .then((rows) => setAlerts(rows || []))
      .catch(() => setAlerts([]));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    try {
      await alertsApi.removePriceAlert(id);
      setAlerts((current) => (current || []).filter((alert) => alert._id !== id));
      toast({ title: 'Price alert removed' });
    } catch {
      toast({ title: 'Could not remove alert', description: 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BellRing className="h-4 w-4 text-amber-500" /> Price-drop alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts === null ? (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading alerts…
          </div>
        ) : alerts.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">
            No price alerts yet. Open a product and choose “Notify me on price drop”.
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const product = typeof alert.productId === 'object' ? alert.productId : null;
              return (
                <div key={alert._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <div className="min-w-0">
                    <Link
                      href={product?._id ? `/products/${product._id}` : '/products'}
                      className="block truncate text-xs font-bold text-slate-900 hover:text-amber-600"
                    >
                      {product?.name || 'Product'}
                    </Link>
                    <p className="text-[10px] text-muted-foreground">
                      {product ? `Now ${formatPrice(product.price)} · ` : ''}Alert under {formatPrice(alert.targetPrice)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove price alert"
                    className="h-7 w-7 shrink-0 text-slate-400 hover:text-rose-600"
                    onClick={() => remove(alert._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
