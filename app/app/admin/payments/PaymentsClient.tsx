'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllOrders, Order, PaymentStatus } from '@/lib/api/orders';
import { adminPaymentsApi, LedgerPayment } from '@/lib/api/adminPayments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { exportToCSV } from '@/lib/utils/export';
import { DollarSign, Search, RefreshCw, Download, Banknote, Smartphone, ShieldCheck, Eye, XCircle } from 'lucide-react';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';

type Tab = 'ledger' | 'cod' | 'orders';

export default function PaymentsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('ledger');
  const [ledger, setLedger] = useState<LedgerPayment[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<{ byMethod: any[]; byPayStatus: any[] } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    loadLedger();
    loadSummary();
    loadOrders();
  }, []);

  const loadLedger = async () => {
    try {
      setLedgerLoading(true);
      const data = await adminPaymentsApi.ledger({ page: 1, limit: 50, status: statusFilter || undefined, purpose: purposeFilter || undefined, search: search || undefined });
      setLedger(data.payments);
    } catch (e: any) {
      toast({ title: 'Ledger failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setLedgerLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await adminPaymentsApi.ordersSummary();
      setSummary(data);
    } catch {
      // optional
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await getAllOrders(1, 50, undefined, undefined);
      setOrders(res.data.orders || []);
    } catch {
      // optional
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleRefund = async (orderId: string) => {
    const target = orders.find((o: any) => o._id === orderId);
    const total = target?.total;
    const amountStr = prompt(`Refund amount in ₹ (blank = full${total ? ` ${total}` : ''}):`);
    if (amountStr === null) return;
    let amount: number | undefined;
    if (amountStr.trim() !== '') {
      amount = Number(amountStr);
      if (!amount || amount <= 0 || (total && amount > total)) {
        toast({ title: 'Invalid amount', description: `Enter 1–${total || 'order total'} or leave blank for full refund.`, variant: 'destructive' });
        return;
      }
    }
    const notes = prompt('Refund reason (required for audit):');
    if (!notes) return;
    try {
      const res: any = await adminPaymentsApi.refund(orderId, amount, notes);
      toast({ title: amount ? 'Partial refund processed' : 'Refund processed', description: res?.message || 'Razorpay refund triggered.' });
      loadLedger();
      loadOrders();
    } catch (e: any) {
      toast({ title: 'Refund failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  const handleExportLedger = () => {
    const rows = ledger.map((p) => ({
      'Razorpay Order': p.razorpayOrderId,
      'Razorpay Payment': p.razorpayPaymentId || '',
      'Order': typeof p.orderId === 'object' ? (p.orderId as any).orderNumber : p.orderNumber || '',
      Amount: p.amount,
      Purpose: p.purpose,
      Status: p.status,
      Date: new Date(p.createdAt).toLocaleString('en-IN'),
    }));
    exportToCSV(rows, Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k })), `razorpay_ledger_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const codOrders = orders.filter((o: any) => o.paymentMethod === 'cod');
  const prepaidOrders = orders.filter((o: any) => ['razorpay', 'upi', 'card', 'netbanking', 'wallet'].includes(o.paymentMethod));

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><DollarSign className="h-6 w-6 text-amber-500" /> Payments Command Center</h1>
          <p className="text-sm text-muted-foreground">Online ledger + COD advances + revenue forecast · live dynamic updates.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { loadLedger(); loadSummary(); loadOrders(); }} variant="outline" size="sm" className="rounded-xl text-xs font-extrabold h-9 shadow-sm"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh</Button>
          <Button onClick={handleExportLedger} variant="outline" size="sm" className="rounded-xl text-xs font-extrabold h-9 shadow-sm"><Download className="h-3.5 w-3.5 mr-1.5" />Export Ledger</Button>
        </div>
      </div>

      {/* Revenue Forecast Card */}
      <Card className="rounded-2xl shadow-lg border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-extrabold text-amber-600 dark:text-amber-400">Revenue Forecast (Live)</div>
            <div className="text-2xl font-black tracking-tight">{summary ? formatPrice((summary.byMethod || []).reduce((acc: number, m: any) => acc + (m.total || 0), 0)) : '—'}</div>
            <div className="text-xs text-muted-foreground">Total collected + pending balance (COD + online)</div>
          </div>
          <div className="bg-amber-500 text-slate-950 rounded-full p-3 shadow-md"><DollarSign className="h-6 w-6" /></div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(summary?.byMethod || []).map((m: any) => (
          <Card key={m._id} className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">{m._id} Orders</div>
              <div className="text-2xl font-black mt-1 tracking-tight">{m.count}</div>
              <div className="text-xs font-semibold mt-0.5 text-amber-600">{formatPrice(m.total)}</div>
              {m._id === 'cod' && <div className="text-[10px] font-bold text-violet-600 mt-1">Advance {formatPrice(m.advancePaid || 0)} · Due {formatPrice(m.balanceDue || 0)}</div>}
            </CardContent>
          </Card>
        ))}
        {(summary?.byPayStatus || []).map((s: any) => (
          <Card key={s._id} className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">Pay: {s._id}</div>
              <div className="text-2xl font-black mt-1 tracking-tight">{s.count}</div>
              <div className="text-xs font-semibold mt-0.5 text-emerald-600">{formatPrice(s.total)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([['ledger', 'Razorpay Ledger'], ['cod', 'COD Advances (' + codOrders.length + ')' ], ['orders', 'All Orders (' + orders.length + ')']] as Array<[Tab, string]>).map(([id, label]) => (
          <Button key={id} variant={tab === id ? 'default' : 'outline'} size="sm" onClick={() => setTab(id)} className="rounded-xl text-xs font-bold">{label}</Button>
        ))}
        <div className="flex gap-2 ml-auto">
          <Input placeholder="Search razorpayId / order" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56 text-xs" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs border rounded-lg px-2">
            <option value="">All status</option>
            <option value="created">created</option>
            <option value="captured">captured</option>
            <option value="failed">failed</option>
            <option value="refunded">refunded</option>
          </select>
          <select value={purposeFilter} onChange={(e) => setPurposeFilter(e.target.value)} className="text-xs border rounded-lg px-2">
            <option value="">full + advance</option>
            <option value="full">full</option>
            <option value="cod_advance">cod_advance</option>
          </select>
          <Button size="sm" onClick={loadLedger}><Search className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {tab === 'ledger' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Razorpay Ledger — every online payment</CardTitle><CardDescription>order_id → payment_id → signature verified → captured/failed. COD advances show as cod_advance.</CardDescription></CardHeader>
          <CardContent>
            {ledgerLoading ? <p className="text-sm">Loading ledger…</p> : ledger.length === 0 ? <p className="text-sm text-muted-foreground">No Razorpay payments yet. Create a test order via checkout with Razorpay.</p> : (
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Date</AdminTableHead>
                    <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Order</AdminTableHead>
                    <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">RP Order</AdminTableHead>
                    <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Payment ID</AdminTableHead>
                    <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Purpose</AdminTableHead>
                    <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Amount</AdminTableHead>
                    <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
                    <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {ledger.map((p) => (
                    <AdminTableRow key={p._id}>
                      <AdminTableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(p.createdAt).toLocaleString('en-IN')}</AdminTableCell>
                      <AdminTableCell className="font-mono text-xs font-medium">{typeof p.orderId === 'object' ? (p.orderId as any).orderNumber : p.orderNumber || <span className="text-muted-foreground">—</span>}</AdminTableCell>
                      <AdminTableCell className="font-mono text-xs truncate max-w-[160px]">{p.razorpayOrderId}</AdminTableCell>
                      <AdminTableCell className="font-mono text-xs truncate max-w-[160px]">{p.razorpayPaymentId || <span className="text-muted-foreground">—</span>}</AdminTableCell>
                      <AdminTableCell><Badge variant={p.purpose === 'cod_advance' ? 'secondary' : 'outline'} className="text-[11px]">{p.purpose}</Badge></AdminTableCell>
                      <AdminTableCell className="font-medium whitespace-nowrap text-[13px]">{formatPrice(p.amount)}</AdminTableCell>
                      <AdminTableCell><Badge variant={p.status === 'captured' ? 'default' : p.status === 'failed' ? 'destructive' : 'outline'} className="text-[11px]">{p.status}</Badge></AdminTableCell>
                      <AdminTableCell className="text-right">{typeof p.orderId === 'object' ? (
                        <RowActions
                          label={`Actions for ${typeof p.orderId === 'object' ? (p.orderId as any).orderNumber : p.orderNumber}`}
                          items={[
                            {
                              label: 'Refund',
                              icon: <XCircle className="h-3.5 w-3.5 mr-2" />,
                              danger: true,
                              onSelect: () => handleRefund((p.orderId as any)._id),
                            },
                          ]}
                        />
                      ) : <span className="text-muted-foreground">—</span>}</AdminTableCell>
                    </AdminTableRow>
                  ))}
                </AdminTableBody>
              </AdminTable>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'cod' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-4 w-4" /> COD — advance paid vs balance due</CardTitle><CardDescription>Doc §21: advance reduces RTO. Collect balance on delivery.</CardDescription></CardHeader>
          <CardContent>
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Order</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Total</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Advance</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Due</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">RP Payment</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Pay Status</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {codOrders.map((o: any) => (
                  <AdminTableRow key={o._id}>
                    <AdminTableCell className="font-mono text-xs font-medium">{o.orderNumber}</AdminTableCell>
                    <AdminTableCell className="whitespace-nowrap text-[13px]">{formatPrice(o.total)}</AdminTableCell>
                    <AdminTableCell className="text-emerald-600 font-medium whitespace-nowrap text-[13px]">{formatPrice(o.codAdvancePaid || 0)}</AdminTableCell>
                    <AdminTableCell className="text-amber-600 font-medium whitespace-nowrap text-[13px]">{formatPrice(o.codBalance ?? o.total)}</AdminTableCell>
                    <AdminTableCell className="font-mono text-xs truncate max-w-[160px]">{o.razorpayPaymentId || <span className="text-muted-foreground">—</span>}</AdminTableCell>
                    <AdminTableCell><Badge variant="outline" className="text-[11px]">{o.paymentStatus}</Badge></AdminTableCell>
                    <AdminTableCell className="text-right">
                      <RowActions
                        label={`Actions for ${o.orderNumber}`}
                        items={[
                          {
                            label: 'View details',
                            icon: <Eye className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => router.push(`/admin/orders/${o._id}`),
                          },
                        ]}
                      />
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
            {codOrders.length === 0 && <p className="text-sm text-muted-foreground py-4">No COD orders yet.</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'orders' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> All orders payment state</CardTitle></CardHeader>
          <CardContent>
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Order</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Method</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Total</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Pay Status</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
                  <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {ordersLoading ? <AdminTableRow><AdminTableCell className="text-[13px]">Loading…</AdminTableCell></AdminTableRow> : orders.map((o: any) => (
                  <AdminTableRow key={o._id}>
                    <AdminTableCell className="font-mono text-xs font-medium">
                      <Link href={`/admin/orders/${o._id}`} className="hover:underline">{o.orderNumber}</Link>
                    </AdminTableCell>
                    <AdminTableCell className="text-[13px] truncate max-w-[120px]">{o.paymentMethod}</AdminTableCell>
                    <AdminTableCell className="whitespace-nowrap text-[13px]">{formatPrice(o.total)}</AdminTableCell>
                    <AdminTableCell><Badge variant={o.paymentStatus === 'confirmed' ? 'default' : 'outline'} className="text-[11px]">{o.paymentStatus}</Badge></AdminTableCell>
                    <AdminTableCell className="text-[13px] truncate max-w-[120px]">{o.status}</AdminTableCell>
                    <AdminTableCell className="text-right">
                      <RowActions
                        label={`Actions for ${o.orderNumber}`}
                        items={[
                          {
                            label: 'View details',
                            icon: <Eye className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => router.push(`/admin/orders/${o._id}`),
                          },
                          {
                            label: 'Refund',
                            icon: <XCircle className="h-3.5 w-3.5 mr-2" />,
                            danger: true,
                            onSelect: () => handleRefund(o._id),
                          },
                        ]}
                      />
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
