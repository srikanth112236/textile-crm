import { authApi, profileApi } from '@/lib/api/endpoints';
import { setAuthTokens, setSessionHandlers } from '@/lib/api/client';
import type { AuthResponse, AuthUser, Profile } from '@/lib/api/types';
import {
  cacheUser,
  clearCachedUser,
  clearTokens,
  readCachedUser,
  readTokens,
  saveTokens,
} from '@/lib/storage';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: Status;
  user: AuthUser | null;
  profile: Profile | null;
};

type AuthContextValue = AuthState & {
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; name?: string; referralCode?: string }) => Promise<void>;
  verifyOtp: (input: { phone: string; code: string; name?: string }) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ debugCode?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, 'name' | 'phone' | 'avatar'>>) => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = React.useState<AuthState>({
    status: 'loading',
    user: null,
    profile: null,
  });

  const applySession = React.useCallback(
    async (payload: AuthResponse) => {
      const tokens = {
        accessToken: payload.accessToken ?? null,
        refreshToken: payload.refreshToken ?? null,
      };
      setAuthTokens(tokens);
      await saveTokens(tokens);
      await cacheUser(payload.user);
      setState({ status: 'signedIn', user: payload.user, profile: null });
      try {
        const { data } = await profileApi.get();
        setState((prev) => ({ ...prev, profile: data }));
      } catch {
        /* profile is nice-to-have; the session is valid without it */
      }
    },
    []
  );

  const signOut = React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* offline logout still clears local state */
    }
    setAuthTokens({ accessToken: null, refreshToken: null });
    await clearTokens();
    await clearCachedUser();
    setState({ status: 'signedOut', user: null, profile: null });
    queryClient.clear();
  }, [queryClient]);

  React.useEffect(() => {
    setSessionHandlers({
      onExpired: () => {
        void signOut();
      },
      onRefreshed: (next) => {
        void saveTokens(next);
      },
    });
  }, [signOut]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const tokens = await readTokens();
      if (cancelled) return;
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        setState({ status: 'signedOut', user: null, profile: null });
        return;
      }

      setAuthTokens(tokens);
      const cached = (await readCachedUser()) as AuthUser | null;
      if (cached && !cancelled) {
        setState({ status: 'signedIn', user: cached, profile: null });
      }

      try {
        const { data } = await profileApi.get();
        if (cancelled) return;
        setState({
          status: 'signedIn',
          user: {
            id: data.id,
            email: data.email,
            phone: data.phone,
            name: data.name,
            role: data.role ?? 'user',
          } as AuthUser,
          profile: data,
        });
      } catch (error) {
        if (cancelled) return;
        const status = (error as { status?: number }).status;
        if (status === 401) {
          setAuthTokens({ accessToken: null, refreshToken: null });
          await clearTokens();
          setState({ status: 'signedOut', user: null, profile: null });
        } else if (!cached) {
          setState({ status: 'signedOut', user: null, profile: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      ...state,
      isSignedIn: state.status === 'signedIn',
      signIn: async (email, password) => {
        const payload = await authApi.login({ email, password });
        await applySession(payload);
      },
      signUp: async (input) => {
        const payload = await authApi.register(input);
        await applySession(payload);
        // /auth/register ignores `name`; persist it on the profile right away.
        if (input.name?.trim()) {
          try {
            const { data } = await profileApi.update({ name: input.name.trim() });
            setState((prev) => ({ ...prev, profile: data, user: prev.user ? { ...prev.user, name: data.name } : prev.user }));
          } catch {
            /* non-blocking */
          }
        }
      },
      requestOtp: async (phone) => {
        const response = await authApi.sendOtp(phone);
        return { debugCode: response.debugCode };
      },
      verifyOtp: async (input) => {
        const payload = await authApi.verifyOtp(input);
        await applySession(payload);
      },
      signOut,
      refreshProfile: async () => {
        const { data } = await profileApi.get();
        setState((prev) => ({ ...prev, profile: data }));
      },
      updateProfile: async (patch) => {
        const { data } = await profileApi.update(patch);
        setState((prev) => ({ ...prev, profile: data }));
      },
    }),
    [applySession, signOut, state]
  );

  // Block the tree until the stored session is restored: every screen below
  // fires an authenticated query on mount, and those must not race the tokens.
  if (state.status === 'loading') {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
