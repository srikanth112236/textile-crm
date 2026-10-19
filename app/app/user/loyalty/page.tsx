import { Metadata } from 'next';
import { LoyaltyDashboard } from '@/components/store/LoyaltyDashboard';

export const metadata: Metadata = {
  title: 'Mentoos Loyalty Program | Mentoos',
  description: 'Earn points on every purchase. Redeem for discounts, free shipping, and exclusive rewards.',
};

export default function LoyaltyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <LoyaltyDashboard />
    </div>
  );
}
