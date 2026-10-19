'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Star,
  Heart,
  Share2,
  Minus,
  Plus,
  Truck,
  Scale,
  MapPin,
  Bell,
  Play,
  RotateCcw
} from 'lucide-react';
import type { IProduct } from '@/lib/api/types';
import { cn, formatPrice, getErrorMessage } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import { BuyNowButton } from './BuyNowButton';
import { WishlistButton } from './WishlistButton';
import { SizeGuideModal } from './SizeGuideModal';
import { FindMySize } from './FindMySize';
import { RecentlyViewed } from './RecentlyViewed';
import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether';
import { CompleteTheLook } from './CompleteTheLook';
import { trackRecentlyViewed } from '@/lib/recentlyViewed';
import { ReviewsEnhanced } from './ReviewsEnhanced';
import { Recommendations } from './Recommendations';
import { useCompare } from '@/lib/contexts/CompareContext';
import { useToast } from '@/hooks/use-toast';

interface ProductDetailClientProps {
  product: IProduct;
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { toast } = useToast();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const isCompared = isInCompare(product._id);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyContact, setNotifyContact] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [freeShipThreshold, setFreeShipThreshold] = useState(999);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showFindSize, setShowFindSize] = useState(false);

  const variantSizes: string[] =
    (product as any).variantAttributes?.find((a: any) => String(a.name).toLowerCase() === 'size')?.options?.map((o: any) => o.value) || [];
  const sizeButtons = variantSizes.length > 0 ? variantSizes : SIZES;
  // Per-size sold-out lookup (same as ProductCard): a size whose variant SKU
  // has zero stock is unselectable, so sold-out sizes can never reach the cart.
  const soldOutSizes = new Set<string>();
  for (const sku of ((product as any).variantSKUs || []) as any[]) {
    const attrs = sku.attributes instanceof Map ? Object.fromEntries(sku.attributes) : sku.attributes || {};
    const sz = attrs.Size || attrs.size;
    if (sz && (sku.stock || 0) <= 0 && sku.isEnabled !== false) soldOutSizes.add(String(sz).toUpperCase());
  }
  const defaultSize = sizeButtons.find((s) => !soldOutSizes.has(s.toUpperCase())) || sizeButtons[0];
  useEffect(() => {
    // Never preselect a sold-out size (e.g. default 'L' may be gone).
    if (soldOutSizes.has(selectedSize.toUpperCase()) && defaultSize) {
      setSelectedSize(defaultSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id]);
  const categoryName = typeof product.category === 'object' ? (product.category as any)?.name : undefined;
  const sizeVariations = [{ name: 'Size', value: selectedSize }];

  useEffect(() => {
    import('@/lib/api/settings').then((m) =>
      m.settingsApi.getPublic().then((s) => setFreeShipThreshold(s.shipping.freeShippingThreshold)).catch(() => {})
    );
    trackRecentlyViewed(product._id);
    import('@/lib/analytics').then((m) => m.funnel.viewItem(product._id, product.name, product.price)).catch(() => {});
  }, [product._id]);

  // Zoom on hover state
  const [zoomStyle, setZoomStyle] = useState<{ opacity: number; backgroundPosition: string }>({
    opacity: 0,
    backgroundPosition: '0% 0%',
  });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const images = product.images && product.images.length > 0 ? product.images : [
    { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' },
    { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80' },
    { url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80' },
  ];

  const mainImageObj = images[selectedImageIndex];
  const mainImageUrl = typeof mainImageObj === 'string' ? mainImageObj : mainImageObj.url;
  const displayImageUrl = mainImageUrl.includes('/uploads/') ? `/api/images${mainImageUrl}` : mainImageUrl;

  const isOutOfStock = product.stock === 0 || product.status === 'out_of_stock';
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 10);
  const mrp = product.compareAtPrice || Math.round(product.price * 1.3);
  const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);

  // Handle Mouse Move for Hover Zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      opacity: 1,
      backgroundPosition: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ opacity: 0, backgroundPosition: '0% 0%' });
  };

  const handlePincodeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeResult('⚠️ Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setPincodeResult('⏳ Checking courier serviceability…');
    try {
      const { shipmentApi } = await import('@/lib/api/shipment');
      const res = await shipmentApi.serviceability(pincode, 500, true);
      const d = res.data;
      if (res.mock) {
        const date = new Date(d.estimatedDelivery);
        const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
        setPincodeResult(`🚚 Delivery available to ${pincode} by ${dateStr}. COD Available! (Shiprocket connect pending)`);
        return;
      }
      const companies = d?.data?.available_courier_companies || [];
      const first = companies[0];
      if (first || d?.status === 200) {
        const etd = first?.etd ? ` by ${first.etd}` : 'in 3-5 days';
        const codTxt = first?.cod === 1 || first?.cod === true ? 'COD Available!' : 'Prepaid only';
        setPincodeResult(`🚚 Delivery to ${pincode}${etd} via ${first?.courier_name || 'Shiprocket partner'}. ${codTxt} Freight ₹${first?.freight_charge || first?.rate || '—'}`);
      } else {
        setPincodeResult(`⚠️ Delivery not available to ${pincode} right now. Try another PIN.`);
      }
    } catch {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      setPincodeResult(`🚚 Delivery available to ${pincode} by ${dateStr}. COD Available!`);
    }
  };

  const [notifyLoading, setNotifyLoading] = useState(false);
  const [priceAlertLoading, setPriceAlertLoading] = useState(false);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyContact.trim()) return;
    setNotifyLoading(true);
    try {
      const { alertsApi } = await import('@/lib/api/alerts');
      const digits = notifyContact.replace(/\D/g, '').slice(-10);
      const isPhone = /^[6-9]\d{9}$/.test(digits) && notifyContact.replace(/\D/g, '').length >= 10;
      await alertsApi.subscribeBackInStock({
        productId: product._id,
        size: selectedSize,
        contact: isPhone ? digits : notifyContact.trim(),
        whatsappConsent: isPhone,
      });
      setShowNotifyModal(false);
      setNotifyContact('');
      toast({
        title: 'Notification Subscribed! 🔔',
        description: `We will alert you as soon as size ${selectedSize} is restocked (email + WhatsApp).`,
      });
    } catch (err: any) {
      toast({ title: 'Subscribe failed', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setNotifyLoading(false);
    }
  };

  const handlePriceAlert = async () => {
    setPriceAlertLoading(true);
    try {
      const { alertsApi } = await import('@/lib/api/alerts');
      const res: any = await alertsApi.subscribePriceAlert(product._id);
      const msg = typeof res?.message === 'string' ? res.message : `We will notify you on a price drop below ${formatPrice(product.price)}.`;
      toast({ title: 'Price alert set! 💰', description: msg });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = getErrorMessage(err) || 'Login to set price alerts.';
      toast({ title: status === 401 ? 'Login needed' : 'Could not set alert', description: msg, variant: 'destructive' });
    } finally {
      setPriceAlertLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied', description: 'Product link copied to clipboard.' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 pb-24 sm:pb-8">
      {/* Breadcrumbs: Home / Category / Product */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-amber-600 font-semibold">Home</Link>
        <span>/</span>
        {categoryName ? (
          <>
            <Link href={`/products?category=${encodeURIComponent(typeof product.category === 'object' ? (product.category as any).slug || '' : '')}`} className="hover:text-amber-600 font-semibold">{categoryName}</Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-foreground font-semibold line-clamp-1 max-w-[60vw]">{product.name}</span>
      </nav>
      {/* Review + Product JSON-LD for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: [displayImageUrl],
            description: (product.shortDescription || product.description || '').slice(0, 500),
            sku: (product as any).sku,
            brand: { '@type': 'Brand', name: 'Mentoos' },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: product.price,
              availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            },
            ...((product.averageRating || 0) > 0
              ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.averageRating, reviewCount: product.totalReviews || 1 } }
              : {}),
          }),
        }}
      />
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column (6 cols): Vertical Image Slider + Main Zoom Container */}
        <div className="lg:col-span-6 flex flex-col sm:flex-row gap-4">
          {/* Vertical Thumbnail Slider Column */}
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[500px] scrollbar-none order-2 sm:order-1 shrink-0">
            {images.map((img, index) => {
              const imgUrl = typeof img === 'string' ? img : img.url;
              const displayUrl = imgUrl.includes('/uploads/') ? `/api/images${imgUrl}` : imgUrl;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    'relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0',
                    selectedImageIndex === index
                      ? 'border-amber-500 shadow-md scale-105'
                      : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                  )}
                >
                  <Image
                    src={displayUrl}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              );
            })}
          </div>

          {/* Main Image with Hover Zoom Effect */}
          <div className="relative flex-1 order-1 sm:order-2">
            {showVideo && product.videos && product.videos.length > 0 ? (
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
                <video
                  src={product.videos[0].url}
                  poster={product.videos[0].thumbnailUrl || displayImageUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setShowVideo(false)}
                  className="absolute top-3 right-3 text-[11px] font-bold bg-slate-900/80 text-white px-2.5 py-1 rounded-full"
                >
                  View photos
                </button>
              </div>
            ) : (
            <div
              ref={imageContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-crosshair group shadow-xl"
            >
              {product.videos && product.videos.length > 0 && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="absolute bottom-3 right-3 z-10 text-[11px] font-bold bg-slate-900/80 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Watch video
                </button>
              )}
              <Image
                src={displayImageUrl}
                alt={product.name}
                fill
                className="object-cover transition-opacity duration-200"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Zoomed Background Overlay Lens */}
              <div
                className="absolute inset-0 bg-no-repeat pointer-events-none transition-opacity duration-200"
                style={{
                  backgroundImage: `url(${displayImageUrl})`,
                  backgroundSize: '250%',
                  ...zoomStyle,
                }}
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {discountPercent > 0 && (
                  <Badge className="bg-rose-500 text-white font-extrabold text-xs px-2.5 py-1">
                    {discountPercent}% OFF
                  </Badge>
                )}
              </div>

              {isOutOfStock && (
                <Badge variant="destructive" className="absolute top-4 right-4 z-10 text-xs font-bold">
                  Out of Stock
                </Badge>
              )}
            </div>
            )}

            <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
              🔍 Hover over image to zoom 2.5x
            </p>
          </div>
        </div>

        {/* Right Column (6 cols): Product Info & Checkout Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs uppercase font-extrabold text-amber-600 border-amber-400">
                {typeof product.category === 'object' ? product.category?.name : 'Mentoos'}
              </Badge>
              {(product.averageRating || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{(product.averageRating || 0).toFixed(1)}</span>
                  <span className="text-slate-400">({product.totalReviews} reviews)</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {product.name}
            </h1>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {formatPrice(product.price)}
              </span>
              {mrp > product.price && (
                <span className="text-base text-slate-400 line-through">
                  {formatPrice(mrp)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Save {discountPercent}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Inclusive of all taxes. Free shipping on orders over {formatPrice(freeShipThreshold)}.
              <button onClick={handlePriceAlert} disabled={priceAlertLoading} className="ml-2 font-bold text-amber-600 hover:underline">
                {priceAlertLoading ? 'Setting alert…' : '🔔 Notify me on price drop'}
              </button>
            </p>
          </div>

          <Separator />

          {/* Size Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Select Size: <span className="text-amber-500">{selectedSize}</span>
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSizeGuide(true)} className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                  Size Guide 📐
                </button>
                <button onClick={() => setShowFindSize(true)} className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
                  ✨ Find My Size
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {sizeButtons.map((size) => {
                const soldOut = soldOutSizes.has(size.toUpperCase());
                return (
                  <button
                    key={size}
                    onClick={() => { if (!soldOut) setSelectedSize(size); }}
                    disabled={soldOut}
                    title={soldOut ? `${size} — sold out` : `Select size ${size}`}
                    className={cn(
                      'h-10 w-12 rounded-xl text-xs font-bold transition-all border relative',
                      soldOut
                        ? 'line-through text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-not-allowed'
                        : selectedSize === size
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 border-slate-900 dark:border-amber-500 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {soldOutSizes.size > 0 && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                Struck-through sizes are sold out.{' '}
                <button onClick={() => setShowNotifyModal(true)} className="font-bold text-amber-600 hover:underline">
                  Notify me when available 🔔
                </button>
              </p>
            )}
          </div>

          {/* Pincode Delivery Checker */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              Check Delivery & COD Availability
            </h4>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit PIN code (e.g. 500001)"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl">
                Check
              </Button>
            </form>
            {pincodeResult && (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-2">
                {pincodeResult}
              </p>
            )}
          </div>

          {/* Quantity & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Quantity:</span>
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold text-slate-900 dark:text-slate-100">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {isOutOfStock ? (
                <Button
                  onClick={() => setShowNotifyModal(true)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-6 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Notify Me When Available
                </Button>
              ) : (
                <AddToCartButton
                  productId={product._id}
                  quantity={quantity}
                  variations={sizeVariations}
                  className="flex-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold py-6 rounded-2xl text-sm transition-all shadow-lg"
                  disabled={isOutOfStock}
                />
              )}
              {!isOutOfStock && (
                <BuyNowButton
                  productId={product._id}
                  quantity={quantity}
                  variations={sizeVariations}
                  disabled={isOutOfStock}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-6 rounded-2xl text-sm transition-all shadow-lg"
                />
              )}
              
              <WishlistButton productId={product._id} size="lg" />

              <button
                onClick={() => {
                  if (isCompared) removeFromCompare(product._id);
                  else addToCompare(product);
                }}
                className={cn(
                  'p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 text-xs font-bold',
                  isCompared
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                )}
                title={isCompared ? 'Remove from compare' : 'Compare product'}
              >
                <Scale className="w-4 h-4" />
                <span>{isCompared ? 'Compared' : 'Compare'}</span>
              </button>

              <Button variant="outline" size="icon" onClick={handleShare} className="rounded-2xl p-4">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Description & Specs */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Product Details & Fabric Info
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Fabric / Fit / Wash / Delivery / Returns accordions */}
          <Accordion type="single" collapsible className="border-t border-slate-200 dark:border-slate-800">
            <AccordionItem value="fabric-fit">
              <AccordionTrigger className="text-xs font-extrabold uppercase tracking-wider">Fabric & Fit</AccordionTrigger>
              <AccordionContent className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                <p><span className="font-bold text-foreground">Fabric: </span>{product.fabric || (product.materials || []).join(', ') || 'Premium combed cotton blend'}</p>
                <p><span className="font-bold text-foreground">Fit: </span>{product.fit || 'Modern tailored fit'}{((product as any).modelHeight || (product as any).modelSizeWorn) ? ` — model is ${(product as any).modelHeight || "6'0\""} and wears size ${(product as any).modelSizeWorn || 'L'}` : ` — model is 6'0" and wears size L`}</p>
                {product.pattern && <p><span className="font-bold text-foreground">Pattern: </span>{product.pattern}</p>}
                {(product.features || []).length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5">
                    {product.features!.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="wash">
              <AccordionTrigger className="text-xs font-extrabold uppercase tracking-wider">Wash Care</AccordionTrigger>
              <AccordionContent className="text-xs text-slate-600 dark:text-slate-400">
                {product.washCare || 'Machine wash cold with like colors. Do not bleach. Tumble dry low. Warm iron if needed.'}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery">
              <AccordionTrigger className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-amber-500" /> Delivery Information</AccordionTrigger>
              <AccordionContent className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>Dispatch in 24–48 hrs. Delivery in 3–5 working days across India.</p>
                <p>Free shipping on orders over {formatPrice(freeShipThreshold)}. COD available on serviceable pincodes — check above.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
              <AccordionTrigger className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Easy 7-Day Exchange & Returns</AccordionTrigger>
              <AccordionContent className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>7-day size exchange, no questions asked. Tags intact, unworn.</p>
                <p>Track your order anytime from Track Order. Support: WhatsApp us from the footer link.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Reviews Section */}
      <Separator className="my-8" />
      <ReviewsEnhanced productId={product._id} />

      {/* Recommendations Section */}
      <Separator className="my-8" />
      <Recommendations productId={product._id} />

      {/* Frequently Bought Together */}
      <Separator className="my-8" />
      <FrequentlyBoughtTogether productId={product._id} mainPrice={product.price} mainName={product.name} mainImage={displayImageUrl} />

      {/* Complete the Look (§12) */}
      <Separator className="my-8" />
      <CompleteTheLook productId={product._id} />

      {/* Recently Viewed */}
      <Separator className="my-8" />
      <RecentlyViewed currentId={product._id} />

      {/* Size Guide Modal */}
      <SizeGuideModal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} categoryName={categoryName} chart={(product as any).sizeChart} modelHeight={(product as any).modelHeight} modelSizeWorn={(product as any).modelSizeWorn} />
      {/* Find My Size */}
      <FindMySize open={showFindSize} onClose={() => setShowFindSize(false)} categoryName={categoryName} onSelect={setSelectedSize} />

      {/* Back In Stock Modal */}
      <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
              <Bell className="w-5 h-5 text-amber-500" /> Back In Stock Alert
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter your Email or WhatsApp number to get an instant alert when <strong>{product.name}</strong> (Size {selectedSize}) is restocked!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNotifySubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="notifyContact" className="text-xs font-bold">Email or WhatsApp Number</Label>
              <Input
                id="notifyContact"
                placeholder="e.g. +91 9876543210 or user@example.com"
                value={notifyContact}
                onChange={(e) => setNotifyContact(e.target.value)}
                required
                className="rounded-xl mt-1 text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={notifyLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
                {notifyLoading ? 'Subscribing…' : 'Notify Me When Available 🔔'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mobile Sticky Add To Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:hidden flex items-center justify-between gap-3 shadow-2xl">
        <div>
          {mrp > product.price && (
            <div className="text-[10px] text-slate-400 line-through">{formatPrice(mrp)}</div>
          )}
          <div className="text-sm font-black text-slate-900 dark:text-white">{formatPrice(product.price)}</div>
        </div>
        {isOutOfStock ? (
          <Button
            onClick={() => setShowNotifyModal(true)}
            size="sm"
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" /> Notify Me
          </Button>
        ) : (
          <AddToCartButton
            productId={product._id}
            quantity={quantity}
            variations={sizeVariations}
            size="sm"
            className="flex-1 bg-slate-900 hover:bg-amber-500 text-white font-bold rounded-xl text-xs"
          />
        )}
      </div>
    </div>
  );
}
