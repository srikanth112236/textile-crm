import { Shield, Check, X } from 'lucide-react';

export default function AdminModerationDashboard() {
  const pending = [
    { id: 'rev-001', title: 'Customer Video Review — Black T-Shirt XL', status: 'pending', submitted: '2026-10-14' },
    { id: 'rev-002', title: 'UGC Reel — Ethnic Kurta Set', status: 'pending', submitted: '2026-10-12' },
  ];
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">UGC & Video Review Moderation</h1>
      <div className="grid gap-4">
        {pending.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-xs text-muted-foreground">Submitted: {item.submitted}</p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-extrabold hover:bg-emerald-600 transition-colors"><Check className="w-3.5 h-3.5" /> Approve</button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-extrabold hover:bg-rose-600 transition-colors"><X className="w-3.5 h-3.5" /> Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
