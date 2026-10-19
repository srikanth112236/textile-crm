'use client';

import Image from 'next/image';
import { useCompare } from '@/lib/contexts/CompareContext';
import { X, Scale, Trash2, ShoppingBag, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from './AddToCartButton';

export function CompareDrawer() {
  const {
    comparedProducts,
    removeFromCompare,
    clearCompare,
    isCompareOpen,
    setIsCompareOpen,
  } = useCompare();

  if (comparedProducts.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-4 right-4 sm:right-8 z-40 bg-slate-900/95 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider">
              Product Compare
            </h4>
            <span className="text-[10px] text-slate-400">
              {comparedProducts.length} of 3 selected
            </span>
          </div>
        </div>

        {/* Thumbnails preview */}
        <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-3">
          {comparedProducts.map((prod) => {
            const firstImg = Array.isArray(prod.images) && prod.images.length > 0
              ? typeof prod.images[0] === 'string'
                ? prod.images[0]
                : prod.images[0]?.url
              : '/placeholder-product.jpg';
            const displayUrl = firstImg.includes('/uploads/') ? `/api/images${firstImg}` : firstImg;

            return (
              <div key={prod._id} className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 group">
                <Image src={displayUrl} alt={prod.name} fill className="object-cover" sizes="40px" />
                <button
                  onClick={() => removeFromCompare(prod._id)}
                  className="absolute inset-0 bg-slate-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-rose-400"
                  title="Remove from compare"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCompareOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl px-3"
          >
            Compare Now ({comparedProducts.length})
          </Button>
          <button
            onClick={clearCompare}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparison Modal Dialog */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div 
            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  PRODUCT COMPARISON MATRIX ({comparedProducts.length}/3)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearCompare}
                  className="text-xs text-rose-500 font-semibold hover:underline"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Side-by-Side Table Body */}
            <div className="overflow-auto p-4 sm:p-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {comparedProducts.map((product) => {
                  const firstImg = Array.isArray(product.images) && product.images.length > 0
                    ? typeof product.images[0] === 'string'
                      ? product.images[0]
                      : product.images[0]?.url
                    : '/placeholder-product.jpg';
                  const displayUrl = firstImg.includes('/uploads/') ? `/api/images${firstImg}` : firstImg;
                  const mrp = product.compareAtPrice || Math.round(product.price * 1.3);
                  const discount = Math.round(((mrp - product.price) / mrp) * 100);

                  return (
                    <div
                      key={product._id}
                      className="flex flex-col justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 relative space-y-4"
                    >
                      <button
                        onClick={() => removeFromCompare(product._id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-rose-500 transition-colors z-10"
                        title="Remove product"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Image & Title */}
                      <div className="space-y-3 text-center">
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <Image
                            src={displayUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="300px"
                          />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-400">
                          {typeof product.category === 'object' ? product.category?.name : 'Mentoos'}
                        </Badge>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 line-clamp-2">
                          {product.name}
                        </h4>
                      </div>

                      {/* Price Specs */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                            ₹{product.price}
                          </span>
                          {mrp > product.price && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{mrp}
                            </span>
                          )}
                          {discount > 0 && (
                            <Badge className="bg-rose-500 text-white text-[10px] font-bold">
                              {discount}% OFF
                            </Badge>
                          )}
                        </div>

                        {(product.averageRating || 0) > 0 && (
                          <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{(product.averageRating || 0).toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400">({product.totalReviews})</span>
                          </div>
                        )}
                      </div>

                      {/* Features Matrix */}
                      <div className="space-y-2 text-xs divide-y divide-slate-200 dark:divide-slate-800">
                        <div className="pt-2 flex justify-between">
                          <span className="text-slate-400">Availability:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                          </span>
                        </div>
                        <div className="pt-2 flex justify-between">
                          <span className="text-slate-400">SKU:</span>
                          <span className="font-mono font-semibold">{product.sku}</span>
                        </div>
                        <div className="pt-2 flex justify-between">
                          <span className="text-slate-400">Fabric:</span>
                          <span className="font-semibold">100% Combed Cotton</span>
                        </div>
                        <div className="pt-2 flex justify-between">
                          <span className="text-slate-400">Fit Type:</span>
                          <span className="font-semibold">Oversized / Regular</span>
                        </div>
                      </div>

                      {/* Add to Cart CTA */}
                      <AddToCartButton
                        productId={product._id}
                        quantity={1}
                        size="sm"
                        disabled={product.stock === 0}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
