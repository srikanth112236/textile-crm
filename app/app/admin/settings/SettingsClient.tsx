'use client';

import { useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api/settings';
import { paymentsApi } from '@/lib/api/payments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';
import { Loader2, Save, ShieldCheck, Truck, CreditCard, Globe, BellRing, Image, AlertTriangle, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function SettingsClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [rzpStatus, setRzpStatus] = useState<{ configured: boolean; keyId: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsApi.getAdmin();
        if (data?.payments) delete data.payments.razorpayKeyId;
        // Legacy values (e.g. 49) are snapped to the supported ₹50/₹55/₹60 options.
        if (data?.shipping) {
          const flat = Number(data.shipping.flatShippingCost);
          const options = [50, 55, 60];
          if (!options.includes(flat)) {
            data.shipping.flatShippingCost = options.reduce(
              (best, v) => (Math.abs(v - flat) < Math.abs(best - flat) ? v : best),
              options[0]
            );
          }
        }
        setForm(data);
      } catch (e: any) {
        toast({ title: 'Failed to load settings', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
    paymentsApi.methods().then((m) => setRzpStatus({ configured: m.razorpayConfigured, keyId: m.razorpayKeyId })).catch(() => {});
  }, []);

  const setDeep = (path: string, value: any) => {
    setForm((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payments = { ...(form.payments || {}) };
      delete payments.razorpayKeyId;
      // Drop blank rows before persisting the marquee list.
      const announcements = ((form.storefront?.announcements || []) as string[])
        .map((m) => (m || '').trim())
        .filter((m) => m.length > 0);
      const payload = {
        codConfirmation: form.codConfirmation,
        shipping: form.shipping,
        payments,
        shipment: form.shipment,
        refunds: form.refunds,
        whatsapp: form.whatsapp,
        storefront: { ...(form.storefront || {}), announcements },
      };
      await settingsApi.updateAdmin(payload);
      toast({ title: 'Settings saved', description: 'All changes applied successfully.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: getErrorMessage(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center gap-2 text-sm"><Loader2 className="h-5 w-5 animate-spin" /> Loading settings…</div>;
  if (!form) return <div className="p-8 text-sm">No settings found.</div>;

  return (
    <div className="w-full px-3 py-3 sm:px-4 lg:px-5 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Store Settings</h1>
            <p className="text-[11px] text-muted-foreground mt-1">COD, shipping, payments, refunds, WhatsApp templates & storefront banners.</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} size="sm" className="h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-extrabold shadow-sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          Save All
        </Button>
      </div>

      {/* Section: COD Confirmation */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-violet-50 dark:bg-violet-950/20">
          <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <h2 className="text-sm font-extrabold tracking-tight">COD Confirmation — RTO Control</h2>
          <Badge variant="outline" className="text-[9px] font-extrabold rounded-full px-1.5 ml-auto">Phase 0</Badge>
        </div>
        <CardContent className="p-3.5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-3">
            <Switch aria-label="COD confirmation enabled" className="h-4 w-7" checked={form.codConfirmation?.enabled} onCheckedChange={(c) => setDeep('codConfirmation.enabled', c)} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-tight">Enabled</p>
              <p className="text-[9px] text-muted-foreground leading-tight">Can receive COD orders</p>
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-bold">Mode</Label>
            <Select value={form.codConfirmation?.mode || 'fixed'} onValueChange={(v) => setDeep('codConfirmation.mode', v)}>
              <SelectTrigger aria-label="COD confirmation mode" className="h-9 rounded-lg text-[11px] mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed" className="text-[11px]">Fixed ₹</SelectItem>
                <SelectItem value="percent" className="text-[11px]">Percent %</SelectItem>
                <SelectItem value="slab" className="text-[11px]">Slab</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[11px] font-bold">Default advance ₹</Label>
            <div className="flex gap-1.5 mt-1">
              <Input
                aria-label="Default COD advance amount"
                type="number"
                value={form.codConfirmation?.defaultAmount ?? 0}
                onChange={(e) => setDeep('codConfirmation.defaultAmount', Number(e.target.value))}
                className="h-9 rounded-lg text-xs w-20 font-mono"
              />
              <div className="flex gap-0.5">
                {[49, 99, 149, 199].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    size="sm"
                    onClick={() => setDeep('codConfirmation.defaultAmount', amt)}
                    className={`h-7 px-1.5 rounded-md text-[10px] font-extrabold shadow-sm transition-all ${form.codConfirmation?.defaultAmount === amt ? 'bg-amber-500 text-slate-950' : 'variant-outline hover:bg-amber-500/10'}`}
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-bold">Fixed options</Label>
            <Input
              aria-label="COD fixed advance options"
              value={(form.codConfirmation?.fixedOptions || []).join(',')}
              onChange={(e) => setDeep('codConfirmation.fixedOptions', e.target.value.split(',').map((x: string) => Number(x.trim())).filter((x) => !isNaN(x)))}
              placeholder="49, 99, 149, 199"
              className="h-9 rounded-lg text-xs mt-1 font-mono"
            />
          </div>
        </CardContent>

        <CardContent className="px-3.5 pb-3.5 pt-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-[11px] font-bold">Percent % (if mode=percent)</Label>
            <Input
              aria-label="COD percent value"
              type="number"
              value={form.codConfirmation?.percentValue ?? 0}
              onChange={(e) => setDeep('codConfirmation.percentValue', Number(e.target.value))}
              className="h-9 rounded-lg text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Percent max cap ₹ (0 = no cap)</Label>
            <Input
              aria-label="COD percent maximum cap"
              type="number"
              value={form.codConfirmation?.percentMaxCap ?? 0}
              onChange={(e) => setDeep('codConfirmation.percentMaxCap', Number(e.target.value) || null)}
              className="h-9 rounded-lg text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Min order for COD ₹</Label>
            <Input
              aria-label="Minimum order value for COD"
              type="number"
              value={form.codConfirmation?.minOrderValueForCOD ?? 0}
              onChange={(e) => setDeep('codConfirmation.minOrderValueForCOD', Number(e.target.value))}
              className="h-9 rounded-lg text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Max order for COD ₹ (0 = no cap)</Label>
            <Input
              aria-label="Maximum order value for COD"
              type="number"
              value={form.codConfirmation?.maxOrderValueForCOD ?? 0}
              onChange={(e) => setDeep('codConfirmation.maxOrderValueForCOD', Number(e.target.value) || null)}
              className="h-9 rounded-lg text-xs mt-1"
            />
          </div>
        </CardContent>

        <CardContent className="px-3.5 pb-3.5 pt-0 grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Pincode rules</p>
              <Badge variant="outline" className="text-[8px] font-extrabold rounded-full">SECURITY</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[9px] font-bold text-muted-foreground">Mode</Label>
                <Input
                  aria-label="COD pincode mode"
                  value={form.codConfirmation?.pincodeMode || 'none'}
                  onChange={(e) => setDeep('codConfirmation.pincodeMode', e.target.value)}
                  placeholder="none / block / allow"
                  className="h-8 rounded-lg text-[11px] mt-0.5"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[9px] font-bold text-muted-foreground">Pincodes (comma separated 6-digit)</Label>
                <Input
                  aria-label="COD pincodes"
                  value={(form.codConfirmation?.pincodes || []).join(', ')}
                  onChange={(e) => setDeep('codConfirmation.pincodes', e.target.value.split(',').map((x: string) => x.trim()).filter((x) => /^\d{6}$/.test(x)))}
                  placeholder="110001, 400001"
                  className="h-8 rounded-lg text-[11px] font-mono mt-0.5"
                />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Trust &amp; risk rules</p>
              <Badge variant="outline" className="text-[8px] font-extrabold rounded-full">TRUST</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[9px] font-bold">Trusted orders to waive</Label>
                <Input
                  aria-label="Trusted orders to waive COD advance"
                  type="number"
                  value={form.codConfirmation?.trustedMinDelivered ?? 2}
                  onChange={(e) => setDeep('codConfirmation.trustedMinDelivered', Number(e.target.value))}
                  className="h-8 rounded-lg text-xs mt-0.5"
                />
              </div>
              <div>
                <Label className="text-[9px] font-bold">Risk threshold ₹ (0 = off)</Label>
                <Input
                  aria-label="COD risk threshold"
                  type="number"
                  value={form.codConfirmation?.riskThreshold || 0}
                  onChange={(e) => setDeep('codConfirmation.riskThreshold', Number(e.target.value))}
                  className="h-8 rounded-lg text-xs mt-0.5"
                />
              </div>
              <div>
                <Label className="text-[9px] font-bold">Risk advance ₹</Label>
                <Input
                  aria-label="COD risk advance"
                  type="number"
                  value={form.codConfirmation?.riskAdvance ?? 149}
                  onChange={(e) => setDeep('codConfirmation.riskAdvance', Number(e.target.value))}
                  className="h-8 rounded-lg text-xs mt-0.5 font-mono"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/20">
          <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-extrabold tracking-tight">Shipping — Shiprocket</h2>
          <Badge variant="outline" className="text-[8px] font-extrabold rounded-full px-1">LOGISTICS</Badge>
        </div>
        <CardContent className="p-3.5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Switch aria-label="Shiprocket enabled" className="h-4 w-7" checked={form.shipment?.shiprocketEnabled !== false} onCheckedChange={(c) => setDeep('shipment.shiprocketEnabled', c)} />
            <Label className="text-[11px] font-bold leading-tight">Shiprocket enabled</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch aria-label="Auto-push orders to Shiprocket" className="h-4 w-7" checked={form.shipment?.autoPush !== false} onCheckedChange={(c) => setDeep('shipment.autoPush', c)} />
            <Label className="text-[11px] font-bold leading-tight">Auto-push orders</Label>
          </div>
        </CardContent>
        <CardContent className="px-3.5 pb-3.5 pt-0 grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] font-bold">Pickup location</Label>
            <Input
              aria-label="Shiprocket pickup location"
              value={form.shipment?.pickupLocation || ''}
              onChange={(e) => setDeep('shipment.pickupLocation', e.target.value)}
              className="h-9 rounded-lg text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Channel ID</Label>
            <Input
              aria-label="Shiprocket channel ID"
              value={form.shipment?.channelId || ''}
              onChange={(e) => setDeep('shipment.channelId', e.target.value)}
              className="h-9 rounded-lg text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Free shipping threshold ₹</Label>
            <Input
              aria-label="Free shipping threshold"
              type="number"
              value={form.shipping?.freeShippingThreshold ?? 0}
              onChange={(e) => setDeep('shipping.freeShippingThreshold', Number(e.target.value))}
              className="h-9 rounded-lg text-xs mt-1 font-mono"
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Shipping below threshold ₹</Label>
            <Select
              value={String(form.shipping?.flatShippingCost ?? 50)}
              onValueChange={(v) => setDeep('shipping.flatShippingCost', Number(v))}
            >
              <SelectTrigger aria-label="Shipping charge below threshold" className="h-9 rounded-lg text-xs mt-1 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[50, 55, 60].map((amt) => (
                  <SelectItem key={amt} value={String(amt)}>
                    ₹{amt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[9px] text-muted-foreground mt-1 leading-tight">
              Applied when the order is below the free-shipping threshold.
            </p>
          </div>
          <div>
            <Label className="text-[11px] font-bold">Default weight (g)</Label>
            <Input
              aria-label="Default package weight in grams"
              type="number"
              value={form.shipping?.defaultWeightG ?? 0}
              onChange={(e) => setDeep('shipping.defaultWeightG', Number(e.target.value))}
              className="h-9 rounded-lg text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Pickup pincode (6-digit)</Label>
            <Input
              aria-label="Shiprocket pickup pincode"
              value={form.shipping?.pickupPincode || ''}
              maxLength={6}
              onChange={(e) => setDeep('shipping.pickupPincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="h-9 rounded-lg text-xs mt-1 font-mono"
            />
          </div>
          <div className="sm:col-span-2 grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] font-bold">Length (cm)</Label>
              <Input
                aria-label="Default package length in centimetres"
                type="number"
                value={form.shipping?.defaultLengthCm ?? 0}
                onChange={(e) => setDeep('shipping.defaultLengthCm', Number(e.target.value))}
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold">Width (cm)</Label>
              <Input
                aria-label="Default package width in centimetres"
                type="number"
                value={form.shipping?.defaultWidthCm ?? 0}
                onChange={(e) => setDeep('shipping.defaultWidthCm', Number(e.target.value))}
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold">Height (cm)</Label>
              <Input
                aria-label="Default package height in centimetres"
                type="number"
                value={form.shipping?.defaultHeightCm ?? 0}
                onChange={(e) => setDeep('shipping.defaultHeightCm', Number(e.target.value))}
                className="h-9 rounded-lg text-xs mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/20">
          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-sm font-extrabold tracking-tight">Payments — Razorpay</h2>
          <Badge variant="outline" className="text-[8px] font-extrabold rounded-full px-1 ml-auto">SECRETS IN .ENV</Badge>
        </div>
        <CardContent className="p-3.5 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { label: 'Razorpay enabled', path: 'payments.razorpayEnabled', note: 'Phase 1 will activate payments' },
            { label: 'COD enabled', path: 'payments.codEnabled', note: 'Cash-on-delivery option' },
            { label: 'UPI', path: 'payments.upiEnabled', note: 'QR / link payments' },
            { label: 'Card', path: 'payments.cardEnabled', note: 'Debit / credit' },
            { label: 'Netbanking', path: 'payments.netbankingEnabled', note: 'Online bank transfer' },
            { label: 'Wallet', path: 'payments.walletEnabled', note: 'Wallet / UPI balance' },
          ].map((f) => (
            <div key={f.path} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-[10px] font-bold">{f.label}</Label>
                <Switch
                  aria-label={f.label}
                  className="h-4 w-6"
                  checked={f.path.split('.').reduce((o, k) => (o as any)?.[k], form) !== false}
                  onCheckedChange={(c) => setDeep(f.path, c)}
                />
              </div>
              <p className="text-[9px] text-muted-foreground">{f.note}</p>
            </div>
          ))}
        </CardContent>
        <CardContent className="px-3.5 pb-3.5 pt-0">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 p-2.5">
            <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> Server-side key status
            </p>
            <p className={`text-sm font-extrabold flex items-center gap-1.5 ${rzpStatus?.configured ? 'text-emerald-600' : 'text-rose-500'}`}>
              {rzpStatus === null ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className={`h-2 w-2 rounded-full ${rzpStatus?.configured ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              )}
              {rzpStatus === null ? 'Checking server config…' : rzpStatus?.configured ? `● Configured (${rzpStatus?.keyId}) — ready` : '● Not configured — set RAZORPAY_KEY_ID / SECRET in server/.env'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Refunds */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/20">
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h2 className="text-sm font-extrabold tracking-tight">Refund Policy</h2>
        </div>
        <CardContent className="p-3.5 grid sm:grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/10 p-2.5">
            <Label className="text-[10px] font-bold">Auto-refund on cancel</Label>
            <Switch
              aria-label="Auto-refund on cancel"
              className="h-4 w-6 mt-1"
              checked={form.refunds?.autoRefundOnCancel !== false}
              onCheckedChange={(c) => setDeep('refunds.autoRefundOnCancel', c)}
            />
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/10 p-2.5">
            <Label className="text-[10px] font-bold">COD advance refundable</Label>
            <Switch
              aria-label="COD advance refundable"
              className="h-4 w-6 mt-1"
              checked={form.refunds?.codAdvanceRefundable !== false}
              onCheckedChange={(c) => setDeep('refunds.codAdvanceRefundable', c)}
            />
          </div>
          <div>
            <Label className="text-[10px] font-bold">Customer cancel window (hours)</Label>
            <div className="flex gap-1 mt-1">
              <Input
                aria-label="Customer cancel window in hours"
                type="number"
                min={1}
                max={720}
                value={form.refunds?.allowCustomerCancelHours ?? ''}
                onChange={(e) => setDeep('refunds.allowCustomerCancelHours', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Unlimited (empty)"
                className="h-8 rounded-lg text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground self-center font-medium">hrs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/20">
          <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-extrabold tracking-tight">WhatsApp Automation</h2>
          <Badge variant="outline" className="text-[8px] font-extrabold rounded-full px-1 ml-auto">AUTO</Badge>
        </div>
        <CardContent className="p-3.5 grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5">
            <Label className="text-[11px] font-bold">Enabled</Label>
            <Switch
              aria-label="WhatsApp automation enabled"
              className="h-5 w-8 mt-1.5"
              checked={form.whatsapp?.enabled !== false}
              onCheckedChange={(c) => setDeep('whatsapp.enabled', c)}
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold">Provider</Label>
            <Input
              aria-label="WhatsApp provider"
              value={form.whatsapp?.provider || ''}
              onChange={(e) => setDeep('whatsapp.provider', e.target.value)}
              placeholder="interakt / wati / gupshup / custom"
              className="h-9 rounded-lg text-xs mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[11px] font-bold">Support number (+91...)</Label>
            <Input
              aria-label="WhatsApp support number"
              value={form.whatsapp?.supportNumber || ''}
              onChange={(e) => setDeep('whatsapp.supportNumber', e.target.value)}
              placeholder="9876543210"
              className="h-9 rounded-lg text-xs mt-1 font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="waTestTo" className="text-[11px] font-bold">Test number</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="waTestTo"
                aria-label="WhatsApp test number"
                placeholder="9876543210"
                className="h-9 rounded-lg text-xs font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const to = (document.getElementById('waTestTo') as HTMLInputElement)?.value;
                  if (!to) { toast({ title: 'Enter test number', variant: 'destructive' }); return; }
                  try {
                    const api = (await import('@/lib/api/client')).default;
                    const res = await api.post('/settings/admin/whatsapp-test', { to });
                    toast({
                      title: res.data.data?.sent ? 'WhatsApp sent!' : 'Logged as mock',
                      description: res.data.data?.mock ? 'No WHATSAPP_API_KEY set — check server console.' : `Provider: ${res.data.data?.provider}`,
                    });
                  } catch (e: any) {
                    toast({ title: 'Test failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
                  }
                }}
                className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm shrink-0"
              >
                <BellRing className="h-3.5 w-3.5 mr-1.5" /> Send Test
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">Sends via WhatsApp provider configured in server .env.</p>
          </div>
        </CardContent>
      </Card>

      {/* Storefront */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/20">
          <Image className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-sm font-extrabold tracking-tight">Storefront — Banner &amp; Announcement</h2>
          <Badge variant="outline" className="text-[8px] font-extrabold rounded-full px-1">HOMEPAGE</Badge>
        </div>
        <CardContent className="p-3.5 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[11px] font-bold flex items-center gap-1.5">
                <BellRing className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Announcement marquee messages ({(form.storefront?.announcements || []).length})
              </Label>
              <Badge
                variant="outline"
                className={`text-[8px] font-extrabold rounded-full px-1.5 ${
                  (form.storefront?.announcements || []).length >= 10
                    ? 'border-emerald-500/40 text-emerald-600'
                    : 'border-amber-500/40 text-amber-600'
                }`}
              >
                {(form.storefront?.announcements || []).length >= 10 ? '10+ READY' : 'MIN 10'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
              Scrolls continuously across the top of every storefront page. Add 10 or more for a
              seamless loop — any missing slots are filled with the default offers.
            </p>
            <div className="space-y-1.5 mt-2">
              {(form.storefront?.announcements || []).map((msg: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-right text-[10px] font-extrabold text-muted-foreground">
                    {i + 1}
                  </span>
                  <Input
                    aria-label={`Announcement message ${i + 1}`}
                    value={msg}
                    onChange={(e) => {
                      const next = [...(form.storefront?.announcements || [])];
                      next[i] = e.target.value;
                      setDeep('storefront.announcements', next);
                    }}
                    placeholder="🎉 FLAT 20% OFF THIS WEEKEND | CODE: FESTIVE20"
                    maxLength={300}
                    className="h-8 rounded-lg text-[11px] flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove announcement message ${i + 1}`}
                    onClick={() =>
                      setDeep(
                        'storefront.announcements',
                        (form.storefront?.announcements || []).filter((_: any, j: number) => j !== i)
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDeep('storefront.announcements', [...(form.storefront?.announcements || []), ''])
                  }
                  className="h-8 rounded-lg text-[11px] font-extrabold shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Message
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDeep('storefront.announcements', [
                      '🔥 FLAT 15% OFF ON YOUR FIRST ORDER | USE CODE: MENTOOS15',
                      '🚚 FREE EXPRESS SHIPPING ON ALL ORDERS OVER ₹999',
                      '💵 CASH ON DELIVERY AVAILABLE | EASY 7-DAY EXCHANGES',
                      '⚡ NEW ARRIVALS 2026 NOW LIVE — SHOP OVERSIZED TEES & KURTAS',
                      '🎉 FESTIVE DROP: FLAT 20% OFF ETHNIC WEAR | CODE: FESTIVE20',
                      '🛍️ BUY ANY 2 PRODUCTS & SAVE 10% EXTRA | CODE: BUY2GET10',
                      '🏷️ FLAT ₹200 OFF ON ORDERS ABOVE ₹1,499 | CODE: FLAT200',
                      '⭐ 4.8/5 RATED BY 10,000+ HAPPY CUSTOMERS',
                      '🔁 EASY 7-DAY RETURNS & EXCHANGES — NO QUESTIONS ASKED',
                      '📦 SAME-DAY DISPATCH ON ALL ORDERS PLACED BEFORE 2 PM',
                    ])
                  }
                  className="h-8 rounded-lg text-[11px] font-extrabold text-amber-700 dark:text-amber-300"
                >
                  Restore 10 defaults
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-[11px] font-bold">Banners ({(form.storefront?.banners || []).length})</Label>
            <div className="space-y-1.5 mt-1">
              {(form.storefront?.banners || []).map((b: any, i: number) => (
                <div key={i} className="flex gap-2 items-end">
                  <Input aria-label={`Banner ${i + 1} title`} value={b.title} onChange={(e) => { const next = [...form.storefront.banners]; next[i] = { ...next[i], title: e.target.value }; setDeep('storefront.banners', next); }} placeholder="Title" className="h-8 rounded-lg text-[11px]" />
                  <Input aria-label={`Banner ${i + 1} image URL`} value={b.image} onChange={(e) => { const next = [...form.storefront.banners]; next[i] = { ...next[i], image: e.target.value }; setDeep('storefront.banners', next); }} placeholder="Image URL" className="h-8 rounded-lg text-[11px] flex-1" />
                  <Input aria-label={`Banner ${i + 1} link`} value={b.link} onChange={(e) => { const next = [...form.storefront.banners]; next[i] = { ...next[i], link: e.target.value }; setDeep('storefront.banners', next); }} placeholder="Link" className="h-8 rounded-lg text-[11px]" />
                  <Button
                    type="button"
                    size="sm"
                    variant={b.isActive ? 'default' : 'outline'}
                    onClick={() => { const next = [...form.storefront.banners]; next[i] = { ...next[i], isActive: !next[i].isActive }; setDeep('storefront.banners', next); }}
                    className="h-8 rounded-lg text-[10px] font-extrabold"
                  >
                    {b.isActive ? 'On' : 'Off'}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove banner ${i + 1}`}
                    onClick={() => setDeep('storefront.banners', form.storefront.banners.filter((_: any, j: number) => j !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeep('storefront.banners', [...(form.storefront?.banners || []), { image: '', title: 'New Banner', link: '/products', isActive: true }])}
                className="h-8 rounded-lg text-[11px] font-extrabold shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Banner
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={save}
        disabled={saving}
        className="w-full h-11 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-extrabold shadow-lg transition-all"
      >
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        {saving ? 'Saving all store settings…' : 'Save All Settings'}
      </Button>
    </div>
  );
}