import { CustomerReviews } from '@/components/store/CustomerReviews';
import { UgcReels } from '@/components/store/UgcReels';
import { Heart, Sparkles } from 'lucide-react';

export function SocialProofZone() {
  return (
    <section className="rounded-[26px] border border-line bg-sand/55 p-3 sm:p-6">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-800">
            <Sparkles className="h-3.5 w-3.5" /> Worn. Rated. Shared.
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
            THE MENTOOS COMMUNITY
          </h2>
        </div>
        <p className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted">
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          Real customers, real fits
        </p>
      </div>

      <CustomerReviews compact />
      <UgcReels compact />
    </section>
  );
}
