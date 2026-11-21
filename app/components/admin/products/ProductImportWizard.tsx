'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  productImportApi,
  type ImportHistoryItem,
  type ImportJob,
  type ValidateImportResponse,
} from '@/lib/api/productImport';

const MAX_BYTES = 10 * 1024 * 1024;

type Step = 'upload' | 'review' | 'importing' | 'done';

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 'upload', label: 'Upload' },
  { id: 'review', label: 'Review' },
  { id: 'importing', label: 'Import' },
  { id: 'done', label: 'Done' },
];

function stepIndex(step: Step): number {
  return STEPS.findIndex((s) => s.id === step);
}

function formatDate(value?: string): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function statusTone(status: string): string {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'failed') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (status === 'importing') return 'bg-amber-100 text-amber-900 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function ProductImportWizard() {
  const { toast } = useToast();
  const { role } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [mode, setMode] = useState<'create' | 'upsert'>('create');
  const [file, setFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validation, setValidation] = useState<ValidateImportResponse | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<'draft' | 'keep'>('draft');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadHistory = () => {
    productImportApi.list().then(setHistory).catch(() => setHistory([]));
  };

  useEffect(() => {
    loadHistory();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const reset = () => {
    stopPolling();
    setStep('upload');
    setMode('create');
    setFile(null);
    setZipFile(null);
    setValidation(null);
    setJob(null);
    setError('');
    setDefaultStatus('draft');
    loadHistory();
  };

  const chooseFile = (next: File | null) => {
    setError('');
    if (!next) return;
    if (!next.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported in this release.');
      return;
    }
    if (next.size > MAX_BYTES) {
      setError('The file is larger than 10 MB. Split it into smaller files.');
      return;
    }
    setFile(next);
  };

  const handleValidate = async () => {
    if (!file) {
      setError('Choose a CSV file first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await productImportApi.validate(file, mode, zipFile);
      setValidation(result);
      setJob(null);
      setDefaultStatus(result.mode === 'upsert' ? 'keep' : 'draft');
      setStep('review');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Could not validate the file.');
    } finally {
      setBusy(false);
    }
  };

  const startPolling = (jobId: string) => {
    stopPolling();
    const tick = async () => {
      try {
        const latest = await productImportApi.getJob(jobId);
        setJob(latest);
        if (latest.status === 'completed' || latest.status === 'failed' || latest.status === 'cancelled') {
          stopPolling();
          setStep('done');
          loadHistory();
        }
      } catch {
        // Keep polling through transient network blips.
      }
    };
    void tick();
    pollRef.current = setInterval(tick, 1500);
  };

  const handleCommit = async () => {
    if (!validation) return;
    setBusy(true);
    setError('');
    try {
      const started = await productImportApi.commit(validation.jobId, defaultStatus);
      setJob(started);
      setStep('importing');
      startPolling(validation.jobId);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Could not start the import.');
    } finally {
      setBusy(false);
    }
  };

  const downloadReport = async () => {
    const jobId = job?.jobId || validation?.jobId;
    if (!jobId) return;
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
      toast({
        title: 'Report unavailable',
        description: 'The report could not be downloaded. Try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    try {
      const latest = await productImportApi.cancel(job.jobId);
      setJob(latest);
      if (latest.status === 'cancelled') {
        stopPolling();
        setStep('done');
      }
      toast({ title: 'Cancellation requested', description: 'The import will stop after the current chunk.' });
    } catch (err: any) {
      toast({ title: 'Could not cancel', description: err?.message || 'Try again.', variant: 'destructive' });
    }
  };

  const handleResume = async () => {
    if (!job) return;
    try {
      const latest = await productImportApi.resume(job.jobId, defaultStatus);
      setJob(latest);
      setStep('importing');
      startPolling(job.jobId);
    } catch (err: any) {
      toast({ title: 'Could not resume', description: err?.message || 'Try again.', variant: 'destructive' });
    }
  };

  const handleRollback = async () => {
    if (!job) return;
    if (!window.confirm('Roll back this import? Created products will be deleted and updated products will be restored.')) {
      return;
    }
    try {
      const latest = await productImportApi.rollback(job.jobId);
      setJob(latest);
      toast({ title: 'Import rolled back', description: 'The catalogue has been restored.' });
      loadHistory();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Rollback failed.';
      toast({ title: 'Could not roll back', description: message, variant: 'destructive' });
    }
  };

  const validRows = validation?.validRows ?? job?.summary?.validRows ?? 0;
  const processed = job?.processedRows ?? 0;
  const total = job?.totalRows ?? validation?.totalRows ?? 0;
  const progress = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/products"
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to products
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">Bulk import products</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Upload a CSV, review every row before anything is written, then import as drafts.
            Nothing is saved until you press Import.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/import/history">
            <Button variant="outline" size="sm">Import history</Button>
          </Link>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
            up to 2,000 rows
          </Badge>
        </div>
      </div>

      {/* Step rail */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((item, index) => {
          const active = step === item.id;
          const complete = stepIndex(step) > index;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
                active
                  ? 'border-slate-900 bg-slate-950 text-white'
                  : complete
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                active ? 'bg-amber-400 text-slate-950' : complete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {complete ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
              </span>
              {item.label}
            </div>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      {step === 'upload' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Upload your CSV</CardTitle>
              <CardDescription>
                Use the template so required columns and pipe-separated values match the importer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className={`rounded-xl border p-3 text-left ${mode === 'create' ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                >
                  <span className="block text-xs font-bold">Create new products</span>
                  <span className={`mt-1 block text-[11px] ${mode === 'create' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Existing SKUs are reported as errors.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('upsert')}
                  className={`rounded-xl border p-3 text-left ${mode === 'upsert' ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                >
                  <span className="block text-xs font-bold">Create or update by SKU</span>
                  <span className={`mt-1 block text-[11px] ${mode === 'upsert' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Only supplied fields change; omitted fields stay.
                  </span>
                </button>
              </div>

              <label
                htmlFor="product-import-file"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  chooseFile(e.dataTransfer.files?.[0] || null);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors ${
                  dragOver ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Upload className="h-5 w-5 text-amber-600" />
                </span>
                <span className="mt-3 text-sm font-bold text-slate-900">
                  {file ? file.name : 'Drop a CSV here or click to choose'}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB · ready to validate`
                    : 'CSV or XLSX · max 10 MB · max 2,000 rows'}
                </span>
                <input
                  id="product-import-file"
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  onChange={(e) => chooseFile(e.target.files?.[0] || null)}
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <label htmlFor="product-import-zip" className="text-xs font-bold text-slate-800">
                  Optional image ZIP (advanced)
                </label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Structure: <code className="rounded bg-slate-100 px-1">images/&#123;sku&#125;/1.jpg</code>. Max 50 MB, 20 images per SKU.
                </p>
                <input
                  id="product-import-zip"
                  type="file"
                  accept=".zip,application/zip"
                  className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                />
                {zipFile && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                    {zipFile.name} · {(zipFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleValidate}
                  disabled={!file || busy}
                  className="bg-slate-950 text-white hover:bg-amber-500 hover:text-slate-950"
                >
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                  {busy ? 'Validating…' : 'Validate & preview'}
                </Button>
                <Link href="/templates/product-import.csv" download>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    CSV template
                  </Button>
                </Link>
                <Link href="/templates/product-import.xlsx" download>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    XLSX template
                  </Button>
                </Link>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
                <strong className="text-slate-800">Required columns:</strong> name, sku, category,
                price, stock, description, images. Separate multiple images or tags with{' '}
                <code className="rounded bg-white px-1">|</code>. Category accepts a slug, name or id.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent imports</CardTitle>
              <CardDescription>Last 10 jobs for this admin account.</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No imports yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.jobId} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">{item.fileName}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {formatDate(item.createdAt)} · {item.totalRows} rows
                          </p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${statusTone(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-600">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold uppercase">{item.mode || 'create'}</span>
                        <span>{item.created} created</span>
                        <span>{item.updated} updated</span>
                        <span>{item.failed} failed</span>
                        {item.errorRows > 0 && <span>{item.errorRows} validation errors</span>}
                        {item.rolledBackAt && <span className="font-bold text-amber-700">rolled back</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'review' && validation && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total rows', value: validation.totalRows, tone: 'text-slate-950' },
              {
                label: validation.updateRows > 0 ? `Ready (${validation.updateRows} updates)` : 'Ready to import',
                value: validation.validRows,
                tone: 'text-emerald-700',
              },
              { label: 'Errors', value: validation.errorRows, tone: 'text-rose-700' },
              { label: 'Warnings', value: validation.warningRows, tone: 'text-amber-700' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className={`text-2xl font-extrabold ${stat.tone}`}>{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {validation.errors.length > 0 && (
            <Card className="border-rose-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-rose-800">
                  <XCircle className="h-4 w-4" /> Rows that will be skipped
                </CardTitle>
                <CardDescription>Fix these in your CSV and upload again for a clean import.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 space-y-2 overflow-auto pr-1">
                  {validation.errors.map((row) => (
                    <div key={`err-${row.row}`} className="rounded-lg border border-rose-100 bg-rose-50/60 p-2.5">
                      <p className="text-[11px] font-bold text-rose-900">
                        Row {row.row} {row.sku ? `· ${row.sku}` : ''}
                      </p>
                      <ul className="mt-1 space-y-0.5 text-[11px] text-rose-800">
                        {row.errors.map((issue, index) => (
                          <li key={index}>{issue.field ? `${issue.field}: ` : ''}{issue.message}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {validation.warnings.length > 0 && (
            <details className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <summary className="cursor-pointer text-xs font-bold text-amber-900">
                {validation.warningRows} rows have warnings — review
              </summary>
              <div className="mt-2 max-h-48 space-y-1.5 overflow-auto text-[11px] text-amber-900">
                {validation.warnings.map((row) => (
                  <div key={`warn-${row.row}`}>
                    <strong>Row {row.row}</strong> {row.sku ? `(${row.sku})` : ''}: {row.warnings.join(' ')}
                  </div>
                ))}
              </div>
            </details>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" /> Preview (first {validation.preview.length} rows)
              </CardTitle>
              <CardDescription>
                {validation.headers.length} columns detected · mode: <strong>{validation.mode}</strong>.
                New products are drafts until you publish them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-center">Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validation.preview.map((row) => (
                      <tr key={row.row} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-500">{row.row}</td>
                        <td className="max-w-[240px] truncate px-3 py-2 font-semibold text-slate-900">{row.name}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-700">{row.sku}</td>
                        <td className="px-3 py-2 text-slate-600">{row.category}</td>
                        <td className="px-3 py-2 text-right text-slate-700">₹{row.price}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{row.stock}</td>
                        <td className="px-3 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold">{row.status}</span></td>
                        <td className="px-3 py-2 text-center text-slate-600">{row.imageCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <p className="text-xs font-bold text-slate-900">Import status</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDefaultStatus('draft')}
                    className={`rounded-xl border p-3 text-left ${defaultStatus === 'draft' ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                  >
                    <span className="block text-xs font-bold">Import as drafts (recommended)</span>
                    <span className={`mt-1 block text-[11px] ${defaultStatus === 'draft' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Review and publish products when you are ready.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultStatus('keep')}
                    className={`rounded-xl border p-3 text-left ${defaultStatus === 'keep' ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                  >
                    <span className="block text-xs font-bold">Use the status in the CSV</span>
                    <span className={`mt-1 block text-[11px] ${defaultStatus === 'keep' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Active rows require shipping weight and dimensions.
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setStep('upload')} disabled={busy}>
                  Choose another file
                </Button>
                <Button
                  onClick={handleCommit}
                  disabled={busy || validation.validRows === 0}
                  className="bg-slate-950 text-white hover:bg-amber-500 hover:text-slate-950"
                >
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  {busy ? 'Starting…' : `Import ${validation.validRows} ${validation.validRows === 1 ? 'row' : 'rows'}`}
                </Button>
              </div>
              {validation.validRows === 0 && (
                <p className="text-right text-[11px] font-semibold text-rose-700">
                  No valid rows to import. Fix the errors above first.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'importing' && job && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              Importing {job.totalRows} rows…
            </CardTitle>
            <CardDescription>
              Keep this tab open. You can leave the import running in the background.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>{job.processedRows} of {job.totalRows} processed</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-3"><p className="text-xl font-extrabold">{job.created}</p><p className="text-[10px] uppercase text-slate-500">Created</p></div>
              <div className="rounded-xl border border-slate-200 p-3"><p className="text-xl font-extrabold text-rose-700">{job.failed}</p><p className="text-[10px] uppercase text-slate-500">Failed</p></div>
              <div className="rounded-xl border border-slate-200 p-3"><p className="text-xl font-extrabold">{job.processedRows}</p><p className="text-[10px] uppercase text-slate-500">Processed</p></div>
              <div className="rounded-xl border border-slate-200 p-3"><p className="text-xl font-extrabold">{job.totalRows}</p><p className="text-[10px] uppercase text-slate-500">Total</p></div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleCancel} disabled={Boolean(job.cancelRequested)}>
                {job.cancelRequested ? 'Stopping after this chunk…' : 'Cancel import'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && job && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {job.status === 'completed'
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                : <XCircle className="h-5 w-5 text-rose-600" />}
              {job.status === 'completed' ? 'Import complete' : 'Import failed'}
            </CardTitle>
            <CardDescription>
              {job.fileName} · {job.totalRows} rows · {job.summary?.durationMs ? `${(job.summary.durationMs / 1000).toFixed(1)}s` : 'finished'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-xl font-extrabold text-emerald-800">{job.created}</p><p className="text-[10px] uppercase text-emerald-700">Created</p></div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3"><p className="text-xl font-extrabold text-sky-800">{job.updated}</p><p className="text-[10px] uppercase text-sky-700">Updated</p></div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3"><p className="text-xl font-extrabold text-rose-800">{job.failed}</p><p className="text-[10px] uppercase text-rose-700">Failed</p></div>
              <div className="rounded-xl border border-slate-200 p-3"><p className="text-xl font-extrabold">{job.summary?.warningRows ?? 0}</p><p className="text-[10px] uppercase text-slate-500">Warnings</p></div>
            </div>

            {job.rolledBackAt && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                This import was rolled back on {formatDate(job.rolledBackAt)}.
              </p>
            )}
            {!job.rolledBackAt && job.rollbackExpiresAt && (
              <p className="text-[11px] text-slate-500">
                Rollback is available until {formatDate(job.rollbackExpiresAt)}.
              </p>
            )}

            {job.error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{job.error}</p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/admin/products?status=draft">
                <Button className="w-full bg-slate-950 text-white hover:bg-amber-500 hover:text-slate-950 sm:w-auto">
                  View imported drafts
                </Button>
              </Link>
              <Button variant="outline" onClick={downloadReport}>
                <Download className="mr-2 h-4 w-4" /> Download report
              </Button>
              {job.canResume && (
                <Button variant="outline" onClick={handleResume}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Resume import
                </Button>
              )}
              {role === 'superadmin' && job.status === 'completed' && !job.rolledBackAt && job.rollbackExpiresAt && (
                <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={handleRollback}>
                  Roll back import
                </Button>
              )}
              <Button variant="ghost" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" /> Import another file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
