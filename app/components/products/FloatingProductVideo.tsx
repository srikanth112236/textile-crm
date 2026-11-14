'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, Volume2, VolumeX, X, RotateCcw, Play, Pause, Minimize2 } from 'lucide-react';

interface FloatingProductVideoProps {
  src: string;
  poster?: string;
  title?: string;
}

const MARGIN = 16;

function resolveSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const api = process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com';
  return url.startsWith('/') ? `${api}${url}` : `${api}/${url}`;
}

/**
 * Draggable, muted, looping product video that floats above the page.
 * Pointer Events so it works with mouse, touch and pen.
 */
export function FloatingProductVideo({ src, poster, title }: FloatingProductVideoProps) {
  const [mounted, setMounted] = useState(false);
  const [closed, setClosed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    // Approximate bottom-right on the very first client render to avoid a
    // flash at the top-left corner; refined once the panel is measured.
    if (typeof window === 'undefined') return { x: MARGIN, y: MARGIN };
    return {
      x: MARGIN + 8,
      y: Math.max(MARGIN, window.innerHeight - 320 - MARGIN),
    };
  });
  const [dragging, setDragging] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const clamp = useCallback((x: number, y: number) => {
    const el = panelRef.current;
    const width = el?.offsetWidth || 240;
    const height = el?.offsetHeight || 320;
    const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - height - MARGIN);
    return {
      x: Math.min(Math.max(MARGIN, x), maxX),
      y: Math.min(Math.max(MARGIN, y), maxY),
    };
  }, []);

  const snapToCorner = useCallback(() => {
    const el = panelRef.current;
    const width = el?.offsetWidth || 240;
    const height = el?.offsetHeight || 320;
    // Keep clear of the mobile sticky "Add to cart" bar.
    const bottomPad = window.innerWidth < 640 ? 88 : MARGIN;
    setPos({
      x: MARGIN + 8,
      y: Math.max(MARGIN, window.innerHeight - height - bottomPad),
    });
  }, []);

  // Mount first, then measure the real panel before placing it.
  useEffect(() => {
    setMounted(true);
    // Mobile: start collapsed so the video never covers the product/CTAs.
    setExpanded(window.innerWidth >= 640);
  }, []);

  useEffect(() => {
    if (!mounted || !expanded) return;
    const id = requestAnimationFrame(snapToCorner);
    return () => cancelAnimationFrame(id);
  }, [mounted, expanded, snapToCorner]);

  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p.x, p.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clamp]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on buttons inside the handle
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const next = clamp(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y);
      setPos(next);
    };
    const onUp = () => setDragging(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, clamp]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    // Unmuting also counts as a user gesture — make sure playback continues.
    if (!video.paused) setPlaying(true);
  };

  if (!src || closed || !mounted) return null;

  if (!expanded) {
    return (
      <div className="fixed bottom-24 left-4 z-[70] flex items-center gap-1 sm:bottom-6">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-slate-950/95 px-2.5 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-sm hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-4 sm:py-2.5"
          aria-label={title ? `Play product video: ${title}` : 'Play product video'}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950">
            <Play className="h-3 w-3 fill-current" />
          </span>
          <span className="hidden max-w-[130px] truncate sm:inline">Watch product video</span>
        </button>
        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Close product video"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/95 text-slate-300 shadow-2xl backdrop-blur-sm hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-[70] select-none touch-none"
      style={{ left: pos.x, top: pos.y }}
      role="complementary"
      aria-label={title ? `Product video: ${title}` : 'Product video'}
    >
      <div
        className={`w-[180px] sm:w-[240px] rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl ring-1 ring-black/20 ${
          dragging ? 'shadow-amber-500/20' : ''
        }`}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onPointerDown}
          className={`flex items-center gap-1.5 px-2 py-1.5 bg-slate-900/95 text-white ${
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title="Drag to move"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[10px] font-bold truncate flex-1">
            {title || 'Product video'}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Minimize video"
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={snapToCorner}
            aria-label="Reset video position"
            className="hidden sm:block p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label="Close video"
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative aspect-[9/16] max-h-[58vh] bg-black group">
          <video
            ref={videoRef}
            src={resolveSrc(src)}
            poster={poster ? resolveSrc(poster) : undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause video' : 'Play video'}
            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
              playing ? 'opacity-0 group-hover:opacity-100 bg-black/0 hover:bg-black/20' : 'opacity-100 bg-black/30'
            }`}
          >
            {playing ? (
              <Pause className="w-8 h-8 text-white/90 drop-shadow" />
            ) : (
              <Play className="w-8 h-8 text-white/90 fill-current drop-shadow" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
