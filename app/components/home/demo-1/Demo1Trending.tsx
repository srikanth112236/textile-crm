'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const TRENDING_ITEMS = [
  {
    id: 'tr-1',
    title: 'Relaxed Cuban Linen Shirt',
    tag: 'PURE FLAX',
    specs: '100% Normandy Flax Linen • Camp Collar',
    price: '₹1,399',
    compareAt: '₹1,999',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    link: '/products?search=linen',
    issue: 'Plate 04',
  },
  {
    id: 'tr-2',
    title: 'Tailored Pleated Trousers',
    tag: 'POLY-VISCOSE',
    specs: 'Double Front Pleat • Clean Straight Taper',
    price: '₹1,499',
    compareAt: '₹2,199',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80',
    link: '/products?category=trousers',
    issue: 'Plate 05',
  },
  {
    id: 'tr-3',
    title: 'Textured Slub Short Kurta',
    tag: 'HANDLOOM',
    specs: 'Coconut Shell Buttons • Mandarin Collar',
    price: '₹1,199',
    compareAt: '₹1,599',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
    link: '/products?category=ethnic-wear',
    issue: 'Plate 06',
  },
  {
    id: 'tr-4',
    title: 'Structured Waffle Knit Polo',
    tag: 'HONEYCOMB',
    specs: 'Open Collar Design • Ribbed Sleeve Finish',
    price: '₹999',
    compareAt: '₹1,499',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    link: '/products?category=t-shirts',
    issue: 'Plate 07',
  },
];

export function Demo1Trending() {
  return (
    <section id="sec-trending" className="w-full bg-paper py-14 sm:py-16 px-4 sm:px-6 border-b border-line/40">
      <div className="mx-auto max-w-7xl">
        {/* Chapter Header */}
        <div className="flex items-baseline justify-between border-b border-line/60 pb-3 mb-8">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs font-bold text-brand uppercase tracking-widest">
              CH. 04 / 13
            </span>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
              EDITORIAL CURATION
            </span>
          </div>
          <Link
            href="/products?sort=best-selling&order=desc"
            className="group font-mono text-xs text-ink hover:text-brand transition-colors flex items-center gap-1"
          >
            <span>DISCOVER TRENDING</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="mb-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-ink">
            Trending in the <span className="italic text-brand font-normal">Atelier.</span>
          </h2>
          <p className="mt-1 font-sans text-xs text-ink-muted max-w-xl">
            High-rotation garments defined by natural fibers, zero neckline sag, and tailored drapes.
          </p>
        </div>

        {/* 4-Item Lookbook Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {TRENDING_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              data-cursor="VIEW"
              className="group block"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/30">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-106"
                />
                <span className="absolute top-3 left-3 font-mono text-[9px] font-bold tracking-widest bg-paper/95 px-2 py-0.5 text-ink uppercase">
                  {item.issue}
                </span>
                <span className="absolute bottom-3 right-3 font-mono text-[9px] font-bold tracking-widest bg-ink text-paper px-2 py-0.5 uppercase">
                  {item.tag}
                </span>
              </div>

              {/* Caption below with price in serif italic */}
              <div className="mt-3.5 border-b border-line/40 pb-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-base font-black text-ink group-hover:underline underline-offset-4 transition-all truncate pr-2">
                    {item.title}
                  </h3>
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span className="font-serif text-sm italic font-bold text-brand">{item.price}</span>
                    <span className="font-mono text-[10px] text-ink-subtle line-through">{item.compareAt}</span>
                  </div>
                </div>
                <p className="mt-1 font-mono text-[10px] text-ink-muted line-clamp-1">
                  {item.specs}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
