'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserOrders, Order } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { FileText, Search, Printer, ArrowRight, Download, Calendar, ShieldCheck, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserInvoicesClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await getUserOrders(1, 50);
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load user invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <Badge variant="outline" className="text-xs uppercase font-extrabold text-amber-600 border-amber-400 mb-1">
            Tax Documents & Invoices
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Invoices Center 🧾
          </h1>
          <p className="text-xs text-slate-500">
            View, download, and print official GST tax invoices for all your past purchases.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search Invoice / Order #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs rounded-xl border-slate-300 dark:border-slate-700 py-5"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 bg-white dark:bg-slate-900">
          <FileText className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No Tax Invoices Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you place an order on Mentoos, your GST tax invoice will be generated and made available here automatically.
          </p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const gstAmount = Math.round(order.total * 0.05);

            return (
              <Card
                key={order._id}
                className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all overflow-hidden bg-white dark:bg-slate-900"
              >
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Invoice:</span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        INV-{order.orderNumber}
                      </span>
                      <Badge className={order.paymentStatus === 'confirmed' ? 'bg-emerald-500 text-white text-[10px]' : 'bg-amber-500 text-slate-950 text-[10px]'}>
                        {order.paymentStatus.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Ref</span>
                        <span className="font-semibold">{order.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
                        <span>{invoiceDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Items Count</span>
                        <span>{order.items?.length || 1} Item(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-end justify-between w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Invoice Amount</span>
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                        {formatPrice(order.total)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Inc. GST 5% ({formatPrice(gstAmount)})</span>
                    </div>

                    <Button asChild size="sm" className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold rounded-xl text-xs gap-1.5 shadow-md">
                      <Link href={`/user/orders/${order._id}/invoice`} target="_blank">
                        <Printer className="w-3.5 h-3.5" /> Tax Invoice
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
