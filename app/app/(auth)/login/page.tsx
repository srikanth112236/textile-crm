'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { UserRole } from '@/lib/types/roles';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground py-8">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithOtp, isAuthenticated, user } = useAuth();
  const { getRecaptchaToken } = useRecaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = (user as any)?.role;
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      
      if (role === UserRole.SUPERADMIN) {
        router.push('/superadmin/dashboard');
      } else if (role === UserRole.ADMIN) {
        router.push('/admin/dashboard');
      } else if (role === UserRole.USER) {
        router.push('/user/dashboard');
      } else {
        router.push(callbackUrl);
      }
    }
  }, [isAuthenticated, user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get reCAPTCHA token (may be null if not configured - that's OK for dev)
      const recaptchaToken = await getRecaptchaToken();
      
      // Use NextAuth signIn for session management
      await login(email, password);
      
      // The useEffect will handle the redirect based on role
      // No need to manually redirect here
    } catch (err: any) {
      // Handle connection errors
      if (err.message?.includes('Backend server is not running')) {
        setError('Backend server is not running. Please start it with: cd server && npm run dev');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const { otpApi } = await import('@/lib/api/alerts');
      const res = await otpApi.send(phone);
      setOtpSent(true);
      if ((res as any).debugCode) {
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithOtp(phone, code);
    } catch (err: any) {
      setError(err.message || 'OTP login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Sign in to your account
        </h2>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant={mode === 'password' ? 'default' : 'outline'} size="sm" onClick={() => setMode('password')}>Password</Button>
          <Button variant={mode === 'otp' ? 'default' : 'outline'} size="sm" onClick={() => setMode('otp')}>Mobile OTP</Button>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Or{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary/90"
          >
            create a new account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Admin?{' '}
          <Link
            href="/register-admin"
            className="font-medium text-primary hover:text-primary/90"
          >
            Register as Admin/Superadmin
          </Link>
        </p>
      </div>

      {searchParams.get('expired') === '1' && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Your session expired — please log in again. You&apos;ll return to where you left off.
          </p>
        </div>
      )}

      {mode === 'password' ? (
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>
      ) : (
      <form className="mt-8 space-y-6" onSubmit={handleOtpLogin}>
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Mobile number (10-digit)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={13}
                required
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setOtpSent(false); }}
                placeholder="9876543210"
              />
              <Button type="button" variant="outline" onClick={handleSendOtp} disabled={loading || !phone.trim()}>
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
            </div>
            {otpSent && <p className="text-xs text-emerald-600 mt-1">OTP sent! Valid for 5 minutes. Check SMS (dev: server console).</p>}
          </div>
          <div>
            <Label htmlFor="code">6-digit OTP</Label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="mt-1 tracking-[0.5em] text-center font-bold"
              placeholder="••••••"
            />
          </div>
        </div>
        <div>
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Login with OTP'}
          </Button>
        </div>
      </form>
      )}
    </div>
  );
}

