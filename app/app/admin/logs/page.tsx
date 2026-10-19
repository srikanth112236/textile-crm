import React from 'react';
import { Metadata } from 'next';
import AuditLogsClient from './AuditLogsClient';

export const metadata: Metadata = {
  title: 'Audit Logs | Admin Dashboard',
  description: 'View system audit logs',
};

export default function AuditLogsPage() {
  return <AuditLogsClient />;
}

