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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pencil, Trash2, Plus, Search, X, Warehouse as WarehouseIcon, ShieldCheck, Loader2, Package,
  Eye, User, Settings2, Boxes, Mail, Phone, Globe, Layers,
  History, ArrowLeftRight, PackagePlus,
} from 'lucide-react';
import {
  getWarehouses,
  getWarehouse,
  deleteWarehouse,
  updateWarehouse,
  type Warehouse,
} from '@/lib/api/inventory';

export default function WarehousesPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Warehouse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await getWarehouses({ limit: 100 });
      setWarehouses(response?.warehouses || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load warehouses',
        variant: 'destructive',
      });
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = (w: Warehouse) => {
    const units = w.stock.reduce((s, x) => s + x.quantity, 0);
    const available = w.stock.reduce((s, x) => s + (x.availableQuantity ?? x.quantity - x.reservedQuantity), 0);
    const reserved = w.stock.reduce((s, x) => s + x.reservedQuantity, 0);
    const low = w.stock.filter((s) => s.quantity <= s.reorderPoint && s.quantity > 0).length;
    const out = w.stock.filter((s) => s.quantity === 0).length;
    const capacity = w.settings?.maxCapacity || 0;
    const pct = capacity > 0 ? Math.min(100, Math.round((units / capacity) * 100)) : null;
    return { units, available, reserved, low, out, capacity, pct };
  };

  const openDetails = async (id: string) => {
    setDetailId(id);
    setStockSearch('');
    setStockFilter('all');
    // Show whatever the list already has, then refresh with the full record.
    setDetail(warehouses.find((w) => w._id === id) || null);
    try {
      setDetailLoading(true);
      const full = await getWarehouse(id);
      setDetail(full);
    } catch {
      // Keep the list-derived copy so the modal still shows something useful.
    } finally {
      setDetailLoading(false);
    }
  };

  const detailStats = detail ? stats(detail) : null;

  const filteredStock = useMemo(() => {
    if (!detail) return [];
    const q = stockSearch.trim().toLowerCase();
    return detail.stock.filter((s) => {
      const pid = s.productId as any;
      const name = typeof pid === 'object' && pid ? (pid.name || '') : '';
      const sku = typeof pid === 'object' && pid ? (pid.sku || '') : (s.variantSku || '');
      const matchSearch = !q
        || name.toLowerCase().includes(q)
        || String(sku).toLowerCase().includes(q)
        || String(s.productId).toLowerCase().includes(q)
        || (s.location || '').toLowerCase().includes(q);
      const matchFilter = stockFilter === 'all'
        || (stockFilter === 'out' && s.quantity === 0)
        || (stockFilter === 'low' && s.quantity > 0 && s.quantity <= s.reorderPoint);
      return matchSearch && matchFilter;
    });
  }, [detail, stockSearch, stockFilter]);

  const totals = useMemo(() => warehouses.reduce(
    (acc, w) => {
      const s = stats(w);
      return { units: acc.units + s.units, skus: acc.skus + w.stock.length, low: acc.low + s.low };
    },
    { units: 0, skus: 0, low: 0 },
  ), [warehouses]);

  const handleDelete = async () => {
    if (!warehouseToDelete) return;

    // Client-side guard: the default warehouse is protected.
    if (warehouseToDelete.isDefault) {
      toast({
        title: 'Default warehouse is protected',
        description: 'Set another warehouse as default before deleting this one.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setDeleting(true);
      await deleteWarehouse(warehouseToDelete._id);
      toast({ title: 'Warehouse deleted', description: `${warehouseToDelete.name} removed.` });
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
      fetchWarehouses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to delete warehouse',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const makeDefault = async (w: Warehouse) => {
    try {
      setBusyId(w._id);
      await updateWarehouse(w._id, {
        isDefault: true,
        isActive: w.isActive,
      });
      toast({ title: `${w.name} is now the default warehouse` });
      fetchWarehouses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to set default',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const filteredWarehouses = warehouses.filter((w) => {
    const q = searchTerm.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.code.toLowerCase().includes(q) ||
      (w.address.city || '').toLowerCase().includes(q) ||
      (w.address.state || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 space-y-4 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <WarehouseIcon className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Warehouses</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              {warehouses.length} locations · {totals.skus} SKUs · {totals.units.toLocaleString()} units
              {totals.low > 0 && <span className="text-amber-600 font-bold"> · {totals.low} low stock</span>}
            </p>
          </div>
        </div>
        <Link href="/admin/inventory/warehouses/new">
          <Button size="sm" className="h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shadow-sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Warehouse
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, code, city, state…"
              className="pl-9 pr-8 h-9 rounded-xl text-xs"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="sm:ml-auto text-[10px] text-muted-foreground font-medium">
            {filteredWarehouses.length} of {warehouses.length} warehouses
          </div>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredWarehouses.length === 0 ? (
          <CardContent className="p-10 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <WarehouseIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold">
                {warehouses.length === 0 ? 'No warehouses yet' : 'No warehouses match your search'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {warehouses.length === 0
                  ? 'Create your first warehouse to start tracking stock.'
                  : 'Try a different name, code or city.'}
              </p>
              {warehouses.length === 0 && (
                <Link href="/admin/inventory/warehouses/new">
                  <Button size="sm" className="mt-1 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Warehouse
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Warehouse</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Location</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Contact</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Units</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">SKUs</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Capacity</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Priority</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
                <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredWarehouses.map((warehouse) => {
                const s = stats(warehouse);
                const isOnly = warehouses.length <= 1;
                const locked = warehouse.isDefault || isOnly;
                return (
                  <AdminTableRow key={warehouse._id} className="hover:bg-amber-500/[0.03] transition-colors">
                    <AdminTableCell>
                      <div className="max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold truncate">{warehouse.name}</span>
                          {warehouse.isDefault && (
                            <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded px-1 flex items-center gap-0.5">
                              <ShieldCheck className="h-2 w-2" /> DEFAULT
                            </Badge>
                          )}
                        </div>
                        <code className="text-[10px] font-mono text-muted-foreground">{warehouse.code}</code>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="max-w-[200px]">
                        <div className="text-[11px] truncate">{warehouse.address.street}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {warehouse.address.city}
                          {warehouse.address.state ? `, ${warehouse.address.state}` : ''}
                          {warehouse.address.zip ? ` — ${warehouse.address.zip}` : ''}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{warehouse.address.country}</div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      {warehouse.contact ? (
                        <div className="text-[11px] max-w-[170px]">
                          {warehouse.contact.name && <div className="truncate font-semibold">{warehouse.contact.name}</div>}
                          {warehouse.contact.email && <div className="text-[10px] text-muted-foreground truncate">{warehouse.contact.email}</div>}
                          {warehouse.contact.phone && <div className="text-[10px] text-muted-foreground truncate">{warehouse.contact.phone}</div>}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <span className="text-xs font-black">{s.units.toLocaleString()}</span>
                      {s.low > 0 && <div className="text-[9px] font-bold text-amber-600">{s.low} low</div>}
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <span className="text-[11px] font-bold text-muted-foreground">{warehouse.stock.length}</span>
                    </AdminTableCell>
                    <AdminTableCell className="w-24">
                      {s.pct !== null ? (
                        <>
                          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.pct >= 90 ? 'bg-rose-500' : s.pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">{s.pct}%</div>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400">Not set</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <Badge variant="outline" className="text-[9px] font-extrabold rounded-md">{warehouse.settings.priority}</Badge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={warehouse.isActive
                          ? 'bg-emerald-500 text-white text-[8px] font-extrabold rounded-full px-1.5'
                          : 'bg-slate-400 text-white text-[8px] font-extrabold rounded-full px-1.5'}>
                          {warehouse.isActive ? 'ACTIVE' : 'OFF'}
                        </Badge>
                        {warehouse.settings?.isPickup && (
                          <Badge variant="outline" className="text-[8px] font-extrabold rounded-full px-1.5">PICKUP</Badge>
                        )}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View full details &amp; stock"
                          onClick={() => openDetails(warehouse._id)}
                          className="h-7 px-2 rounded-lg text-[10px] font-extrabold hover:bg-amber-500/10"
                        >
                          <Eye className="h-3 w-3" /> Details
                        </Button>
                        {!warehouse.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Set as default warehouse"
                            disabled={busyId === warehouse._id}
                            onClick={() => makeDefault(warehouse)}
                            className="h-7 px-2 rounded-lg text-[10px] font-extrabold text-amber-600 hover:bg-amber-500/10"
                          >
                            {busyId === warehouse._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                            Set Default
                          </Button>
                        )}
                        <RowActions
                          label={`Actions for ${warehouse.name}`}
                          items={[
                            {
                              label: 'View full details',
                              icon: <Eye className="h-3.5 w-3.5 mr-2" />,
                              onSelect: () => openDetails(warehouse._id),
                            },
                            {
                              label: 'Edit details',
                              icon: <Pencil className="h-3.5 w-3.5 mr-2" />,
                              onSelect: () => router.push(`/admin/inventory/warehouses/${warehouse._id}`),
                            },
                            {
                              label: 'Adjust stock',
                              icon: <Package className="h-3.5 w-3.5 mr-2" />,
                              onSelect: () => router.push('/admin/inventory/stock'),
                            },
                            {
                              label: warehouse.isDefault
                                ? 'Cannot delete — default warehouse'
                                : isOnly
                                  ? 'Cannot delete — only warehouse'
                                  : 'Delete warehouse',
                              icon: <Trash2 className="h-3.5 w-3.5 mr-2" />,
                              danger: true,
                              disabled: locked,
                              onSelect: () => {
                                setWarehouseToDelete(warehouse);
                                setDeleteDialogOpen(true);
                              },
                            },
                          ]}
                        />
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </AdminTableBody>
          </AdminTable>
        )}
      </Card>

      {/* Full Details Modal */}
      <Dialog
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
            setDetail(null);
            setStockSearch('');
            setStockFilter('all');
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0">
          {detail && detailStats ? (
            <>
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <WarehouseIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base font-extrabold flex items-center gap-1.5 flex-wrap">
                      {detail.name}
                      {detail.isDefault && (
                        <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded px-1 flex items-center gap-0.5">
                          <ShieldCheck className="h-2 w-2" /> DEFAULT
                        </Badge>
                      )}
                      <Badge className={detail.isActive
                        ? 'bg-emerald-500 text-white text-[8px] font-extrabold rounded-full px-1.5'
                        : 'bg-slate-400 text-white text-[8px] font-extrabold rounded-full px-1.5'}>
                        {detail.isActive ? 'ACTIVE' : 'OFF'}
                      </Badge>
                      {detailLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] mt-0.5 flex items-center gap-2 flex-wrap">
                      <code className="font-mono font-bold text-amber-600">{detail.code}</code>
                      <span>·</span>
                      <span>{detail.address.street}</span>
                      <span>·</span>
                      <span>{detail.address.city}{detail.address.state ? `, ${detail.address.state}` : ''}{detail.address.zip ? ` — ${detail.address.zip}` : ''}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{detail.address.country}</span>
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Stock KPI strip */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: 'Units', value: detailStats.units.toLocaleString(), tone: 'text-slate-900 dark:text-white' },
                    { label: 'Available', value: detailStats.available.toLocaleString(), tone: 'text-emerald-600' },
                    { label: 'Reserved', value: detailStats.reserved.toLocaleString(), tone: 'text-violet-600' },
                    { label: 'SKUs', value: detail.stock.length, tone: 'text-slate-900 dark:text-white' },
                    { label: 'Low stock', value: detailStats.low, tone: detailStats.low > 0 ? 'text-amber-600' : 'text-slate-400' },
                    { label: 'Out of stock', value: detailStats.out, tone: detailStats.out > 0 ? 'text-rose-600' : 'text-slate-400' },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 text-center">
                      <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">{k.label}</p>
                      <p className={`text-base font-black mt-0.5 ${k.tone}`}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Capacity */}
                {detailStats.pct !== null && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">Capacity used</span>
                      <span className="text-[10px] font-extrabold">
                        {detailStats.units.toLocaleString()} / {detailStats.capacity.toLocaleString()} units
                        <span className={`ml-1.5 ${detailStats.pct >= 90 ? 'text-rose-600' : detailStats.pct >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ({detailStats.pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${detailStats.pct >= 90 ? 'bg-rose-500' : detailStats.pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${detailStats.pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Details grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Fulfilment settings */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <Settings2 className="h-3 w-3 text-amber-500" />
                      <p className="text-[10px] font-extrabold uppercase tracking-widest">Fulfilment</p>
                    </div>
                    <dl className="p-2.5 space-y-1.5 text-[11px]">
                      {[
                        ['Priority', String(detail.settings?.priority ?? 1), detail.settings?.priority === 1 ? 'Highest' : ''],
                        ['Max capacity', detail.settings?.maxCapacity ? `${detail.settings.maxCapacity.toLocaleString()} units` : 'Not set', ''],
                        ['Handling time', detail.settings?.handlingTime != null ? `${detail.settings.handlingTime} day${detail.settings.handlingTime === 1 ? '' : 's'}` : 'Not set', ''],
                        ['Pickup point', detail.settings?.isPickup ? 'Yes' : 'No', ''],
                        ['Service regions', (detail.settings?.supportedRegions || []).length ? (detail.settings!.supportedRegions!).join(', ') : 'All India', ''],
                      ].map(([k, v, note]) => (
                        <div key={k as string} className="flex items-center justify-between gap-2">
                          <dt className="text-muted-foreground shrink-0">{k}</dt>
                          <dd className="font-bold truncate text-right">
                            {v}
                            {note && <span className="ml-1.5 text-[9px] font-bold text-amber-600">{note}</span>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Contact */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <User className="h-3 w-3 text-amber-500" />
                      <p className="text-[10px] font-extrabold uppercase tracking-widest">Contact</p>
                    </div>
                    <div className="p-2.5 space-y-1.5 text-[11px]">
                      {detail.contact?.name && (
                        <p className="font-bold">{detail.contact.name}</p>
                      )}
                      {detail.contact?.email ? (
                        <a href={`mailto:${detail.contact.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-amber-600 transition-colors truncate">
                          <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{detail.contact.email}</span>
                        </a>
                      ) : null}
                      {detail.contact?.phone && (
                        <a href={`tel:${detail.contact.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-amber-600 transition-colors">
                          <Phone className="h-3 w-3 shrink-0" /> {detail.contact.phone}
                        </a>
                      )}
                      {!detail.contact?.name && !detail.contact?.email && !detail.contact?.phone && (
                        <p className="text-muted-foreground">No contact recorded for this warehouse.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-2.5 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-1.5">
                      <Boxes className="h-3 w-3 text-amber-500" />
                      <p className="text-[10px] font-extrabold uppercase tracking-widest">Stock</p>
                      <Badge variant="outline" className="text-[8px] font-extrabold rounded-full px-1.5">{detail.stock.length}</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:ml-auto">
                      <div className="relative sm:w-52">
                        <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={stockSearch}
                          onChange={(e) => setStockSearch(e.target.value)}
                          placeholder="Search product, SKU, bin…"
                          className="w-full pl-7 pr-6 h-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[10px] outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {stockSearch && (
                          <button onClick={() => setStockSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {([
                          { k: 'all', n: 'All', c: detail.stock.length },
                          { k: 'low', n: 'Low', c: detailStats.low },
                          { k: 'out', n: 'OOS', c: detailStats.out },
                        ] as const).map((f) => (
                          <button
                            key={f.k}
                            onClick={() => setStockFilter(f.k)}
                            className={`h-7 px-2 rounded-lg text-[9px] uppercase font-extrabold border transition-colors ${
                              stockFilter === f.k
                                ? 'bg-amber-500 text-slate-950 border-amber-500'
                                : 'border-slate-300 dark:border-slate-700 text-muted-foreground hover:bg-amber-500/10'
                            }`}
                          >
                            {f.n} <span className="opacity-60">{f.c}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {filteredStock.length === 0 ? (
                    <div className="p-8 text-center">
                      <Layers className="h-6 w-6 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-[11px] font-bold mt-2">
                        {detail.stock.length === 0 ? 'No stock in this warehouse' : 'No stock entries match'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {detail.stock.length === 0
                          ? 'Receive stock to get started.'
                          : 'Try a different search or filter.'}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white dark:bg-slate-900 z-[1]">
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            {['Product', 'Qty', 'Reserved', 'Available', 'Reorder', 'Status'].map((h, i) => (
                              <th
                                key={h}
                                className={`py-1.5 px-2 text-[8px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap ${i > 0 ? 'text-right' : ''}`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStock.map((s, i) => {
                            const pid = s.productId as any;
                            const name = typeof pid === 'object' && pid ? pid.name : `Product ${String(s.productId).slice(-6)}`;
                            const sku = typeof pid === 'object' && pid ? pid.sku : (s.variantSku || '');
                            const available = s.availableQuantity ?? s.quantity - s.reservedQuantity;
                            const isOut = s.quantity === 0;
                            const isLow = !isOut && s.quantity <= s.reorderPoint;
                            return (
                              <tr key={s._id || s.productId + i} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-amber-500/[0.03]">
                                <td className="py-1.5 px-2 max-w-[200px]">
                                  <div className="text-[10px] font-bold truncate">{name}</div>
                                  <div className="text-[9px] text-muted-foreground truncate font-mono">
                                    {sku || '—'}{s.location ? ` · ${s.location}` : ''}
                                  </div>
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <span className={`text-[11px] font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : ''}`}>
                                    {s.quantity}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <span className="text-[10px] font-bold text-violet-600">{s.reservedQuantity}</span>
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <span className="text-[10px] font-bold text-emerald-600">{available}</span>
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <span className="text-[10px] font-bold text-muted-foreground">{s.reorderPoint}</span>
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <span className={`text-[8px] font-extrabold rounded-full px-1.5 py-0.5 whitespace-nowrap ${
                                    isOut ? 'bg-rose-500 text-white'
                                    : isLow ? 'bg-amber-500 text-slate-950'
                                    : 'bg-emerald-500 text-white'
                                  }`}>
                                    {isOut ? 'OOS' : isLow ? 'LOW' : 'OK'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {filteredStock.length > 0 && filteredStock.length !== detail.stock.length && (
                    <div className="px-2.5 py-1.5 border-t border-slate-200 dark:border-slate-800 text-[9px] text-muted-foreground font-medium">
                      Showing {filteredStock.length} of {detail.stock.length} stock entries
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <DialogFooter className="gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 sticky bottom-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDetailId(null); router.push(`/admin/inventory/warehouses/${detail._id}`); }}
                  className="h-8 rounded-lg text-[10px] font-extrabold"
                >
                  <Pencil className="h-3 w-3 mr-1.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDetailId(null); router.push('/admin/inventory/stock'); }}
                  className="h-8 rounded-lg text-[10px] font-extrabold"
                >
                  <PackagePlus className="h-3 w-3 mr-1.5" /> Adjust Stock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDetailId(null); router.push('/admin/inventory/movements'); }}
                  className="h-8 rounded-lg text-[10px] font-extrabold"
                >
                  <History className="h-3 w-3 mr-1.5" /> Movements
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setDetailId(null); router.push('/admin/inventory/transfer'); }}
                  className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold"
                >
                  <ArrowLeftRight className="h-3 w-3 mr-1.5" /> Transfer Out
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-10 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <p className="text-[11px] text-muted-foreground">Loading warehouse details…</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Delete Warehouse</DialogTitle>
            <DialogDescription className="text-[11px]">
              Permanently remove <span className="font-bold text-slate-700 dark:text-slate-200">{warehouseToDelete?.name}</span> ({warehouseToDelete?.code}).
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {warehouseToDelete && stats(warehouseToDelete).units > 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                This warehouse still holds {stats(warehouseToDelete).units.toLocaleString()} units. Transfer or adjust the stock first.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)} className="h-9 rounded-xl text-[11px] font-extrabold">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="h-9 rounded-xl text-[11px] font-extrabold"
            >
              {deleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Delete Warehouse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}