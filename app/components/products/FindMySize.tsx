'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FindMySizeProps {
  open: boolean;
  onClose: () => void;
  categoryName?: string;
  onSelect: (size: string) => void;
}

// Chest estimates (inches) per size for tops; waist for bottoms.
// Score = closeness of user's build to size midpoints, adjusted by fit + height.
const TOPS: Array<{ size: string; chest: number }> = [
  { size: 'S', chest: 38 }, { size: 'M', chest: 40 }, { size: 'L', chest: 42 },
  { size: 'XL', chest: 44 }, { size: 'XXL', chest: 46 },
];
const BOTTOMS: Array<{ size: string; waist: number }> = [
  { size: 'S', waist: 28 }, { size: 'M', waist: 30 }, { size: 'L', waist: 32 },
  { size: 'XL', waist: 34 }, { size: 'XXL', waist: 36 },
];

function isBottoms(categoryName?: string): boolean {
  return /trouser|jogger|pant|short|bottom|chino|cargo|pyjama|pajama/i.test(categoryName || '');
}

function nudge(idx: number, fit: string, len: number): number {
  if (fit === 'relaxed' || fit === 'oversized') return Math.min(len - 1, idx + 1);
  if (fit === 'slim') return Math.max(0, idx - 1);
  return idx;
}

// Direct match from a real body measurement — ties round up for comfort.
export function recommendFromMeasurement(measureIn: number, fit: string, bottoms: boolean): { size: string; confidence: string } {
  const table = bottoms ? BOTTOMS : TOPS;
  const key = bottoms ? 'waist' : 'chest';
  let best = 2;
  let bestDiff = Infinity;
  for (let i = 0; i < table.length; i++) {
    const d = Math.abs(((table[i] as any)[key] as number) - measureIn);
    if (d < bestDiff - 1e-9 || (Math.abs(d - bestDiff) < 1e-9 && i > best)) {
      bestDiff = d;
      best = i;
    }
  }
  const finalIdx = nudge(best, fit, table.length);
  return {
    size: table[finalIdx].size,
    confidence: bestDiff <= 0.5 ? 'High — matched to your measurements' : 'Good — closest to your measurements',
  };
}

export function recommendSize(heightCm: number, weightKg: number, fit: string, bottoms: boolean): { size: string; confidence: string } {
  // Estimated body measurement from BMI curve tuned for Indian menswear
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const base = bottoms ? 28 + (bmi - 17) * 1.1 : 36 + (bmi - 17) * 1.35;
  const table = bottoms ? BOTTOMS : TOPS;
  const key = bottoms ? 'waist' : 'chest';
  let bestIdx = 2;
  let bestDiff = Infinity;
  for (let i = 0; i < table.length; i++) {
    const d = Math.abs(((table[i] as any)[key] as number) - base);
    if (d < bestDiff) {
      bestDiff = d;
      bestIdx = i;
    }
  }
  const finalIdx = nudge(bestIdx, fit, table.length);
  const confidence = bestDiff <= 0.8 ? 'High — matches your build closely' : bestDiff <= 1.6 ? 'Good — between sizes, comfort picked' : 'Approximate — check the Size Guide table';
  return { size: table[finalIdx].size, confidence };
}

export function FindMySize({ open, onClose, categoryName, onSelect }: FindMySizeProps) {
  const bottoms = isBottoms(categoryName);
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [measure, setMeasure] = useState('');
  const [fit, setFit] = useState('regular');
  const [result, setResult] = useState<{ size: string; confidence: string } | null>(null);
  const [usedProfile, setUsedProfile] = useState(false);

  // Prefill from saved profile measurements, else last local result.
  useEffect(() => {
    if (!open) return;
    setResult(null);
    (async () => {
      try {
        const { profileApi } = await import('@/lib/api/profile');
        const p = await profileApi.getProfile();
        const m: any = (p as any).measurements;
        if (m) {
          if (m.heightCm) setHeight(String(m.heightCm));
          if (m.weightKg) setWeight(String(m.weightKg));
          if (m.fit) setFit(m.fit);
          const v = bottoms ? m.waistIn : m.chestIn;
          if (v) {
            setMeasure(String(v));
            setUsedProfile(true);
            return;
          }
        }
      } catch { /* guests / offline — fall through */ }
      try {
        const raw = localStorage.getItem('mentoos_my_size');
        if (raw) {
          const s = JSON.parse(raw);
          if (s.height) setHeight(String(s.height));
          if (s.weight) setWeight(String(s.weight));
          if (s.fit) setFit(s.fit);
        }
      } catch { /* ignore */ }
      setUsedProfile(false);
    })();
  }, [open, bottoms]);

  const run = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const mVal = parseFloat(measure);
    if (mVal && mVal > 20 && mVal < 65) {
      setResult(recommendFromMeasurement(mVal, fit, bottoms));
    } else {
      if (!h || !w || h < 140 || h > 220 || w < 35 || w > 180) return;
      setResult(recommendSize(h, w, fit, bottoms));
    }
    try {
      localStorage.setItem('mentoos_my_size', JSON.stringify({ height: h, weight: w, fit }));
    } catch { /* ignore */ }
  };

  const num = (v: string, set: (s: string) => void) => (
    <Input value={v} onChange={(e) => set(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" className="mt-1 text-sm" />
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold">
            <Sparkles className="w-5 h-5 text-amber-500" /> Find My Size
          </DialogTitle>
          <DialogDescription className="text-xs">
            {usedProfile ? 'Prefilled from your saved measurements — adjust if needed.' : 'Answer 3 quick questions — we recommend your Mentoos size.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-bold">{bottoms ? 'Waist (in) — recommended' : 'Chest (in) — recommended'}</Label>
            {num(measure, setMeasure)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-bold">Height (cm)</Label>{num(height, setHeight)}</div>
            <div><Label className="text-xs font-bold">Weight (kg)</Label>{num(weight, setWeight)}</div>
          </div>
          <div>
            <Label className="text-xs font-bold">Preferred fit</Label>
            <div className="flex gap-1.5 mt-1.5">
              {['slim', 'regular', 'relaxed', 'oversized'].map((f) => (
                <button key={f} onClick={() => setFit(f)} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border capitalize', fit === f ? 'bg-slate-900 text-white border-slate-900' : 'border-border')}>{f}</button>
              ))}
            </div>
          </div>
          {!result ? (
            <Button onClick={run} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl">Recommend My Size</Button>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
              <div className="text-[11px] uppercase font-bold text-muted-foreground">Your Mentoos size</div>
              <div className="text-4xl font-black">{result.size}</div>
              <div className="text-[11px] text-muted-foreground">{result.confidence}</div>
              <Button
                onClick={() => { onSelect(result.size); onClose(); }}
                className="w-full mt-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" /> Use Size {result.size}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
