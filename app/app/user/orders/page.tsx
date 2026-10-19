import React from 'react';
import { Metadata } from 'next';
import OrdersClient from './OrdersClient';

export const metadata: Metadata = {
  title: 'My Orders | E-Commerce',
  description: 'View your order history',
};

export default function OrdersPage() {
  return <OrdersClient />;
}

