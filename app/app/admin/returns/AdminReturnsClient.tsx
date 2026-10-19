'use client';

import { useEffect, useState } from 'react';
import { returnsApi } from '@/lib/api/returns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const STATUSES = ['requested', 'approved', 'rejected', 'pickup_scheduled', 'received', 'refunded', 'exchanged', 'cancelled'];

export default function AdminReturnsClient() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sizeReport, setSizeReport] = useState<Array<{ productId: string; name: string; sku: string; total: number; sizeIssues: number; rate: number; sizes: Record<string, number> }>>([]);

  useEffect(() => {
    load();
    returnsApi.sizeReport().then((d) => setSizeReport(d.rows)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setRows(await returnsApi.adminList());
    } catch (e: any) {
      toast({ title: 'Load failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, status: string) => {
    try {
      await returnsApi.adminUpdate(id, { status, adminNote: notes[id] || undefined });
      toast({ title: `Marked ${status.replace('_', ' ')} — customer notified on WhatsApp` });
      load();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  const filtered = filter ? rows.filter((r) => r.status === filter) : rows;

  if (loading) return <div className="p-8 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading RMA queue…</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Returns & Exchange (RMA)</h1>
          <p className="text-sm text-muted-foreground">{rows.length} requests · status changes notify the customer on WhatsApp</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={filter === '' ? 'default' : 'outline'} onClick={() => setFilter('')}>All</Button>
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>{s.replace('_', ' ')}</Button>
          ))}
        </div>
      </div>

      {sizeReport.filter((r) => r.rate >= 40).length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">⚠️ Size-chart suspects (90 days)</CardTitle>
            <CardDescription>High size-issue return rate — verify measurements for these products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {sizeReport.filter((r) => r.rate >= 40).map((r) => (
              <div key={r.productId} className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium">{r.name} <span className="text-muted-foreground font-mono text-xs">{r.sku}</span></span>
                <span className="text-xs"><Badge variant="destructive">{r.rate}% size</Badge> <span className="text-muted-foreground">{r.sizeIssues}/{r.total} returns · {Object.entries(r.sizes).map(([k, v]) => `${k}×${v}`).join(', ')}</span></span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No requests.</p> : filtered.map((r) => (
        <Card key={r._id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="uppercase">{r.type}</Badge>
              {r.orderNumber}
              <Badge>{r.status.replace('_', ' ')}</Badge>
            </CardTitle>
            <CardDescription>{new Date(r.createdAt).toLocaleString('en-IN')} · {r.items.length} item(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {r.items.map((it: any, i: number) => (
              <div key={i} className="flex justify-between border rounded-lg p-2">
                <span>Qty {it.quantity} — {it.reason}{it.size ? ` (size ${it.size})` : ''}{it.exchangeSize ? ` → ${it.exchangeSize}` : ''}</span>
              </div>
            ))}
            <p className="text-muted-foreground">{r.reason}</p>
            <div className="flex gap-2 items-center flex-wrap">
              <Input placeholder="Admin note (sent to customer)" value={notes[r._id] || ''} onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })} className="flex-1 min-w-[200px] text-xs" />
              <select value={r.status} onChange={(e) => update(r._id, e.target.value)} className="text-xs border rounded-lg px-2 py-2">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
