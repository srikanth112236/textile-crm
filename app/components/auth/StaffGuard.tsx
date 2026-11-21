'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { getRoleDashboard, getRoleLabel } from '@/lib/auth/roleHome';

const BLOCKED_PREFIXES = ['/cart', '/checkout', '/user'];

function isCommerceRoute(pathname: string): boolean {
  return BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Storefront route guard for staff accounts.
 *
 * Admin/superadmin may browse products and read content, but cart, checkout
 * and customer account pages are customer-only. The API already enforces
 * this; the guard removes the dead end before it becomes a 403.
 */
export function StaffGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const { isAuthenticated, isCustomer, isStaff, isLoading, role } = useAuth();
  const blocked = isCommerceRoute(pathname);

  if (!blocked) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="container-page py-16 text-center text-sm text-muted-foreground">
        Checking your account…
      </div>
    );
  }

  // Guests and customers use the normal page. Only authenticated staff are
  // redirected to this explanation.
  if (!isAuthenticated || isCustomer || !isStaff) return <>{children}</>;

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-14">
      <div className="w-full max-w-lg rounded-2xl border border-sand-deep bg-white p-8 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950">
          Customer accounts only
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          You are signed in as <strong>{getRoleLabel(role)}</strong>. Staff accounts are for
          managing the store and cannot use the cart, checkout, wishlist or customer pages.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href={getRoleDashboard(role)}>
            <Button className="w-full bg-slate-950 text-white hover:bg-amber-500 hover:text-slate-950 sm:w-auto">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Go to dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Continue browsing <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-slate-500">
          Need to shop? Sign out and use a customer account.
        </p>
      </div>
    </div>
  );
}
