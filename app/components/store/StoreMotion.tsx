'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface RevealProps {
  children: ReactNode;
  /** Stagger in ms. */
  delay?: number;
  /** Distance travelled in px. */
  y?: number;
  className?: string;
}

/**
 * Reveal-on-enter that can never leave content invisible: the resting state is
 * 65% opacity and full opacity is also applied client-side if the observer
 * never fires (background tabs, print, reduced motion engines).
 */
export function Reveal({ children, delay = 0, y = 18, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 }
    );
    io.observe(el);
    const failSafe = window.setTimeout(() => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.96) setShown(true);
    }, 1000);
    return () => {
      io.disconnect();
      window.clearTimeout(failSafe);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0.65,
        transform: shown ? 'none' : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 720ms ${EASE} ${delay}ms, transform 720ms ${EASE} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

interface MarqueeProps {
  items: string[];
  className?: string;
  /** Seconds for one full loop. */
  duration?: number;
  reverse?: boolean;
}

/** Dependency-free infinite marquee — duplicated track, CSS keyframes. */
export function Marquee({ items, className = '', duration = 26, reverse = false }: MarqueeProps) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden>
      <div
        className="store-marquee-track flex w-max will-change-transform"
        style={{
          animation: `store-marquee ${duration}s linear infinite${reverse ? ' reverse' : ''}`,
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {items.map((item, i) => (
              <span key={`${copy}-${i}`} className="flex items-center gap-6 whitespace-nowrap px-6 text-[11px] font-semibold uppercase tracking-[0.28em]">
                {item}
                <span className="inline-block h-1 w-1 rounded-full bg-current opacity-40" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
