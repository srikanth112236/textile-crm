import React from 'react';
import { Metadata } from 'next';
import OrdersAdminClient from './OrdersAdminClient';

export const metadata: Metadata = {
  title: 'Order Management | Admin Dashboard',
  description: 'Manage all orders',
};

export default function OrdersAdminPage() {
  return <OrdersAdminClient />;
}

