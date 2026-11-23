'use client';

import React from 'react';
import { Demo4Lenis } from './Demo4Lenis';
import { Demo4Cursor } from './Demo4Cursor';
import { Demo4Nav } from './Demo4Nav';
import { Demo4Hero } from './Demo4Hero';
import { Demo4Category } from './Demo4Category';
import { Demo4NewArrivals } from './Demo4NewArrivals';
import { Demo4Trending } from './Demo4Trending';
import { Demo4BestSellers } from './Demo4BestSellers';
import { Demo4Fit } from './Demo4Fit';
import { Demo4Style } from './Demo4Style';
import { Demo4ShopTheLook } from './Demo4ShopTheLook';
import { Demo4Reviews } from './Demo4Reviews';
import { Demo4Ugc } from './Demo4Ugc';
import { Demo4Social } from './Demo4Social';
import { Demo4Trust } from './Demo4Trust';
import { Demo4Footer } from './Demo4Footer';
import { bebasNeue, dmSans } from './fonts';

export function Demo4Page() {
  return (
    <div className={`min-h-screen bg-paper text-ink ${bebasNeue.variable} ${dmSans.variable} font-sans selection:bg-brand selection:text-paper antialiased`}>
      {/* High Velocity Lenis Smooth Scroll */}
      <Demo4Lenis />

      {/* Dynamic Runway Magnetic Cursor */}
      <Demo4Cursor />

      {/* Runway Navigation & Marquee Bar */}
      <Demo4Nav />

      {/* 13 Ordered Sections */}
      <main className="relative">
        {/* 1. Main Hero Banner */}
        <Demo4Hero />

        {/* 2. Shop by Category */}
        <Demo4Category />

        {/* 3. New Arrivals */}
        <Demo4NewArrivals />

        {/* 4. Trending Now */}
        <Demo4Trending />

        {/* 5. Best Sellers */}
        <Demo4BestSellers />

        {/* 6. Shop by Fit */}
        <Demo4Fit />

        {/* 7. Shop by Style */}
        <Demo4Style />

        {/* 8. Shop the Look */}
        <Demo4ShopTheLook />

        {/* 9. Customer Reviews */}
        <Demo4Reviews />

        {/* 10. UGC / Customer Videos */}
        <Demo4Ugc />

        {/* 11. Instagram / Social Content */}
        <Demo4Social />

        {/* 12. Trust Section */}
        <Demo4Trust />

        {/* 13. Footer */}
        <Demo4Footer />
      </main>
    </div>
  );
}
