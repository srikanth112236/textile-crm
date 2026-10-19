'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllOrders, Order, OrderStatus } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Truck, Search, MapPin, CheckCircle2, Package, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';

export default function AdminDeliveriesClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [overview, setOverview] = useState<any>(null);
  const [liveInfo, setLiveInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDeliveries();
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const { adminShipmentApi } = await import('@/lib/api/adminPayments');
      const data = await adminShipmentApi.overview();
      setOverview(data);
    } catch {
      // optional until backend deployed
    }
  };

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await getAllOrders(1, 100);
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.shippingAddress.city.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
        <div>
          <Badge variant="outline" className="text-[11px] uppercase font-extrabold text-amber-600 border-amber-400 mb-1">
            Fulfillment & Express Dispatch
          </Badge>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Logistics & Deliveries Operations
          </h1>
          <p className="text-xs text-slate-500">
            Monitor real-time courier partner dispatches, BlueDart/Delhivery AWB codes, and delivery status.
          </p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold" onClick={async () => { try { const { adminShipmentApi } = await import('@/lib/api/adminPayments'); const r = await adminShipmentApi.syncStale(20); toast({ title: 'Sync complete', description: `Checked ${r.data.checked}, updated ${r.data.updated}, failed ${r.data.failed}` }); loadOverview(); } catch (e: any) { toast({ title: 'Sync failed', description: e?.response?.data?.error || 'Sync failed', variant: 'destructive' }); } }}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Sync Tracking
          </Button>
          <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md">
            <Link href="/admin/orders">
              <Package className="w-4 h-4 mr-1.5" /> Order Fulfillment
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search Order # or Destination City"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl border-slate-300 dark:border-slate-700 py-5"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            {['all', 'pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="rounded-xl text-xs uppercase font-bold capitalize flex-1 sm:flex-none"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipment overview KPIs */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-[11px] uppercase font-bold text-muted-foreground">Unshipped queue</div><div className="text-2xl font-black">{overview.unshippedQueue?.length || 0}</div><div className="text-[11px]">processing + no AWB — ship now</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] uppercase font-bold text-muted-foreground">NDR / attention</div><div className="text-2xl font-black">{overview.ndrWatch?.length || 0}</div><div className="text-[11px]">failed / RTO pattern</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] uppercase font-bold text-muted-foreground">Couriers</div>{(overview.byCourier || []).slice(0, 3).map((c: any) => <div key={c._id} className="text-xs font-bold">{c._id}: {c.count}</div>)}<div className="text-[11px]">top partners</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] uppercase font-bold text-muted-foreground">Ship status</div>{(overview.byShipStatus || []).slice(0, 4).map((s: any) => <div key={s._id} className="text-xs">{s._id}: {s.count}</div>)}</CardContent></Card>
        </div>
      )}

      {/* NDR watch */}
      {overview?.ndrWatch?.length > 0 && (
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-sm text-red-600">NDR / RTO watch — act first</CardTitle></CardHeader>
          <CardContent>
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>Order</AdminTableHead>
                  <AdminTableHead>Courier status</AdminTableHead>
                  <AdminTableHead>AWB</AdminTableHead>
                  <AdminTableHead className="text-right">Actions</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {overview.ndrWatch.slice(0, 10).map((o: any) => (
                  <AdminTableRow key={o._id}>
                    <AdminTableCell className="font-mono text-xs font-medium">{o.orderNumber}</AdminTableCell>
                    <AdminTableCell className="text-[13px] truncate max-w-[180px]">{o.shiprocketStatus || 'shipped'}</AdminTableCell>
                    <AdminTableCell className="font-mono text-xs">{o.shiprocketAWB || <span className="text-muted-foreground">—</span>}</AdminTableCell>
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
          </CardContent>
        </Card>
      )}

      {/* Deliveries Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHead>Order #</AdminTableHead>
              <AdminTableHead>Destination</AdminTableHead>
              <AdminTableHead>Courier partner</AdminTableHead>
              <AdminTableHead>AWB tracking ID</AdminTableHead>
              <AdminTableHead>Delivery status</AdminTableHead>
              <AdminTableHead className="text-right">Actions</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {filteredOrders.map((order: any) => {
              const courier = order.shiprocketCourier || 'Shiprocket partner';
              const awb = order.shiprocketAWB || order.trackingNumber || 'Not shipped yet';

              const handleShip = async () => {
                if (!confirm(`Push ${order.orderNumber} to Shiprocket?`)) return;
                try {
                  const { shipmentApi } = await import('@/lib/api/shipment');
                  await shipmentApi.shipOrder(order._id);
                  toast({ title: 'Success', description: 'Pushed to Shiprocket. Reload to see AWB.' });
                  loadDeliveries();
                  loadOverview();
                } catch (e: any) {
                  toast({ title: 'Ship failed', description: e.response?.data?.error || 'Ship failed. Check SHIPROCKET_EMAIL/PASSWORD.', variant: 'destructive' });
                }
              };

              const handleLive = async () => {
                const awb = (order as any).shiprocketAWB;
                if (!awb) { toast({ title: 'No AWB yet', description: 'No AWB yet — push to Shiprocket first.', variant: 'destructive' }); return; }
                try {
                  const { shipmentApi } = await import('@/lib/api/shipment');
                  const live = await shipmentApi.liveTrack(awb);
                  const st = live?.tracking_data?.shipment_track?.[0]?.current_status || JSON.stringify(live).slice(0, 300);
                  setLiveInfo((p) => ({ ...p, [order._id]: String(st) }));
                } catch (e: any) {
                  toast({ title: 'Live track failed', description: e.response?.data?.error || 'Live track failed.', variant: 'destructive' });
                }
              };

              return (
                <AdminTableRow key={order._id}>
                  <AdminTableCell>
                    <div className="font-mono text-xs font-medium">{order.orderNumber}</div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">{order.paymentMethod?.toUpperCase()} · {formatPrice(order.total)}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="font-medium truncate max-w-[180px]">{order.shippingAddress.city}, {order.shippingAddress.state}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">PIN: {order.shippingAddress.zip}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-1.5 font-medium truncate max-w-[180px]">
                      <Truck className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{courier}</span>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-xs">
                    <span className="truncate max-w-[180px] block">{awb}</span>
                    {liveInfo[order._id] && <div className="text-[11px] text-emerald-600 font-sans mt-1 max-w-[220px] truncate">Live: {liveInfo[order._id]}</div>}
                    {(order as any).shiprocketStatus && <div className="text-[11px] text-muted-foreground">SR: {(order as any).shiprocketStatus}</div>}
                  </AdminTableCell>
                  <AdminTableCell>
                    <Badge className={
                      order.status === 'delivered'
                        ? 'bg-emerald-500 text-white text-[11px]'
                        : order.status === 'shipped' || order.status === 'out_for_delivery'
                        ? 'bg-blue-500 text-white text-[11px]'
                        : order.status === 'packed'
                        ? 'bg-violet-500 text-white text-[11px]'
                        : 'bg-amber-500 text-slate-950 text-[11px]'
                    }>
                      {order.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <RowActions
                      label={`Actions for ${order.orderNumber}`}
                      items={[
                        {
                          label: 'Push to Shiprocket',
                          icon: <Truck className="h-3.5 w-3.5 mr-2" />,
                          disabled: order.status === 'shipped' || order.status === 'delivered',
                          onSelect: () => handleShip(),
                        },
                        {
                          label: 'Live track',
                          icon: <MapPin className="h-3.5 w-3.5 mr-2" />,
                          onSelect: () => handleLive(),
                        },
                        {
                          label: 'View details',
                          icon: <Eye className="h-3.5 w-3.5 mr-2" />,
                          onSelect: () => router.push(`/admin/orders/${order._id}`),
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
    </div>
  );
}
