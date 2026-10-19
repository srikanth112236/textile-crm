'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LoginModal } from '@/components/auth/LoginModal';

interface BuyNowButtonProps {
  productId: string;
  quantity?: number;
  variations?: Array<{ name: string; value: string }>;
  disabled?: boolean;
  className?: string;
}

// Buy Now: add to cart (with size/color) then jump straight to checkout
export function BuyNowButton({ productId, quantity = 1, variations, disabled, className }: BuyNowButtonProps) {
  const router = useRouter();
  const { addItem, requiresAuth } = useCart();
  const { isAuthenticated, isCustomer } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Staff (admin/superadmin) are dashboard-only and cannot shop.
    if (isAuthenticated && !isCustomer) {
      toast({ title: 'Customers only', description: 'Shopping actions are for customer accounts. Staff, please use the dashboard.', variant: 'destructive' });
      return;
    }
    // Guests get express checkout too: guest bag → guest checkout (no login wall).
    if (!isAuthenticated) {
      setLoading(true);
      try {
        const { addToGuestCart } = await import('@/lib/guestCart');
        await addToGuestCart(productId, quantity, variations);
        router.push('/checkout?guest=1');
      } finally {
        setLoading(false);
      }
      return;
    }
    // Login compulsory for any shopping action
    if (requiresAuth()) {
      setShowLogin(true);
      return;
    }
    setLoading(true);
    try {
      const ok = await addItem(productId, quantity, variations);
      if (ok) router.push('/checkout');
      else setShowLogin(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleBuyNow} disabled={disabled || loading} className={className} size="default">
        <Zap className="mr-2 h-4 w-4" />
        {loading ? 'Going to checkout…' : 'Buy Now'}
      </Button>
      <LoginModal open={showLogin} onOpenChange={setShowLogin} title="Login for Express Checkout" description="Login to use Buy Now express checkout." />
    </>
  );
}
