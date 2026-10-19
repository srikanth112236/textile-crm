'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';
import {
  BellRing, Tag, ExternalLink, RefreshCw, Search, X, Filter, ChevronLeft, ChevronRight,
  Download, ShieldCheck, Clock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { alertsApi } from '@/lib/api/alerts';

type SeverityFilter = 'all' | 'notified' | 'pending';

export default function StockAlertsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<'stock' | 'price'>('stock');
  const [subs, setSubs] = useState<any[]>([]);
  const [pending, setPending] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'notified' | 'pending'>('all');

  useEffect(() => { load(); }, [tab]);

  const load = async () => {
    try {
      setLoading(true);
      const [s, p] = await Promise.all([alertsApi.adminBackInStock(), alertsApi.adminPriceAlerts()]);
      setSubs(s.subscriptions || []);
      setPending(s.pending || 0);
      setAlerts(p.alerts || []);
      setActive(p.active || 0);
    } catch (e: any) {
      toast({ title: 'Load failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = useMemo(() => {
    const q = search.toLowerCase();
    return subs.filter((s: any) => {
      const matchText = !q ||
        (s.productName || '').toLowerCase().includes(q) ||
        (s.productId?.name || '').toLowerCase().includes(q) ||
        (s.contact || '').toLowerCase().includes(q) ||
        (s.size || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'notified' && s.notified)
        || (statusFilter === 'pending' && !s.notified);
      return matchText && matchStatus;
    });
  }, [subs, search, statusFilter]);

  const stockStats = useMemo(() => ({
    total: subs.length,
    notified: subs.filter((s: any) => s.notified).length,
    pending: subs.filter((s: any) => !s.notified).length,
  }), [subs]);

  const priceFilters = useMemo(() => {
    const q = search.toLowerCase();
    return alerts.filter((a: any) => {
      const matchText = !q ||
        (a.productName || '').toLowerCase().includes(q) ||
        (a.productId?.name || '').toLowerCase().includes(q) ||
        (a.contact || '').toLowerCase().includes(q);
      return matchText;
    });
  }, [alerts, search]);

  const getStatusBadge = (notified: boolean) =>
    <Badge className={notified ? 'bg-emerald-500 text-white text-[10px] font-extrabold rounded-full px-2' : 'bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full px-2'}>
      {notified ? 'NOTIFIED' : 'PENDING'}
    </Badge>;

  return (
    <div className="px-3 py-4 space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <BellRing className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Retention Alerts</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              Back-in-stock subscriptions and price-drop alerts · Auto-notified via email + WhatsApp + in-app
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Back-in-stock', value: stockStats.total, sub: `${stockStats.pending} pending · ${stockStats.notified} notified`, tone: 'text-violet-600', ring: 'border-violet-200 dark:border-violet-800' },
          { label: 'Price alerts', value: active, sub: 'Active subscribers', tone: 'text-amber-600', ring: 'border-amber-200 dark:border-amber-800' },
          { label: 'Price subscribers', value: alerts.length, sub: 'Price-drop subscriptions', tone: 'text-emerald-600', ring: 'border-emerald-200 dark:border-emerald-800' },
          { label: 'Notified rate', value: stockStats.total > 0 ? Math.round((stockStats.notified / stockStats.total) * 100) + '%' : '—', sub: 'Back-in-stock delivery rate', tone: 'text-slate-900 dark:text-white', ring: 'border-slate-200 dark:border-slate-800' },
        ].map((k) => (
          <Card key={k.label} className={`rounded-xl border ${k.ring} shadow-sm`}>
            <CardContent className="p-2.5">
              <div className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">{k.label}</div>
              <div className={`text-xl font-black tracking-tight mt-0.5 ${k.tone}`}>{k.value}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Picker */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'stock' | 'price')}>
        <TabsList className="h-9 rounded-xl shadow-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-0.5 p-0.5">
          <TabsTrigger value="stock" className="h-7 rounded-lg text-[10px] font-extrabold uppercase tracking-widest data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-violet-500/10">
            Back-in-Stock <Badge variant="secondary" className="ml-1 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200 text-[9px] font-extrabold">{pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="price" className="h-7 rounded-lg text-[10px] font-extrabold uppercase tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=inactive]:hover:bg-amber-500/10">
            Price Drops <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200 text-[9px] font-extrabold">{active}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Back-in-Stock Table */}
      {tab === 'stock' && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BellRing className="h-3.5 w-3.5 text-violet-500" />
              <h2 className="text-sm font-extrabold tracking-tight">Back-in-Stock Subscriptions</h2>
              <Badge variant="outline" className="text-[9px] font-extrabold rounded-full px-1.5">{filteredStock.length} / {subs.length}</Badge>
            </div>
            <div className="flex gap-2">
              <div className="relative w-56">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Product, SKU, contact…"
                  className="pl-8 pr-7 h-8 rounded-xl text-[11px]"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SeverityFilter)}>
                <SelectTrigger className="h-8 rounded-xl text-[10px] w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="notified">Notified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Product</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Contact</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">WhatsApp</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Subscribed</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Size</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredStock.length > 0 ? filteredStock.map((s: any) => (
                <AdminTableRow key={s._id}>
                  <AdminTableCell>
                    <div className="max-w-[220px]">
                      <div className="font-bold text-xs truncate">{s.productName || (s.productId?.name) || s.productId}</div>
                      <div className="text-[9px] text-muted-foreground truncate font-mono">SKU: {(s.productId?.sku || s.sku || '—')}</div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-[11px] truncate max-w-[160px]">{s.contact}</AdminTableCell>
                  <AdminTableCell className="text-[11px] whitespace-nowrap">{s.whatsappConsent ? 'Yes' : '—'}</AdminTableCell>
                  <AdminTableCell>{getStatusBadge(s.notified)}</AdminTableCell>
                  <AdminTableCell className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' })}</AdminTableCell>
                  <AdminTableCell className="text-[11px] font-bold">{s.size || '—'}</AdminTableCell>
                  <AdminTableCell className="text-right">
                    <RowActions
                      label={`Actions for ${s.productName || 'subscription'}`}
                      items={[
                        {
                          label: 'Open product',
                          icon: <ExternalLink className="h-3.5 w-3.5 mr-2" />,
                          onSelect: () => router.push(`/admin/products/${typeof s.productId === 'object' ? s.productId._id : s.productId}`),
                        },
                      ]}
                    />
                  </AdminTableCell>
                </AdminTableRow>
              )) : (
                <AdminTableRow>
                  <AdminTableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                    No subscriptions match your filters.
                  </AdminTableCell>
                </AdminTableRow>
              )}
            </AdminTableBody>
          </AdminTable>
        </Card>
      )}

      {/* Price-drop Alerts Table */}
      {tab === 'price' && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <CardTitle className="text-sm font-extrabold tracking-tight flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-amber-500" /> Price-drop Subscriptions
              <Badge variant="outline" className="text-[9px] font-extrabold rounded-full px-1.5">{priceFilters.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {priceFilters.length > 0 ? (
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Product</AdminTableHead>
                    <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Target ₹</AdminTableHead>
                    <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Last Notified At</AdminTableHead>
                    <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Contact</AdminTableHead>
                    <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
                    <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {priceFilters.map((a: any) => (
                    <AdminTableRow key={a._id}>
                      <AdminTableCell className="font-bold truncate max-w-[220px] text-[13px]">{a.productName || a.productId?.name || a.productId}</AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-[13px] font-bold text-amber-600">{formatPrice(a.targetPrice)}</AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-[13px]">{a.lastNotifiedPrice !== undefined ? formatPrice(a.lastNotifiedPrice) : '—'}</AdminTableCell>
                      <AdminTableCell className="font-mono text-[11px] truncate max-w-[180px]">{a.contact || 'in-app only'}</AdminTableCell>
                      <AdminTableCell><Badge variant={a.active ? 'secondary' : 'outline'} className="text-[11px] font-extrabold">{a.active ? 'Active' : 'Off'}</Badge></AdminTableCell>
                      <AdminTableCell className="text-right">
                        <RowActions
                          label={`Actions for ${a.productName || 'price alert'}`}
                          items={[
                            {
                              label: 'Open product',
                              icon: <ExternalLink className="h-3.5 w-3.5 mr-2" />,
                              onSelect: () => router.push(`/admin/products/${typeof a.productId === 'object' ? a.productId._id : a.productId}`),
                            },
                          ]}
                        />
                      </AdminTableCell>
                    </AdminTableRow>
                  ))}
                </AdminTableBody>
              </AdminTable>
            ) : (
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No price alerts found.
              </CardContent>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
