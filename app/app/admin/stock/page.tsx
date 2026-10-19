import React from 'react';
import { Metadata } from 'next';
import StockManagementClient from './StockManagementClient';

export const metadata: Metadata = {
  title: 'Stock Management | Admin Dashboard',
  description: 'Manage product stock levels',
};

export default function StockManagementPage() {
  return <StockManagementClient />;
}

