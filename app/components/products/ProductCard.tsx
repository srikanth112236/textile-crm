'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Eye, Scale, Check, Zap } from 'lucide-react';
import type { IProduct } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';
import { QuickViewModal } from './QuickViewModal';
import { formatPrice } from '@/lib/utils';
import { useCompare } from '@/lib/contexts/CompareContext';
import { useCart } from '@/lib/contexts/CartContext';
import { LoginModal } from '@/components/auth/LoginModal';

interface ProductCardProps {
  product: IProduct;
  className?: string;
  showQuickView?: boolean;
  onQuickView?: (product: IProduct) => void;
}

export function ProductCard({ product, className, showQuickView = true, onQuickView }: ProductCardProps) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const isCompared = isInCompare(product._id);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [quickAdding, setQuickAdding] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const { addItem, requiresAuth } = useCart();

  const sizeOptions: string[] =
    (product as any).variantAttributes?.find((a: any) => String(a.name).toLowerCase() === 'size')?.options?.map((o: any) => o.value) || [];

  const colorOptions: Array<{ value: string; colorCode?: string }> =
    (product as any).variantAttributes?.find((a: any) => String(a.name).toLowerCase() === 'color')?.options?.map((o: any) => ({ value: o.value, colorCode: o.colorCode })) || [];

  // Size-level sold-out lookup from variant SKUs
  const soldOutSizes = new Set<string>();
  for (const sku of ((product as any).variantSKUs || []) as any[]) {
    const attrs = sku.attributes instanceof Map ? Object.fromEntries(sku.attributes) : sku.attributes || {};
    const sz = attrs.Size || attrs.size;
    if (sz && (sku.stock || 0) <= 0 && sku.isEnabled !== false) soldOutSizes.add(String(sz).toUpperCase());
  }

  // Badges: admin (bestseller/trending/limited) + computed (new = 14 days, sale)
  const createdDays = (Date.now() - new Date((product as any).createdAt || Date.now()).getTime()) / 86400000;
  const isNew = (product.badges || []).includes('new') || createdDays <= 14;
  const isSale = (product.compareAtPrice || 0) > product.price;
  const adminBadges = (product.badges || []).filter((b) => ['bestseller', 'trending', 'limited'].includes(b));
  const badgeStyle: Record<string, string> = {
    bestseller: 'bg-amber-500 text-slate-950',
    trending: 'bg-violet-500 text-white',
    limited: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
    new: 'bg-emerald-500 text-white',
    sale: 'bg-rose-500 text-white',
  };

  const mainImage = product.images && product.images.length > 0
    ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)
    : '/placeholder-product.jpg';

  const imageUrl = mainImage.includes('/uploads/')
    ? `/api/images${mainImage}`
    : mainImage;

  const isOutOfStock = product.stock === 0 || product.status === 'out_of_stock';
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 10);
  const mrp = product.compareAtPrice || Math.round(product.price * 1.3);
  const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeFromCompare(product._id);
    } else {
      addToCompare(product);
    }
  };

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
    else setQuickViewOpen(true);
  };

  const handleQuickAddSize = async (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Login compulsory for any shopping action (only pincode check is public)
    if (requiresAuth()) {
      setLoginOpen(true);
      return;
    }
    setQuickAdding(size);
    try {
      await addItem(product._id, 1, [{ name: 'Size', value: size }]);
      setSizePickerOpen(false);
    } finally {
      setQuickAdding(null);
    }
  };

  return (
    <>
    <Card className={cn('group overflow-hidden transition-all duration-300 hover:shadow-xl border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col justify-between', className)}>
      <div>
        <Link href={`/products/${product._id}`} className="block">
          <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              loading="lazy"
              priority={false}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {discountPercent > 0 && (
              <Badge className="absolute top-2 left-2 bg-rose-500 text-white font-extrabold text-[10px] px-2 py-0.5">
                {discountPercent}% OFF
              </Badge>
            )}
            {/* Admin + computed badges: New / Bestseller / Trending / Limited / Sale */}
            <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
              {isNew && <Badge className={cn('font-extrabold text-[10px] px-2 py-0.5', badgeStyle.new)}>New</Badge>}
              {isSale && <Badge className={cn('font-extrabold text-[10px] px-2 py-0.5', badgeStyle.sale)}>Sale</Badge>}
              {adminBadges.map((b) => (
                <Badge key={b} className={cn('font-extrabold text-[10px] px-2 py-0.5 capitalize', badgeStyle[b])}>{b}</Badge>
              ))}
            </div>
            {isOutOfStock && (
              <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">
                Out of Stock
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="outline" className="absolute top-2 right-2 bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                Low Stock
              </Badge>
            )}
            
            {/* Top Right Action Overlay: Wishlist & Compare */}
            <div 
              className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <WishlistButton productId={product._id} />
              
              <button
                onClick={toggleCompare}
                className={cn(
                  'p-2 rounded-full backdrop-blur-md transition-all border shadow-sm',
                  isCompared 
                    ? 'bg-amber-500 text-slate-950 border-amber-400' 
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-amber-500 border-white/20'
                )}
                title={isCompared ? 'Remove from compare' : 'Add to compare'}
              >
                {isCompared ? <Check className="w-4 h-4 font-bold" /> : <Scale className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </Link>
        
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {typeof product.category === 'object' ? product.category?.name : 'Mentoos'}
            </span>
            {(product.averageRating || 0) > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{(product.averageRating || 0).toFixed(1)}</span>
              </div>
            )}
          </div>

          <Link href={`/products/${product._id}`}>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-amber-500 transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {formatPrice(product.price)}
            </span>
            {mrp > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(mrp)}
              </span>
            )}
          </div>

          {/* Color dots */}
          {colorOptions.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              {colorOptions.slice(0, 6).map((c) => (
                <span
                  key={c.value}
                  title={c.value}
                  className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: c.colorCode || '#cbd5e1' }}
                />
              ))}
              {colorOptions.length > 6 && (
                <span className="text-[10px] text-muted-foreground font-bold">+{colorOptions.length - 6}</span>
              )}
            </div>
          )}

          {/* Available sizes (sold-out struck through) */}
          {sizeOptions.length > 0 && (
            <div className="flex items-center gap-1 pt-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Sizes:</span>
              {sizeOptions.map((s) => {
                const soldOut = soldOutSizes.has(s.toUpperCase());
                return (
                  <span
                    key={s}
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                      soldOut
                        ? 'line-through text-slate-400 border-slate-200 dark:border-slate-800'
                        : 'border-slate-300 dark:border-slate-700'
                    )}
                  >
                    {s}
                  </span>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {sizePickerOpen && sizeOptions.length > 0 ? (
          <div className="w-full">
            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Select size — Quick Add</div>
            <div className="flex gap-1.5 flex-wrap">
              {sizeOptions.map((s) => {
                const soldOut = soldOutSizes.has(s.toUpperCase());
                return (
                <button
                  key={s}
                  onClick={(e) => handleQuickAddSize(e, s)}
                  disabled={isOutOfStock || soldOut || quickAdding !== null}
                  title={soldOut ? `${s} sold out` : `Quick add size ${s}`}
                  className={cn(
                    'h-8 min-w-[44px] px-3 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50',
                    soldOut
                      ? 'line-through text-slate-400 border-slate-200 dark:border-slate-800'
                      : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-500/10'
                  )}
                >
                  {quickAdding === s ? '…' : s}
                </button>
                );
              })}
            </div>
            <button onClick={() => setSizePickerOpen(false)} className="text-[10px] text-muted-foreground hover:underline mt-1">Cancel</button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            {sizeOptions.length > 0 ? (
              <Button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSizePickerOpen(true); }}
                className="flex-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs rounded-xl transition-all"
                disabled={isOutOfStock}
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" /> Quick Add
              </Button>
            ) : (
              <AddToCartButton
                productId={product._id}
                className="flex-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs rounded-xl transition-all"
                disabled={isOutOfStock}
              />
            )}
            {showQuickView && (
              <Button
                variant="outline"
                size="icon"
                onClick={openQuickView}
                className="rounded-xl border-slate-200 dark:border-slate-800"
                aria-label="Quick view"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
    <QuickViewModal product={quickViewOpen ? product : null} onClose={() => setQuickViewOpen(false)} />
    <LoginModal open={loginOpen} onOpenChange={setLoginOpen} title="Login to Shop" description="Login or register to add to cart, wishlist, or buy. Only pincode check is available without login." />
    </>
  );
}
