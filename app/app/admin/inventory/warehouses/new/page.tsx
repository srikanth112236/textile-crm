'use client';

import { useEffect, useState } from 'react';
import { WarehouseForm } from '@/components/admin/WarehouseForm';
import { getWarehouses } from '@/lib/api/inventory';
import { Loader2 } from 'lucide-react';

export default function NewWarehousePage() {
  const [existingCount, setExistingCount] = useState<number | null>(null);

  // Knowing the current count lets us force "default" for the very first
  // warehouse and show the right guidance copy.
  useEffect(() => {
    getWarehouses({ limit: 100 })
      .then((res) => setExistingCount(res?.warehouses?.length ?? 0))
      // -1 means "unknown": never force the new warehouse to become default
      // just because the count request failed.
      .catch(() => setExistingCount(-1));
  }, []);

  if (existingCount === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
      </div>
    );
  }

  return <WarehouseForm mode="create" existingCount={existingCount} />;
}
