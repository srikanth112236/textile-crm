'use client';

import { useEffect, useState } from 'react';

export function Demo2Cursor() {
  const [coords, setCoords] = useState({ x: -100, y: -100 });
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      if (
        target?.closest('button') ||
        target?.closest('a') ||
        target?.closest('[data-cursor-target]')
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    const handleMouseLeave = () => setVisible(false);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 transition-opacity duration-200"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Precision Crosshair */}
      <div className="relative flex items-center justify-center">
        {/* Horizontal axis */}
        <span
          className={`block bg-ink transition-all duration-150 ${
            hovered ? 'w-8 h-[2px] bg-brand' : 'w-5 h-[1px]'
          }`}
        />
        {/* Vertical axis */}
        <span
          className={`absolute block bg-ink transition-all duration-150 ${
            hovered ? 'h-8 w-[2px] bg-brand' : 'h-5 w-[1px]'
          }`}
        />

        {/* Framing box on hover */}
        {hovered && (
          <div className="absolute w-7 h-7 border border-brand animate-ping opacity-60" />
        )}

        {/* Real-time coordinate tag */}
        <div className="absolute left-4 top-4 whitespace-nowrap bg-ink text-paper font-mono text-[9px] px-1.5 py-0.5 tracking-tighter">
          {coords.x.toString().padStart(4, '0')} : {coords.y.toString().padStart(4, '0')}
        </div>
      </div>
    </div>
  );
}
