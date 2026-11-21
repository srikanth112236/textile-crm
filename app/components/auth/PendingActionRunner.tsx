'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { takeCommerceAction } from '@/lib/auth/pendingAction';
import { trackEvent } from '@/lib/analytics/events';

/**
 * Replays a commerce intent after the authenticated reload.
 *
 * Mounted inside Cart/Wishlist providers so the new session is already
 * available. This is deliberately a reload-based flow: it avoids trying to
 * call cart APIs from a stale closure where `isAuthenticated` is still false.
 */
export function PendingActionRunner() {
  const { isAuthenticated, isCustomer, isLoading } = useAuth();
  const { addItem } = useCart();
  const { addItem: addToWishlist } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();
  const running = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !isCustomer || running.current) return;
    const action = takeCommerceAction();
    if (!action) return;

    running.current = true;
    (async () => {
      try {
        switch (action.type) {
          case 'add_to_cart':
            await addItem(action.productId, action.quantity, action.variations);
            break;
          case 'wishlist_add':
            await addToWishlist(action.productId);
            break;
          case 'add_many':
            for (const item of action.items) {
              await addItem(item.productId, item.quantity, item.variations);
            }
            break;
          case 'buy_now':
            await addItem(action.productId, action.quantity, action.variations);
            router.push('/checkout');
            break;
          case 'checkout':
            router.push('/checkout');
            break;
          case 'review':
            // The visitor is already on the product page; the form is now
            // unlocked. No automatic submission is attempted.
            break;
        }
        trackEvent('auth_pending_action_replayed', {
          action: action.type === 'wishlist_add' ? 'wishlist'
            : action.type === 'review' ? 'review'
            : action.type === 'checkout' || action.type === 'buy_now' ? 'checkout'
            : 'cart',
          productId: 'productId' in action ? action.productId : undefined,
          quantity: 'quantity' in action ? action.quantity : undefined,
        });
      } catch (error) {
        console.warn('Pending commerce action failed:', error);
        toast({
          title: 'Could not complete that action',
          description: 'Please try again from the product page.',
          variant: 'destructive',
        });
      } finally {
        running.current = false;
      }
    })();
  }, [isLoading, isAuthenticated, isCustomer, addItem, addToWishlist, router, toast]);

  return null;
}
