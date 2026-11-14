'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Shield, Globe, Monitor, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { AuditLog } from '@/lib/api/admin';

const ACTION_META: Record<string, { label: string; tone: string; desc: string }> = {
  create: { label: 'Create', tone: 'bg-blue-500 text-white', desc: 'A new record was created.' },
  update: { label: 'Update', tone: 'bg-amber-500 text-slate-950', desc: 'An existing record was modified.' },
  delete: { label: 'Delete', tone: 'bg-rose-500 text-white', desc: 'A record was removed.' },
  login: { label: 'Login', tone: 'bg-emerald-500 text-white', desc: 'User authenticated successfully.' },
  logout: { label: 'Logout', tone: 'bg-slate-400 text-white', desc: 'User ended their session.' },
  user_ban: { label: 'Ban User', tone: 'bg-rose-700 text-white', desc: 'A user was banned from the system.' },
  user_unban: { label: 'Unban User', tone: 'bg-emerald-600 text-white', desc: 'A user ban was lifted.' },
  role_change: { label: 'Role Change', tone: 'bg-violet-600 text-white', desc: 'User role or permissions were changed.' },
};

export function LogDetailDialog({ open, onOpenChange, log }: { open: boolean; onOpenChange: (o: boolean) => void; log: AuditLog | null }) {
  if (!log) return null;
  const meta = ACTION_META[log.action.split('_')[0]] || ACTION_META['update'];
  const userName = (typeof log.userId === 'object' && log.userId ? log.userId.name || log.userId.email : log.userId) || '—';
  const userEmail = (typeof log.userId === 'object' && log.userId ? log.userId.email : '') || '';
  const created = new Date(log.createdAt);
  const createdStr = created.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const details = log.details ? Object.entries(log.details) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-lg rounded-2xl gap-0 overflow-hidden p-0 sm:w-full">
        {/* Header */}
        <div className={`${meta.tone} px-4 py-3 flex items-start gap-2.5 border-b border-white/10`}>
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-base font-extrabold leading-tight tracking-tight text-white">{meta.label}</DialogTitle>
            <DialogDescription className="text-[10px] text-white/80 truncate">
              {log.resource ? `${log.resource}${log.resourceId ? ' · ' + log.resourceId : ''}` : 'System event'} · {createdStr}
            </DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 bg-white dark:bg-slate-900 max-h-[80vh] overflow-y-auto">
          {/* ID + Status */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-muted-foreground truncate">{log._id}</span>
            <Badge className={`rounded-full px-2 py-0 text-[9px] font-extrabold uppercase tracking-wider ${log.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {log.status}
            </Badge>
          </div>

          {/* Grid: Action + Resource */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Info className="h-3 w-3 text-violet-500" />
                <span className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Action</span>
              </div>
              <p className="text-[11px] font-extrabold">{meta.label}</p>
              <p className="text-[9px] text-muted-foreground truncate">{log.action}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Monitor className="h-3 w-3 text-amber-500" />
                <span className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Resource</span>
              </div>
              <p className="text-[11px] font-extrabold capitalize">{log.resource}</p>
              <p className="text-[9px] text-muted-foreground truncate">{log.resourceId || '—'}</p>
            </div>
          </div>

          {/* Grid: User + IP */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <User className="h-3 w-3 text-violet-500" />
                <span className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">User</span>
              </div>
              <p className="text-[11px] font-bold truncate">{userName}</p>
              {userEmail && <p className="text-[9px] text-muted-foreground truncate">{userEmail}</p>}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Globe className="h-3 w-3 text-amber-500" />
                <span className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">IP Address</span>
              </div>
              <p className="text-[11px] font-black truncate">{log.ipAddress || '—'}</p>
              <p className="text-[9px] text-muted-foreground truncate">{log.userAgent ? 'Browser: ' + (log.userAgent.split(' ')[0] || '—') : '—'}</p>
            </div>
          </div>

          {/* Details */}
          {details.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex items-center gap-1 mb-1.5">
                <Info className="h-3 w-3 text-violet-500" />
                <span className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Details</span>
              </div>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                {details.map(([key, val]) => (
                  <div key={String(key)} className="flex items-center justify-between gap-3 py-1">
                    <dt className="text-[10px] font-medium text-muted-foreground">{String(key).replace(/_/g, ' ')}</dt>
                    <dd className="text-[10px] font-bold text-right break-words min-w-0">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Error message */}
          {log.errorMessage && (
            <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-2 flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold leading-snug">{log.errorMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
