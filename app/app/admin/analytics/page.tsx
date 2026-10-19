import React from 'react';
import { Metadata } from 'next';
import AnalyticsClient from './AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Admin Dashboard',
  description: 'View sales analytics and reports',
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}

