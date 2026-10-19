'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Heart, Package, CreditCard, UserCircle, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import LoyaltyPointsCard from '@/components/loyalty/LoyaltyPointsCard';
import ReferralCard from '@/components/referral/ReferralCard';

const CARDS = [
  { href: '/user/profile', icon: UserCircle, title: 'My Profile', desc: 'Profile & addresses', tone: 'bg-primary/10 text-primary' },
  { href: '/user/orders', icon: Package, title: 'My Orders', desc: 'Order history & tracking', tone: 'bg-primary/10 text-primary' },
  { href: '/user/wishlist', icon: Heart, title: 'Wishlist', desc: 'Saved items', tone: 'bg-primary/10 text-primary' },
  { href: '/user/payments', icon: CreditCard, title: 'My Payments', desc: 'Payment history', tone: 'bg-primary/10 text-primary' },
  { href: '/user/refunds', icon: XCircle, title: 'My Refunds', desc: 'Refund history', tone: 'bg-red-100 dark:bg-red-900/20 text-red-600' },
  { href: '/user/returns', icon: RotateCcw, title: 'Returns', desc: 'Returns & exchanges', tone: 'bg-primary/10 text-primary' },
];

export default function UserDashboard() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-5xl px-3 sm:px-4">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight">My Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Welcome back, {user?.email}!
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-xl border bg-card p-4 hover:shadow-md hover:border-amber-500/50 transition-all group">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${c.tone} shrink-0`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold group-hover:text-amber-600">{c.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{c.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 mt-4">
        <LoyaltyPointsCard />
        <ReferralCard />
      </div>

      <Card className="mt-4">
        <CardContent className="p-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span><strong className="text-foreground">Role:</strong> User</span>
          <span><strong className="text-foreground">Email:</strong> {user?.email}</span>
          <Link href="/user/settings" className="font-semibold text-amber-600 hover:underline">Account Settings →</Link>
        </CardContent>
      </Card>
    </div>
  );
}
