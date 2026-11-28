'use client';

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Pointer-driven 3D tilt surface.
 *
 * Uses a plain CSS transform driven by pointer position — no spring library,
 * no layout reads on scroll — so it stays smooth on phones and old laptops.
 * Children can be lifted on the Z axis with `translateZ()` because the card
 * keeps `transform-style: preserve-3d`.
 */
export function TiltCard({
  children,
  className = '',
  max = 10,
  glare = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ rx: 0, ry: 0, mx: 50, my: 50, active: false });

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setState({
      rx: (0.5 - py) * max * 2,
      ry: (px - 0.5) * max * 2,
      mx: px * 100,
      my: py * 100,
      active: true,
    });
  };

  const reset = () => setState({ rx: 0, ry: 0, mx: 50, my: 50, active: false });

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={`relative will-change-transform [transform-style:preserve-3d] ${className}`}
      style={{
        ...style,
        transform: `perspective(1100px) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg) scale(${state.active ? 1.02 : 1})`,
        transition: state.active
          ? 'transform 120ms ease-out'
          : 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {children}
      {glare ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${state.mx}% ${state.my}%, rgba(255,255,255,0.35), transparent 62%)`,
            opacity: state.active ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
        />
      ) : null}
    </div>
  );
}
