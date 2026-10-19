'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { addToWishlist, removeFromWishlist, checkWishlist } from '@/lib/api/wishlist';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  className,
  size = 'icon',
  variant = 'ghost',
}) => {
  const { isAuthenticated, isCustomer } = useAuth();
  const { isInWishlist: checkInWishlist, addItem, removeItem } = useWishlist();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      // Use context to check wishlist status
      const inWishlist = checkInWishlist(productId);
      setIsInWishlist(inWishlist);
      setChecking(false);
    } else {
      setChecking(false);
      setIsInWishlist(false);
    }
  }, [isAuthenticated, productId, checkInWishlist]);

  // Re-check wishlist status when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      checkWishlistStatus();
    }
  }, [isAuthenticated]);

  const checkWishlistStatus = async () => {
    try {
      setChecking(true);
      const response = await checkWishlist(productId);
      if (response.success && response.data) {
        setIsInWishlist(response.data.isInWishlist || false);
      } else {
        setIsInWishlist(false);
      }
    } catch (error: any) {
      // Silently fail - user might not be authenticated or product might not be in wishlist
      setIsInWishlist(false);
      if (error.response?.status !== 401) {
        console.warn('Failed to check wishlist status:', error);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleToggleWishlist = async (e?: React.MouseEvent) => {
    // Prevent navigation when clicking wishlist button
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Staff (admin/superadmin) are dashboard-only and cannot shop.
    if (!isCustomer) {
      toast({ title: 'Customers only', description: 'Wishlist is for customer accounts. Staff, please use the dashboard.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      if (isInWishlist) {
        const success = await removeItem(productId);
        if (success) {
          setIsInWishlist(false);
        }
      } else {
        const success = await addItem(productId);
        if (success) {
          setIsInWishlist(true);
        }
      }
    } catch (error: any) {
      console.error('Failed to toggle wishlist:', error);
      if (error.response?.status === 401) {
        setShowLoginModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
        aria-label="Checking wishlist status"
      >
        <Heart className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleToggleWishlist}
        disabled={loading}
        variant={variant}
        size={size}
        className={cn(className, isInWishlist && 'text-red-500 hover:text-red-600')}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={cn(
            'h-4 w-4',
            isInWishlist && 'fill-current'
          )}
        />
      </Button>
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        title="Login to Save to Wishlist"
        description="You need to be logged in to save items to your wishlist."
      />
    </>
  );
};

