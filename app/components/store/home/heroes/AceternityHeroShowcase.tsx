'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, Heart, Compass } from 'lucide-react';
// The Two Favorites
import { HeroParallaxColumns } from './HeroParallaxColumns';
import { HeroFlipWordsLuxury } from './HeroFlipWordsLuxury';
// The 5 New Masterpiece Parallax & Flip Designs
import { HeroParallaxFlipSplit } from './HeroParallaxFlipSplit';
import { HeroInfiniteDiagonalParallax } from './HeroInfiniteDiagonalParallax';
import { HeroKineticTypographyParallax } from './HeroKineticTypographyParallax';
import { HeroDualColumnFlipCurator } from './HeroDualColumnFlipCurator';
import { HeroEditorialLookbookParallax } from './HeroEditorialLookbookParallax';
// Additional Hero Options
import { HeroLampGlow } from './HeroLampGlow';
import { HeroCinematicScrollReel } from './HeroCinematicScrollReel';
import { Hero3DTiltCardPerspective } from './Hero3DTiltCardPerspective';
import { HeroSpotlightBento } from './HeroSpotlightBento';
import { HeroInfiniteMovingRunway } from './HeroInfiniteMovingRunway';
import { HeroMeteorShowerDark } from './HeroMeteorShowerDark';
import { HeroAuraGradientBlob } from './HeroAuraGradientBlob';

const TOP_FAVORITES = [
  { id: 'fav-hybrid', badge: 'NEW HYBRID', title: 'Parallax Columns + Flip Words', component: HeroParallaxFlipSplit },
  { id: 'fav-parallax', badge: 'FAVORITE', title: 'Parallax Floating Columns', component: HeroParallaxColumns },
  { id: 'fav-flip', badge: 'FAVORITE', title: 'Flip Words Minimalist Luxury', component: HeroFlipWordsLuxury },
  { id: 'fav-diagonal', badge: 'NEW RUNWAY', title: 'Diagonal Parallax Runway', component: HeroInfiniteDiagonalParallax },
  { id: 'fav-kinetic', badge: 'NEW KINETIC', title: 'Kinetic Verb Marquee Parallax', component: HeroKineticTypographyParallax },
  { id: 'fav-dual', badge: 'NEW DUAL', title: 'Dual Counter-Scroll Curator', component: HeroDualColumnFlipCurator },
  { id: 'fav-lookbook', badge: 'NEW MAGAZINE', title: 'Lookbook Magazine Parallax', component: HeroEditorialLookbookParallax },
];

const OTHER_HEROES = [
  { id: 'lamp', title: 'Lamp Radiant Glow', component: HeroLampGlow },
  { id: 'reel', title: '35mm Film Reel', component: HeroCinematicScrollReel },
  { id: 'tilt', title: '3D Gyroscope Tilt', component: Hero3DTiltCardPerspective },
  { id: 'bento', title: 'Spotlight Cursor Bento', component: HeroSpotlightBento },
  { id: 'velocity', title: 'Infinite Velocity Runway', component: HeroInfiniteMovingRunway },
  { id: 'meteor', title: 'Midnight Meteor Shower', component: HeroMeteorShowerDark },
  { id: 'aura', title: 'Liquid Aura Mesh', component: HeroAuraGradientBlob },
];

export function AceternityHeroShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [category, setCategory] = useState<'favorites' | 'all'>('favorites');
  const [viewAll, setViewAll] = useState(false);

  const currentList = category === 'favorites' ? TOP_FAVORITES : OTHER_HEROES;
  const ActiveComponent = currentList[activeTab]?.component || TOP_FAVORITES[0].component;

  return (
    <div className="space-y-6 pt-4">
      {/* Showcase Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-line bg-white/85 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-[#c6f03d] shadow-sm">
            <Heart className="h-4 w-4 fill-current" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-ink">
                Curated Parallax & Flip Word Heroes
              </h3>
              <span className="rounded-full bg-[#c6f03d] px-2 py-0.5 text-[9px] font-black text-slate-950 uppercase">
                7 Masterpieces
              </span>
            </div>
            <p className="text-[10px] text-ink-muted">
              Built on your top 2 favorites: Parallax Floating Columns & Animated Flip Typography.
            </p>
          </div>
        </div>

        {/* Action Toggle Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setCategory('favorites');
              setActiveTab(0);
              setViewAll(false);
            }}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              category === 'favorites' && !viewAll
                ? 'bg-ink text-white shadow-xs font-black'
                : 'border border-line bg-sand/60 text-ink hover:bg-sand'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#c6f03d]" />
            <span>Top Parallax & Flip (7)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setActiveTab(0);
              setViewAll(false);
            }}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              category === 'all' && !viewAll
                ? 'bg-ink text-white shadow-xs font-black'
                : 'border border-line bg-sand/60 text-ink hover:bg-sand'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Other Hero Styles (7)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewAll((v) => !v)}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewAll
                ? 'bg-[#c6f03d] text-slate-950 font-black shadow-xs scale-105'
                : 'border border-line bg-sand/60 text-ink hover:bg-sand'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Stack All</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs for Current Category */}
      {!viewAll && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar px-1">
          {currentList.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === idx
                  ? 'bg-ink text-white shadow-xs scale-105 font-extrabold'
                  : 'border border-line bg-white/70 text-ink hover:bg-sand'
              }`}
            >
              {(item as any).badge && (
                <span className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-[#c6f03d] text-slate-950">
                  {(item as any).badge}
                </span>
              )}
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Display Active Hero or Stack All */}
      {viewAll ? (
        <div className="space-y-12">
          <HeroParallaxFlipSplit />
          <HeroParallaxColumns />
          <HeroFlipWordsLuxury />
          <HeroInfiniteDiagonalParallax />
          <HeroKineticTypographyParallax />
          <HeroDualColumnFlipCurator />
          <HeroEditorialLookbookParallax />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentList[activeTab]?.id || 'hero-active'}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
