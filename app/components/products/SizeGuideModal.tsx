'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ruler } from 'lucide-react';
import type { ISizeChartRow } from '@/lib/api/types';
import { defaultRowsFor, activeColumns } from '@/lib/sizeCharts';

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  categoryName?: string;
  // Per-product override (inches). Empty/undefined = category table.
  chart?: ISizeChartRow[];
  modelHeight?: string;
  modelSizeWorn?: string;
}

export function SizeGuideModal({ open, onClose, categoryName, chart, modelHeight, modelSizeWorn }: SizeGuideModalProps) {
  const rows = chart && chart.length > 0 ? chart : defaultRowsFor(categoryName);
  const cols = activeColumns(rows);
  const modelLine =
    modelHeight || modelSizeWorn
      ? `Model is ${modelHeight || "6'0\""} and wears size ${modelSizeWorn || 'L'}.`
      : `Model is 6'0" and wears size L.`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold">
            <Ruler className="w-5 h-5 text-amber-500" /> Size Guide — {categoryName || 'Mentoos Apparel'}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">All measurements in inches. {modelLine} When between sizes, take the larger one for comfort fit.</p>
        </DialogHeader>

        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-muted font-bold">
              <th className="p-2 border">Size</th>
              {cols.map((c) => <th key={c.key} className="p-2 border">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size}>
                <td className="p-2 border font-bold">{r.size}</td>
                {cols.map((c) => <td key={c.key} className="p-2 border">{(r as any)[c.key] || '–'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p className="font-bold text-foreground">How to measure:</p>
          <p>• Chest — tape around the fullest part of your chest, under arms.</p>
          <p>• Waist — around your natural waistline, one finger of ease.</p>
          <p>• Shoulder — seam to seam across the back.</p>
          <p>• Length — from highest shoulder point down.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
