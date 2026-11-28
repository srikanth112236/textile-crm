import React from 'react';
import type { Metadata } from 'next';
import Demo5Page from '@/components/home/demo-5/Demo5Page';

export const metadata: Metadata = {
  title: 'Mentoos · Mediterranean Earth & Craft · Harvest 2026',
  description: 'Artisanal menswear crafted from 100% Normandy flax linen, unbleached combed cotton, and sun-baked terracotta silhouettes.',
};

export default function Demo5Route() {
  return <Demo5Page />;
}
