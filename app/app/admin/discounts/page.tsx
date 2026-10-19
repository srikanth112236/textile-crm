import React from 'react';
import { Metadata } from 'next';
import DiscountsClient from './DiscountsClient';

export const metadata: Metadata = {
  title: 'Discount Management | Admin Dashboard',
  description: 'Manage discount codes and coupons',
};

export default function DiscountsPage() {
  return <DiscountsClient />;
}

