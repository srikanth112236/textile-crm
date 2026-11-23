'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export function Demo1Cursor() {
  const [cursorText, setCursorText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-cursor]');
      if (target) {
        const type = target.getAttribute('data-cursor') || 'VIEW';
        setCursorText(type);
        setIsHovered(true);
      } else {
        setCursorText('');
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY, isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-sans uppercase font-black tracking-widest text-[10px]"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: isHovered ? 72 : 10,
        height: isHovered ? 72 : 10,
        backgroundColor: isHovered ? 'rgba(23, 21, 19, 0.92)' : 'rgba(183, 121, 31, 0.95)',
        color: '#FBF9F5',
        backdropFilter: isHovered ? 'blur(4px)' : 'none',
        border: isHovered ? '1px solid rgba(241, 236, 227, 0.3)' : 'none',
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {isHovered && <span>{cursorText}</span>}
    </motion.div>
  );
}
