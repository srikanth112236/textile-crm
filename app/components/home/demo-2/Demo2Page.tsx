'use client';

import React from 'react';
import { Demo2Lenis } from './Demo2Lenis';
import { Demo2Cursor } from './Demo2Cursor';
import { Demo2Nav } from './Demo2Nav';
import { Demo2Hero } from './Demo2Hero';
import { Demo2Category } from './Demo2Category';
import { Demo2NewArrivals } from './Demo2NewArrivals';
import { Demo2Trending } from './Demo2Trending';
import { Demo2BestSellers } from './Demo2BestSellers';
import { Demo2Fit } from './Demo2Fit';
import { Demo2Style } from './Demo2Style';
import { Demo2ShopTheLook } from './Demo2ShopTheLook';
import { Demo2Reviews } from './Demo2Reviews';
import { Demo2Ugc } from './Demo2Ugc';
import { Demo2Social } from './Demo2Social';
import { Demo2Trust } from './Demo2Trust';
import { Demo2Footer } from './Demo2Footer';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

export function Demo2Page() {
  return (
    <div className={`min-h-screen bg-paper text-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans selection:bg-ink selection:text-brand antialiased`}>
      {/* Snappy Mechanical Lenis Smooth Scroll */}
      <Demo2Lenis />

      {/* Technical Precision Crosshair Cursor */}
      <Demo2Cursor />

      {/* Blueprint Header & Telemetry Strip */}
      <Demo2Nav />

      {/* Main 13 Ordered Sections */}
      <main className="relative">
        {/* 1. Main Hero Banner */}
        <Demo2Hero />

        {/* 2. Shop by Category */}
        <Demo2Category />

        {/* 3. New Arrivals */}
        <Demo2NewArrivals />

        {/* 4. Trending Now */}
        <Demo2Trending />

        {/* 5. Best Sellers */}
        <Demo2BestSellers />

        {/* 6. Shop by Fit */}
        <Demo2Fit />

        {/* 7. Shop by Style */}
        <Demo2Style />

        {/* 8. Shop the Look */}
        <Demo2ShopTheLook />

        {/* 9. Customer Reviews */}
        <Demo2Reviews />

        {/* 10. UGC / Customer Videos */}
        <Demo2Ugc />

        {/* 11. Instagram / Social Content */}
        <Demo2Social />

        {/* 12. Trust Section */}
        <Demo2Trust />

        {/* 13. Footer */}
        <Demo2Footer />
      </main>
    </div>
  );
}
