'use client';

import { RefObject, useEffect, useRef } from 'react';

/**
 * Basic focus trap for a mobile drawer/dialog:
 *  - focuses the first focusable element on open
 *  - keeps Tab/Shift+Tab inside
 *  - closes on Escape
 *  - restores focus to the previously focused element on close
 */
export function useFocusTrap(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const first = focusables()[0];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === firstItem || !container.contains(active))) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && (active === lastItem || !container.contains(active))) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [open, containerRef]);
}
