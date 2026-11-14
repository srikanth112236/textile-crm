'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  id: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  thumb?: string;
  keywords?: string;
}

interface SearchComboboxProps {
  label: string;
  required?: boolean;
  placeholder: string;
  emptyLabel: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (id: string, option: ComboboxOption | null) => void;
  disabled?: boolean;
  disabledHint?: string;
  /** Minimum characters before results are shown. 0 = show everything on open. */
  minChars?: number;
  searchPlaceholder?: string;
  /** Icon shown when the option has no thumbnail */
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  /** Extra content rendered under the trigger (e.g. inline errors) */
  footer?: React.ReactNode;
  className?: string;
}

const PANEL_MAX_HEIGHT = 300;

/**
 * Searchable combobox whose dropdown is rendered in a portal with fixed
 * positioning. Because the panel is not a child of the surrounding card, it
 * can never be clipped by `overflow-hidden`, transformed or scroll containers
 * — the list always opens fully and stays aligned with its trigger.
 */
export function SearchCombobox({
  label,
  required,
  placeholder,
  emptyLabel,
  options,
  value,
  onChange,
  disabled,
  disabledHint,
  minChars = 0,
  searchPlaceholder,
  fallbackIcon: FallbackIcon,
  hint,
  footer,
  className,
}: SearchComboboxProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    width: number;
    maxHeight: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  const selected = useMemo(() => options.find((o) => o.id === value) ?? null, [options, value]);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const openUp = spaceBelow < 190 && spaceAbove > spaceBelow;
    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - margin * 2);
    const left = Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin);
    const maxHeight = Math.max(160, Math.min(PANEL_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow));

    setPosition({
      left,
      width,
      maxHeight,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    });
  }, []);

  // Keep the portal glued to the trigger while the page scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    measure();
    const onScroll = () => measure();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, measure]);

  // Close on outside click (panel lives outside the trigger in the portal).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(t);
    }
    setQuery('');
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = q.length < minChars
      ? options
      : options.filter((o) =>
          (o.keywords || `${o.title} ${o.subtitle ?? ''}`).toLowerCase().includes(q),
        );
    return source.slice(0, 80);
  }, [options, query, minChars]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(results.length - 1, 0)));
  }, [results.length]);

  const openPanel = () => {
    if (disabled) return;
    measure();
    setOpen(true);
  };

  const closePanel = () => {
    setOpen(false);
    setQuery('');
  };

  const pick = (option: ComboboxOption) => {
    onChange(option.id, option);
    closePanel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = results[activeIndex];
      if (option) pick(option);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePanel();
    } else if (e.key === 'Tab') {
      closePanel();
    }
  };

  const renderIcon = (thumb: string | undefined, size: 'sm' | 'md') => {
    if (thumb) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className={cn(
            'rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0',
            size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
          )}
        />
      );
    }
    return (
      <span
        className={cn(
          'rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0',
          size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        )}
      >
        {FallbackIcon ? <FallbackIcon className="h-3.5 w-3.5" /> : null}
      </span>
    );
  };

  return (
    <div className={cn('relative min-w-0', className)}>
      <Label className="text-[11px] font-bold">
        {label} {required && <span className="text-amber-600">*</span>}
      </Label>

      <div ref={anchorRef} className="mt-1">
        {selected ? (
          <div className="w-full flex items-center gap-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-2.5 pr-2 h-10 transition-colors hover:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/40">
            <button
              type="button"
              onClick={openPanel}
              className="min-w-0 flex flex-1 items-center gap-2.5 text-left outline-none"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              {renderIcon(selected.thumb, 'sm')}
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold truncate">{selected.title}</span>
                {selected.subtitle && (
                  <span className="block text-[10px] text-muted-foreground truncate">{selected.subtitle}</span>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { onChange('', null); closePanel(); }}
              aria-label={`Clear ${label}`}
              className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={openPanel}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 h-10 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:border-amber-400 transition-colors"
          >
            <span className="text-xs text-muted-foreground truncate">
              {disabled ? disabledHint : placeholder}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>
        )}
      </div>

      {disabled && disabledHint && !selected && (
        <p className="text-[9px] font-medium text-amber-600 mt-1">{disabledHint}</p>
      )}
      {hint && !footer && <p className="text-[9px] text-muted-foreground mt-1">{hint}</p>}
      {footer}

      {mounted && open && position && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          aria-label={label}
          style={{
            position: 'fixed',
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight,
            top: position.top,
            bottom: position.bottom,
          }}
          className="z-[120] flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        >
          <div className="relative border-b border-slate-200 dark:border-slate-800 shrink-0">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder || placeholder}
              className="w-full pl-9 pr-3 h-10 bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {query.trim().length < minChars ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Type {minChars > 1 ? `${minChars}+ characters` : 'to search'} to filter
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{options.length} available</p>
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-[11px] font-semibold">{emptyLabel}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Try a different search term.</p>
              </div>
            ) : (
              results.map((option, i) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(option)}
                  className={cn(
                    'w-full text-left flex items-center gap-2.5 px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0 transition-colors',
                    i === activeIndex ? 'bg-amber-500/10' : 'hover:bg-amber-500/5',
                  )}
                >
                  {renderIcon(option.thumb, 'md')}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold truncate">{option.title}</span>
                    {option.subtitle && (
                      <span className="block text-[10px] text-muted-foreground truncate">{option.subtitle}</span>
                    )}
                  </span>
                  {option.meta && <span className="shrink-0">{option.meta}</span>}
                </button>
              ))
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[9px] font-semibold text-muted-foreground">
              {results.length} of {options.length}
            </span>
            <span className="text-[9px] text-slate-400">↑↓ to move · ↵ to select · esc to close</span>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
