import LoyaltyPointsCard from '@/components/loyalty/LoyaltyPointsCard';
import { LoyaltyHistoryTable } from '@/components/loyalty/LoyaltyHistoryTable';

export function LoyaltyDashboard() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Loyalty Program</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <LoyaltyPointsCard />
        <LoyaltyHistoryTable />
      </div>
    </div>
  );
}
