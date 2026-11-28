'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';

interface StyleItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  category: string;
  image: string;
  link: string;
}

const CATEGORIES = [
  'Streetwear',
  'Formal Wear',
  'Casual Classics',
  'Sports & Active',
  'Festive Ethnic',
  'T-Shirts',
  'Bottoms',
];

const ITEMS_BY_CATEGORY: Record<string, StyleItem[]> = {
  'Streetwear': [
    {
      id: 'street-1',
      name: 'Men Casual Utility Jacket',
      price: 1899,
      originalPrice: 2499,
      discount: '-24%',
      category: 'Streetwear',
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=jacket',
    },
    {
      id: 'street-2',
      name: 'Heavyweight Boxy Oversized Tee',
      price: 899,
      originalPrice: 1299,
      discount: '-30%',
      category: 'Streetwear',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=oversized',
    },
    {
      id: 'street-3',
      name: 'Multi-Pocket Cargo Joggers',
      price: 1299,
      originalPrice: 1799,
      discount: '-28%',
      category: 'Streetwear',
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=joggers',
    },
    {
      id: 'street-4',
      name: 'Distressed Wash Denim Jacket',
      price: 2199,
      originalPrice: 3299,
      discount: '-33%',
      category: 'Streetwear',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=denim',
    },
    {
      id: 'street-5',
      name: 'Acid Wash Drop-Shoulder Hoodie',
      price: 1699,
      originalPrice: 2299,
      discount: '-26%',
      category: 'Streetwear',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=hoodie',
    },
  ],
  'Formal Wear': [
    {
      id: 'formal-1',
      name: 'Pleated Tailored Wool Trousers',
      price: 1599,
      originalPrice: 2199,
      discount: '-27%',
      category: 'Formal Wear',
      image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=trousers',
    },
    {
      id: 'formal-2',
      name: 'Crisp Oxford Spread-Collar Shirt',
      price: 1199,
      originalPrice: 1599,
      discount: '-25%',
      category: 'Formal Wear',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=shirts',
    },
    {
      id: 'formal-3',
      name: 'Structured Charcoal Blazer',
      price: 3499,
      originalPrice: 4999,
      discount: '-30%',
      category: 'Formal Wear',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=blazer',
    },
    {
      id: 'formal-4',
      name: 'Italian Fit Linen Trousers',
      price: 1499,
      originalPrice: 1999,
      discount: '-25%',
      category: 'Formal Wear',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=trousers',
    },
  ],
  'Casual Classics': [
    {
      id: 'casual-1',
      name: 'Breezy Cuban Collar Linen Shirt',
      price: 1399,
      originalPrice: 1899,
      discount: '-26%',
      category: 'Casual Classics',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=linen',
    },
    {
      id: 'casual-2',
      name: 'Textured Waffle Knit Polo',
      price: 999,
      originalPrice: 1399,
      discount: '-28%',
      category: 'Casual Classics',
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=polo',
    },
    {
      id: 'casual-3',
      name: 'Relaxed Fit Chino Trousers',
      price: 1299,
      originalPrice: 1699,
      discount: '-23%',
      category: 'Casual Classics',
      image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=chinos',
    },
    {
      id: 'casual-4',
      name: 'Vintage Wash Crewneck Sweatshirt',
      price: 1499,
      originalPrice: 1999,
      discount: '-25%',
      category: 'Casual Classics',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80',
      link: '/products?search=sweatshirt',
    },
  ],
  'Sports & Active': [
    {
      id: 'active-1',
      name: 'Pro-Dry Performance Athletic Tee',
      price: 699,
      originalPrice: 999,
      discount: '-30%',
      category: 'Sports & Active',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=activewear',
    },
    {
      id: 'active-2',
      name: '4-Way Stretch Training Joggers',
      price: 1199,
      originalPrice: 1699,
      discount: '-29%',
      category: 'Sports & Active',
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=activewear',
    },
    {
      id: 'active-3',
      name: 'Lightweight Breathable Windbreaker',
      price: 1899,
      originalPrice: 2599,
      discount: '-27%',
      category: 'Sports & Active',
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=activewear',
    },
  ],
  'Festive Ethnic': [
    {
      id: 'ethnic-1',
      name: 'Textured Slub Short Kurta - Ivory',
      price: 1299,
      originalPrice: 1799,
      discount: '-28%',
      category: 'Festive Ethnic',
      image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=ethnic-wear',
    },
    {
      id: 'ethnic-2',
      name: 'Embroidered Silk Blend Kurta Set',
      price: 2499,
      originalPrice: 3499,
      discount: '-28%',
      category: 'Festive Ethnic',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=ethnic-wear',
    },
    {
      id: 'ethnic-3',
      name: 'Jacquard Woven Nehru Jacket',
      price: 1899,
      originalPrice: 2699,
      discount: '-30%',
      category: 'Festive Ethnic',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=ethnic-wear',
    },
  ],
  'T-Shirts': [
    {
      id: 'tee-1',
      name: 'Acid Wash 240 GSM Oversized Tee',
      price: 899,
      originalPrice: 1299,
      discount: '-30%',
      category: 'T-Shirts',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=t-shirts',
    },
    {
      id: 'tee-2',
      name: 'Minimalist Typography Oversized Tee',
      price: 799,
      originalPrice: 1199,
      discount: '-33%',
      category: 'T-Shirts',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=t-shirts',
    },
    {
      id: 'tee-3',
      name: 'Supima Cotton Classic Crewneck',
      price: 699,
      originalPrice: 999,
      discount: '-30%',
      category: 'T-Shirts',
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=t-shirts',
    },
  ],
  'Bottoms': [
    {
      id: 'bot-1',
      name: 'Pleated Relaxed Cotton Trousers',
      price: 1399,
      originalPrice: 1899,
      discount: '-26%',
      category: 'Bottoms',
      image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=trousers',
    },
    {
      id: 'bot-2',
      name: '6-Pocket Heavy Drill Cargo Pants',
      price: 1499,
      originalPrice: 2099,
      discount: '-28%',
      category: 'Bottoms',
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=joggers',
    },
    {
      id: 'bot-3',
      name: 'Everyday Relaxed Linen Drawstring Pants',
      price: 1299,
      originalPrice: 1799,
      discount: '-28%',
      category: 'Bottoms',
      image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80',
      link: '/products?category=trousers',
    },
  ],
};

export function FindYourStyle() {
  const [activeCategory, setActiveCategory] = useState<string>('Streetwear');
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isStaff } = useAuth();
  const { toast } = useToast();

  const currentItems = ITEMS_BY_CATEGORY[activeCategory] || ITEMS_BY_CATEGORY['Streetwear'];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent, item: StyleItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (isStaff) {
      toast({
        title: 'Customer account required',
        description: 'Staff accounts cannot add to bag.',
      });
      return;
    }

    setAddedItem(item.id);
    toast({
      title: 'Added to cart',
      description: `${item.name} is ready in your bag.`,
    });
    setTimeout(() => setAddedItem(null), 2000);
  };

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 sm:p-10 shadow-sm backdrop-blur-md">
      {/* Background Soft Glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-96 w-96 rounded-full bg-lime-400/10 blur-3xl" />

      {/* Header Block matching Reference Image */}
      <div className="relative z-10 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-2xl font-extrabold tracking-[-0.035em] text-ink sm:text-3xl lg:text-4xl">
            Find Your Style
          </h2>
        </div>
        <p className="max-w-md text-xs sm:text-sm leading-relaxed text-ink-muted">
          Shop by category and discover looks that suit your mood, fit any occasion, and elevate your daily routine.
        </p>
      </div>

      {/* Interactive Category Filter Pills */}
      <div className="relative z-10 mt-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold transition-all duration-300 ${
                isActive
                  ? 'bg-[#c6f03d] text-slate-950 shadow-md scale-105 font-extrabold'
                  : 'border border-line bg-sand/60 text-ink hover:bg-sand hover:text-ink'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Product Cards Row with Chamfered Corners & Smooth Elevation */}
      <div
        ref={scrollRef}
        className="relative z-10 mt-8 flex gap-5 overflow-x-auto pb-6 pt-2 no-scrollbar scroll-smooth"
      >
        {currentItems.map((item, idx) => {
          const isAdded = addedItem === item.id;
          return (
            <Link
              key={item.id}
              href={item.link}
              className="group relative flex w-[260px] sm:w-[285px] shrink-0 flex-col rounded-[28px] border border-line/60 bg-white dark:bg-card p-3 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              {/* Image Frame with Exact Diagonal Chamfered Corners */}
              <div
                className="relative aspect-[3/4] w-full overflow-hidden bg-[#e8e5dc] dark:bg-slate-900 transition-all duration-500 shadow-inner"
                style={{
                  clipPath: 'polygon(36px 0%, 100% 0%, 100% calc(100% - 36px), calc(100% - 36px) 100%, 0% 100%, 0% 36px)',
                }}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="285px"
                  className="object-cover object-[50%_20%] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                />

                {/* Floating Discount Tag placed cleanly inside */}
                <div className="absolute left-11 top-3.5 rounded-full bg-white/95 dark:bg-black/90 px-2.5 py-1 text-[11px] font-extrabold text-ink dark:text-white shadow-sm backdrop-blur-md">
                  {item.discount}
                </div>

                {/* Soft ambient hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>

              {/* Bottom Info Bar */}
              <div className="mt-3.5 flex items-center justify-between gap-2 px-1">
                <div className="min-w-0">
                  <h3 className="truncate text-xs sm:text-sm font-bold text-ink dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {item.name}
                  </h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-ink dark:text-white">₹{item.price}</span>
                    <span className="text-xs text-ink-muted line-through">₹{item.originalPrice}</span>
                  </div>
                </div>

                {/* Circular Shopping Bag Action Button */}
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, item)}
                  aria-label={`Add ${item.name} to bag`}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-sm ${
                    idx === 0 || isAdded
                      ? 'bg-[#c6f03d] text-slate-950 scale-105 shadow-md shadow-lime-300/40'
                      : 'bg-sand text-ink hover:bg-[#c6f03d] hover:text-slate-950 hover:scale-110 hover:shadow-md'
                  }`}
                >
                  {isAdded ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Slider & Previous/Next Navigation Controls */}
      <div className="relative z-10 mt-4 flex items-center justify-center gap-6 pt-2">
        <button
          type="button"
          onClick={() => scroll('left')}
          className="flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        {/* Minimalist Slider Bar */}
        <div className="flex h-1 w-28 items-center rounded-full bg-line overflow-hidden">
          <div className="h-full w-10 rounded-full bg-ink animate-pulse" />
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          className="flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-ink transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
