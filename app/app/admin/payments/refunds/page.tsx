import React from 'react';
import { Metadata } from 'next';
import RefundsClient from './RefundsClient';

export const metadata: Metadata = {
  title: 'Refunds | Admin Dashboard',
  description: 'View all refunded orders',
};

export default function RefundsPage() {
  return <RefundsClient />;
}

