'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { ISizeChartRow } from '@/lib/api/types';
import { MEASURE_COLUMNS, defaultRowsFor } from '@/lib/sizeCharts';

interface SizeChartEditorProps {
  rows: ISizeChartRow[];
  onChange: (rows: ISizeChartRow[]) => void;
  modelHeight: string;
  onModelHeightChange: (v: string) => void;
  modelSizeWorn: string;
  onModelSizeWornChange: (v: string) => void;
  categoryName?: string;
}

const emptyRow = (): ISizeChartRow => ({ size: '' });

export function SizeChartEditor({
  rows,
  onChange,
  modelHeight,
  onModelHeightChange,
  modelSizeWorn,
  onModelSizeWornChange,
  categoryName,
}: SizeChartEditorProps) {
  const setCell = (idx: number, key: keyof ISizeChartRow, v: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [key]: v } : r));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Model height (e.g. 6'0")</Label>
          <Input value={modelHeight} onChange={(e) => onModelHeightChange(e.target.value)} placeholder="6'0&quot;" maxLength={20} className="h-8 text-xs mt-1" />
        </div>
        <div>
          <Label className="text-xs">Size worn by model (e.g. L)</Label>
          <Input value={modelSizeWorn} onChange={(e) => onModelSizeWornChange(e.target.value)} placeholder="L" maxLength={10} className="h-8 text-xs mt-1" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed p-3">
          <p className="text-xs text-muted-foreground">No override — shoppers see the {categoryName || 'category'} table.</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => onChange(defaultRowsFor(categoryName))}>
              Load defaults
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => onChange([emptyRow()])}>
              <Plus className="h-3 w-3 mr-1" /> Add row
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-1.5 text-left font-semibold">Size</th>
                  {MEASURE_COLUMNS.map((c) => (
                    <th key={c.key} className="px-2 py-1.5 text-left font-semibold">{c.label}</th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-1.5 py-1">
                      <Input value={r.size} onChange={(e) => setCell(i, 'size', e.target.value)} placeholder="M" maxLength={10} className="h-7 text-xs font-bold w-16" />
                    </td>
                    {MEASURE_COLUMNS.map((c) => (
                      <td key={c.key} className="px-1.5 py-1">
                        <Input value={(r as any)[c.key] || ''} onChange={(e) => setCell(i, c.key, e.target.value)} placeholder="–" maxLength={20} className="h-7 text-xs w-16" inputMode="decimal" />
                      </td>
                    ))}
                    <td className="px-1.5 py-1">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove row">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => onChange([...rows, emptyRow()])}>
              <Plus className="h-3 w-3 mr-1" /> Add row
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => onChange([])}>
              Clear (use category table)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
