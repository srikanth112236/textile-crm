import type { Metadata } from 'next';
import InvoiceClient from '@/components/orders/InvoiceClient';

export const metadata: Metadata = {
  title: 'Tax Invoice | Mentoos',
  robots: { index: false, follow: false },
};

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  return (
    <InvoiceClient
      orderId={id}
      backUrl={`/admin/orders/${id}`}
      embedded={query?.embed === '1'}
    />
  );
}
