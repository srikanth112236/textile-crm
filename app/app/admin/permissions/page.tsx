import React from 'react';
import { Metadata } from 'next';
import PermissionsClient from './PermissionsClient';

export const metadata: Metadata = {
  title: 'Permissions & Roles | Admin Dashboard',
  description: 'Manage permissions and roles',
};

export default function PermissionsPage() {
  return <PermissionsClient />;
}

