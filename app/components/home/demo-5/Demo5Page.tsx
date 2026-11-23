'use client';

import React from 'react';
import { Demo5Lenis } from './Demo5Lenis';
import { Demo5Cursor } from './Demo5Cursor';
import { Demo5Nav } from './Demo5Nav';
import { Demo5Hero } from './Demo5Hero';
import { Demo5Category } from './Demo5Category';
import { Demo5NewArrivals } from './Demo5NewArrivals';
import { Demo5Trending } from './Demo5Trending';
import { Demo5BestSellers } from './Demo5BestSellers';
import { Demo5Fit } from './Demo5Fit';
import { Demo5Style } from './Demo5Style';
import { Demo5ShopTheLook } from './Demo5ShopTheLook';
import { Demo5Reviews } from './Demo5Reviews';
import { Demo5Ugc } from './Demo5Ugc';
import { Demo5Social } from './Demo5Social';
import { Demo5Trust } from './Demo5Trust';
import { Demo5Footer } from './Demo5Footer';
import { cinzel, outfit } from './fonts';

export function Demo5Page() {
  return (
    <div className={`min-h-screen bg-[#F4EFEA] text-[#2C241E] ${cinzel.variable} ${outfit.variable} font-sans selection:bg-[#B85D3B] selection:text-[#F4EFEA] antialiased`}>
      {/* Organic Breezy Lenis Smooth Scroll */}
      <Demo5Lenis />

      {/* Terracotta Clay Pebble Cursor */}
      <Demo5Cursor />

      {/* Sun-Washed Mediterranean Navigation */}
      <Demo5Nav />

      {/* 13 Ordered Sections */}
      <main className="relative">
        {/* 1. Main Hero Banner */}
        <Demo5Hero />

        {/* 2. Shop by Category */}
        <Demo5Category />

        {/* 3. New Arrivals */}
        <Demo5NewArrivals />

        {/* 4. Trending Now */}
        <Demo5Trending />

        {/* 5. Best Sellers */}
        <Demo5BestSellers />

        {/* 6. Shop by Fit */}
        <Demo5Fit />

        {/* 7. Shop by Style */}
        <Demo5Style />

        {/* 8. Shop the Look */}
        <Demo5ShopTheLook />

        {/* 9. Customer Reviews */}
        <Demo5Reviews />

        {/* 10. UGC / Customer Videos */}
        <Demo5Ugc />

        {/* 11. Instagram / Social Content */}
        <Demo5Social />

        {/* 12. Trust Section */}
        <Demo5Trust />

        {/* 13. Footer */}
        <Demo5Footer />
      </main>
    </div>
  );
}
