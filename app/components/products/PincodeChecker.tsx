'use client';

import { useState } from 'react';
import { MapPin, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { shipmentApi } from '@/lib/api/shipment';
import { settingsApi } from '@/lib/api/settings';

export function PincodeChecker({ compact = false }: { compact?: boolean }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; edd?: string } | null>(null);

  const check = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setResult({ ok: false, msg: 'Enter a valid 6-digit pincode' });
      return;
    }
    setLoading(true);
    try {
      const [svc, quote] = await Promise.all([
        shipmentApi.serviceability(pin, 500, true).catch(() => null),
        settingsApi.codQuote(1000, pin).catch(() => null),
      ]);
      const edd = svc?.data?.estimatedDelivery
        ? new Date(svc.data.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
        : new Date(Date.now() + 3 * 864e5).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const codOk = quote ? quote.codAllowed !== false : true;
      setResult({
        ok: true,
        msg: `Delivery by ${edd} · ${codOk ? 'COD available' : 'Prepaid only'}${svc?.mock ? ' · Free shipping over ₹999' : ''}`,
        edd,
      });
    } catch {
      setResult({ ok: true, msg: 'Delivery in 3–5 days · COD available' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter pincode"
            inputMode="numeric"
            maxLength={6}
            className="h-8 pl-7 text-xs rounded-lg"
            aria-label="Delivery pincode"
            onKeyDown={(e) => e.key === 'Enter' && check()}
          />
        </div>
        <Button size="sm" onClick={check} disabled={loading || pin.length !== 6} className="h-8 text-xs rounded-lg px-3">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Check'}
        </Button>
      </div>
      {result && (
        <p className={`flex items-center gap-1 text-[11px] font-medium ${result.ok ? 'text-emerald-600' : 'text-rose-600'}`} role="status">
          {result.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {result.msg}
        </p>
      )}
    </div>
  );
}
