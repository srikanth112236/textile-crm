'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getOrder,
  addOrderNote,
  updateOrderPriority,
  assignOrder,
  updateTracking,
  getOrderTimeline,
  toggleArchiveOrder,
  Order,
  OrderStatus,
  OrderPriority,
  OrderFlag,
  OrderNote,
  OrderTimelineEvent,
} from '@/lib/api/orders';
import { adminApi } from '@/lib/api/admin';
import { formatPrice } from '@/lib/utils';

interface OrderEnhancedClientProps {
  orderId: string;
}

export default function OrderEnhancedClient({ orderId }: OrderEnhancedClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([]);
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs
  const [noteDialog, setNoteDialog] = useState(false);
  const [trackingDialog, setTrackingDialog] = useState(false);

  // Form states
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'internal' | 'customer'>('internal');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, timelineRes, usersRes] = await Promise.all([
        getOrder(orderId),
        getOrderTimeline(orderId).catch(() => null),
        adminApi.getUsers({ role: 'admin', limit: 50 }).catch(() => null),
      ]);

      if (orderRes.success) {
        setOrder(orderRes.data);
      }

      if (timelineRes?.success) {
        setTimeline(timelineRes.data.timeline);
        setNotes(timelineRes.data.notes);
      }

      if (usersRes?.success) {
        setAdmins(usersRes.data.users || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    try {
      setActionLoading(true);
      await addOrderNote(orderId, { content: noteContent, type: noteType });
      toast({ title: 'Success', description: 'Note added successfully' });
      setNoteDialog(false);
      setNoteContent('');
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add note',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePriority = async (priority: OrderPriority) => {
    try {
      setActionLoading(true);
      await updateOrderPriority(orderId, { priority });
      toast({ title: 'Success', description: 'Priority updated' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update priority',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (assignedTo: string | null) => {
    try {
      setActionLoading(true);
      await assignOrder(orderId, { assignedTo });
      toast({ title: 'Success', description: 'Order assignment updated' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign order',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!trackingNumber.trim()) return;

    try {
      setActionLoading(true);
      await updateTracking(orderId, {
        trackingNumber,
        trackingUrl: trackingUrl || undefined,
        estimatedDelivery: estimatedDelivery || undefined,
      });
      toast({ title: 'Success', description: 'Tracking updated' });
      setTrackingDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tracking',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setActionLoading(true);
      await toggleArchiveOrder(orderId);
      toast({ title: 'Success', description: order?.isArchived ? 'Order unarchived' : 'Order archived' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update archive status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (priority: OrderPriority) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      low: 'secondary',
      normal: 'outline',
      high: 'default',
      urgent: 'destructive',
    };
    return <Badge variant={variants[priority] || 'outline'}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Created on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTrackingDialog(true)}>
            Update Tracking
          </Button>
          <Button variant="outline" onClick={handleArchive}>
            {order.isArchived ? 'Unarchive' : 'Archive'}
          </Button>
          <Button onClick={() => router.back()}>Back</Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Priority</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={order.priority}
              onValueChange={(value) => handleUpdatePriority(value as OrderPriority)}
              disabled={actionLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrderPriority).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assigned To</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={order.assignedTo?.toString() || 'unassigned'}
              onValueChange={(value) => handleAssign(value === 'unassigned' ? null : value)}
              disabled={actionLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin._id} value={admin._id}>
                    {admin.name || admin.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="default">{order.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-bold">{formatPrice(order.total)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Flags */}
      {order.flags && order.flags.length > 0 && order.flags[0] !== 'none' && (
        <Card>
          <CardHeader>
            <CardTitle>Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {order.flags.filter(f => f !== 'none').map((flag) => (
                <Badge key={flag} variant="secondary">{flag.replace('_', ' ')}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Info */}
      {order.trackingNumber && (
        <Card>
          <CardHeader>
            <CardTitle>Tracking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Tracking Number</Label>
                <p className="font-medium">{order.trackingNumber}</p>
              </div>
              {order.trackingUrl && (
                <div>
                  <Label className="text-muted-foreground">Tracking URL</Label>
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Tracking
                  </a>
                </div>
              )}
              {order.estimatedDelivery && (
                <div>
                  <Label className="text-muted-foreground">Estimated Delivery</Label>
                  <p className="font-medium">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Notes and Timeline */}
      <Tabs defaultValue="payment">
        <TabsList className="flex-wrap">
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="shipment">Shipment</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
          <TabsTrigger value="items">Items ({order.items.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Payment Detail — Razorpay + COD</CardTitle><CardDescription>Every rupee tracked: method, gateway IDs, advance vs balance, refunds.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><Label className="text-muted-foreground">Method</Label><p className="font-bold">{(order as any).paymentMethod}</p></div>
              <div><Label className="text-muted-foreground">Pay Status</Label><p><Badge>{(order as any).paymentStatus}</Badge></p></div>
              <div><Label className="text-muted-foreground">Total</Label><p className="font-bold">{formatPrice(order.total)}</p></div>
              <div><Label className="text-muted-foreground">Shipping</Label><p>{formatPrice((order as any).shippingCost || 0)}</p></div>
              <div><Label className="text-muted-foreground">Razorpay Order ID</Label><p className="font-mono">{(order as any).razorpayOrderId || '—'}</p></div>
              <div><Label className="text-muted-foreground">Razorpay Payment ID</Label><p className="font-mono">{(order as any).razorpayPaymentId || '—'}</p></div>
              <div><Label className="text-muted-foreground">COD Advance Paid</Label><p className="font-bold text-emerald-600">{formatPrice((order as any).codAdvancePaid || 0)}</p></div>
              <div><Label className="text-muted-foreground">COD Balance Due</Label><p className="font-bold text-amber-600">{formatPrice((order as any).codBalance ?? ((order as any).paymentMethod === 'cod' ? order.total : 0))}</p></div>
              {(order as any).refundAmount ? <div><Label className="text-muted-foreground">Refunded</Label><p className="font-bold text-red-600">{formatPrice((order as any).refundAmount)}</p></div> : null}
              <div className="md:col-span-2 flex gap-2">
                <Button variant="outline" onClick={async () => { const amountStr = prompt(`Refund amount in ₹ (blank = full ${order.total}):`); if (amountStr === null) return; let amount: number | undefined; if (amountStr.trim() !== '') { amount = Number(amountStr); if (!amount || amount <= 0 || amount > order.total) { toast({ title: 'Invalid amount', description: `Enter 1–${order.total} or leave blank.`, variant: 'destructive' }); return; } } const notes = prompt('Refund reason:'); if (!notes) return; try { const { adminPaymentsApi } = await import('@/lib/api/adminPayments'); const res: any = await adminPaymentsApi.refund(orderId, amount, notes); toast({ title: amount ? 'Partial refund processed' : 'Refund processed', description: res?.message }); fetchData(); } catch (e: any) { toast({ title: 'Refund failed', description: e.response?.data?.error, variant: 'destructive' }); } }}>{(order as any).refundAmount ? 'Refund Again / Adjust' : 'Refund via Razorpay / Mark Refunded'}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipment" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Shipment Detail — Shiprocket</CardTitle><CardDescription>AWB, courier, live status, push/cancel, tracking.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><Label className="text-muted-foreground">Courier</Label><p className="font-bold">{(order as any).shiprocketCourier || 'Not assigned'}</p></div>
              <div><Label className="text-muted-foreground">AWB</Label><p className="font-mono font-bold">{(order as any).shiprocketAWB || (order as any).trackingNumber || 'Not shipped'}</p></div>
              <div><Label className="text-muted-foreground">Shiprocket Order/Shipment</Label><p className="font-mono">{(order as any).shiprocketOrderId || '—'} / {(order as any).shiprocketShipmentId || '—'}</p></div>
              <div><Label className="text-muted-foreground">Shiprocket Status</Label><p><Badge variant="outline">{(order as any).shiprocketStatus || 'not_pushed'}</Badge></p></div>
              <div><Label className="text-muted-foreground">Package</Label><p>{(order as any).packageWeightG || 500}g · {(order as any).packageLengthCm || 30}×{(order as any).packageWidthCm || 25}×{(order as any).packageHeightCm || 3}cm</p></div>
              <div><Label className="text-muted-foreground">ETD</Label><p>{(order as any).estimatedDelivery ? new Date((order as any).estimatedDelivery).toLocaleDateString('en-IN') : '—'}</p></div>
              <div className="md:col-span-2 flex gap-2 flex-wrap">
                <Button onClick={async () => { try { const { shipmentApi } = await import('@/lib/api/shipment'); await shipmentApi.shipOrder(orderId); toast({ title: 'Pushed to Shiprocket' }); fetchData(); } catch (e: any) { toast({ title: 'Ship failed', description: e.response?.data?.error, variant: 'destructive' }); } }}>Push to Shiprocket</Button>
                <Button variant="secondary" onClick={async () => { try { const { adminShipmentApi } = await import('@/lib/api/adminPayments'); const r = await adminShipmentApi.assignAwb(orderId); toast({ title: r.duplicate ? 'AWB already assigned' : 'AWB assigned', description: `${r.data?.awb || ''} ${r.data?.courier || ''}` }); fetchData(); } catch (e: any) { toast({ title: 'AWB failed', description: e.response?.data?.error || 'Assign courier/AWB in Shiprocket panel if auto-assign blocked', variant: 'destructive' }); } }}>Assign AWB</Button>
                <Button variant="secondary" onClick={async () => { try { const { adminShipmentApi } = await import('@/lib/api/adminPayments'); await adminShipmentApi.requestPickup(orderId); toast({ title: 'Pickup requested' }); fetchData(); } catch (e: any) { toast({ title: 'Pickup failed', description: e.response?.data?.error, variant: 'destructive' }); } }}>Request Pickup</Button>
                <Button variant="outline" onClick={async () => { try { const { adminShipmentApi } = await import('@/lib/api/adminPayments'); const r = await adminShipmentApi.getLabel(orderId); if (r.data?.url) window.open(r.data.url, '_blank'); else toast({ title: 'No label URL', description: JSON.stringify(r.data?.shiprocket).slice(0, 200) }); } catch (e: any) { toast({ title: 'Label failed', description: e.response?.data?.error, variant: 'destructive' }); } }}>Download Label</Button>
                <Button variant="outline" onClick={async () => { try { const { adminShipmentApi } = await import('@/lib/api/adminPayments'); const r = await adminShipmentApi.getInvoice(orderId); if (r.data?.url) window.open(r.data.url, '_blank'); else toast({ title: 'No invoice URL', description: JSON.stringify(r.data?.shiprocket).slice(0, 200) }); } catch (e: any) { toast({ title: 'Invoice failed', description: e.response?.data?.error, variant: 'destructive' }); } }}>Download Invoice</Button>
                <Button variant="outline" onClick={async () => { const awb = (order as any).shiprocketAWB; if (!awb) { toast({ title: 'No AWB yet' }); return; } try { const { shipmentApi } = await import('@/lib/api/shipment'); const live = await shipmentApi.liveTrack(awb); toast({ title: 'Live status', description: JSON.stringify(live?.tracking_data?.shipment_track?.[0]?.current_status || live).slice(0, 200) }); } catch (e: any) { toast({ title: 'Track failed', description: e.response?.data?.error, variant: 'destructive' }); } }}>Live Track AWB</Button>
                <Button variant="outline" onClick={async () => { if (!confirm('Cancel Shiprocket shipment?')) return; try { const { adminShipmentApi } = await import('@/lib/api/adminPayments'); await adminShipmentApi.cancelShipment(orderId); toast({ title: 'Shipment cancel requested' }); } catch (e: any) { toast({ title: 'Cancel failed', description: e.response?.data?.error, variant: 'destructive' }); } }}>Cancel Shipment</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNoteDialog(true)}>Add Note</Button>
          </div>
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No notes yet</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note._id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">{note.type}</Badge>
                        <p>{note.content}</p>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        <p>{note.createdByName || (typeof note.createdBy === 'object' ? (note.createdBy as any).name : '-')}</p>
                        <p>{new Date(note.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No timeline events</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((event) => (
                <Card key={event._id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">{event.type.replace('_', ' ')}</Badge>
                        <p className="font-medium">{event.event}</p>
                        {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                      </div>
                      <p className="text-sm text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">
                        {item.product?.name || `Product ${item.productId}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-bold">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Note Dialog */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Add a note to this order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Note Type</Label>
              <Select value={noteType} onValueChange={(v) => setNoteType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal (Staff only)</SelectItem>
                  <SelectItem value="customer">Customer (Visible to customer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={actionLoading || !noteContent.trim()}>
              {actionLoading ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Tracking Dialog */}
      <Dialog open={trackingDialog} onOpenChange={setTrackingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tracking</DialogTitle>
            <DialogDescription>Add or update tracking information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tracking Number *</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label>Tracking URL</Label>
              <Input
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Estimated Delivery</Label>
              <Input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateTracking} disabled={actionLoading || !trackingNumber.trim()}>
              {actionLoading ? 'Updating...' : 'Update Tracking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

