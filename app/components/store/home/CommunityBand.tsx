import Link from 'next/link';
import { ArrowRight, Instagram, MessageCircle, Sparkles } from 'lucide-react';

export function CommunityBand() {
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-ink px-6 py-9 text-paper sm:px-10 sm:py-12">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
            <Sparkles className="h-3.5 w-3.5" /> Stay in the loop
          </p>
          <h2 className="mt-2 max-w-xl text-3xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-4xl">
            NEW DROPS, FIT NOTES<br className="hidden sm:block" /> AND STYLING IDEAS.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-paper/60">
            Follow the feed for first looks, or message support if you need help with sizing, delivery or returns.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/products?sort=createdAt&order=desc"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition-colors hover:bg-amber-300"
          >
            Shop new arrivals <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-paper transition-colors hover:bg-white/10"
          >
            <Instagram className="h-4 w-4" /> Instagram
          </a>
          <Link
            href="/support"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-paper transition-colors hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" /> Support
          </Link>
        </div>
      </div>
    </section>
  );
}
