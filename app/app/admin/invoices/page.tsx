import React from 'react';
import { Metadata } from 'next';
import AdminInvoicesClient from './AdminInvoicesClient';

export const metadata: Metadata = {
  title: 'Invoices Dashboard | Admin',
  description: 'Manage and print GST Tax Invoices',
};

export default function AdminInvoicesPage() {
  return <AdminInvoicesClient />;
}
