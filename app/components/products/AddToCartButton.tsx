'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginModal } from '@/components/auth/LoginModal';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics/events';

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  variations?: Array<{ name: string; value: string }>;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  quantity = 1,
  variations,
  disabled = false,
  className,
  size = 'default',
  variant = 'default',
}) => {
  const router = useRouter();
  const { items, addItem, updateItem, removeItem, requiresAuth } = useCart();
  const { isAuthenticated, isCustomer, isStaff } = useAuth();
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Staff (admin/superadmin) are dashboard-only and cannot shop.
  const staffBlocked = () => {
    if (isAuthenticated && !isCustomer) {
      toast({
        title: 'Customers only',
        description: 'Shopping actions are for customer accounts. Staff, please use the dashboard.',
        variant: 'destructive',
      });
      return true;
    }
    return false;
  };

  // Find if item is already in cart
  const itemIndex = items.findIndex((item) => item.productId === productId);
  const cartItem = itemIndex >= 0 ? items[itemIndex] : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Login compulsory: no guest add-to-cart. Only pincode check is public.
    if (staffBlocked()) {
      return;
    }
    if (requiresAuth()) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    try {
      const success = await addItem(productId, quantity, variations);
      if (!success) {
        setShowLoginModal(true);
      }
    } catch (error) {
      // Error handled in context
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;
    setLoading(true);
    try {
      await updateItem(itemIndex, cartItem.quantity + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;
    setLoading(true);
    try {
      if (cartItem.quantity <= 1) {
        await removeItem(itemIndex);
      } else {
        await updateItem(itemIndex, cartItem.quantity - 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/checkout');
  };

  // Staff accounts are dashboard-only. Never render a buying control they
  // cannot complete (the API would reject it with a confusing 403).
  if (isStaff) {
    return (
      <motion.button
        type="button"
        className={cn('border-amber-300 bg-amber-50 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors', className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          trackEvent('staff_commerce_blocked', { surface: 'add_to_cart', productId });
          toast({
            title: 'Customer account required',
            description: 'Staff accounts cannot shop. Use the dashboard or sign in as a customer.',
          });
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 150 }}
      >
        <Lock className="mr-2 h-4 w-4" />
        Customer account required
      </motion.button>
    );
  }

  // If item is in cart, show quantity controls + Checkout button!
  if (cartItem) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 120 }}
        className="flex items-center gap-1.5 w-full"
      >
        {/* Counter controls */}
        <motion.div
          className="flex items-center border border-amber-500/50 dark:border-amber-400/50 rounded-xl overflow-hidden bg-amber-500/10 dark:bg-amber-500/20 backdrop-blur-sm shrink-0"
          whileHover={{ backgroundColor: 'rgba(251, 191, 36, 0.2)' }}
        >
          <motion.button
            onClick={handleDecrement}
            disabled={loading || disabled}
            className="p-2 text-slate-800 dark:text-slate-100 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            title="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </motion.button>
          <span className="px-2.5 text-xs font-black text-amber-700 dark:text-amber-300 min-w-[20px] text-center">
            {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : cartItem.quantity}
          </span>
          <motion.button
            onClick={handleIncrement}
            disabled={loading || disabled}
            className="p-2 text-slate-800 dark:text-slate-100 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            title="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>

        {/* Go to Checkout Button */}
        <motion.button
          onClick={handleCheckout}
          className={cn(
            'flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 py-2',
            className
          )}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Checkout</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 150 }}
      className={cn('relative inline-flex items-center gap-2', className)}
    >
      <Button
        onClick={handleAddToCart}
        disabled={disabled || loading}
        className={cn('flex-1 rounded-lg border transition-colors', className)}
        size={size}
        variant={variant}
        aria-label="Add to cart"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {loading ? 'Adding...' : 'Add to Cart'}
      </Button>
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        action="cart"
        pendingAction={{ type: 'add_to_cart', productId, quantity, variations }}
      />
    </motion.div>
  );
};