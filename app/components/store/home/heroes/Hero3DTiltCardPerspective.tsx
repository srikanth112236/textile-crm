'use client';

import { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Flame, Check } from 'lucide-react';

export function Hero3DTiltCardPerspective() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['14deg', '-14deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-14deg', '14deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[#141416] p-6 sm:p-12 text-white shadow-2xl border border-white/10 [perspective:1000px]">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Narrative */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#c6f03d]/30 bg-[#c6f03d]/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-[#c6f03d] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#c6f03d]" />
            <span>Aceternity 07 · 3D Parallax Gyroscope</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
            TAILORED IN 3D.<br />
            <span className="bg-gradient-to-r from-[#c6f03d] to-emerald-400 bg-clip-text text-transparent">
              EXPERIENCED IN MOTION.
            </span>
          </h2>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-300 max-w-lg">
            Move your cursor across the showcase card to feel true three-dimensional depth. Multi-layer depth projection separates fabric textures, garment badges, and silhouette lines in real time.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/products?sort=createdAt&order=desc"
              className="inline-flex items-center gap-2 rounded-xl bg-[#c6f03d] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:bg-[#b8e232] shadow-lg shadow-lime-400/20 active:scale-95"
            >
              <span>Explore 3D Fits</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <span className="text-xs font-mono font-bold text-slate-400">
              Interactive · Hover to Tilt
            </span>
          </div>
        </div>

        {/* Right 3D Tilt Card Stage */}
        <div className="lg:col-span-6 flex items-center justify-center py-4">
          <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }}
            className="group relative h-[440px] sm:h-[480px] w-full max-w-[380px] rounded-[32px] border border-white/20 bg-gradient-to-b from-[#222328] to-[#16171a] p-5 shadow-2xl transition-all duration-200"
          >
            {/* Background Layer: Chamfered Image (Depth 20px) */}
            <div
              style={{ transform: 'translateZ(30px)' }}
              className="relative h-[320px] w-full overflow-hidden rounded-[24px] bg-[#ebe7df]"
            >
              <Image
                src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=85"
                alt="3D Menswear Model"
                fill
                priority
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Mid Layer: Floating Glass Badge (Depth 60px) */}
            <div
              style={{ transform: 'translateZ(65px)' }}
              className="absolute left-8 top-8 rounded-full bg-black/70 border border-white/25 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#c6f03d] backdrop-blur-md shadow-lg"
            >
              240 GSM DROPPED TEE
            </div>

            {/* Foreground Layer: Product Details and Instant Bag Button (Depth 90px) */}
            <div
              style={{ transform: 'translateZ(90px)' }}
              className="mt-4 flex items-center justify-between gap-3 px-2"
            >
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Heavyweight Oversized Fit
                </h3>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-base font-black text-[#c6f03d]">₹899</span>
                  <span className="text-xs text-slate-400 line-through">₹1,299</span>
                </div>
              </div>

              <Link
                href="/products/streetwear"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c6f03d] text-slate-950 font-black shadow-lg hover:scale-110 transition-transform"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
