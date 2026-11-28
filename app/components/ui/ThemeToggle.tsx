'use client';

import { useState, useEffect } from 'react';

/**
 * ThemeToggle - Toggles between light and dark theme with persistence
 * Persists user preference in localStorage and respects prefers-reduced-motion
 */
export function ThemeToggle({ className }: { className?: string } = {}) {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then prefers-color-scheme, then default to light
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vedasynk-theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vedasynk-theme', isDark ? 'light' : 'dark');
    }
  };

  useEffect(() => {
    // Apply the theme class to html element
    if (typeof window !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark]);

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`p-2 rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className ?? ''}`}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        // Moon icon for dark mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0Zm7.377-2.227a1 1 0 01-.758-.385A5.987 5.987 0 016.25 5.75a5.988 5.988 0 016.885-2.718c.106.18.167.337.203.503a1 1 0 01.118.528c-.786.385-1.39.962-1.798 1.48a1 1 0 01-.367.317c-.013.045-.027.09-.042.134ZM10 15a5 5 0 100-10 5 5 0 000 10Z" />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4zM9.083 4.92a1 1 0 011.414.567l.758 1.928a1 1 0 00.204.088l1.404-.628a1 1 0 01.636.438l1.404.628a1 1 0 00.204.088l.758-1.928a1 1 0 011.414-.567l1.123-2.648a1 1 0 01-.24-.748L15.5 1.83a1 1 0 01.06-.14l.758 1.928a1 1 0 00.08.203l-1.404.628a1 1 0 01-.636.438l-1.404-.628a1 1 0 00-.204-.088l-.758 1.928a1 1 0 01-1.414.567l-1.123 2.648a1 1 0 01-.24.748l.637 1.568a1 1 0 01-.127.228l-.636-1.568Zm6.688 5.163a1 1 0 11-1.977-1.826 1 1 0 011.978 1.826Z" />
        </svg>
      )}
    </button>
  );
}