'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Compass, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const DEMOS = [
  { num: '01', path: '/demo-1', title: 'Editorial Luxe', agency: 'Kinfolk · Locomotive' },
  { num: '02', path: '/demo-2', title: 'Brutalist Atelier', agency: 'Studio Freight · Borsche' },
  { num: '03', path: '/demo-3', title: 'Neo-Minimalist', agency: 'Lemaire · Jacquemus' },
  { num: '04', path: '/demo-4', title: 'Kinetic Runway', agency: 'Resn · Monopo Tokyo' },
  { num: '05', path: '/demo-5', title: 'Mediterranean Craft', agency: 'Koto · Pentagram' },
];

export function DemoFloatingSwitcher() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredDemo, setHoveredDemo] = useState<string | null>(null);

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-mentoos-search'));
  };

  return (
    <aside aria-label="Demo Navigation" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 font-sans select-none pointer-events-auto">
      {/* Tooltip on hover */}
      {hoveredDemo && !collapsed && (
        <div className="bg-ink text-paper px-3 py-1.5 rounded-full text-[11px] font-mono shadow-xl border border-paper/20 backdrop-blur-md animate-fade-in flex items-center gap-2 mb-1">
          <Sparkles className="w-3 h-3 text-brand" />
          <span>{hoveredDemo}</span>
        </div>
      )}

      {/* Main Switcher Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-ink/90 backdrop-blur-xl border border-white/20 text-paper rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300">
        {!collapsed && (
          <>
            {/* Search Pill */}
            <button
              onClick={openSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper/10 hover:bg-brand text-paper hover:text-paper text-xs font-mono tracking-wider transition-all duration-200"
              title="Open Smart Search (⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-brand" />
              <span className="hidden sm:inline text-[11px] font-bold">SEARCH</span>
            </button>

            <span className="w-px h-4 bg-white/20 my-auto mx-0.5" />

            {/* Demo Buttons */}
            <div className="flex items-center gap-1">
              {DEMOS.map((d) => {
                const isActive = pathname === d.path;
                return (
                  <Link
                    key={d.num}
                    href={d.path}
                    onMouseEnter={() => setHoveredDemo(`${d.num}: ${d.title} (${d.agency})`)}
                    onMouseLeave={() => setHoveredDemo(null)}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-brand text-paper scale-105 shadow-md shadow-brand/40 ring-2 ring-brand/40'
                        : 'bg-paper/5 hover:bg-paper/20 text-paper/80 hover:text-paper'
                    }`}
                  >
                    {d.num}
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Collapse / Expand Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-full bg-paper/10 hover:bg-paper/20 text-paper flex items-center justify-center transition-colors"
          title={collapsed ? 'Expand Demo Switcher' : 'Minimize Switcher'}
        >
          {collapsed ? (
            <Compass className="w-4 h-4 text-brand animate-spin-slow" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-paper/70" />
          )}
        </button>
      </div>
    </aside>
  );
}
