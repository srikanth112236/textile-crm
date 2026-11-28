import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const OCCASIONS = [
  { label: 'Everyday casual', href: '/products?occasion=Casual', note: 'Tees, easy shirts, joggers' },
  { label: 'Office formal', href: '/products?occasion=Formal', note: 'Crisp shirting, tailored trousers' },
  { label: 'Festive ethnic', href: '/products?occasion=Festive', note: 'Kurtas, sets, Nehru jackets' },
  { label: 'Gym & active', href: '/products?occasion=Sports', note: 'Dry-fit, training, athleisure' },
];

export function OccasionEdit() {
  return (
    <section className="overflow-hidden rounded-[26px] bg-ink text-paper">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[340px] lg:min-h-[460px]">
          <Image
            src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80"
            alt="Mentoos occasion styling"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-ink/60 lg:bg-gradient-to-r lg:from-transparent lg:to-ink" />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
            <Sparkles className="h-3.5 w-3.5" /> Dress for the moment
          </p>
          <h2 className="mt-2 text-2xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-3xl">
            ONE WARDROBE.<br />EVERY OCCASION.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/65">
            Start with the plan, not the product. Pick an occasion and we will narrow the catalogue for you.
          </p>

          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {OCCASIONS.map((occasion) => (
              <Link
                key={occasion.label}
                href={occasion.href}
                className="group flex items-center justify-between gap-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-bold text-paper group-hover:text-amber-300">{occasion.label}</p>
                  <p className="text-[11px] text-paper/70">{occasion.note}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-paper/65 transition-transform group-hover:translate-x-1 group-hover:text-amber-300" />
              </Link>
            ))}
          </div>

          <Link
            href="/products"
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition-colors hover:bg-amber-300"
          >
            Browse everything <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
