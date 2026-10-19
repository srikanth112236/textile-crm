'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

// Style tiles map to the occasion filter (?occasion=) so every tile lands on
// a pre-filtered listing page instead of a dead-end.
const STYLES = [
  {
    title: 'CASUAL EVERYDAY',
    tagline: 'Tees, shirts & joggers for daily rotation',
    link: '/products?occasion=Casual',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'FORMAL OFFICE',
    tagline: 'Crisp shirts & tailored trousers',
    link: '/products?occasion=Formal',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'FESTIVE ETHNIC',
    tagline: 'Kurtas & Nehru jackets for celebrations',
    link: '/products?occasion=Festive',
    imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'STREETWEAR',
    tagline: 'Oversized fits & graphic drops',
    link: '/products?pattern=Graphic',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'ATHLEISURE',
    tagline: 'Gym-to-street performance wear',
    link: '/products?occasion=Sports',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'PARTY NIGHT',
    tagline: 'Statement shirts that stand out',
    link: '/products?occasion=Party',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
  },
];

export function ShopByStyle() {
  return (
    <section className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Styles
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            SHOP BY STYLE
          </h2>
        </div>
        <Link
          href="/products"
          className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 mt-2 sm:mt-0"
        >
          View all styles <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {STYLES.map((style) => (
          <Link
            key={style.title}
            href={style.link}
            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow aspect-[4/3] bg-slate-200 dark:bg-slate-800"
          >
            <Image
              src={style.imageUrl}
              alt={style.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-4 flex flex-col justify-end text-white">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                {style.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-1">
                {style.tagline}
              </p>
              <span className="mt-1.5 inline-flex items-center text-[10px] sm:text-[11px] font-bold text-amber-400 gap-1">
                SHOP NOW <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
