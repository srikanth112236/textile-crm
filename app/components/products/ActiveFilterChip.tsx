'use client';

import { X } from 'lucide-react';

export function ActiveFilterChip({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
      <span>
        {label}: {value}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label.toLowerCase()} filter ${value}`}
        className="rounded-full p-0.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
