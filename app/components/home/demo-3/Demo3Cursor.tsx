'use client';

import { useEffect, useState } from 'react';

export function Demo3Cursor() {
  const [coords, setCoords] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      if (target?.closest('button') || target?.closest('a')) {
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
      className="pointer-events-none fixed z-50 transition-transform duration-75 ease-out"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`rounded-full transition-all duration-200 flex items-center justify-center font-sans ${
          hovered
            ? 'w-12 h-12 bg-neutral-900 text-white scale-110 shadow-xl text-[10px] uppercase font-bold tracking-widest'
            : 'w-3.5 h-3.5 bg-neutral-900 border-2 border-white/80 shadow-md'
        }`}
      >
        {hovered ? 'view' : ''}
      </div>
    </div>
  );
}
