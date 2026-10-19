export function LoyaltyHistoryTable() {
  const history = [
    { date: '2026-10-15', action: 'Purchase — Oversized Tee', points: '+120' },
    { date: '2026-10-10', action: 'Redeemed — Free Shipping', points: '-200' },
    { date: '2026-09-28', action: 'Purchase — Linen Shirt', points: '+145' },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h3 className="text-lg font-extrabold mb-4">Points History</h3>
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-muted-foreground font-bold">
          <tr className="border-b border-slate-100 dark:border-slate-800"><th className="text-left py-2">Date</th><th className="text-left py-2">Action</th><th className="text-right py-2">Points</th></tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
              <td className="py-2">{h.date}</td>
              <td className="py-2">{h.action}</td>
              <td className={`py-2 text-right font-bold ${h.points.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{h.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
