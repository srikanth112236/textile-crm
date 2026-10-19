import React from 'react';
import { Metadata } from 'next';
import UserInvoicesClient from './UserInvoicesClient';

export const metadata: Metadata = {
  title: 'My Tax Invoices | Mentoos',
  description: 'Download and print official GST tax invoices for your purchases',
};

export default function UserInvoicesPage() {
  return <UserInvoicesClient />;
}
