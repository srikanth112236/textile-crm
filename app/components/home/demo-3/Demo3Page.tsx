'use client';

import React from 'react';
import { Demo3Lenis } from './Demo3Lenis';
import { Demo3Cursor } from './Demo3Cursor';
import { Demo3Nav } from './Demo3Nav';
import { Demo3Hero } from './Demo3Hero';
import { Demo3Category } from './Demo3Category';
import { Demo3NewArrivals } from './Demo3NewArrivals';
import { Demo3Trending } from './Demo3Trending';
import { Demo3BestSellers } from './Demo3BestSellers';
import { Demo3Fit } from './Demo3Fit';
import { Demo3Style } from './Demo3Style';
import { Demo3ShopTheLook } from './Demo3ShopTheLook';
import { Demo3Reviews } from './Demo3Reviews';
import { Demo3Ugc } from './Demo3Ugc';
import { Demo3Social } from './Demo3Social';
import { Demo3Trust } from './Demo3Trust';
import { Demo3Footer } from './Demo3Footer';
import { plusJakarta, playfair } from './fonts';

export function Demo3Page() {
  return (
    <div className={`min-h-screen bg-[#FAF9F6] text-[#121214] ${plusJakarta.variable} ${playfair.variable} font-sans selection:bg-[#D97706] selection:text-white antialiased`}>
      {/* Lenis Smooth Scroll Engine */}
      <Demo3Lenis />

      {/* Modern Luxury Cursor */}
      <Demo3Cursor />

      {/* Neo-Minimalist Navigation with Integrated Smart Search */}
      <Demo3Nav />

      {/* 13 Ordered Sections */}
      <main className="relative">
        {/* 1. Main Hero Banner */}
        <Demo3Hero />

        {/* 2. Shop by Category */}
        <Demo3Category />

        {/* 3. New Arrivals */}
        <Demo3NewArrivals />

        {/* 4. Trending Now */}
        <Demo3Trending />

        {/* 5. Best Sellers */}
        <Demo3BestSellers />

        {/* 6. Shop by Fit */}
        <Demo3Fit />

        {/* 7. Shop by Style */}
        <Demo3Style />

        {/* 8. Shop the Look */}
        <Demo3ShopTheLook />

        {/* 9. Customer Reviews */}
        <Demo3Reviews />

        {/* 10. UGC / Customer Videos */}
        <Demo3Ugc />

        {/* 11. Instagram / Social Content */}
        <Demo3Social />

        {/* 12. Trust Section */}
        <Demo3Trust />

        {/* 13. Footer */}
        <Demo3Footer />
      </main>
    </div>
  );
}
