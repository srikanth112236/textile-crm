import React from 'react';
import { Metadata } from 'next';
import OrderDetailClient from './OrderDetailClient';

export const metadata: Metadata = {
  title: 'Order Details | E-Commerce',
  description: 'View order details and tracking information',
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailClient orderId={params.id} />;
}

