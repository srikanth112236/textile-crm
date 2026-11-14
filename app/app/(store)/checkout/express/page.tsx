import { Suspense } from 'react';
import { Metadata } from 'next';
import ExpressCheckoutClient from './ExpressCheckoutClient';

export const metadata: Metadata = {
  title: 'Express Checkout | Mentoos',
  description: 'Skip the address step with your saved address and pay securely.',
  robots: { index: false, follow: false },
};

export default function ExpressCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Loading express checkout…</span>
        </div>
      }
    >
      <ExpressCheckoutClient />
    </Suspense>
  );
}
