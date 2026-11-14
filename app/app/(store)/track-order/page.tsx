import React from 'react';
import { Metadata } from 'next';
import TrackOrderClient from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'Track Your Order | Mentoos',
  description: 'Track your Mentoos order in real time with live shipment status, courier updates and delivery timeline.',
  alternates: { canonical: '/track-order' },
};

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
