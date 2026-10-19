'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Eye, Package, RefreshCw, Search, X, Warehouse as WarehouseIcon, Boxes,
  AlertTriangle, ArrowLeftRight, History, Plus, TrendingUp, Layers, Gauge,
} from 'lucide-react';
import {
  getWarehouses,
  getLowStockAlerts,
  type Warehouse,
  type LowStockAlert,
} from '@/lib/api/inventory';

type SeverityFilter = 'all' | 'critical' | 'warning';

export default function InventoryDashboardClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertStats, setAlertStats] = useState({ total: 0, critical: 0, warning: 0 });
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [warehousesRes, alertsRes] = await Promise.all([
        getWarehouses({ limit: 50 }),
        getLowStockAlerts(),
      ]);
      setWarehouses(warehousesRes?.warehouses || []);
      setLowStockAlerts(alertsRes?.alerts || []);
      setAlertStats({
        total: alertsRes?.totalAlerts || 0,
        critical: alertsRes?.criticalCount || 0,
        warning: alertsRes?.warningCount || 0,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load inventory data',
        variant: 'destructive',
      });
      setWarehouses([]);
      setLowStockAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWarehouseStats = (warehouse: Warehouse) => {
    const totalStock = warehouse.stock.reduce((sum, s) => sum + s.quantity, 0);
    const totalReserved = warehouse.stock.reduce((sum, s) => sum + s.reservedQuantity, 0);
    const totalAvailable = warehouse.stock.reduce((sum, s) => sum + (s.availableQuantity ?? s.quantity - s.reservedQuantity), 0);
    const lowStockCount = warehouse.stock.filter((s) => s.quantity <= s.reorderPoint).length;
    const outOfStock = warehouse.stock.filter((s) => s.quantity === 0).length;
    const capacity = warehouse.settings?.maxCapacity || 0;
    const fillPct = capacity > 0 ? Math.min(100, Math.round((totalStock / capacity) * 100)) : null;
    return { totalStock, totalReserved, totalAvailable, lowStockCount, outOfStock, capacity, fillPct };
  };

  // Aggregate totals across all warehouses
  const totals = useMemo(() => warehouses.reduce(
    (acc, w) => {
      const s = calculateWarehouseStats(w);
      return {
        units: acc.units + s.totalStock,
        available: acc.available + s.totalAvailable,
        reserved: acc.reserved + s.totalReserved,
        skus: acc.skus + w.stock.length,
        lowStock: acc.lowStock + s.lowStockCount,
        outOfStock: acc.outOfStock + s.outOfStock,
        capacity: acc.capacity + s.capacity,
      };
    },
    { units: 0, available: 0, reserved: 0, skus: 0, lowStock: 0, outOfStock: 0, capacity: 0 },
  ), [warehouses]);

  const utilisationPct = totals.capacity > 0 ? Math.round((totals.units / totals.capacity) * 100) : null;

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lowStockAlerts.filter((a) => {
      const matchSearch = !q
        || a.productName.toLowerCase().includes(q)
        || (a.productSku || '').toLowerCase().includes(q)
        || a.warehouseName.toLowerCase().includes(q);
      const matchSeverity = severityFilter === 'all' || a.severity === severityFilter;
      return matchSearch && matchSeverity;
    });
  }, [lowStockAlerts, search, severityFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 space-y-4 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Boxes className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Inventory Dashboard</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              {warehouses.length} warehouses · {totals.skus} SKUs tracked
              {utilisationPct !== null && <span className="text-slate-400"> · {utilisationPct}% capacity used</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Link href="/admin/inventory/transfer">
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
              <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" /> Transfer
            </Button>
          </Link>
          <Link href="/admin/inventory/warehouses/new">
            <Button size="sm" className="h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shadow-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Warehouse
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: 'Warehouses', value: warehouses.length, sub: `${warehouses.filter((w) => w.isActive).length} active`, icon: WarehouseIcon, tone: 'text-slate-900 dark:text-white', ring: 'border-slate-200 dark:border-slate-800' },
          { label: 'SKUs', value: totals.skus, sub: 'variants tracked', icon: Layers, tone: 'text-slate-900 dark:text-white', ring: 'border-slate-200 dark:border-slate-800' },
          { label: 'Stock units', value: totals.units.toLocaleString(), sub: `${totals.available.toLocaleString()} available`, icon: Package, tone: 'text-emerald-600', ring: 'border-emerald-200 dark:border-emerald-800' },
          { label: 'Reserved', value: totals.reserved.toLocaleString(), sub: 'in open orders', icon: TrendingUp, tone: 'text-violet-600', ring: 'border-violet-200 dark:border-violet-800' },
          { label: 'Low stock', value: alertStats.total, sub: `${alertStats.critical} critical`, icon: AlertTriangle, tone: 'text-amber-600', ring: 'border-amber-200 dark:border-amber-800' },
          { label: 'Out of stock', value: totals.outOfStock, sub: 'zero qty SKUs', icon: Gauge, tone: totals.outOfStock > 0 ? 'text-rose-600' : 'text-slate-400', ring: totals.outOfStock > 0 ? 'border-rose-200 dark:border-rose-800' : 'border-slate-200 dark:border-slate-800' },
        ].map((k) => (
          <Card key={k.label} className={`rounded-xl border ${k.ring} shadow-sm`}>
            <CardContent className="p-2.5">
              <div className="flex items-center gap-1.5">
                <k.icon className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">{k.label}</span>
              </div>
              <div className={`text-xl font-black tracking-tight mt-1 ${k.tone}`}>{k.value}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alerts */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <h2 className="text-sm font-extrabold tracking-tight">Low Stock Alerts</h2>
            <Badge className="bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-full px-1.5">{lowStockAlerts.length}</Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, SKU, warehouse…"
                className="pl-8 pr-7 h-8 rounded-lg text-[11px]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              {([
                { k: 'all', n: 'All', c: alertStats.total },
                { k: 'critical', n: 'Critical', c: alertStats.critical },
                { k: 'warning', n: 'Warning', c: alertStats.warning },
              ] as const).map((f) => (
                <Button
                  key={f.k}
                  variant={severityFilter === f.k ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSeverityFilter(f.k)}
                  className={`rounded-full text-[10px] uppercase font-extrabold h-8 px-2.5 ${
                    severityFilter === f.k
                      ? f.k === 'critical' ? 'bg-rose-500 hover:bg-rose-600 text-white' : f.k === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : 'bg-slate-900 hover:bg-slate-800 text-white'
                      : ''
                  }`}
                >
                  {f.n}
                  <span className="ml-1.5 text-[9px] opacity-60">{f.c}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <CardContent className="p-10 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold">
                {lowStockAlerts.length === 0 ? 'All stock levels healthy' : 'No alerts match your filters'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {lowStockAlerts.length === 0
                  ? 'No product is at or below its reorder point.'
                  : 'Try a different severity or clear the search.'}
              </p>
            </div>
          </CardContent>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Product</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Warehouse</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Stock level</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Stock</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Reorder at</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Severity</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredAlerts.slice(0, 8).map((alert, idx) => {
                const pct = alert.reorderPoint > 0
                  ? Math.min(100, Math.round((alert.currentStock / alert.reorderPoint) * 100))
                  : 0;
                return (
                  <AdminTableRow key={idx} className="hover:bg-amber-500/[0.03] transition-colors">
                    <AdminTableCell>
                      <div className="max-w-[220px]">
                        <div className="text-[11px] font-bold truncate">{alert.productName}</div>
                        <div className="text-[10px] text-muted-foreground truncate font-mono">{alert.productSku}</div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="max-w-[160px]">
                      <span className="text-[11px] truncate block">{alert.warehouseName}</span>
                    </AdminTableCell>
                    <AdminTableCell className="w-28">
                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${alert.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <span className={`text-xs font-black ${alert.currentStock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {alert.currentStock}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <span className="text-[11px] font-bold text-muted-foreground">{alert.reorderPoint}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <Badge className={alert.severity === 'critical'
                        ? 'bg-rose-500 text-white text-[9px] font-extrabold rounded-full px-2'
                        : 'bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-full px-2'}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <RowActions
                        label={`Actions for ${alert.productName}`}
                        items={[
                          {
                            label: 'Reorder stock',
                            icon: <RefreshCw className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => router.push('/admin/inventory/stock'),
                          },
                          {
                            label: 'View movements',
                            icon: <History className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => router.push('/admin/inventory/movements'),
                          },
                        ]}
                      />
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </AdminTableBody>
          </AdminTable>
        )}
        {filteredAlerts.length > 8 && (
          <div className="px-3.5 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">
              Showing top 8 of <span className="font-extrabold text-slate-600 dark:text-slate-300">{filteredAlerts.length}</span> alerts
            </span>
            <Link href="/admin/inventory/stock" className="text-[10px] font-extrabold text-amber-600 hover:underline">
              Manage stock →
            </Link>
          </div>
        )}
      </Card>

      {/* Warehouses */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <WarehouseIcon className="h-3.5 w-3.5 text-amber-500" />
            <h2 className="text-sm font-extrabold tracking-tight">Warehouses</h2>
            <Badge variant="outline" className="text-[9px] font-extrabold rounded-full px-1.5">{warehouses.length}</Badge>
          </div>
          <Link href="/admin/inventory/warehouses" className="text-[10px] font-extrabold text-amber-600 hover:underline">
            Manage warehouses →
          </Link>
        </div>

        {warehouses.length === 0 ? (
          <CardContent className="p-10 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <WarehouseIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold">No warehouses yet</p>
              <p className="text-[11px] text-muted-foreground">Create your first warehouse to start tracking stock.</p>
              <Link href="/admin/inventory/warehouses/new">
                <Button size="sm" className="mt-1 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Warehouse
                </Button>
              </Link>
            </div>
          </CardContent>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Warehouse</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Location</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Units</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Avail</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Reserved</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">SKUs</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Capacity</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Flags</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {warehouses.map((warehouse) => {
                const stats = calculateWarehouseStats(warehouse);
                return (
                  <AdminTableRow key={warehouse._id} className="hover:bg-amber-500/[0.03] transition-colors">
                    <AdminTableCell>
                      <div className="max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold truncate">{warehouse.name}</span>
                          {warehouse.isDefault && (
                            <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded px-1">DEFAULT</Badge>
                          )}
                        </div>
                        <code className="text-[10px] font-mono text-muted-foreground">{warehouse.code}</code>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="max-w-[180px]">
                        <div className="text-[11px] truncate">
                          {warehouse.address.city}, {warehouse.address.state}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{warehouse.address.country}</div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <span className="text-xs font-black">{stats.totalStock.toLocaleString()}</span>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <span className="text-[11px] font-bold text-emerald-600">{stats.totalAvailable.toLocaleString()}</span>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <span className="text-[11px] font-bold text-violet-600">{stats.totalReserved.toLocaleString()}</span>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <span className="text-[11px] font-bold text-muted-foreground">{warehouse.stock.length}</span>
                    </AdminTableCell>
                    <AdminTableCell className="w-28">
                      {stats.fillPct !== null ? (
                        <>
                          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${stats.fillPct >= 90 ? 'bg-rose-500' : stats.fillPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${stats.fillPct}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                            {stats.fillPct}% of {stats.capacity.toLocaleString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400">Not set</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={warehouse.isActive
                          ? 'bg-emerald-500 text-white text-[8px] font-extrabold rounded-full px-1.5'
                          : 'bg-slate-400 text-white text-[8px] font-extrabold rounded-full px-1.5'}>
                          {warehouse.isActive ? 'ACTIVE' : 'OFF'}
                        </Badge>
                        {stats.outOfStock > 0 && (
                          <Badge className="bg-rose-500 text-white text-[8px] font-extrabold rounded-full px-1.5">{stats.outOfStock} OOS</Badge>
                        )}
                        {stats.lowStockCount > 0 && (
                          <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded-full px-1.5">{stats.lowStockCount} LOW</Badge>
                        )}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <RowActions
                        label={`Actions for ${warehouse.name}`}
                        items={[
                          {
                            label: 'View details',
                            icon: <Eye className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => router.push(`/admin/inventory/warehouses/${warehouse._id}`),
                          },
                          {
                            label: 'Adjust stock',
                            icon: <Package className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => router.push('/admin/inventory/stock'),
                          },
                          {
                            label: 'Stock movements',
                            icon: <History className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => router.push('/admin/inventory/movements'),
                          },
                        ]}
                      />
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </AdminTableBody>
          </AdminTable>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { href: '/admin/inventory/stock', icon: Package, title: 'Add / Adjust Stock', sub: 'Receive or correct quantities' },
          { href: '/admin/inventory/movements', icon: History, title: 'Stock Movements', sub: 'Full audit trail of changes' },
          { href: '/admin/inventory/transfer', icon: ArrowLeftRight, title: 'Stock Transfer', sub: 'Move stock between warehouses' },
          { href: '/admin/inventory/warehouses', icon: WarehouseIcon, title: 'Warehouses', sub: 'Manage locations & capacity' },
        ].map((q) => (
          <Link key={q.href} href={q.href}>
            <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <q.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[11px] font-extrabold truncate">{q.title}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{q.sub}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}