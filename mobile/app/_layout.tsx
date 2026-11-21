import '@/global.css';

import { BrandSplash } from '@/components/brand-splash';
import { AuthProvider, useAuth } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { AppQueryProvider } from '@/lib/query';
import { NAV_THEME } from '@/lib/theme';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Keep the native splash up until React has something to show, then hand over
// to <BrandSplash /> which uses the identical background colour.
void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';

  React.useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <AppQueryProvider>
      <AuthProvider>
        <CartProvider>
          <ThemeProvider value={NAV_THEME[scheme]}>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <AppShell />
            <PortalHost />
          </ThemeProvider>
        </CartProvider>
      </AuthProvider>
    </AppQueryProvider>
  );
}

function AppShell() {
  const { status } = useAuth();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const [minimumElapsed, setMinimumElapsed] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMinimumElapsed(true), 850);
    return () => clearTimeout(timer);
  }, []);

  const ready = status !== 'loading' && minimumElapsed;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: NAV_THEME[scheme].colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="products/index" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="checkout/index" />
        <Stack.Screen name="orders/index" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="returns/index" />
        <Stack.Screen name="invoices/index" />
        <Stack.Screen name="invoices/[orderId]" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="refunds" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="categories/[slug]" />
        <Stack.Screen name="wishlist" />
        <Stack.Screen name="auth/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account/profile" />
        <Stack.Screen name="account/addresses" />
        <Stack.Screen name="loyalty" />
        <Stack.Screen name="referrals" />
        <Stack.Screen name="track-order" />
        <Stack.Screen name="content/[slug]" />
      </Stack>
      <BrandSplash visible={!ready} />
    </>
  );
}
