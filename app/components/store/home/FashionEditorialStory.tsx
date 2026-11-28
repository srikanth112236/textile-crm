'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star, ShieldCheck, Check, Heart, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const COLOR_SWATCHES = [
  { name: 'Oatmeal Cream', hex: '#e8e1d5', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80' },
  { name: 'Washed Charcoal', hex: '#2d2d2d', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80' },
  { name: 'Olive Khaki', hex: '#5b614b', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80' },
  { name: 'Desert Sand', hex: '#c9b79c', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80' },
  { name: 'Midnight Navy', hex: '#1e2838', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80' },
];

export function FashionEditorialStory() {
  const [selectedColor, setSelectedColor] = useState(0);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    toast({
      title: 'Welcome to the VIP Club',
      description: 'You will receive private drop links and 15% off your next order.',
    });
  };

  const currentColor = COLOR_SWATCHES[selectedColor];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Main Editorial Fashion Hero Banner (Ref: Image 2 Top Section) */}
      <section className="relative overflow-hidden rounded-[32px] border border-line bg-[#fbf9f5] p-6 sm:p-12 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Text & Typography Column */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sand/70 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink">
              <Sparkles className="h-3 w-3 text-amber-700" /> Curated Menswear 2026
            </span>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-ink-muted uppercase">
                Wear Your
              </p>
              <h2 className="font-serif italic text-3xl sm:text-4xl text-ink leading-none">
                Style,
              </h2>
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-ink-muted uppercase mt-1">
                Own Your
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink uppercase leading-none">
                Confidence
              </h2>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-ink-muted max-w-sm">
              Premium quality clothing crafted for effortless daily wear for the modern man. Heavyweight yarns, breathable weaves, and relaxed precision cuts.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/products?sort=createdAt&order=desc"
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-slate-800 shadow-md active:scale-95"
              >
                Shop Collection <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Social Proof Avatar Stack */}
            <div className="flex items-center gap-3 pt-3 border-t border-line/60">
              <div className="flex -space-x-2">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Customer"
                  width={34}
                  height={34}
                  className="rounded-full border-2 border-white object-cover"
                />
                <Image
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                  alt="Customer"
                  width={34}
                  height={34}
                  className="rounded-full border-2 border-white object-cover"
                />
                <Image
                  src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80"
                  alt="Customer"
                  width={34}
                  height={34}
                  className="rounded-full border-2 border-white object-cover"
                />
              </div>
              <div className="text-[11px] leading-tight text-ink">
                <div className="flex items-center text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold">Rated 4.9/5</span> by 10,000+ Customers
              </div>
            </div>
          </div>

          {/* Right Editorial Campaign Imagery */}
          <div className="lg:col-span-7 relative">
            <div className="relative mx-auto aspect-[4/5] max-h-[520px] w-full overflow-hidden rounded-[28px] bg-sand border border-line shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80"
                alt="Mentoos Editorial Fashion Campaign"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-[50%_25%]"
              />

              {/* Floating Product Spotlight Pill */}
              <div className="absolute right-4 top-4 max-w-[200px] rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur-md border border-white/60">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800">
                  New Arrival
                </span>
                <p className="mt-0.5 text-xs font-extrabold text-ink leading-tight">
                  Linen Overshirt
                </p>
                <p className="mt-1 text-xs font-bold text-ink">₹1,499</p>
                <Link
                  href="/products?search=linen"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-amber-700 hover:underline"
                >
                  Explore Fit <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Floating Quality Seal */}
              <div className="absolute bottom-4 left-4 rounded-full bg-ink/80 px-3.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/20">
                ✨ 100% Combed Natural Fibers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Slashed Editorial Brand / Fabric Ribbon (Ref: Image 2 Angled Tape) */}
      <div className="relative -mx-4 overflow-hidden bg-ink py-3.5 text-white shadow-md sm:rounded-2xl sm:mx-0">
        <div className="flex animate-marquee whitespace-nowrap gap-8 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/90">
          <span>Heavyweight 240 GSM Cotton</span>
          <span className="text-amber-400">✦</span>
          <span>100% Pure French Linen</span>
          <span className="text-amber-400">✦</span>
          <span>Artisanal Tailoring</span>
          <span className="text-amber-400">✦</span>
          <span>Pre-Shrunk Luxury Yarns</span>
          <span className="text-amber-400">✦</span>
          <span>Engineered For Indian Climates</span>
          <span className="text-amber-400">✦</span>
          <span>Zero Fade Reactive Dyeing</span>
          <span className="text-amber-400">✦</span>
          <span>Heavyweight 240 GSM Cotton</span>
          <span className="text-amber-400">✦</span>
          <span>100% Pure French Linen</span>
        </div>
      </div>

      {/* 3. Editorial Split Feature ("Fresh Styles For Every You" & Interactive Color Swatches) */}
      <section className="grid gap-6 lg:grid-cols-12 items-stretch">
        {/* Left Lifestyle Model Shot with Luxury Emblem */}
        <div className="lg:col-span-6 relative overflow-hidden rounded-[28px] border border-line bg-ink min-h-[440px] shadow-lg group">
          <Image
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80"
            alt="Mentoos Fresh Styles For Every You"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Rotating Luxury Emblem Seal */}
          <div className="absolute top-5 left-5 h-16 w-16 rounded-full border border-white/30 bg-black/40 backdrop-blur-md p-2 flex items-center justify-center text-center">
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-white leading-none">
              EST<br />2026<br />MENTOOS
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
              Seasonal Capsule
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Fresh Styles For Every You
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-sm line-clamp-2">
              Discover effortless transitions from desk to lounge. Designed with refined drape and everyday ease.
            </p>
            <Link
              href="/products?sort=createdAt&order=desc"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 uppercase tracking-wide"
            >
              View Full Collection <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Garment Texture & Interactive Color Swatch Detail Card */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-[28px] border border-line bg-[#fbf9f5] p-6 sm:p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800">
                Signature Spotlight
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                In Stock · Ready to Dispatch
              </span>
            </div>

            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-sand border border-line">
              <Image
                src={currentColor.image}
                alt={currentColor.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-all duration-500"
              />
              <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                Color: {currentColor.name}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-ink">
                Classic Waffle Slub Knit Polo
              </h4>
              <p className="text-xs text-ink-muted mt-1">
                Soft pre-shrunk waffle knit, structured rib collar, and antique horn buttons.
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-ink">₹1,199</span>
                <span className="text-xs text-ink-muted line-through">₹1,599</span>
                <span className="text-[10px] font-bold text-emerald-700">Save 25%</span>
              </div>
            </div>

            {/* Interactive Color Swatches (Ref: Image 2 Color Dot Picker) */}
            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink mb-2">
                Available in 5 Colors:
              </p>
              <div className="flex items-center gap-3">
                {COLOR_SWATCHES.map((swatch, idx) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => setSelectedColor(idx)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform duration-200 ${
                      idx === selectedColor
                        ? 'scale-125 border-ink ring-2 ring-amber-400 ring-offset-2'
                        : 'border-white shadow-sm hover:scale-110'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    aria-label={`Select ${swatch.name}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-line/60 flex items-center justify-between gap-4 mt-4">
            <Link
              href="/products?search=polo"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-slate-800 transition-colors"
            >
              Shop This Fit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. "Crafted For Quality, Made For You" 4-Pillar Grid (Ref: Image 2 Middle) */}
      <section className="rounded-[30px] border border-line bg-sand/60 p-6 sm:p-10">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-800">
            Brand Promises
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
            Crafted For Quality. Made For You.
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Every thread, stitch, and wash has been engineered for effortless durability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-white/80 p-5 border border-line/60 shadow-sm space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
              💎
            </div>
            <h4 className="text-sm font-extrabold text-ink">Premium Quality</h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Heavyweight combed fibers and ring-spun threads that retain structure wash after wash.
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-5 border border-line/60 shadow-sm space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
              ✨
            </div>
            <h4 className="text-sm font-extrabold text-ink">Modern Design</h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Timeless silhouettes designed to mix and match effortlessly across casual and formal moods.
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-5 border border-line/60 shadow-sm space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
              📐
            </div>
            <h4 className="text-sm font-extrabold text-ink">Perfect Indian Fit</h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Tailored specifically to Indian height, shoulder, and chest proportions for unmatched ease.
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-5 border border-line/60 shadow-sm space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
              🔄
            </div>
            <h4 className="text-sm font-extrabold text-ink">Easy 7-Day Returns</h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Instant doorstep pickup and zero hassle size replacements so you shop with 100% confidence.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Editorial Testimonial ("Real People, Real Style" - Ref: Image 2 Right Column) */}
      <section className="grid gap-6 lg:grid-cols-12 items-center rounded-[32px] border border-line bg-[#fbf9f5] p-6 sm:p-10 shadow-sm">
        <div className="lg:col-span-5 relative aspect-[4/5] max-h-[380px] w-full overflow-hidden rounded-2xl bg-sand border border-line">
          <Image
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80"
            alt="Customer Testimonial"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
            @aditya_m · Mumbai
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4 lg:pl-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800">
            Real People, Real Style
          </span>
          <div className="flex items-center gap-1 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="font-serif italic text-lg sm:text-2xl text-ink leading-relaxed">
            &ldquo;The drape of the 240 GSM oversized tee and the linen shirt blew me away. Finding contemporary fits that actually suit Indian builds is rare — Mentoos has nailed the silhouette completely.&rdquo;
          </blockquote>
          <div>
            <p className="text-xs font-extrabold text-ink">Aditya Mehta</p>
            <p className="text-[11px] text-ink-muted">Verified Buyer · Owns 5 Pieces</p>
          </div>
        </div>
      </section>

      {/* 6. Minimalist Dark VIP Club Subscription (Ref: Image 2 Bottom) */}
      <section className="relative overflow-hidden rounded-[30px] bg-ink p-6 sm:p-10 text-white shadow-xl">
        <div className="grid gap-6 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
              Private Drop Access
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Join The Mentoos VIP Club
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              Receive secret drop links, private archive sales, and flat 15% off your first purchase.
            </p>
          </div>

          <div className="lg:col-span-5">
            {subscribed ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-400/20 border border-amber-300/40 p-4 text-xs font-bold text-amber-200">
                <Check className="h-4 w-4 text-amber-300" /> You are in! Check your inbox for your 15% welcome voucher.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 text-xs font-extrabold uppercase text-slate-950 transition-colors hover:bg-amber-300"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
