import React from 'react';
import type { Metadata } from 'next';
import { Demo1Page } from '@/components/home/demo-1/Demo1Page';

export const metadata: Metadata = {
  title: 'Mentoos · Editorial Luxe · Vol. XXIV Lookbook',
  description: 'Curated menswear atelier featuring 240+ GSM heavyweight jersey, pure Belgian linen, and tailored minimalist silhouettes.',
};

export default function Demo1Route() {
  return <Demo1Page />;
}
