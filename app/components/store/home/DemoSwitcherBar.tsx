'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, ChevronUp, ChevronDown, Check, Compass, ArrowUpRight } from 'lucide-react';

const DEMOS = [
  { id: 'demo-1', path: '/demo-1', label: 'Demo 1', name: 'Hybrid Parallax + Flip', badge: 'Recommended' },
  { id: 'demo-2', path: '/demo-2', label: 'Demo 2', name: '3-Col Parallax Columns', badge: 'Parallax' },
  { id: 'demo-3', path: '/demo-3', label: 'Demo 3', name: 'Flip Words Luxury', badge: 'Flip Words' },
  { id: 'demo-4', path: '/demo-4', label: 'Demo 4', name: 'Diagonal Skew Parallax', badge: 'Parallax' },
  { id: 'demo-5', path: '/demo-5', label: 'Demo 5', name: 'Dual Counter Flip', badge: 'Dual Flip' },
  { id: 'home', path: '/', label: 'Default Home', name: 'Original Showcase', badge: 'Live Store' },
];

const SECTIONS = [
  { id: 'sec-hero', label: 'Hero Banner' },
  { id: 'sec-category', label: 'Categories' },
  { id: 'sec-new-arrivals', label: 'New Arrivals' },
  { id: 'sec-trending', label: 'Trending' },
  { id: 'sec-best-sellers', label: 'Best Sellers' },
  { id: 'sec-fit', label: 'Shop by Fit' },
  { id: 'sec-style', label: 'Shop by Style' },
  { id: 'sec-shop-the-look', label: 'Shop the Look' },
  { id: 'sec-reviews', label: 'Customer Reviews' },
  { id: 'sec-ugc', label: 'Customer Videos' },
  { id: 'sec-social', label: 'Community' },
  { id: 'sec-trust', label: 'Guarantee' },
];

export function DemoSwitcherBar({ currentDemo = 'demo-1' }: { currentDemo?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const pathname = usePathname();

  const activeDemo = DEMOS.find((d) => d.id === currentDemo || pathname === d.path) || DEMOS[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 max-w-[95vw]">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-2xl border border-white/15 bg-neutral-950/90 text-white shadow-2xl backdrop-blur-xl px-3 py-2.5 transition-all"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Demo Label Pill */}
          <div className="flex items-center gap-2 pl-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black tracking-wider uppercase text-amber-300">
                  {activeDemo.label}
                </span>
                <span className="hidden sm:inline-block text-[10px] rounded-full bg-white/10 px-1.5 py-0.2 text-neutral-300 font-medium">
                  {activeDemo.name}
                </span>
              </div>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-white/15" />

          {/* Quick Demo Jumpers */}
          <div className="flex items-center gap-1">
            {DEMOS.slice(0, 5).map((d) => {
              const isActive = activeDemo.id === d.id;
              return (
                <Link
                  key={d.id}
                  href={d.path}
                  prefetch={true}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-400 text-neutral-950 shadow-md font-bold'
                      : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {d.label.replace('Demo ', 'D')}
                </Link>
              );
            })}
          </div>

          <div className="h-5 w-[1px] bg-white/15" />

          {/* 14-Section Quick Jump Trigger */}
          <button
            onClick={() => {
              setShowSections(!showSections);
              if (isOpen) setIsOpen(false);
            }}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              showSections ? 'bg-white/20 text-white' : 'text-neutral-300 hover:bg-white/10'
            }`}
            title="14 Architecture Sections"
          >
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">14 Sections</span>
            <span className="md:hidden">Sections</span>
          </button>

          {/* Switcher Expand/Collapse */}
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (showSections) setShowSections(false);
            }}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs text-neutral-200 hover:bg-white/20"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">All</span>
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Section Quick Jump Drawer */}
        <AnimatePresence>
          {showSections && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10 pt-2.5 mt-2.5"
            >
              <div className="flex items-center justify-between pb-1 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Store Sections Navigator
                </span>
                <span className="text-[10px] text-amber-400">Jump to section</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-1">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      scrollToSection(sec.id);
                      setShowSections(false);
                    }}
                    className="flex items-center justify-start rounded-md bg-white/5 hover:bg-amber-400/20 hover:text-amber-300 px-2 py-1 text-[11px] text-left text-neutral-300 transition-colors"
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Demos Expand Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10 pt-2.5 mt-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {DEMOS.map((d) => {
                  const isActive = activeDemo.id === d.id;
                  return (
                    <Link
                      key={d.id}
                      href={d.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-start justify-between rounded-xl p-2.5 transition-all ${
                        isActive
                          ? 'bg-amber-400 text-neutral-950 font-medium'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{d.label}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              isActive ? 'bg-neutral-950 text-amber-300 font-bold' : 'bg-white/10 text-neutral-400'
                            }`}
                          >
                            {d.badge}
                          </span>
                        </div>
                        <span className={`text-[11px] ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}>
                          {d.name}
                        </span>
                      </div>
                      {isActive ? (
                        <Check className="h-4 w-4 text-neutral-950" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
