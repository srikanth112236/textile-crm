import { Truck, RefreshCw, ShieldCheck, Award, Sparkles } from 'lucide-react';

const PROMISES = [
  {
    icon: Truck,
    title: 'EXPRESS METRO DISPATCH',
    text: '2-4 Days Delivery Across India • Real-Time Tracking',
  },
  {
    icon: RefreshCw,
    title: '7-DAY DOORSTEP EXCHANGE',
    text: 'No-Questions-Asked Size Swaps at Your Doorstep',
  },
  {
    icon: Award,
    title: '240 GSM COMBED COTTON',
    text: 'Bio-Washed & Pre-Shrunk • Zero Neckline Sag',
  },
  {
    icon: ShieldCheck,
    title: 'SECURE PAYMENTS & COD',
    text: 'Encrypted Razorpay UPI, Cards & Cash on Delivery',
  },
];

export function ValueStrip() {
  return (
    <section
      aria-label="Service promises"
      className="rounded-[22px] border border-neutral-200/80 bg-sand/60 dark:border-neutral-800 dark:bg-neutral-950/80 p-2 sm:p-3 shadow-sm backdrop-blur-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200/80 dark:divide-neutral-800">
        {PROMISES.map((promise) => {
          const Icon = promise.icon;
          return (
            <div
              key={promise.title}
              className="flex items-center gap-3.5 px-4 py-3 sm:px-5 transition-colors hover:bg-white/40 dark:hover:bg-white/5 rounded-xl"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm border border-neutral-200/60 dark:bg-neutral-900 dark:border-neutral-800 dark:text-amber-400">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                  {promise.title}
                </p>
                <p className="truncate text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                  {promise.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
