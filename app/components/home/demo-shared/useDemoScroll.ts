'use client';

import { useEffect, type RefObject } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Shared motion engine for the five alternative demo storefronts.
 *
 * Design rules that keep this fail-safe:
 *  - Content is visible by default. Initial "hidden" states are only applied
 *    in the browser, and only when the animation that reveals them can run.
 *  - Entrances use IntersectionObserver (reliable, cheap) instead of
 *    ScrollTrigger, so a missed refresh can never leave a section blank.
 *  - ScrollTrigger is reserved for parallax, scale and pinning. Pinning only
 *    runs at >=1024px; below that the rails scroll natively (the markup has
 *    `overflow-x-auto lg:overflow-hidden`).
 *
 * Opt-in data attributes:
 *  - data-reveal            rise/fade in once when it enters the viewport
 *  - data-reveal-group      staggers its direct children in
 *  - data-line              masked line that unmasks horizontally
 *  - data-parallax="0.3"    translate on scroll (negative moves opposite)
 *  - data-parallax-scope    element used as the parallax trigger
 *  - data-scale-scroll      slow scale while the section is in view
 *  - data-hscroll           horizontal track pinned and scrubbed (desktop)
 */
export function useDemoScroll(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = scope.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cleanupListeners: (() => void) | null = null;
    const cleanupTimers: Array<() => void> = [];

    // Lenis smooth scrolling, driven by the GSAP ticker ---------------------
    let lenis: Lenis | null = null;
    let ticker: ((time: number) => void) | null = null;
    if (!reduce) {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      });
      lenis.on('scroll', ScrollTrigger.update);
      ticker = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);
    }

    // Entrances (IntersectionObserver, never leaves content hidden) --------
    const revealEls = Array.from(
      root.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-group] > *, [data-line]')
    );

    let io: IntersectionObserver | null = null;

    // Reveals never start fully invisible: the resting state is 45% opacity,
    // so even if every trigger fails the copy is still readable. Motion then
    // lifts it to full opacity on the way in.
    const reveal = (el: HTMLElement) => {
      if (el.dataset.revealed === 'true') return;
      el.dataset.revealed = 'true';
      io?.unobserve(el);
      gsap.to(el, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', overwrite: 'auto' });
      // GSAP's ticker rides requestAnimationFrame, which is suspended in a
      // background tab and in some embedded views. A wall-clock timer (hidden
      // tabs still run them) guarantees the element lands at full opacity.
      window.setTimeout(() => {
        if (parseFloat(window.getComputedStyle(el).opacity) < 0.99) {
          gsap.set(el, { opacity: 1, y: 0 });
        }
      }, 1400);
    };

    if (!reduce && revealEls.length) {
      revealEls.forEach((el) => {
        // A remount (StrictMode, HMR, route restore) must not re-fade content
        // that has already been revealed — it would stay stuck mid-way.
        if (el.dataset.revealed === 'true') {
          gsap.set(el, { opacity: 1, y: 0 });
          return;
        }
        gsap.set(el, { opacity: el.hasAttribute('data-line') ? 0.65 : 0.55, y: 24 });
      });

      if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) reveal(entry.target as HTMLElement);
            });
          },
          { rootMargin: '0px 0px -6% 0px', threshold: 0.02 }
        );
        revealEls.forEach((el) => io!.observe(el));
      }

      // Scroll fallback: any revealable element that scrolls into view is
      // revealed even if the observer never fired (pins, HMR, odd layouts).
      let ticking = false;
      const checkInView = () => {
        ticking = false;
        revealEls.forEach((el) => {
          if (el.dataset.revealed === 'true') return;
          // Anything at or above the fold line is revealed, including content
          // already scrolled past (fast scrolls, anchor jumps, back/forward).
          if (el.getBoundingClientRect().top < window.innerHeight * 0.94) reveal(el);
        });
      };
      // setTimeout rather than rAF: rAF is throttled to zero in background
      // tabs, which would leave sections mid-reveal.
      let pending = false;
      const onScroll = () => {
        if (pending) return;
        pending = true;
        window.setTimeout(() => {
          pending = false;
          checkInView();
        }, 120);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      checkInView();

      // Late layout (images, fonts, pins) can move targets into view without a
      // scroll event — keep a light heartbeat for the first half minute.
      const heartbeat = window.setInterval(checkInView, 1200);
      cleanupTimers.push(() => window.clearInterval(heartbeat));
      cleanupListeners = () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };

      // Re-check after fonts and images settle, so anything already in view is
      // never left at its resting 45% state.
      const safety = window.setTimeout(checkInView, 1200);
      cleanupTimers.push(() => window.clearTimeout(safety));
    }

    // Scroll-linked motion -------------------------------------------------
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const depth = parseFloat(el.dataset.parallax || '0.25');
        const trigger = el.closest('[data-parallax-scope]') || el;
        gsap.fromTo(
          el,
          { yPercent: -depth * 14 },
          {
            yPercent: depth * 14,
            ease: 'none',
            scrollTrigger: {
              trigger: trigger as Element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-scale-scroll]').forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 1.1 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el.closest('[data-parallax-scope]') || el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });

      // Desktop-only pinned rails. Mobile uses native horizontal scroll.
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        gsap.utils.toArray<HTMLElement>('[data-hscroll]').forEach((track) => {
          const wrapper = track.parentElement as HTMLElement | null;
          if (!wrapper) return;
          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
          if (distance() < 40) return;

          gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: wrapper,
              start: 'top top',
              end: () => `+=${distance() + window.innerHeight * 0.35}`,
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
        });
      });
    }, root);

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      window.clearTimeout(refresh);
      cleanupTimers.forEach((fn) => fn());
      cleanupListeners?.();
      io?.disconnect();
      ctx.revert();
      if (ticker) gsap.ticker.remove(ticker);
      lenis?.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [scope]);
}

export const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];
