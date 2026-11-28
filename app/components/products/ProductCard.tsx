'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Eye, Scale, Check, Zap, Lock } from 'lucide-react';
import type { IProduct } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';
import { QuickViewModal } from './QuickViewModal';
import { SizeGuideModal } from './SizeGuideModal';
import { formatPrice } from '@/lib/utils';
import { useCompare } from '@/lib/contexts/CompareContext';
import { useCart } from '@/lib/contexts/CartContext';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics/events';

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
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [pendingSize, setPendingSize] = useState<string | null>(null);
  const { addItem, requiresAuth } = useCart();
  const { isStaff } = useAuth();
  const { toast } = useToast();

  const sizeOptions: string[] =
    (product as any).variantAttributes?.find((a: any) => String(a.name).toLowerCase() === 'size')?.options?.map((o: any) => o.value) || [];

  const colorOptions: Array<{ value: string; colorCode?: string }> =
    (product as any).variantAttributes?.find((a: any) => String(a.name).toLowerCase() === 'color')?.options?.map((o: any) => ({ value: o.value, colorCode: o.colorCode })) || [];

  const soldOutSizes = new Set<string>();
  for (const sku of ((product as any).variantSKUs || []) as any[]) {
    const attrs = sku.attributes instanceof Map ? Object.fromEntries(sku.attributes) : sku.attributes || {};
    const sz = attrs.Size || attrs.size;
    if (sz && (sku.stock || 0) <= 0 && sku.isEnabled !== false) soldOutSizes.add(String(sz).toUpperCase());
  }

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

  const imageUrl = mainImage.includes('/uploads/') ? `/api/images${mainImage}` : mainImage;
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
    if (isStaff) {
      trackEvent('staff_commerce_blocked', { surface: 'add_to_cart', productId: product._id });
      toast({ title: 'Customer account required', description: 'Staff accounts cannot shop.' });
      return;
    }
    if (requiresAuth()) {
      setPendingSize(size);
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
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 120 }}
      className="group relative overflow-hidden"
    >
      <Card className={cn('relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_25px_50px_-15px_rgba(0,0,0,0.15)] hover:-translate-y-3 border border-line/70 rounded-[30px] bg-white dark:bg-card p-4 flex flex-col justify-between', className)}>
        <div>
          <div
            className="relative aspect-[3/4] w-full overflow-hidden bg-[#e8e5dc] dark:bg-slate-900 shadow-inner transition-all duration-500"
            style={{ clipPath: 'polygon(36px 0%, 100% 0%, 100% calc(100% - 36px), calc(100% - 36px) 100%, 0% 100%, 0% 36px)' }}
          >
            <Link href={`/products/${product._id}`} aria-label={product.name} className="absolute inset-0 z-0">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                loading="lazy"
                priority={false}
                className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] group-hover:shadow-lg"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </Link>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {discountPercent > 0 && (
              <div className="pointer-events-none absolute left-10 top-3.5 z-10 rounded-full bg-white/95 dark:bg-black/90 px-2.5 py-1 text-[11px] font-extrabold text-ink dark:text-white shadow-sm backdrop-blur-md">
                -{discountPercent}%
              </div>
            )}

            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex gap-1 flex-wrap">
              {isNew && <Badge className={cn('font-extrabold text-[10px] px-2 py-0.5 rounded-full', badgeStyle.new)}>New</Badge>}
              {isSale && <Badge className={cn('font-extrabold text-[10px] px-2 py-0.5 rounded-full', badgeStyle.sale)}>Sale</Badge>}
              {adminBadges.map((b) => (
                <Badge key={b} className={cn('font-extrabold text-[10px] px-2 py-0.5 rounded-full capitalize', badgeStyle[b])}>{b}</Badge>
              ))}
            </div>

            {isOutOfStock && (
              <Badge variant="destructive" className="pointer-events-none absolute top-3.5 right-3.5 z-10 text-[10px] rounded-full">
                Out of Stock
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="outline" className="pointer-events-none absolute top-3.5 right-3.5 z-10 bg-amber-100 text-amber-900 border-amber-300 text-[10px] rounded-full">
                Low Stock
              </Badge>
            )}

            <div
              className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 opacity-80 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
              onClick={(e) => e.stopPropagation()}
            >
              <WishlistButton productId={product._id} />
              <button
                onClick={toggleCompare}
                className={cn(
                  'p-2 rounded-full backdrop-blur-md transition-all border shadow-sm',
                  isCompared ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/85 dark:bg-slate-900/85 text-slate-700 dark:text-slate-300 hover:text-amber-500 border-white/30'
                )}
                title={isCompared ? 'Remove from compare' : 'Add to compare'}
              >
                {isCompared ? <Check className="w-3.5 h-3.5 font-bold" /> : <Scale className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <CardContent className="p-3 pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                {typeof product.category === 'object' ? product.category?.name : 'Mentoos'}
              </span>
              {(product.averageRating || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{(product.averageRating || 0).toFixed(1)}</span>
                </div>
              )}
            </div>

            <Link href={`/products/${product._id}`}>
              <h2 className="font-bold text-xs sm:text-sm text-ink dark:text-slate-100 line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                {product.name}
              </h2>
            </Link>

            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-sm sm:text-base font-extrabold text-ink dark:text-slate-100">
                {formatPrice(product.price)}
              </span>
              {mrp > product.price && (
                <span className="text-xs text-ink-muted line-through">
                  {formatPrice(mrp)}
                </span>
              )}
            </div>

            {colorOptions.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {colorOptions.slice(0, 6).map((c) => (
                  <span
                    key={c.value}
                    title={c.value}
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs"
                    style={{ backgroundColor: c.colorCode || '#cbd5e1' }}
                  />
                ))}
                {colorOptions.length > 6 && (
                  <span className="text-[10px] text-muted-foreground font-bold">+{colorOptions.length - 6}</span>
                )}
              </div>
            )}

            {sizeOptions.length > 0 && (
              <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                <span className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider">Sizes:</span>
                {sizeOptions.map((s) => {
                  const soldOut = soldOutSizes.has(s.toUpperCase());
                  return (
                    <span
                      key={s}
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded border',
                        soldOut ? 'line-through text-slate-400 border-slate-200 dark:border-slate-800' : 'border-slate-300 dark:border-slate-700'
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
                        soldOut ? 'line-through text-slate-400 border-slate-200 dark:border-slate-800' : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-500/10'
                      )}
                    >
                      {quickAdding === s ? '…' : s}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <button onClick={() => setSizePickerOpen(false)} className="text-[10px] text-muted-foreground hover:underline">Cancel</button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSizeGuideOpen(true); }}
                  className="text-[10px] font-bold text-amber-700 hover:underline"
                >
                  Size guide
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 w-full pt-1">
              {sizeOptions.length > 0 ? (
                <Button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSizePickerOpen(true); }}
                  className="flex-1 bg-ink hover:bg-[#c6f03d] hover:text-slate-950 text-white font-extrabold text-xs rounded-xl transition-all duration-300 shadow-sm active:scale-95"
                  disabled={isOutOfStock || isStaff}
                  title={isStaff ? 'Customer account required' : undefined}
                >
                  {isStaff ? <Lock className="mr-1.5 h-3.5 w-3.5" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
                  {isStaff ? 'Staff account' : 'Quick Add'}
                </Button>
              ) : (
                <AddToCartButton
                  productId={product._id}
                  className="flex-1 bg-ink hover:bg-[#c6f03d] hover:text-slate-950 text-white font-extrabold text-xs rounded-xl transition-all duration-300 shadow-sm active:scale-95"
                  disabled={isOutOfStock}
                />
              )}
              {showQuickView && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={openQuickView}
                  className="rounded-xl border-line bg-sand/60 hover:bg-white text-ink transition-colors"
                  aria-label="Quick view"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};