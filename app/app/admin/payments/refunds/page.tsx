import React from 'react';
import { Metadata } from 'next';
import PaymentsClient from '../PaymentsClient';

export const metadata: Metadata = {
  title: 'Refunds | Admin Dashboard',
  description: 'Refund ledger, manual settlements, and queue',
};

export default function RefundsPage() {
  return <PaymentsClient initialTab="refunds" />;
}
