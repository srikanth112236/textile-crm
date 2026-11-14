'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { shipmentApi, type SyncTrackingResult, type TrackingActivity } from '@/lib/api/shipment';
import { adminShipmentApi } from '@/lib/api/adminPayments';
import type { Order } from '@/lib/api/orders';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  MoreHorizontal,
  Package,
  RefreshCw,
  Route,
  Truck,
} from 'lucide-react';

interface OrderShipmentPanelProps {
  order: Order;
  onOrderChanged: () => void | Promise<void>;
}

const fmtDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtActivityDate = (value?: string) => {
  if (!value) return '';
  // Shiprocket sends "YYYY-MM-DD HH:mm:ss" — normalise for Safari.
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const humanize = (value?: string) => {
  if (!value) return 'Not pushed';
  if (value === 'not_pushed') return 'Not pushed';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const trackingTone = (status: string) => {
  const s = status.toLowerCase();
  if (/delivered/.test(s)) return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300';
  if (/out for delivery|in transit|shipped/.test(s)) return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300';
  if (/pickup|awb|new|created|manifest/.test(s)) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300';
  if (/exception|ndr|failed|rto|cancel|undelivered|return/.test(s)) return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300';
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300';
};

function Info({
  label,
  value,
  mono = false,
  onCopy,
  children,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  onCopy?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn('mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-slate-800 dark:text-slate-200', mono && 'font-mono')}>
        <span className="truncate">{children ?? value ?? '—'}</span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrderShipmentPanel({ order, onOrderChanged }: OrderShipmentPanelProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [tracking, setTracking] = useState<SyncTrackingResult | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const onChangedRef = useRef(onOrderChanged);
  useEffect(() => {
    onChangedRef.current = onOrderChanged;
  }, [onOrderChanged]);

  const rawStatus = (order.shiprocketStatus || '').trim();
  const awb = order.shiprocketAWB || '';
  const hasShipment = Boolean(order.shiprocketOrderId || order.shiprocketShipmentId);
  const isClosed = order.status === 'cancelled' || order.status === 'refunded';
  const isDelivered = order.status === 'delivered' || /delivered/i.test(rawStatus);
  const pickupDone =
    Boolean(order.shiprocketPickupScheduled) ||
    /pickup scheduled|picked up|in transit|shipped|out for delivery|delivered/i.test(rawStatus);
  const inTransit = /in transit|shipped|out for delivery|delivered/i.test(rawStatus);
  const hasTracking = Boolean(awb || order.shiprocketShipmentId);
  const syncKey = `${order._id}:${awb}:${order.shiprocketShipmentId || ''}`;

  const steps = [
    { label: 'Pushed', done: hasShipment },
    { label: 'AWB', done: Boolean(awb) },
    { label: 'Pickup', done: pickupDone },
    { label: 'In transit', done: inTransit },
    { label: 'Delivered', done: isDelivered },
  ];
  const currentStep = steps.findIndex((s) => !s.done);

  const displayStatus =
    tracking?.courierStatus || rawStatus || (isDelivered ? 'Delivered' : hasShipment ? 'Pushed to Shiprocket' : 'Not pushed');

  const td = (tracking?.tracking?.tracking_data || (tracking?.tracking as any)) as any;
  const live = td?.shipment_track?.[0];
  const trackingUrl = tracking?.trackingUrl || td?.track_url || order.trackingUrl || '';
  const activities = (td?.shipment_track_activities || []) as TrackingActivity[];
  const fallbackActivity: TrackingActivity[] =
    activities.length === 0 && (live?.current_status || live?.updated_time_stamp)
      ? [
          {
            date: live?.updated_time_stamp || '',
            activity: live?.current_status || displayStatus,
            location: live?.destination || '',
          },
        ]
      : [];
  const allActivities = activities.length ? activities : fallbackActivity;
  const visibleActivities = showAllActivities ? allActivities : allActivities.slice(0, 5);
  const ndr = td?.ndr || null;
  const npr = td?.npr || null;
  const hasException =
    /exception|ndr|failed|undelivered|rto|cancel/i.test(displayStatus) ||
    Number(npr?.attempts || 0) > 0 ||
    Number(ndr?.attempts || 0) > 0;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const syncTracking = async (showToast = true) => {
    setBusy('sync');
    setTrackingError(null);
    try {
      const res = await shipmentApi.syncTracking(order._id);
      if (res.success && res.data) {
        setTracking(res.data);
        setLastSyncedAt(new Date());
        if (res.data.updated) await onChangedRef.current();
        if (showToast) {
          toast({
            title: res.data.updated ? 'Tracking synced' : 'Already up to date',
            description: res.data.message || res.data.courierStatus || 'Shiprocket returned no new activity.',
          });
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not reach Shiprocket.';
      setTrackingError(message);
      if (showToast) toast({ title: 'Tracking sync failed', description: message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  // Load once per order (and again if an AWB is discovered). The endpoint is
  // idempotent and also applies a delivered status if a webhook was missed.
  useEffect(() => {
    if (!hasTracking) {
      setTracking(null);
      return;
    }
    let cancelled = false;
    setTrackingLoading(true);
    setTrackingError(null);
    (async () => {
      try {
        const res = await shipmentApi.syncTracking(order._id);
        if (cancelled) return;
        if (res.success && res.data) {
          setTracking(res.data);
          setLastSyncedAt(new Date());
          if (res.data.updated) await onChangedRef.current();
        }
      } catch (error: any) {
        if (!cancelled) {
          setTrackingError(error?.response?.data?.error || 'Live tracking is unavailable right now.');
        }
      } finally {
        if (!cancelled) setTrackingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  const runAction = async (key: string, title: string, fn: () => Promise<any>) => {
    setBusy(key);
    try {
      const result = await fn();
      if (result?.duplicate) {
        toast({ title: 'Already done', description: title });
      } else {
        toast({
          title,
          description: result?.data?.awb ? `AWB ${result.data.awb}${result.data?.courier ? ` · ${result.data.courier}` : ''}` : undefined,
        });
      }
      await onChangedRef.current();
    } catch (error: any) {
      toast({
        title: 'Shipment action failed',
        description: error?.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const openDocument = async (key: string, title: string, fn: () => Promise<any>) => {
    setBusy(key);
    try {
      const result = await fn();
      const url = result?.data?.url;
      if (!url) throw new Error('No document URL returned');
      window.open(url, '_blank', 'noopener,noreferrer');
      toast({ title, description: 'Document opened in a new tab.' });
    } catch (error: any) {
      toast({
        title: 'Could not open document',
        description: error?.response?.data?.error || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleCancelShipment = async () => {
    setBusy('cancel');
    try {
      await adminShipmentApi.cancelShipment(order._id);
      toast({ title: 'Shipment cancellation requested' });
      setCancelOpen(false);
      await onChangedRef.current();
    } catch (error: any) {
      toast({
        title: 'Cancel failed',
        description: error?.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const primary = (() => {
    if (isClosed) return null;
    if (!hasShipment) {
      return {
        key: 'push',
        label: 'Push to Shiprocket',
        icon: <Truck className="h-4 w-4" />,
        onClick: () => runAction('push', 'Pushed to Shiprocket', () => shipmentApi.shipOrder(order._id)),
      };
    }
    if (!awb) {
      return {
        key: 'awb',
        label: 'Assign AWB',
        icon: <Package className="h-4 w-4" />,
        onClick: () => runAction('awb', 'AWB assigned', () => adminShipmentApi.assignAwb(order._id)),
      };
    }
    if (isDelivered) return null;
    if (!pickupDone) {
      return {
        key: 'pickup',
        label: 'Schedule pickup',
        icon: <MapPin className="h-4 w-4" />,
        onClick: () => runAction('pickup', 'Pickup requested', () => adminShipmentApi.requestPickup(order._id)),
      };
    }
    return {
      key: 'sync',
      label: 'Refresh tracking',
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => syncTracking(true),
    };
  })();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white pb-3 dark:from-slate-900/60 dark:to-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <Truck className="h-4 w-4" />
              </span>
              Shipment
              <span className="text-xs font-medium text-muted-foreground">via Shiprocket</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {isDelivered
                ? 'Delivery is complete for this order.'
                : isClosed
                  ? 'Shipment actions are disabled for this order.'
                  : 'Push, AWB, pickup, documents and live courier tracking in one place.'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            {(hasShipment || isDelivered) && (
              <Badge className={cn('border text-[10px] font-extrabold uppercase tracking-wide', trackingTone(displayStatus))}>
                {humanize(displayStatus)}
              </Badge>
            )}            {lastSyncedAt && (
              <span className="hidden text-[10px] text-muted-foreground sm:inline">
                Synced {lastSyncedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {isClosed && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">Order {order.status} — shipment actions are disabled.</p>
              <p className="mt-0.5 opacity-80">Create a re-order if a fresh shipment is needed.</p>
            </div>
          </div>
        )}

        {!hasShipment ? (
          isClosed ? null : isDelivered ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Delivered</p>
                <p className="mt-0.5 opacity-80">
                  This order is delivered. No Shiprocket shipment was created for it, so there is no courier tracking to show.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm dark:bg-slate-800">
                  <Truck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold">Ready for dispatch</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Push this order to Shiprocket to create a shipment, then assign an AWB and schedule pickup. Live tracking starts automatically.
                  </p>
                </div>
              </div>
            </div>
          )
        ) : (
          <>
            {/* Progress */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-2">
                {steps.map((step, index) => (
                  <div key={step.label} className="relative flex flex-1 flex-col items-center gap-1.5">
                    {index < steps.length - 1 && (
                      <span
                        className={cn(
                          'absolute left-1/2 top-3 h-0.5 w-full',
                          step.done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-black',
                        step.done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : index === currentStep
                            ? 'border-amber-500 bg-white text-amber-600 dark:bg-slate-900'
                            : 'border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900'
                      )}
                    >
                      {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        step.done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipment facts */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <Info label="Courier" value={order.shiprocketCourier || live?.courier_name || 'Awaiting assignment'} />
              <Info
                label="AWB"
                mono
                value={awb || '—'}
                onCopy={awb ? () => copy(awb, 'AWB') : undefined}
              />
              <Info label="Pickup" value={order.pickupLocation || 'Primary'} />
              <Info label="ETA" value={fmtDate(tracking?.etd || order.estimatedDelivery || live?.edd)} />
              <Info label="SR order" mono value={order.shiprocketOrderId || '—'} onCopy={order.shiprocketOrderId ? () => copy(order.shiprocketOrderId!, 'Shiprocket order ID') : undefined} />
              <Info label="SR shipment" mono value={order.shiprocketShipmentId || '—'} onCopy={order.shiprocketShipmentId ? () => copy(order.shiprocketShipmentId!, 'Shiprocket shipment ID') : undefined} />
              <Info
                label="Package"
                value={
                  order.packageWeightG || order.packageLengthCm
                    ? `${order.packageWeightG || 500} g · ${order.packageLengthCm || 30}×${order.packageWidthCm || 25}×${order.packageHeightCm || 3} cm`
                    : '500 g · 30×25×3 cm (default)'
                }
              />
              <Info label="Pay mode" value={order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {primary && (
                <Button
                  onClick={primary.onClick}
                  disabled={busy !== null}
                  className="bg-amber-500 font-extrabold text-slate-950 shadow-sm hover:bg-amber-600"
                >
                  {busy === primary.key ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : primary.icon}
                  <span className="ml-1.5">{primary.label}</span>
                </Button>
              )}

              {hasShipment && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={busy !== null}>
                      <FileText className="mr-1.5 h-4 w-4" />
                      Documents
                      <ChevronDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuLabel>Shipping documents</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => openDocument('label', 'Shipping label ready', () => adminShipmentApi.getLabel(order._id))}
                    >
                      <FileText className="mr-2 h-4 w-4" /> Shipping label
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDocument('invoice', 'Courier invoice ready', () => adminShipmentApi.getInvoice(order._id))}
                    >
                      <FileText className="mr-2 h-4 w-4" /> Courier invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDocument('manifest', 'Manifest ready', () => adminShipmentApi.getManifest(order._id))}
                    >
                      <FileText className="mr-2 h-4 w-4" /> Pickup manifest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {hasTracking && (
                <Button variant="outline" onClick={() => syncTracking(true)} disabled={busy !== null}>
                  {busy === 'sync' ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                  )}
                  Sync status
                </Button>
              )}

              {trackingUrl && (
                <Button variant="ghost" asChild>
                  <a href={trackingUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Track on Shiprocket
                  </a>
                </Button>
              )}

              {!isClosed && hasShipment && !isDelivered && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={busy !== null} aria-label="More shipment actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Shipment</DropdownMenuLabel>
                    {awb && (
                      <DropdownMenuItem onClick={() => copy(awb, 'AWB')}>
                        <Copy className="mr-2 h-4 w-4" /> Copy AWB
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => setCancelOpen(true)}>
                      <AlertTriangle className="mr-2 h-4 w-4" /> Cancel shipment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}

        {/* Live tracking */}
        {hasTracking && (
          <>
            <Separator />
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold">Live tracking</h3>
                  {trackingLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                {allActivities.length > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {allActivities.length} update{allActivities.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              {trackingError ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                  <span>{trackingError}</span>
                  <Button size="sm" variant="outline" onClick={() => syncTracking(true)} disabled={busy !== null}>
                    Retry
                  </Button>
                </div>
              ) : trackingLoading && !tracking ? (
                <div className="space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ) : (
                <>
                  {hasException && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-bold">Courier exception: {humanize(displayStatus)}</p>
                        <p className="mt-0.5 opacity-80">
                          {npr?.attempts ? `${npr.attempts} pickup attempt(s). ` : ''}
                          {ndr?.attempts ? `${ndr.attempts} delivery attempt(s). ` : ''}
                          Review the activity below before retrying or cancelling.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-3 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/40 sm:grid-cols-4">
                    <Info label="Current status" value={humanize(displayStatus)} />
                    <Info label="Location" value={live?.destination || activities[0]?.location || '—'} />
                    <Info label="Courier" value={live?.courier_name || order.shiprocketCourier || '—'} />
                    <Info label="Last update" value={fmtActivityDate(live?.updated_time_stamp || activities[0]?.date)} />
                  </div>

                  {allActivities.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                      Shiprocket has not recorded any scan for this shipment yet. Updates will appear here automatically.
                    </p>
                  ) : (
                    <ol className="relative space-y-0">
                      {visibleActivities.map((activity, index) => (
                        <li key={`${activity.date}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                          {index < visibleActivities.length - 1 && (
                            <span className="absolute left-[5px] top-3 h-full w-px bg-slate-200 dark:bg-slate-800" />
                          )}
                          <span
                            className={cn(
                              'relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                              index === 0 ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-500/20' : 'bg-slate-300 dark:bg-slate-600'
                            )}
                          />
                          <div className="min-w-0">
                            <p className={cn('text-xs font-semibold', index === 0 && 'text-slate-900 dark:text-white')}>
                              {activity.activity || activity['sr-status-label'] || 'Shipment update'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {activity.location ? `${activity.location} · ` : ''}
                              {fmtActivityDate(activity.date)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  {allActivities.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 px-2 text-xs"
                      onClick={() => setShowAllActivities((v) => !v)}
                    >
                      {showAllActivities ? 'Show less' : `Show all ${allActivities.length} updates`}
                    </Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </CardContent>

      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancelShipment}
        title="Cancel this shipment?"
        description={
          <>
            This requests cancellation of the courier pickup/AWB in Shiprocket for <strong>{order.orderNumber}</strong>.
            The order, payment and stock are not changed. Use the order refund flow separately if money must be returned.
          </>
        }
        confirmText="Cancel shipment"
        variant="destructive"
        isLoading={busy === 'cancel'}
      />
    </Card>
  );
}
