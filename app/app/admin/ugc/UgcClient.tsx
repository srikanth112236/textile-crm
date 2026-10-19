'use client';

import { useEffect, useState } from 'react';
import { ugcApi, UgcItem } from '@/lib/api/ugc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Star, Trash2, Loader2 } from 'lucide-react';

export default function UgcClient() {
  const { toast } = useToast();
  const [items, setItems] = useState<UgcItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ mediaUrl: '', customerName: '', caption: '', productId: '', mediaType: 'video' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await ugcApi.adminList());
    } catch (e: any) {
      toast({ title: 'Load failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (item: UgcItem) => {
    try {
      await ugcApi.update(item._id, { featured: !item.featured });
      load();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this UGC item?')) return;
    try {
      await ugcApi.remove(id);
      load();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ugcApi.create({ mediaUrl: form.mediaUrl, customerName: form.customerName || undefined, caption: form.caption || undefined, productId: form.productId || undefined, mediaType: form.mediaType as 'video' | 'image', featured: true } as any);
      setForm({ mediaUrl: '', customerName: '', caption: '', productId: '', mediaType: 'video' });
      toast({ title: 'UGC added + featured on homepage' });
      load();
    } catch (err: any) {
      toast({ title: 'Create failed', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await ugcApi.syncInstagram();
      toast({ title: 'Instagram sync done', description: res.message });
      load();
    } catch (e: any) {
      toast({ title: 'Sync failed', description: e.response?.data?.error || 'Set INSTAGRAM_ACCESS_TOKEN in server/.env', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading UGC…</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">UGC & Social Commerce</h1>
          <p className="text-sm text-muted-foreground">{items.length} items · feature/star to show on homepage · tag a product for Shop This Look</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs">
          <Instagram className="h-4 w-4 mr-1.5" /> {syncing ? 'Syncing…' : 'Sync Instagram'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add UGC (customer video/image)</CardTitle><CardDescription>Paste media URL, link a product ID for Shop This Look, auto-featured.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label>Media URL *</Label><Input value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} placeholder="https://…mp4 or image" required /></div>
            <div><Label>Customer handle</Label><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="@rohit_fit" /></div>
            <div><Label>Product ID (for Shop This Look)</Label><Input value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} placeholder="Mongo ObjectId" /></div>
            <div className="sm:col-span-2"><Label>Caption</Label><Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Styling my oversized tee…" /></div>
            <div className="sm:col-span-2"><Button type="submit" size="sm">Add + Feature</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item._id} className="overflow-hidden">
            <div className="relative h-48 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumbnailUrl || item.mediaUrl} alt={item.caption || 'UGC'} className="w-full h-full object-cover" loading="lazy" />
              <Badge className="absolute top-2 left-2 text-[10px]" variant={item.source === 'instagram' ? 'default' : 'secondary'}>{item.source}</Badge>
              {item.featured && <Badge className="absolute top-2 right-2 text-[10px] bg-amber-500 text-slate-950">Featured</Badge>}
            </div>
            <CardContent className="p-3 space-y-1.5 text-xs">
              <div className="font-bold truncate">{item.customerName || item.caption || 'Untitled'}</div>
              <div className="text-muted-foreground truncate">Product: {typeof item.productId === 'object' ? (item.productId as any).name : item.productId || 'not tagged'}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleFeatured(item)}><Star className="h-3 w-3 mr-1" />{item.featured ? 'Unfeature' : 'Feature'}</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(item._id)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {items.length === 0 && <p className="text-sm text-muted-foreground">No UGC yet — sync Instagram or add manually.</p>}
    </div>
  );
}
