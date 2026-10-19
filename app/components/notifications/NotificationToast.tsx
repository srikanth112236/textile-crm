'use client';

import { useSocket } from '@/lib/contexts/SocketContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Package, Gift, AlertTriangle, Info, CreditCard, Truck } from 'lucide-react';
import Link from 'next/link';

export default function NotificationToast() {
  const { notifications, clearNotifications, dismissNotification } = useSocket();

  const getIcon = (type: string) => {
    switch (type) {
      case 'orderUpdate': return <Package className="h-4 w-4" />;
      case 'promotion': return <Gift className="h-4 w-4" />;
      case 'lowStockAlert': return <AlertTriangle className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'refund': return <CreditCard className="h-4 w-4" />;
      case 'stock': return <Truck className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-14 right-3 z-[60] space-y-2 w-[320px] max-w-[calc(100vw-24px)]" role="status" aria-live="polite">
      {notifications.slice(0, 5).map((n) => (
        <Card key={n.id} className="border-amber-500/40 bg-white dark:bg-slate-900 shadow-xl animate-in slide-in-from-right">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-amber-600">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] leading-tight">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-muted-foreground">{new Date(n.timestamp).toLocaleTimeString()}</p>
                  {n.orderNumber && (
                    <Link href="/track-order" className="text-[10px] font-bold text-amber-600 hover:underline">Track order</Link>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => dismissNotification(n.id)} aria-label="Dismiss notification">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={clearNotifications} className="w-full h-7 text-[11px] bg-white dark:bg-slate-900">
        Clear All ({notifications.length})
      </Button>
    </div>
  );
}
