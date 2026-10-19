import React from 'react';
import { Metadata } from 'next';
import InvoiceClient from '@/components/orders/InvoiceClient';

export const metadata: Metadata = {
  title: 'Tax Invoice | Mentoos',
  description: 'Download or Print Tax Invoice',
};

export default async function StoreOrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceClient orderId={id} backUrl={`/user/orders/${id}`} />;
}
