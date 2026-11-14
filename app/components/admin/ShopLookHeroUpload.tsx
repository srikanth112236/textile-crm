'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { uploadApi } from '@/lib/api/upload';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';

interface ShopLookHeroUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB, matches the backend limit

// Uploaded files are absolute URLs, but relative `/uploads/...` paths from
// older records still need the Next.js proxy.
export function toDisplaySrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `/api/images${url}`;
  return url;
}

/**
 * Drag & drop (or click to browse) hero image picker for Shop the Look.
 * Uploads immediately and hands the public URL back to the form.
 */
export default function ShopLookHeroUpload({ value, onChange, disabled = false }: ShopLookHeroUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const shown = localPreview || value || '';

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('That image is larger than 10MB. Please pick a smaller file.');
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadApi.uploadFile(formData, 'shoplook');
      const url = res.imageUrl || res.url;
      if (!url) throw new Error('Upload succeeded but no image URL was returned.');
      onChange(url);
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
    } catch (err: any) {
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.details?.[0] ||
          err?.message ||
          'Failed to upload image.'
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const openPicker = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
          Hero image <span className="text-red-500">*</span>
        </label>
        {shown && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setLocalPreview(null);
              onChange('');
            }}
            disabled={disabled}
            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {shown ? (
        <div
          className={`group relative aspect-[16/10] w-full overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-950 transition-colors ${
            dragOver ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-slate-200 dark:border-slate-800'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={toDisplaySrc(shown)} alt="Shop the look hero preview" className="h-full w-full object-cover" />

          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              onClick={openPicker}
              disabled={disabled || uploading}
              className="rounded-lg font-semibold"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading…' : 'Replace'}
            </Button>
          </div>

          {dragOver && !uploading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-amber-500/20">
              <span className="rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white">
                Drop to replace image
              </span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/60">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="text-[11px] font-semibold text-white">Uploading…</span>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
            dragOver
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 hover:border-amber-400'
          } ${disabled || uploading ? 'cursor-not-allowed opacity-70' : ''}`}
          aria-label="Upload Shop the Look hero image"
        >
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              <span className="text-xs font-semibold text-slate-500">Uploading…</span>
            </>
          ) : (
            <>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                <UploadCloud className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Drag & drop or click to upload</span>
              <span className="px-6 text-center text-[11px] text-slate-500">
                JPG, PNG or WebP · up to 10MB · portrait or square looks best (4:5, 1200×1500)
              </span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
