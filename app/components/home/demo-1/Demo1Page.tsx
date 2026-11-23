'use client';

import React from 'react';
import { Demo1Lenis } from './Demo1Lenis';
import { Demo1Cursor } from './Demo1Cursor';
import { Demo1Nav } from './Demo1Nav';
import { Demo1Hero } from './Demo1Hero';
import { Demo1Category } from './Demo1Category';
import { Demo1NewArrivals } from './Demo1NewArrivals';
import { Demo1Trending } from './Demo1Trending';
import { Demo1BestSellers } from './Demo1BestSellers';
import { Demo1Fit } from './Demo1Fit';
import { Demo1Style } from './Demo1Style';
import { Demo1ShopTheLook } from './Demo1ShopTheLook';
import { Demo1Reviews } from './Demo1Reviews';
import { Demo1Ugc } from './Demo1Ugc';
import { Demo1Social } from './Demo1Social';
import { Demo1Trust } from './Demo1Trust';
import { Demo1Footer } from './Demo1Footer';
import { fraunces, manrope } from './fonts';

export function Demo1Page() {
  return (
    <div className={`min-h-screen bg-paper text-ink ${manrope.variable} ${fraunces.variable} font-sans selection:bg-brand selection:text-paper antialiased`}>
      {/* Lenis Smooth Scroll Engine */}
      <Demo1Lenis />

      {/* Bespoke Editorial Follow Cursor */}
      <Demo1Cursor />

      {/* Editorial Masthead & Navigation */}
      <Demo1Nav />

      {/* Main 13 Ordered Sections */}
      <main className="relative">
        {/* 1. Main Hero Banner */}
        <Demo1Hero />

        {/* 2. Shop by Category */}
        <Demo1Category />

        {/* 3. New Arrivals */}
        <Demo1NewArrivals />

        {/* 4. Trending Now */}
        <Demo1Trending />

        {/* 5. Best Sellers */}
        <Demo1BestSellers />

        {/* 6. Shop by Fit */}
        <Demo1Fit />

        {/* 7. Shop by Style */}
        <Demo1Style />

        {/* 8. Shop the Look */}
        <Demo1ShopTheLook />

        {/* 9. Customer Reviews */}
        <Demo1Reviews />

        {/* 10. UGC / Customer Videos */}
        <Demo1Ugc />

        {/* 11. Instagram / Social Content */}
        <Demo1Social />

        {/* 12. Trust Section */}
        <Demo1Trust />

        {/* 13. Footer */}
        <Demo1Footer />
      </main>
    </div>
  );
}
