import { Gift, TrendingUp } from 'lucide-react';

export function ReferralProgram() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Refer a Friend</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white p-6 shadow-xl">
          <Gift className="w-8 h-8 mb-3" />
          <h3 className="text-xl font-extrabold">Invite Friends</h3>
          <p className="text-sm opacity-90 mt-2">Share your referral link and earn 200 points per successful sign-up.</p>
          <div className="mt-4 bg-white/10 rounded-xl p-3 font-mono text-xs break-all">https://mentoos.in/ref/?code=USER123</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <TrendingUp className="w-8 h-8 text-violet-500 mb-3" />
          <h3 className="text-xl font-extrabold">Your Stats</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Invites Sent</span><span className="font-extrabold">12</span></div>
            <div className="flex justify-between"><span>Friends Joined</span><span className="font-extrabold">7</span></div>
            <div className="flex justify-between"><span>Points Earned</span><span className="font-extrabold text-violet-600">1,400 pts</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
