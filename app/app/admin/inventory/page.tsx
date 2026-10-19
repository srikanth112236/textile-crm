'use client';

import { Suspense } from 'react';
import InventoryDashboardClient from './InventoryDashboardClient';

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <InventoryDashboardClient />
    </Suspense>
  );
}

