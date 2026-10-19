import { Sparkles } from 'lucide-react';

export default function LoyaltyPointsCard() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-extrabold uppercase tracking-widest">Your Balance</span>
      </div>
      <div className="text-5xl font-black tracking-tighter">1,250 pts</div>
      <p className="text-sm font-semibold opacity-90 mt-2">Earn 1 point per ₹1 spent. Redeem for discounts & free shipping.</p>
    </div>
  );
}
