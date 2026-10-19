'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Ruler } from 'lucide-react';
import type { IProduct } from '@/lib/api/types';
import { cn, formatPrice } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import { BuyNowButton } from './BuyNowButton';
import { WishlistButton } from './WishlistButton';
import { SizeGuideModal } from './SizeGuideModal';
import { FindMySize } from './FindMySize';

interface QuickViewModalProps {
  product: IProduct | null;
  onClose: () => void;
}

function optionsOf(product: IProduct, name: string): string[] {
  const attr = (product as any).variantAttributes?.find((a: any) => String(a.name).toLowerCase() === name.toLowerCase());
  return attr?.options?.map((o: any) => o.value) || [];
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showFindSize, setShowFindSize] = useState(false);

  useEffect(() => {
    if (product && soldOutSizes.has(selectedSize.toUpperCase())) {
      const firstAvailable = sizes.find((s) => !soldOutSizes.has(s.toUpperCase()));
      if (firstAvailable) setSelectedSize(firstAvailable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  if (!product) return null;
  const sizes = optionsOf(product, 'Size');
  const soldOutSizes = new Set<string>();
  for (const sku of ((product as any).variantSKUs || []) as any[]) {
    const attrs = sku.attributes instanceof Map ? Object.fromEntries(sku.attributes) : sku.attributes || {};
    const sz = attrs.Size || attrs.size;
    if (sz && (sku.stock || 0) <= 0 && sku.isEnabled !== false) soldOutSizes.add(String(sz).toUpperCase());
  }
  const colors = optionsOf(product, 'Color');
  const img = product.images?.[0];
  const imgUrl = typeof img === 'string' ? img : img?.url || '/placeholder-product.jpg';
  const mrp = product.compareAtPrice || Math.round(product.price * 1.3);
  const off = Math.round(((mrp - product.price) / mrp) * 100);
  const categoryName = typeof product.category === 'object' ? (product.category as any)?.name : undefined;
  const variations = [
    ...(sizes.length > 0 ? [{ name: 'Size', value: selectedSize }] : []),
    ...(selectedColor ? [{ name: 'Color', value: selectedColor }] : []),
  ];

  return (
    <>
      <Dialog open={!!product} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="grid sm:grid-cols-2">
            <div className="relative aspect-square bg-muted">
              <Image src={imgUrl.includes('/uploads/') ? `/api/images${imgUrl}` : imgUrl} alt={product.name} fill className="object-cover rounded-l-2xl" sizes="50vw" />
              {off > 0 && <Badge className="absolute top-3 left-3 bg-rose-500 text-white">{off}% OFF</Badge>}
            </div>
            <div className="p-6 space-y-4">
              <DialogTitle className="text-lg font-extrabold leading-tight">{product.name}</DialogTitle>
              {(product.averageRating || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" /> {(product.averageRating || 0).toFixed(1)}
                  <span className="text-muted-foreground">({product.totalReviews} reviews)</span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{formatPrice(product.price)}</span>
                {mrp > product.price && <span className="text-sm text-muted-foreground line-through">{formatPrice(mrp)}</span>}
              </div>
              {colors.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase mb-1.5">Color{selectedColor ? `: ${selectedColor}` : ''}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {colors.map((c) => (
                      <button key={c} onClick={() => setSelectedColor(c)} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border', selectedColor === c ? 'bg-slate-900 text-white border-slate-900' : 'border-border')}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
              {sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase">Size: <span className="text-amber-500">{selectedSize}</span></span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowSizeGuide(true)} className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"><Ruler className="w-3 h-3" /> Size Guide</button>
                      <button onClick={() => setShowFindSize(true)} className="text-xs font-bold text-violet-600 hover:underline">✨ My Size</button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {sizes.map((s) => {
                      const soldOut = soldOutSizes.has(s.toUpperCase());
                      return (
                        <button key={s} onClick={() => { if (!soldOut) setSelectedSize(s); }} disabled={soldOut} title={soldOut ? `${s} sold out` : `Size ${s}`} className={cn('h-9 w-11 rounded-lg text-xs font-bold border', soldOut ? 'line-through text-slate-400 opacity-60 cursor-not-allowed' : selectedSize === s ? 'bg-slate-900 text-white border-slate-900' : 'border-border')}>{s}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <AddToCartButton productId={product._id} variations={variations} className="flex-1 font-bold rounded-xl" />
                <WishlistButton productId={product._id} />
              </div>
              <BuyNowButton productId={product._id} variations={variations} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl" />
              <Link href={`/products/${product._id}`} className="block text-center text-xs font-bold text-amber-600 hover:underline">View Full Product →</Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <SizeGuideModal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} categoryName={categoryName} chart={(product as any).sizeChart} modelHeight={(product as any).modelHeight} modelSizeWorn={(product as any).modelSizeWorn} />
      <FindMySize open={showFindSize} onClose={() => setShowFindSize(false)} categoryName={categoryName} onSelect={setSelectedSize} />
    </>
  );
}
