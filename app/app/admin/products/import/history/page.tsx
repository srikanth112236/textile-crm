'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { productImportApi, type ImportHistoryItem } from '@/lib/api/productImport';

function formatDate(value?: string): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function tone(status: string): string {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'failed') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (status === 'importing') return 'bg-amber-100 text-amber-900 border-amber-200';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-sky-100 text-sky-800 border-sky-200';
}

export default function ProductImportHistoryPage() {
  const { toast } = useToast();
  const { role } = useAuth();
  const [items, setItems] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    productImportApi
      .list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const downloadReport = async (jobId: string) => {
    try {
      const blob = await productImportApi.downloadReport(jobId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `product-import-${jobId}-report.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Report unavailable', description: 'Try again later.', variant: 'destructive' });
    }
  };

  const resume = async (jobId: string) => {
    setBusy(jobId);
    try {
      await productImportApi.resume(jobId, 'draft');
      toast({ title: 'Import resumed', description: 'Progress will continue in the background.' });
      load();
    } catch (err: any) {
      toast({ title: 'Could not resume', description: err?.message || 'Try again.', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const rollback = async (jobId: string) => {
    if (!window.confirm('Roll back this import? Created products will be deleted and updated products restored.')) return;
    setBusy(jobId);
    try {
      await productImportApi.rollback(jobId);
      toast({ title: 'Import rolled back', description: 'The catalogue has been restored.' });
      load();
    } catch (err: any) {
      toast({
        title: 'Could not roll back',
        description: err?.response?.data?.error || err?.message || 'Rollback failed.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <Link
        href="/admin/products/import"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to import
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Import history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Last 10 imports. Reports remain available for completed jobs; rollback lasts 24 hours.
          </p>
        </div>
        <Link href="/admin/products/import">
          <Button className="bg-slate-950 text-white hover:bg-amber-500 hover:text-slate-950">New import</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading imports…
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No imports yet.</p>
          ) : (
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">File</th>
                    <th className="px-3 py-2">Mode</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Rows</th>
                    <th className="px-3 py-2 text-right">Created</th>
                    <th className="px-3 py-2 text-right">Updated</th>
                    <th className="px-3 py-2 text-right">Failed</th>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.jobId} className="border-t border-slate-100 align-top">
                      <td className="max-w-[220px] px-3 py-3">
                        <p className="truncate font-semibold text-slate-900">{item.fileName}</p>
                        {item.rolledBackAt && <p className="text-[10px] font-bold text-amber-700">rolled back</p>}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className="text-[9px] uppercase">{item.mode || 'create'}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${tone(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">{item.totalRows}</td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-700">{item.created}</td>
                      <td className="px-3 py-3 text-right font-bold text-sky-700">{item.updated}</td>
                      <td className="px-3 py-3 text-right font-bold text-rose-700">{item.failed}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => downloadReport(item.jobId)}>
                            <Download className="mr-1 h-3 w-3" /> Report
                          </Button>
                          {item.canResume && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px]"
                              disabled={busy === item.jobId}
                              onClick={() => resume(item.jobId)}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" /> Resume
                            </Button>
                          )}
                          {role === 'superadmin' && item.status === 'completed' && !item.rolledBackAt && item.rollbackExpiresAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-rose-200 px-2 text-[10px] text-rose-700 hover:bg-rose-50"
                              disabled={busy === item.jobId}
                              onClick={() => rollback(item.jobId)}
                            >
                              Rollback
                            </Button>
                          )}
                        </div>
                      </td>
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
