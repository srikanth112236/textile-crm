'use client';

import { useEffect } from 'react';
import { ExternalLink, Instagram } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics/events';
import { parseInstagramUrl } from '@/lib/media/instagram';

export interface InstagramEmbedModalProps {
  open: boolean;
  onClose: () => void;
  embedUrl?: string;
  sourceUrl?: string;
  title?: string;
  posterUrl?: string;
  aspectRatio?: '9:16' | '1:1';
  productId?: string;
  placement?: 'pdp' | 'ugc' | 'home';
}

/**
 * Click-to-load Instagram embed.
 *
 * No Instagram request is made until this dialog opens. The iframe is lazy,
 * isolated and always paired with an "Open on Instagram" fallback.
 */
export function InstagramEmbedModal({
  open,
  onClose,
  embedUrl,
  sourceUrl,
  title = 'Instagram Reel',
  aspectRatio = '9:16',
  productId,
  placement = 'pdp',
}: InstagramEmbedModalProps) {
  const parsed = parseInstagramUrl(sourceUrl || embedUrl);
  const shortcode = parsed?.shortcode || '';
  const watchUrl = sourceUrl || parsed?.sourceUrl || 'https://www.instagram.com/';

  useEffect(() => {
    if (!open) return;
    trackEvent('reel_play', {
      productId,
      shortcode,
      provider: 'instagram',
      placement,
    });
    // One play event per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-[460px] gap-0 overflow-hidden rounded-2xl border-slate-800 bg-slate-950 p-0 [&>button]:text-white">
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-white/10 px-4 py-3 pr-12 text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-amber-400 text-white">
              <Instagram className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-sm font-bold text-white">{title}</DialogTitle>
              <DialogDescription className="text-[10px] text-white/60">
                {shortcode ? `Reel · ${shortcode}` : 'Instagram'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className={`relative w-full ${aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[9/16]'} bg-black`}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`Instagram Reel — ${title}`}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              allow="encrypted-media; picture-in-picture; clipboard-write"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white/70">
              <Instagram className="h-8 w-8" />
              <p className="text-sm">This Reel cannot be embedded here.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
          <p className="text-[10px] text-white/50">
            Playback is provided by Instagram.
          </p>
          <Button asChild size="sm" variant="secondary" className="h-8 text-[11px] font-bold">
            <a href={watchUrl} target="_blank" rel="noopener noreferrer">
              Watch on Instagram <ExternalLink className="ml-1.5 h-3 w-3" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
