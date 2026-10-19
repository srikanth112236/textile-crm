import React from 'react';
import { Metadata } from 'next';
import UsersAdminClient from './UsersAdminClient';

export const metadata: Metadata = {
  title: 'User Management | Admin Dashboard',
  description: 'Manage users, roles, and permissions',
};

export default function UsersAdminPage() {
  return <UsersAdminClient />;
}

