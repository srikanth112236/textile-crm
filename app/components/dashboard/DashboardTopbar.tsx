'use client';

import Link from 'next/link';
import { ArrowLeft, Menu, Bell, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/lib/contexts/SocketContext';

interface Props {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  homeHref?: string;
}

export function DashboardTopbar({ title, subtitle, onMenuToggle, homeHref = '/' }: Props) {
  const { user } = useAuth();
  const { notifications } = useSocket();
  const unread = notifications.length;

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : 'M';

  return (
    <div className="sticky top-0 z-30 h-12 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 px-3">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-[13px] font-bold leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-muted-foreground leading-tight truncate">{subtitle}</p>}
      </div>
      <Link href="/track-order" className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
        <Bell className="h-3.5 w-3.5" />
        {unread > 0 && <span className="min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">{unread}</span>}
      </Link>
      <Link href={homeHref}>
        <Button variant="outline" size="sm" className="h-7 text-[11px] font-bold rounded-lg px-2.5 gap-1">
          <ArrowLeft className="h-3 w-3" />
          <ShoppingBag className="h-3 w-3 hidden sm:block" />
          Back to Shopping
        </Button>
      </Link>
      <Avatar className="h-7 w-7">
        <AvatarImage src={(user as any)?.avatar} alt={user?.email} />
        <AvatarFallback className="bg-amber-500 text-slate-950 font-extrabold text-[11px]">{initials}</AvatarFallback>
      </Avatar>
    </div>
  );
}
