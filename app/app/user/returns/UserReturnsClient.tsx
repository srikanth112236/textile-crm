'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { returnsApi } from '@/lib/api/returns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Loader2 } from 'lucide-react';

export default function UserReturnsClient() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setRows(await returnsApi.mine());
      } catch (e: any) {
        toast({ title: 'Load failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading returns…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><RotateCcw className="h-6 w-6" /> My Returns & Exchanges</h1>
        <p className="text-sm text-muted-foreground">7-day easy exchange · pickup updates on WhatsApp</p>
      </div>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No return requests yet. Open an order and tap <span className="font-bold">Return / Exchange</span>.
            <div className="mt-4"><Button asChild size="sm"><Link href="/user/orders">View My Orders</Link></Button></div>
          </CardContent>
        </Card>
      ) : rows.map((r) => (
        <Card key={r._id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline" className="uppercase">{r.type}</Badge>
              {r.orderNumber}
              <Badge variant={r.status === 'requested' ? 'secondary' : 'default'}>{r.status.replace('_', ' ')}</Badge>
            </CardTitle>
            <CardDescription>{new Date(r.createdAt).toLocaleString('en-IN')} · {r.items.length} item(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {r.items.map((it: any, i: number) => (
              <div key={i} className="flex justify-between"><span>Qty {it.quantity} — {it.reason}{it.exchangeSize ? ` → size ${it.exchangeSize}` : ''}</span></div>
            ))}
            <p className="text-muted-foreground">{r.reason}</p>
            {(r.refundMethod || r.upiId || r.bankAccountNumber || r.refundAmount || r.razorpayRefundId) && (
              <div className="text-xs bg-muted p-2 rounded-lg space-y-0.5">
                <p><span className="font-bold">Refund:</span> {r.refundMethod === 'upi' ? `UPI ${r.upiId || ''}` : r.refundMethod === 'bank' ? `Bank ${r.bankAccountName || ''} ••${String(r.bankAccountNumber || '').slice(-4)} ${r.bankIfsc || ''}` : 'Original payment source'}{r.refundAmount ? ` • ₹${r.refundAmount}` : ''}</p>
                {r.razorpayRefundId && <p className="text-muted-foreground">Razorpay refund ID: {r.razorpayRefundId}</p>}
                {r.refundedAt && <p className="text-muted-foreground">Refunded on {new Date(r.refundedAt).toLocaleString('en-IN')}</p>}
              </div>
            )}
            {r.adminNote && <p className="text-xs bg-muted p-2 rounded-lg">Store note: {r.adminNote}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
