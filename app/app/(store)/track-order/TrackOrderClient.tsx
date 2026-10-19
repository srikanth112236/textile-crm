'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import {
  Truck,
  Search,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface OrderTimelineEvent {
  title: string;
  desc: string;
  time: string;
  completed: boolean;
  current: boolean;
}

export default function TrackOrderClient() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setSearched(true);
    setTrackingResult(null);

    try {
      const { shipmentApi } = await import('@/lib/api/shipment');
      const data = await shipmentApi.publicTrack(orderNumber.trim());
      const status = (data.status || 'processing').toLowerCase();
      const tl = (data.timeline || []).map((t: any) => ({
        title: t.event,
        desc: t.description || '',
        time: t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '',
        completed: true,
        current: false,
      }));
      const stage = (s: string) => ['pending', 'processing', 'packed', 'partially_fulfilled', 'shipped', 'out_for_delivery', 'delivered'].indexOf(s);
      const cur = stage(status);
      const done = (s: string) => cur >= stage(s);
      const base = [
        { title: 'Order Confirmed', desc: 'Received and verified', time: '', completed: done('processing'), current: status === 'pending' },
        { title: 'Packed at Warehouse', desc: 'Packed at fulfillment hub', time: '', completed: done('packed'), current: status === 'processing' },
        { title: 'Shipped in Transit', desc: `Courier: ${data.courier || 'Shiprocket partner'}`, time: data.trackingNumber ? `AWB: ${data.trackingNumber}` : '', completed: done('shipped'), current: status === 'shipped' || status === 'packed' },
        { title: 'Out for Delivery', desc: data.live?.tracking_data?.shipment_track?.[0]?.current_status || 'Courier update pending', time: '', completed: done('out_for_delivery'), current: status === 'out_for_delivery' },
        { title: 'Delivered Successfully', desc: 'Handed over to recipient', time: data.estimatedDelivery ? new Date(data.estimatedDelivery).toLocaleDateString('en-IN') : 'Expected soon', completed: status === 'delivered', current: status === 'delivered' },
      ];
      setTrackingResult({
        orderNumber: data.orderNumber,
        courier: data.courier,
        trackingId: data.trackingNumber || 'Awaiting AWB',
        expectedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'To be updated',
        status,
        address: '',
        timeline: tl.length > 0 ? tl : base,
        trackingUrl: data.trackingUrl,
        live: data.live,
      });
    } catch {
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="text-xs uppercase font-extrabold text-amber-600 border-amber-400 px-3 py-1">
          Express Logistics & Live Dispatch
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Track Your Mentoos Order 🚚
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your Order Number and registered Mobile Number to see real-time shipment updates.
        </p>
      </div>

      {/* Search Input Card */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-6 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Order Reference Number *
              </label>
              <Input
                placeholder="e.g. ORD-20261008-101"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
                className="rounded-xl border-slate-300 dark:border-slate-700 text-xs py-5"
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Mobile Number (Optional)
              </label>
              <Input
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border-slate-300 dark:border-slate-700 text-xs py-5"
              />
            </div>

            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-5 rounded-xl text-xs gap-2 shadow-md"
              >
                {loading ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <Search className="w-4 h-4" />}
                Track
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tracking Results Output */}
      {trackingResult && (
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 space-y-6">
          <CardHeader className="bg-slate-50 dark:bg-slate-950/60 p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order Status</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {trackingResult.orderNumber}
                  <Badge className="bg-emerald-500 text-white font-bold text-xs uppercase">
                    {trackingResult.status.toUpperCase()}
                  </Badge>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-bold">
                  <Link href={`/user/orders/6ac7a701d4b565a43ca2b657/invoice`} target="_blank">
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    Tax Invoice
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Courier & Delivery Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Courier Partner</span>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-500" />
                  {trackingResult.courier}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">AWB: {trackingResult.trackingId}</div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Estimated Delivery</span>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  {trackingResult.expectedDelivery}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold">On Schedule</div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Delivery Address</span>
                <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                  {trackingResult.address}
                </div>
              </div>
            </div>

            {/* Vertical Shipment Timeline */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Shipment Journey Timeline
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {trackingResult.timeline.map((event: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-4 text-xs">
                    {/* Event Marker */}
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        event.completed
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : event.current
                          ? 'bg-slate-900 border-amber-500 text-white animate-pulse'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {event.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className={`font-bold text-sm ${event.completed ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                        {event.title}
                      </div>
                      <div className="text-slate-500 text-[11px]">{event.desc}</div>
                      <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {searched && !trackingResult && !loading && (
        <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">No Tracking Info Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please verify your order reference number (e.g. ORD-20261008-101) or check your order history under your account profile.
          </p>
          <Button asChild variant="outline" className="rounded-xl text-xs font-bold">
            <Link href="/user/orders">View My Orders</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
