import React from 'react';
import { Metadata } from 'next';
import InvoiceClient from '@/components/orders/InvoiceClient';

export const metadata: Metadata = {
  title: 'Tax Invoice | Admin Dashboard',
  description: 'Official Tax Invoice for Order',
};

export default async function AdminOrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceClient orderId={id} backUrl={`/admin/orders/${id}`} />;
}
