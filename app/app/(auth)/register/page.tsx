'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground py-8">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getRecaptchaToken } = useRecaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      try {
        localStorage.setItem('mentoos_ref', ref.toUpperCase());
      } catch { /* ignore */ }
    } else {
      try {
        const saved = localStorage.getItem('mentoos_ref');
        if (saved) setReferralCode(saved);
      } catch { /* ignore */ }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      // Get reCAPTCHA token (may be null if not configured - that's OK for dev)
      const recaptchaToken = await getRecaptchaToken();
      
      const response = await authApi.register({ 
        email, 
        password,
        ...(recaptchaToken && { recaptchaToken }),
        ...(referralCode && { referralCode }),
      });
      
      // Redirect to login or dashboard
      router.push('/login');
    } catch (err: any) {
      // Handle connection errors
      if (err.message?.includes('Backend server is not running')) {
        setError('Backend server is not running. Please start it with: cd server && npm run dev');
      } else {
        setError(err.response?.data?.error?.message || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Or{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/90"
          >
            sign in to existing account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Need admin access?{' '}
          <Link
            href="/register-admin"
            className="font-medium text-primary hover:text-primary/90"
          >
            Register as Admin
          </Link>
        </p>
      </div>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 8 characters with uppercase, lowercase, number, and symbol
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label htmlFor="referral">Referral code (optional — you get ₹2 off)</Label>
            <Input
              id="referral"
              name="referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="mt-1 tracking-widest font-bold"
              placeholder="MENTOOS-XXXXXX"
            />
            {referralCode && (
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Referral applied — 200 bonus points (₹2) on signup!</p>
            )}
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </div>
      </form>
    </div>
  );
}

