'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const STYLES = [
  {
    title: 'Casual Daily Rotation',
    occasion: 'WEEKEND & STREET',
    description: 'Heavyweight boxy tees and cargo joggers built for effortless motion.',
    link: '/products?occasion=Casual',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
    plate: 'Occasion 01',
    count: '42 Styles',
  },
  {
    title: 'Workplace & Tailored',
    occasion: 'CORPORATE & OFFICE',
    description: 'Crisp French flax shirts paired with tailored pleated trousers.',
    link: '/products?occasion=Formal',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    plate: 'Occasion 02',
    count: '28 Styles',
  },
  {
    title: 'Festive & Celebration',
    occasion: 'CONTEMPORARY HERITAGE',
    description: 'Handloom slub textured short kurtas and Nehru waistcoats.',
    link: '/products?occasion=Festive',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
    plate: 'Occasion 03',
    count: '31 Styles',
  },
];

export function Demo1Style() {
  return (
    <section id="sec-style" className="w-full bg-paper py-20 px-4 sm:px-6 border-b border-line/40">
      <div className="mx-auto max-w-7xl">
        {/* Chapter Header */}
        <div className="flex items-baseline justify-between border-b border-line/60 pb-4 mb-16">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs font-bold text-brand uppercase tracking-widest">
              CH. 07 / 13
            </span>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
              OCCASION EDITORIAL
            </span>
          </div>
          <Link
            href="/products"
            className="group font-mono text-xs text-ink hover:text-brand transition-colors flex items-center gap-1"
          >
            <span>ALL OCCASIONS</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="mb-12">
          <h2 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-ink">
            Curated by <span className="italic text-brand font-normal">Occasion.</span>
          </h2>
          <p className="mt-2 font-sans text-xs sm:text-sm text-ink-muted max-w-xl">
            From relaxed cafe mornings to festive evening gatherings — discover curated outfits calibrated for the moment.
          </p>
        </div>

        {/* 3 Asymmetric Occasion Plates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {STYLES.map((style) => (
            <Link
              key={style.title}
              href={style.link}
              data-cursor="VIEW"
              className="group block"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand/30">
                <Image
                  src={style.image}
                  alt={style.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-106"
                />
                <span className="absolute top-4 left-4 font-mono text-[9px] font-bold tracking-widest bg-paper px-2.5 py-1 text-ink uppercase">
                  {style.plate}
                </span>
                <span className="absolute bottom-4 left-4 font-mono text-[9px] font-bold tracking-widest bg-ink text-paper px-2.5 py-1 uppercase">
                  {style.occasion}
                </span>
              </div>

              {/* Caption with underline draw */}
              <div className="mt-4 border-b border-line/40 pb-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-xl font-black text-ink group-hover:underline underline-offset-4 transition-all">
                    {style.title}
                  </h3>
                  <span className="font-mono text-xs text-ink-subtle">{style.count}</span>
                </div>
                <p className="mt-1 font-sans text-xs text-ink-muted leading-relaxed">
                  {style.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
