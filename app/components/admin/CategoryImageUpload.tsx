'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { uploadApi } from '@/lib/api/upload';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';

interface CategoryImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  /** Aspect ratio class for the preview box. */
  aspect?: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB, matches backend limit

// Uploaded files are stored as absolute URLs in production, but relative
// `/uploads/...` paths from older records still need the Next.js proxy.
function toDisplaySrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `/api/images${url}`;
  return url;
}

export default function CategoryImageUpload({
  value,
  onChange,
  disabled = false,
  label = 'Category Image',
  hint = 'JPG, PNG or WebP — up to 10MB. Recommended 1200×800.',
  aspect = 'aspect-[4/3]',
}: CategoryImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadApi.uploadFile(formData, 'category');
      const url = res.imageUrl || res.url;
      if (!url) throw new Error('Upload succeeded but no image URL was returned.');
      onChange(url);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.details?.[0] ||
        err?.message ||
        'Failed to upload image.';
      setError(message);
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{label}</label>
        {value && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
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

      {value ? (
        <div className={`relative w-full ${aspect} overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 group`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={toDisplaySrc(value)}
            alt="Category preview"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="rounded-lg font-semibold"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading…' : 'Replace'}
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex w-full ${aspect} cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
            dragOver
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 hover:border-amber-400'
          } ${disabled || uploading ? 'cursor-not-allowed opacity-70' : ''}`}
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
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Click to upload or drag & drop</span>
              <span className="text-[11px] text-slate-500 px-6 text-center">{hint}</span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
