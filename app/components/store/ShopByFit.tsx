'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

const FITS = [
  {
    title: 'OVERSIZED FIT',
    tagline: 'Streetwear staple with dropped shoulders & relaxed drop',
    itemCount: '24+ Styles',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
    link: '/products?search=oversized',
  },
  {
    title: 'SLIM FIT',
    tagline: 'Tailored silhouette hugging chest and arms for sharp look',
    itemCount: '32+ Styles',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    link: '/products?search=slim',
  },
  {
    title: 'RELAXED FIT',
    tagline: 'Versatile everyday cut with optimal freedom of movement',
    itemCount: '18+ Styles',
    imageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
    link: '/products?search=relaxed',
  },
  {
    title: 'ATHLETIC FIT',
    tagline: 'Stretch moisture-wicking fabric for active lifestyle',
    itemCount: '15+ Styles',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=activewear',
  },
];

export function ShopByFit() {
  return (
    <section className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Silhouettes
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            SHOP BY FIT
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 sm:mt-0">
          Find your exact silhouette cut crafted specifically for Indian body shapes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FITS.map((fit, idx) => (
          <Link 
            key={idx} 
            href={fit.link}
            className="group relative h-80 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-200 dark:border-slate-800"
          >
            {/* Background Image */}
            <Image
              src={fit.imageUrl}
              alt={fit.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-85 group-hover:opacity-90 transition-opacity" />

            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 bg-amber-500/20 w-max px-2.5 py-1 rounded-md border border-amber-500/30 backdrop-blur-sm mb-2">
                {fit.itemCount}
              </span>
              <h3 className="text-xl font-extrabold tracking-tight group-hover:text-amber-400 transition-colors">
                {fit.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {fit.tagline}
              </p>
              
              <div className="mt-3 flex items-center text-xs font-bold text-amber-400 gap-1.5 group-hover:translate-x-1 transition-transform">
                <span>EXPLORE CUT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
