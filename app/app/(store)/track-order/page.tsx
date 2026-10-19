import React from 'react';
import { Metadata } from 'next';
import TrackOrderClient from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'Track Order | Mentoos Express Tracking',
  description: 'Real-time order tracking and shipment timeline',
};

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
