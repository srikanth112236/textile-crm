import React from 'react';
import type { Metadata } from 'next';
import { Demo3Page } from '@/components/home/demo-3/Demo3Page';

export const metadata: Metadata = {
  title: 'Mentoos · Neo-Minimalist Studio · Drop 03 Lookbook',
  description: 'Sculpted menswear atelier. 280 GSM heavyweight combed cotton, pure Normandy flax linen, and architectural tailoring.',
};

export default function Demo3Route() {
  return <Demo3Page />;
}
