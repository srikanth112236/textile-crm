'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { profileApi, type BodyMeasurements } from '@/lib/api/profile';
import { cn } from '@/lib/utils';
import { Loader2, Ruler } from 'lucide-react';

const NUM = (v: string) => (v.trim() === '' ? undefined : Number(v));

export function MeasurementsForm({ initial, onSaved }: { initial?: BodyMeasurements; onSaved: (m: BodyMeasurements) => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [height, setHeight] = useState(initial?.heightCm?.toString() || '');
  const [weight, setWeight] = useState(initial?.weightKg?.toString() || '');
  const [chest, setChest] = useState(initial?.chestIn?.toString() || '');
  const [waist, setWaist] = useState(initial?.waistIn?.toString() || '');
  const [hip, setHip] = useState(initial?.hipIn?.toString() || '');
  const [fit, setFit] = useState(initial?.fit || 'regular');

  const save = async () => {
    const m: BodyMeasurements = {
      heightCm: NUM(height),
      weightKg: NUM(weight),
      chestIn: NUM(chest),
      waistIn: NUM(waist),
      hipIn: NUM(hip),
      fit: fit as BodyMeasurements['fit'],
    };
    if (
      (m.heightCm && (m.heightCm < 140 || m.heightCm > 220)) ||
      (m.weightKg && (m.weightKg < 35 || m.weightKg > 180))
    ) {
      toast({ title: 'Check height/weight', description: 'Height 140–220 cm, weight 35–180 kg.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile({ measurements: m });
      onSaved(updated.measurements || m);
      toast({ title: 'Measurements saved', description: 'Find My Size will use these automatically.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.response?.data?.error || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => set(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder={placeholder} className="h-8 text-xs mt-1" />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {field('Height (cm)', height, setHeight, '175')}
        {field('Weight (kg)', weight, setWeight, '70')}
        {field('Chest (in)', chest, setChest, '40')}
        {field('Waist (in)', waist, setWaist, '32')}
        {field('Hip (in) — optional', hip, setHip, '40')}
        <div>
          <Label className="text-xs">Preferred fit</Label>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {(['slim', 'regular', 'relaxed', 'oversized'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFit(f)} className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border capitalize h-8', fit === f ? 'bg-slate-900 text-white border-slate-900' : 'border-border')}>{f}</button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> Chest/waist drive size picks directly; height/weight are the fallback.</p>
      <Button size="sm" onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Save Measurements
      </Button>
    </div>
  );
}
