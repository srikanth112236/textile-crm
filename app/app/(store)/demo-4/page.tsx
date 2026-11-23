import React from 'react';
import type { Metadata } from 'next';
import { Demo4Page } from '@/components/home/demo-4/Demo4Page';

export const metadata: Metadata = {
  title: 'Mentoos · Kinetic Runway · Live Runway 2026',
  description: 'High-velocity menswear runway. 280 GSM heavyweight cotton drop, Belgian flax linen airflow, and structural Gurkha trousers.',
};

export default function Demo4Route() {
  return <Demo4Page />;
}
