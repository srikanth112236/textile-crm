import React from 'react';
import type { Metadata } from 'next';
import Demo2Page from '@/components/home/demo-2/Demo2Page';

export const metadata: Metadata = {
  title: 'Mentoos · Brutalist Atelier · Specification Sheet 2.0',
  description: 'Technical menswear engineering spec. 280 GSM heavyweight cotton, 100% Belgian flax linen, and CAD-calibrated silhouettes.',
};

export default function Demo2Route() {
  return <Demo2Page />;
}
