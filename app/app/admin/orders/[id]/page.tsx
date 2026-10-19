import React from 'react';
import { Metadata } from 'next';
import OrderDetailAdminClient from './OrderDetailAdminClient';

export const metadata: Metadata = {
  title: 'Order Details | Admin Dashboard',
  description: 'View and manage order details',
};

export default async function OrderDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailAdminClient orderId={id} />;
}
