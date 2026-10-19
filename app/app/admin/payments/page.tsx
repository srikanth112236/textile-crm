import React from 'react';
import { Metadata } from 'next';
import PaymentsClient from './PaymentsClient';

export const metadata: Metadata = {
  title: 'All Payments | Admin Dashboard',
  description: 'View all confirmed payments',
};

export default function PaymentsPage() {
  return <PaymentsClient />;
}

