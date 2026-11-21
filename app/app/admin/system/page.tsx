'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, BellRing, Database, Loader2, RefreshCw, Server, ShoppingBag, Users } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface HealthData {
  application: {
    status: string;
    environment: string;
    uptimeSeconds: number;
    node: string;
    memoryMb: { rss: number; heapUsed: number };
  };
  services: { mongodb: string; redis: string; elasticsearch: string };
  counts: { products: number; users: number; orders: number; imports: number };
  importStatuses: Record<string, number>;
  recentImports: Array<{
    jobId: string;
    fileName: string;
    status: string;
    mode: string;
    totalRows: number;
    created: number;
    updated: number;
    failed: number;
    errorRows: number;
    createdAt: string;
  }>;
  featureFlags: Record<string, boolean>;
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function serviceTone(value: string) {
  if (['connected', 'ok', 'configured'].includes(value)) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (['disabled', 'not configured'].includes(value)) return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-rose-100 text-rose-800 border-rose-200';
}

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/system/health');
      setData(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Health check failed',
        description: error?.response?.data?.error || error?.message || 'Could not read system health.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking system health…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">System health is unavailable.</p>
        <Button className="mt-4" onClick={load}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <Link href="/admin/dashboard" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">System health</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live service status, catalogue counts, imports and feature flags.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-extrabold capitalize">{data.application.status}</p><p className="text-[10px] uppercase font-bold text-muted-foreground">Application</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-extrabold">{formatUptime(data.application.uptimeSeconds)}</p><p className="text-[10px] uppercase font-bold text-muted-foreground">Uptime</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-extrabold">{data.application.memoryMb.heapUsed} MB</p><p className="text-[10px] uppercase font-bold text-muted-foreground">Heap used</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-extrabold">{data.application.node}</p><p className="text-[10px] uppercase font-bold text-muted-foreground">Node runtime</p></CardContent></Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Server className="h-4 w-4 text-amber-500" /> Services</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {Object.entries(data.services).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span className="text-xs font-bold capitalize text-slate-700">{name}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${serviceTone(status)}`}>{status}</span>
              </div>
            ))}
            <p className="pt-1 text-[10px] text-muted-foreground">Environment: {data.application.environment}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Database className="h-4 w-4 text-amber-500" /> Catalogue snapshot</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-0">
            <div className="rounded-lg border border-slate-200 p-3"><ShoppingBag className="mb-1 h-4 w-4 text-slate-400" /><p className="text-lg font-extrabold">{data.counts.products}</p><p className="text-[10px] uppercase text-muted-foreground">Products</p></div>
            <div className="rounded-lg border border-slate-200 p-3"><Users className="mb-1 h-4 w-4 text-slate-400" /><p className="text-lg font-extrabold">{data.counts.users}</p><p className="text-[10px] uppercase text-muted-foreground">Users</p></div>
            <div className="rounded-lg border border-slate-200 p-3"><BellRing className="mb-1 h-4 w-4 text-slate-400" /><p className="text-lg font-extrabold">{data.counts.orders}</p><p className="text-[10px] uppercase text-muted-foreground">Orders</p></div>
            <div className="rounded-lg border border-slate-200 p-3"><Activity className="mb-1 h-4 w-4 text-slate-400" /><p className="text-lg font-extrabold">{data.counts.imports}</p><p className="text-[10px] uppercase text-muted-foreground">Imports</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Feature flags</CardTitle>
            <span className="text-[10px] text-muted-foreground">Server-side values</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          {Object.entries(data.featureFlags).map(([flag, enabled]) => (
            <Badge key={flag} variant="outline" className={enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}>
              {flag}: {enabled ? 'ON' : 'OFF'}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Recent imports</CardTitle>
            <Link href="/admin/products/import/history" className="text-[11px] font-bold text-amber-700 hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {data.recentImports.length === 0 ? (
            <p className="py-4 text-xs text-muted-foreground">No imports yet.</p>
          ) : (
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr><th className="px-3 py-2">File</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Rows</th><th className="px-3 py-2 text-right">Created</th><th className="px-3 py-2 text-right">Updated</th><th className="px-3 py-2 text-right">Failed</th></tr>
                </thead>
                <tbody>
                  {data.recentImports.map((job) => (
                    <tr key={job.jobId} className="border-t border-slate-100">
                      <td className="max-w-[220px] truncate px-3 py-2 font-semibold">{job.fileName}</td>
                      <td className="px-3 py-2 uppercase">{job.mode}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={serviceTone(job.status === 'completed' ? 'ok' : job.status === 'failed' ? 'down' : 'configured')}>{job.status}</Badge></td>
                      <td className="px-3 py-2 text-right">{job.totalRows}</td>
                      <td className="px-3 py-2 text-right text-emerald-700">{job.created}</td>
                      <td className="px-3 py-2 text-right text-sky-700">{job.updated}</td>
                      <td className="px-3 py-2 text-right text-rose-700">{job.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
