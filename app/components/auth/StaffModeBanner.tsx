'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getRoleDashboard } from '@/lib/auth/roleHome';

/** A slim, honest banner so staff never wonder why commerce UI is missing. */
export function StaffModeBanner() {
  const { isStaff, role } = useAuth();
  if (!isStaff) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Staff mode · You can browse, but shopping is disabled for this account.
        </span>
        <Link
          href={getRoleDashboard(role)}
          className="inline-flex items-center gap-1 font-extrabold underline underline-offset-2 hover:text-amber-700"
        >
          Open dashboard <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
