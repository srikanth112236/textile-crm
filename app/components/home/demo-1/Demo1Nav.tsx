'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Compass, Menu, X, ArrowUpRight } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { cn } from '@/lib/utils';

export function Demo1Nav() {
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* 1. Magazine Issue Header Strip */}
      <div className="w-full border-b border-line/60 bg-sand/80 px-4 py-1.5 text-[10px] font-mono tracking-widest text-ink-muted backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-brand uppercase">Vol. XXIV</span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="hidden sm:inline">ISSUE NO. 01 / WINTER ATELIER</span>
          </div>
          <div className="flex items-center gap-4 text-ink-muted">
            <span className="hidden md:inline">240 GSM COMBED YARNS</span>
            <span className="hidden md:inline text-line">•</span>
            <span>MUMBAI, IN</span>
            <span className="text-line">•</span>
            <span className="text-emerald-700 font-bold">DISPATCH: 24-48H</span>
          </div>
        </div>
      </div>

      {/* 2. Main Editorial Navbar */}
      <nav
        className={cn(
          'w-full border-b border-line/40 transition-all duration-300',
          scrolled ? 'bg-paper/95 py-3 shadow-sm backdrop-blur-lg' : 'bg-paper/85 py-4 backdrop-blur-md'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left Editorial Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-mono tracking-wider text-ink-muted">
            <Link href="/products?sort=createdAt&order=desc" className="hover:text-ink transition-colors group flex items-center gap-1">
              <span className="text-[9px] text-brand">01</span>
              <span className="group-hover:underline underline-offset-4 font-sans">New Arrivals</span>
            </Link>
            <Link href="/products?category=t-shirts" className="hover:text-ink transition-colors group flex items-center gap-1">
              <span className="text-[9px] text-brand">02</span>
              <span className="group-hover:underline underline-offset-4 font-sans">Oversized</span>
            </Link>
            <Link href="/products?category=shirts" className="hover:text-ink transition-colors group flex items-center gap-1">
              <span className="text-[9px] text-brand">03</span>
              <span className="group-hover:underline underline-offset-4 font-sans">Linen Resort</span>
            </Link>
            <Link href="/products?category=trousers" className="hover:text-ink transition-colors group flex items-center gap-1">
              <span className="text-[9px] text-brand">04</span>
              <span className="group-hover:underline underline-offset-4 font-sans">Tailored</span>
            </Link>
          </div>

          {/* Center Brand Typographic Masthead */}
          <div className="text-center">
            <Link href="/" className="inline-block group">
              <span className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-ink transition-colors group-hover:text-brand">
                MENTOOS
              </span>
              <span className="block text-[8px] font-mono tracking-[0.3em] uppercase text-ink-muted">
                Editorial Luxe • Issue 01
              </span>
            </Link>
          </div>

          {/* Right Action Icons & Bag Counter */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-mentoos-search'))}
              aria-label="Search Collection"
              className="p-1.5 text-ink-muted hover:text-ink transition-colors flex items-center gap-1.5"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">Search</span>
            </button>

            <Link
              href="/cart"
              className="group flex items-center gap-2 rounded-full border border-line bg-sand/40 px-3 py-1.5 text-xs font-mono text-ink transition-colors hover:border-brand hover:bg-sand"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-brand" />
              <span className="font-bold">BAG</span>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold text-paper">
                {itemCount}
              </span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-ink lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-line bg-paper px-6 py-6 lg:hidden">
            <div className="space-y-4">
              <Link
                href="/products?sort=createdAt&order=desc"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm font-serif font-bold text-ink"
              >
                <span>01 / New Arrivals</span>
                <ArrowUpRight className="h-4 w-4 text-brand" />
              </Link>
              <Link
                href="/products?category=t-shirts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm font-serif font-bold text-ink"
              >
                <span>02 / Oversized 240 GSM</span>
                <ArrowUpRight className="h-4 w-4 text-brand" />
              </Link>
              <Link
                href="/products?category=shirts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm font-serif font-bold text-ink"
              >
                <span>03 / Pure French Flax Linen</span>
                <ArrowUpRight className="h-4 w-4 text-brand" />
              </Link>
              <Link
                href="/products?category=trousers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm font-serif font-bold text-ink"
              >
                <span>04 / Tailored Pleated Trousers</span>
                <ArrowUpRight className="h-4 w-4 text-brand" />
              </Link>
              <Link
                href="/products?category=ethnic-wear"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm font-serif font-bold text-ink"
              >
                <span>05 / Festive Artisan Kurtas</span>
                <ArrowUpRight className="h-4 w-4 text-brand" />
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
