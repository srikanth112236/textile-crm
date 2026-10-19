'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types/roles';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  User, 
  UserCircle, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  ChevronDown,
  ArrowRight,
  Flame
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { TopAnnouncementBar } from '@/components/store/TopAnnouncementBar';
import { SmartSearchModal } from '@/components/search/SmartSearchModal';

interface MegaMenuData {
  title: string;
  subcategories: { name: string; href: string }[];
  featuredImage: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredLink: string;
}

const MEGA_MENU_DATA: Record<string, MegaMenuData> = {
  't-shirts': {
    title: 'T-Shirts & Tops',
    subcategories: [
      { name: 'Heavyweight Oversized Tees', href: '/products?category=t-shirts&search=oversized' },
      { name: 'Classic Crew Neck', href: '/products?category=t-shirts&search=crew' },
      { name: 'Polo T-Shirts', href: '/products?category=t-shirts&search=polo' },
      { name: 'Graphic & Printed Tees', href: '/products?category=t-shirts&search=graphic' },
      { name: 'Solid Basics', href: '/products?category=t-shirts&search=solid' },
    ],
    featuredImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    featuredTitle: 'OVERSIZED TEES 2026',
    featuredSubtitle: 'Heavyweight 240 GSM Combed Cotton',
    featuredLink: '/products?category=t-shirts',
  },
  'shirts': {
    title: 'Shirts',
    subcategories: [
      { name: 'Pure Linen Shirts', href: '/products?category=shirts&search=linen' },
      { name: 'Casual Printed Shirts', href: '/products?category=shirts&search=printed' },
      { name: 'Formal Dress Shirts', href: '/products?category=shirts&search=formal' },
      { name: 'Mandarin Collar Shirts', href: '/products?category=shirts&search=mandarin' },
      { name: 'Oversized Cuban Collar', href: '/products?category=shirts&search=cuban' },
    ],
    featuredImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    featuredTitle: 'LINEN & PRINTED SHIRTS',
    featuredSubtitle: 'Breathable Fabrics for All Seasons',
    featuredLink: '/products?category=shirts',
  },
  'trousers': {
    title: 'Trousers & Bottomwear',
    subcategories: [
      { name: 'Slim Fit Chinos', href: '/products?category=trousers&search=chinos' },
      { name: 'Formal Tailored Trousers', href: '/products?category=trousers&search=formal' },
      { name: 'Casual Cotton Pants', href: '/products?category=trousers&search=casual' },
      { name: 'Pleated Trousers', href: '/products?category=trousers&search=pleated' },
    ],
    featuredImage: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=600&q=80',
    featuredTitle: 'SMART TROUSERS',
    featuredSubtitle: 'Wrinkle-Resistant Tailored Cuts',
    featuredLink: '/products?category=trousers',
  },
  'joggers': {
    title: 'Joggers & Cargos',
    subcategories: [
      { name: 'Multi-Pocket Cargo Joggers', href: '/products?category=joggers&search=cargo' },
      { name: 'Relaxed Fit Sweatpants', href: '/products?category=joggers&search=sweatpants' },
      { name: 'Athletic Track Pants', href: '/products?category=joggers&search=track' },
      { name: 'Streetwear Tapered Joggers', href: '/products?category=joggers&search=tapered' },
    ],
    featuredImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
    featuredTitle: 'STREET CARGO JOGGERS',
    featuredSubtitle: 'Utility Pockets & Elastic Drawstrings',
    featuredLink: '/products?category=joggers',
  },
  'activewear': {
    title: 'Activewear & Gym',
    subcategories: [
      { name: 'Gym T-Shirts', href: '/products?category=activewear&search=gym' },
      { name: 'Gym Vests & Stringers', href: '/products?category=gym-vests' },
      { name: 'Training Shorts', href: '/products?category=shorts&search=training' },
      { name: 'Sweatshirts & Fleece', href: '/products?category=sweatshirts' },
    ],
    featuredImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    featuredTitle: 'GYM PERFORMANCE 2026',
    featuredSubtitle: 'Dry-Fit Tees & Muscle Vests',
    featuredLink: '/products?category=activewear',
  },
  'ethnic-wear': {
    title: 'Ethnic & Festive Wear',
    subcategories: [
      { name: 'Short Linen Kurtas', href: '/products?category=ethnic-wear&search=short' },
      { name: 'Kurta Pajama Sets', href: '/products?category=ethnic-wear&search=set' },
      { name: 'Designer Nehru Jackets', href: '/products?category=ethnic-wear&search=nehru' },
      { name: 'Woven Jacquard Waistcoats', href: '/products?category=ethnic-wear&search=waistcoat' },
    ],
    featuredImage: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
    featuredTitle: 'FESTIVE ETHNIC WEAR',
    featuredSubtitle: 'Handcrafted Designer Sets',
    featuredLink: '/products?category=ethnic-wear',
  },
};

const NAV_ITEMS = [
  { key: 'new-arrivals', name: 'New Arrivals', href: '/products?recent=true', isHot: true },
  { key: 't-shirts', name: 'T-Shirts', href: '/products?category=t-shirts', megaKey: 't-shirts' },
  { key: 'shirts', name: 'Shirts', href: '/products?category=shirts', megaKey: 'shirts' },
  { key: 'trousers', name: 'Trousers', href: '/products?category=trousers', megaKey: 'trousers' },
  { key: 'joggers', name: 'Joggers', href: '/products?category=joggers', megaKey: 'joggers' },
  { key: 'activewear', name: 'Activewear', href: '/products?category=activewear', megaKey: 'activewear' },
  { key: 'ethnic-wear', name: 'Ethnic Wear', href: '/products?category=ethnic-wear', megaKey: 'ethnic-wear' },
  { key: 'best-sellers', name: 'Best Sellers', href: '/products?sort=rating&order=desc', isHot: true },
  { key: 'sale', name: 'Sale', href: '/products?sort=price&order=asc', isSale: true },
];

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaKey, setActiveMegaKey] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(0);

  // Guest bag count for non-logged-in shoppers
  useEffect(() => {
    if (isAuthenticated) {
      setGuestCount(0);
      return;
    }
    const sync = async () => {
      try {
        const { getGuestCount } = await import('@/lib/guestCart');
        setGuestCount(getGuestCount());
      } catch { /* ignore */ }
    };
    sync();
    window.addEventListener('guest-cart-updated', sync);
    return () => window.removeEventListener('guest-cart-updated', sync);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'M';
  };

  const getDashboardLink = (role?: string) => {
    switch (role) {
      case UserRole.SUPERADMIN:
        return '/superadmin/dashboard';
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.USER:
        return '/user/dashboard';
      default:
        return '/';
    }
  };

  return (
    <>
      {/* Top Announcement Ticker Bar */}
      <TopAnnouncementBar />

      {/* Compact Main Header Navbar — single line, no wrap */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-[1440px] px-3">
          <div className="flex min-h-[52px] items-center justify-between gap-2">
            {/* Left: Mobile Menu Toggle & Brand Logo */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 text-slate-700 dark:text-slate-200 hover:text-amber-500 rounded-lg focus:outline-none"
                aria-label="Toggle Navigation"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link href="/" className="flex items-center gap-1.5">
                <span className="font-extrabold text-base xl:text-lg tracking-tighter text-slate-950 dark:text-white uppercase whitespace-nowrap">
                  MENTOOS<span className="text-amber-500">.</span>
                </span>
                <span className="hidden xl:inline-block text-[8px] font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                  MEN'S FASHION
                </span>
              </Link>
            </div>

            {/* Middle: Single-line Desktop Navigation with Segregated Mega Menu */}
            <nav className="hidden lg:flex items-center gap-0 min-w-0" onMouseLeave={() => setActiveMegaKey(null)} aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="relative shrink-0"
                  onMouseEnter={() => item.megaKey && setActiveMegaKey(item.megaKey)}
                >
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={`px-2 py-4 text-[10px] font-bold uppercase tracking-wide transition-colors flex items-center gap-0.5 whitespace-nowrap ${
                      activeMegaKey === item.megaKey 
                        ? 'text-amber-500' 
                        : 'text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400'
                    }`}
                  >
                    <span>{item.name}</span>
                    {item.megaKey && <ChevronDown className="w-2.5 h-2.5 opacity-60" />}
                    {item.isHot && (
                      <span className="ml-0.5 text-[8px] font-black text-white bg-rose-500 px-1 py-px rounded leading-none">
                        HOT
                      </span>
                    )}
                    {item.isSale && (
                      <span className="ml-0.5 text-[8px] font-black text-slate-950 bg-amber-400 px-1 py-px rounded leading-none">
                        SALE
                      </span>
                    )}
                  </Link>

                  {/* Segregated Mega Menu: Shop-by column + Featured column */}
                  {item.megaKey && activeMegaKey === item.megaKey && MEGA_MENU_DATA[item.megaKey] && (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 top-full w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex gap-4"
                      onMouseEnter={() => setActiveMegaKey(item.megaKey)}
                    >
                      {/* Col 1 — Shop by */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Shop {MEGA_MENU_DATA[item.megaKey].title}
                        </h4>
                        <ul className="space-y-0.5">
                          {MEGA_MENU_DATA[item.megaKey].subcategories.map((sub, idx) => (
                            <li key={idx}>
                              <Link
                                href={sub.href}
                                onClick={() => setActiveMegaKey(null)}
                                className="group text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center justify-between py-1 px-2 rounded-lg hover:bg-amber-500/10 transition-colors"
                              >
                                <span className="truncate">{sub.name}</span>
                                <ArrowRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href={MEGA_MENU_DATA[item.megaKey].featuredLink}
                          onClick={() => setActiveMegaKey(null)}
                          className="mt-2 inline-flex items-center text-[10px] font-bold text-amber-600 hover:underline gap-1 px-2"
                        >
                          <span>VIEW ALL</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Col 2 — Featured card */}
                      <div className="w-44 relative rounded-xl overflow-hidden shadow-md group shrink-0 min-h-[220px]">
                        <Image
                          src={MEGA_MENU_DATA[item.megaKey].featuredImage}
                          alt={MEGA_MENU_DATA[item.megaKey].featuredTitle}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="176px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3 flex flex-col justify-end text-white">
                          <span className="text-[9px] font-bold text-amber-400 tracking-wider uppercase">
                            {MEGA_MENU_DATA[item.megaKey].featuredSubtitle}
                          </span>
                          <h5 className="text-[11px] font-extrabold tracking-tight mt-0.5 leading-tight">
                            {MEGA_MENU_DATA[item.megaKey].featuredTitle}
                          </h5>
                          <Link
                            href={MEGA_MENU_DATA[item.megaKey].featuredLink}
                            onClick={() => setActiveMegaKey(null)}
                            className="mt-1.5 inline-flex items-center text-[10px] font-bold text-amber-400 hover:underline gap-1"
                          >
                            <span>SHOP COLLECTION</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right: Smart Search Trigger & Badges */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Header Smart Search Trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Smart Search"
                className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-all shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden xl:inline">Smart Search...</span>
                <span className="hidden xl:inline-block px-1 py-px text-[9px] font-bold bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 text-slate-400">
                  ⌘K
                </span>
              </button>

              {/* Wishlist Link */}
              <Link 
                href="/user/wishlist" 
                className="relative p-1.5 text-slate-700 dark:text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Link */}
              <Link 
                href="/cart" 
                className="relative p-1.5 text-slate-700 dark:text-slate-300 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="h-4 w-4" />
                {(itemCount + guestCount) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center">
                    {itemCount + guestCount}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-0.5 rounded-full border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-colors focus:outline-none">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={(user as any)?.avatar} alt={user?.email} />
                        <AvatarFallback className="bg-amber-500 text-slate-950 font-extrabold text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
                    <DropdownMenuLabel className="px-3 py-2">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-xs font-bold truncate">{user?.email}</p>
                        <p className="text-[10px] uppercase font-bold text-amber-500">{user?.role || 'Customer'}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardLink(user?.role)} className="flex items-center px-3 py-2 text-xs font-semibold cursor-pointer rounded-xl hover:bg-amber-500/10">
                        <UserCircle className="mr-2.5 h-4 w-4 text-amber-500" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/user/profile" className="flex items-center px-3 py-2 text-xs font-semibold cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <User className="mr-2.5 h-4 w-4" />
                        <span>Profile & Addresses</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/user/orders" className="flex items-center px-3 py-2 text-xs font-semibold cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ShoppingBag className="mr-2.5 h-4 w-4" />
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center px-3 py-2 text-xs font-semibold cursor-pointer text-rose-500 hover:bg-rose-50 rounded-xl">
                      <LogOut className="mr-2.5 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="font-semibold text-[11px] rounded-lg h-7 px-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-[11px] rounded-lg h-7 px-2.5">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Expandable Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((cat, i) => (
                <Link
                  key={i}
                  href={cat.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase hover:text-amber-500"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Smart Search Modal */}
      <SmartSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
