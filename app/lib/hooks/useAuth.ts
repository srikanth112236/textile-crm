import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Sync token from session to localStorage after successful login
      if (result?.ok && typeof window !== 'undefined') {
        try {
          const { syncTokenFromSession } = await import('@/lib/utils/auth');
          await syncTokenFromSession();
        } catch (e) {
          console.warn('Could not sync token after login:', e);
        }
      }

      return result;
    },
    []
  );

  const loginWithOtp = useCallback(async (phone: string, code: string) => {
    const result = await signIn('otp', { phone, code, redirect: false });
    if (result?.error) {
      throw new Error(result.error);
    }
    if (result?.ok && typeof window !== 'undefined') {
      try {
        const { syncTokenFromSession } = await import('@/lib/utils/auth');
        await syncTokenFromSession();
      } catch (e) {
        console.warn('Could not sync token after OTP login:', e);
      }
    }
    return result;
  }, []);

  const logout = useCallback(async (opts?: { redirectTo?: string; silent?: boolean }) => {
    try {
      // Call backend logout API to clear refresh token
      const { authApi } = await import('@/lib/api/auth');
      await authApi.logout();
    } catch (error: any) {
      // 401/Network here just means the session was already dead — not worth noise
      const status = error?.response?.status;
      if (status !== 401 && error?.code !== 'ERR_NETWORK' && error?.message !== 'Network Error') {
        console.warn('Backend logout failed:', error);
      }
    }

    // Sign out from NextAuth
    await signOut({ redirect: false });

    // Clear any local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    // Tell the user what happened and where they are going — never a silent drop.
    if (!opts?.silent) {
      toast({
        title: "You've been logged out",
        description: 'Please log in again to continue shopping.',
      });
    }
    const back = opts?.redirectTo
      ?? (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/');
    // Product rule: logout lands on the storefront with a gentle login
    // prompt (never a hard /login bounce). callbackUrl preserves where
    // the user was so the modal's Login button can return them.
    const dest = back.startsWith('/login') || back.startsWith('/register')
      ? '/'
      : `/?authRequired=1&callbackUrl=${encodeURIComponent(back)}`;
    router.push(dest);
  }, [router, toast]);

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  // Staff (admin/superadmin) are dashboard-only: they may browse the public
  // site but must not shop. Only role 'user' (customers) may cart/wishlist/order.
  const userRole = (session?.user as any)?.role as string | undefined;
  const isCustomer = isAuthenticated && (!userRole || userRole === 'user');

  return {
    session,
    user: session?.user,
    userRole,
    isCustomer,
    login,
    loginWithOtp,
    logout,
    isAuthenticated,
    isLoading,
  };
};

