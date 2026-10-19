'use client';

import { ReactNode } from 'react';
import { SessionProvider } from './SessionProvider';
import { RecaptchaProvider } from './RecaptchaProvider';
import { SocketProvider } from '@/lib/contexts/SocketContext';
import { CartProvider } from '@/lib/contexts/CartContext';
import { WishlistProvider } from '@/lib/contexts/WishlistContext';
import { CompareProvider } from '@/lib/contexts/CompareContext';
import { CompareDrawer } from '@/components/products/CompareDrawer';
import CookieConsent from '@/components/gdpr/CookieConsent';
import NotificationToast from '@/components/notifications/NotificationToast';
import RateLimitNotice from '@/components/notifications/RateLimitNotice';
import { AuthSessionManager } from './AuthSessionManager';

/**
 * Combined provider component for all client-side providers
 * This ensures proper nesting and client component boundaries
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <RecaptchaProvider>
      <SessionProvider>
        <SocketProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                {children}
                <AuthSessionManager />
                <CompareDrawer />
                <CookieConsent />
                <NotificationToast />
                <RateLimitNotice />
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </SocketProvider>
      </SessionProvider>
    </RecaptchaProvider>
  );
}
