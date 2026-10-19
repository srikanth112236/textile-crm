import React from 'react';
import { Metadata } from 'next';
import AdminDeliveriesClient from './AdminDeliveriesClient';

export const metadata: Metadata = {
  title: 'Deliveries & Logistics | Admin',
  description: 'Monitor courier partner dispatches and tracking',
};

export default function AdminDeliveriesPage() {
  return <AdminDeliveriesClient />;
}
