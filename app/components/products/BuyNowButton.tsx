'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LoginModal } from '@/components/auth/LoginModal';
import { trackEvent } from '@/lib/analytics/events';

interface BuyNowButtonProps {
  productId: string;
  quantity?: number;
  variations?: Array<{ name: string; value: string }>;
  disabled?: boolean;
  className?: string;
}

// Buy Now: sign in, add the exact size/colour line, then jump to checkout.
export function BuyNowButton({ productId, quantity = 1, variations, disabled, className }: BuyNowButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isAuthenticated, isStaff } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isStaff) {
      trackEvent('staff_commerce_blocked', { surface: 'buy_now', productId });
      toast({
        title: 'Customer account required',
        description: 'Staff accounts cannot shop. Use the dashboard or sign in as a customer.',
      });
      return;
    }

    // Login is compulsory for every shopping action.
    if (!isAuthenticated) {
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

  if (isStaff) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={className}
        onClick={handleBuyNow}
      >
        <Lock className="mr-2 h-4 w-4" />
        Customer account required
      </Button>
    );
  }

  return (
    <>
      <Button onClick={handleBuyNow} disabled={disabled || loading} className={className} size="default">
        <Zap className="mr-2 h-4 w-4" />
        {loading ? 'Going to checkout…' : 'Buy Now'}
      </Button>
      <LoginModal
        open={showLogin}
        onOpenChange={setShowLogin}
        action="checkout"
        pendingAction={{ type: 'buy_now', productId, quantity, variations }}
      />
    </>
  );
}
