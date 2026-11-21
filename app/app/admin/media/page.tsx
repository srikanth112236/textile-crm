'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, ImageIcon, Loader2, Search } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import type { IProduct } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function imageStats(product: IProduct) {
  const images = (product.images || []).map((image) =>
    typeof image === 'string' ? { url: image, altText: '' } : image
  );
  const missing = images.filter((image) => !String(image.altText || '').trim()).length;
  return { total: images.length, missing };
}

export default function MediaHealthPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [missingOnly, setMissingOnly] = useState(true);

  useEffect(() => {
    productsApi
      .getProducts({ limit: 100 })
      .then((response) => setProducts(response.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    let totalImages = 0;
    let missingAlt = 0;
    let productsWithMissing = 0;
    for (const product of products) {
      const current = imageStats(product);
      totalImages += current.total;
      missingAlt += current.missing;
      if (current.missing > 0) productsWithMissing += 1;
    }
    return {
      totalImages,
      missingAlt,
      productsWithMissing,
      score: totalImages > 0 ? Math.round(((totalImages - missingAlt) / totalImages) * 100) : 100,
    };
  }, [products]);

  const visible = products
    .filter((product) => !search || product.name.toLowerCase().includes(search.toLowerCase()) || product.sku.toLowerCase().includes(search.toLowerCase()))
    .filter((product) => !missingOnly || imageStats(product).missing > 0);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to products
      </Link>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Media &amp; SEO health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alt text helps accessibility and image search. This audit covers the latest 100 products.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-extrabold">{stats.score}%</p><p className="text-[10px] uppercase font-bold text-muted-foreground">Alt-text score</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-extrabold">{stats.totalImages}</p><p className="text-[10px] uppercase font-bold text-muted-foreground">Images</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-extrabold text-rose-700">{stats.missingAlt}</p><p className="text-[10px] uppercase font-bold text-muted-foreground">Missing alt</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-extrabold text-amber-700">{stats.productsWithMissing}</p><p className="text-[10px] uppercase font-bold text-muted-foreground">Products affected</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4 text-amber-500" /> Product images
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product or SKU"
                  className="h-8 w-56 pl-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                variant={missingOnly ? 'default' : 'outline'}
                className={missingOnly ? 'h-8 bg-slate-950 text-xs text-white' : 'h-8 text-xs'}
                onClick={() => setMissingOnly((value) => !value)}
              >
                {missingOnly ? 'Missing only' : 'All products'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Auditing images…</div>
          ) : visible.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
              No image issues in this view.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Images</th>
                    <th className="px-3 py-2">Missing alt</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => {
                    const current = imageStats(product);
                    return (
                      <tr key={product._id} className="border-t border-slate-100">
                        <td className="max-w-[260px] truncate px-3 py-2.5 font-semibold text-slate-900">{product.name}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">{product.sku}</td>
                        <td className="px-3 py-2.5">{current.total}</td>
                        <td className="px-3 py-2.5">
                          {current.missing > 0 ? (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-200">{current.missing}</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Complete</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 capitalize">{product.status.replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2.5 text-right">
                          <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
                            <Link href={`/admin/products/${product._id}`}>Fix alt text</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Add concise, descriptive alt text for every image in the product editor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
