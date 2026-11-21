'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, Trash2, Video, Link2, Instagram, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { looksLikeInstagram, parseInstagramUrl } from '@/lib/media/instagram';

export interface ProductVideoInfo {
  url: string;
  thumbnailUrl?: string;
  title?: string;
  enabled?: boolean;
  provider?: 'upload' | 'instagram' | 'youtube' | 'vimeo';
  sourceUrl?: string;
  shortcode?: string;
  embedUrl?: string;
  mediaType?: 'file' | 'reel' | 'post' | 'tv';
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

interface ProductVideoManagerProps {
  videos: ProductVideoInfo[];
  onChange: (videos: ProductVideoInfo[]) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com';

/** Videos are stored as absolute backend URLs, but tolerate relative paths. */
function resolveSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
  return url;
}

export default function ProductVideoManager({ videos, onChange }: ProductVideoManagerProps) {
  const video = videos[0];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const draftInstagram = parseInstagramUrl(urlDraft);
  const isInstagram = video?.provider === 'instagram' || Boolean(video?.embedUrl);

  const update = (patch: Partial<ProductVideoInfo>) => {
    const next: ProductVideoInfo = {
      ...(video || { url: '' }),
      ...patch,
    };
    onChange([next]);
  };

  const uploadFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Please choose a video file (mp4, webm, mov…).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be under 50MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener('load', () => {
      setUploading(false);
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = data.videoUrl || data.url;
          if (!url) throw new Error('Upload succeeded but no video URL was returned.');
          onChange([{ ...(video || {}), url, enabled: video?.enabled !== false }]);
        } else {
          throw new Error(data.error || 'Failed to upload video');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to upload video');
      }
    });
    xhr.addEventListener('error', () => {
      setUploading(false);
      setError('Network error while uploading video.');
    });
    xhr.open('POST', '/api/upload/product-video');
    xhr.send(formData);
  };

  const applyUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    const instagram = parseInstagramUrl(url);
    if (looksLikeInstagram(url) && !instagram) {
      setError('That looks like an Instagram link, but it is not a Reel, Post or TV URL.');
      return;
    }
    setError(null);
    if (instagram) {
      onChange([{
        ...(video || { url: instagram.sourceUrl }),
        url: instagram.sourceUrl,
        provider: 'instagram',
        sourceUrl: instagram.sourceUrl,
        shortcode: instagram.shortcode,
        embedUrl: instagram.embedUrl,
        mediaType: instagram.mediaType,
        aspectRatio: instagram.aspectRatio,
        enabled: video?.enabled !== false,
      }]);
    } else {
      onChange([{
        ...(video || {}),
        url,
        provider: 'upload',
        mediaType: 'file',
        aspectRatio: '16:9',
        sourceUrl: undefined,
        shortcode: undefined,
        embedUrl: undefined,
        enabled: video?.enabled !== false,
      }]);
    }
    setUrlDraft('');
    setShowUrlInput(false);
  };

  const remove = () => {
    onChange([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        MP4/WebM plays in the draggable floating player. Instagram Reels open in a click-to-load 9:16 modal.
      </p>

      {error && (
        <p className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      {!video?.url ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Add a product video</p>
            <p className="text-xs text-muted-foreground">MP4 / WebM, up to 50MB</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Upload video
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => setShowUrlInput((v) => !v)}
            >
              <Link2 className="h-4 w-4 mr-1.5" />
              Paste URL
            </Button>
          </div>
          {showUrlInput && (
            <div className="flex gap-2 max-w-xl mx-auto pt-1">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="MP4 URL or Instagram Reel link"
                className="h-9 text-xs"
              />
              <Button type="button" size="sm" onClick={applyUrl} disabled={!urlDraft.trim()}>
                Add
              </Button>
            </div>
          )}
          {urlDraft.trim() && (
            <div className="mx-auto max-w-xl">
              {draftInstagram ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left">
                  <span className="flex items-center gap-2 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Instagram {draftInstagram.mediaType} detected · {draftInstagram.shortcode}
                  </span>
                  <a href={draftInstagram.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-emerald-800 underline">
                    Preview <ExternalLink className="inline h-3 w-3" />
                  </a>
                </div>
              ) : looksLikeInstagram(urlDraft) ? (
                <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                  <AlertCircle className="h-3.5 w-3.5" /> Not an Instagram Reel, Post or TV URL.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Will be treated as a hosted video file.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className={`w-full sm:w-48 shrink-0 overflow-hidden rounded-lg bg-slate-950 ${isInstagram ? 'aspect-[9/16]' : 'aspect-video'}`}>
              {isInstagram ? (
                <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-fuchsia-600/30 via-slate-950 to-amber-500/20 p-3 text-center">
                  <Instagram className="h-7 w-7 text-white" />
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-white">
                    Reel detected
                  </p>
                  <p className="text-[9px] font-mono text-white/60">{video.shortcode}</p>
                  <a
                    href={video.sourceUrl || video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 underline"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <video
                  src={resolveSrc(video.url)}
                  poster={video.thumbnailUrl ? resolveSrc(video.thumbnailUrl) : undefined}
                  controls
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div>
                  <Label className="text-xs font-semibold">
                    {isInstagram ? 'Show Reel on product page' : 'Show floating player'}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {isInstagram
                      ? 'Click-to-load 9:16 embed. Nothing loads until the shopper taps Play.'
                      : 'Draggable, muted autoplay on the product page.'}
                  </p>
                </div>
                <Switch
                  aria-label={isInstagram ? 'Show Instagram Reel on product page' : 'Show floating product video'}
                  checked={video.enabled !== false}
                  onCheckedChange={(c) => update({ enabled: c })}
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold">Video title (optional)</Label>
                <Input
                  value={video.title || ''}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="e.g. Fabric close-up"
                  className="h-8 text-xs mt-1"
                  maxLength={120}
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold">Poster image URL (optional)</Label>
                <Input
                  value={video.thumbnailUrl || ''}
                  onChange={(e) => update({ thumbnailUrl: e.target.value })}
                  placeholder="https://… (shown before the video loads)"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Replace
                </>
              )}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={remove}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Remove
            </Button>
            <span className="text-[11px] text-muted-foreground truncate max-w-full">
              {video.url}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
