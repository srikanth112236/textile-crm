'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Lock,
  Mail,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import {
  queueCommerceAction,
  clearCommerceAction,
  type PendingCommerceAction,
} from '@/lib/auth/pendingAction';
import { getRoleDashboard, isStaffRole } from '@/lib/auth/roleHome';
import type { AuthAction } from '@/lib/analytics/events';
import { trackEvent } from '@/lib/analytics/events';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Why the shopper is being asked to sign in. Drives the copy only. */
  action?: AuthAction;
  /** Page to return to after sign-in. Defaults to the current page. */
  callbackUrl?: string;
  /** Commerce intent replayed after the authenticated reload. */
  pendingAction?: PendingCommerceAction | null;
  /** Where the prompt came from, for analytics. */
  source?: 'modal' | 'listener' | 'route_guard';
  /** Legacy copy overrides used by older components. */
  title?: string;
  description?: string;
}

const ACTION_COPY: Record<AuthAction, { title: string; description: string }> = {
  cart: {
    title: 'Sign in to add to bag',
    description: 'Save your bag, sync it across devices, and check out faster.',
  },
  wishlist: {
    title: 'Sign in to save this',
    description: 'Keep your favourites in one place and get price-drop alerts.',
  },
  checkout: {
    title: 'Sign in to checkout',
    description: 'Your bag and saved addresses are waiting. It only takes a moment.',
  },
  review: {
    title: 'Sign in to write a review',
    description: 'Share your fit feedback with other shoppers.',
  },
  generic: {
    title: 'Welcome back',
    description: 'Sign in to continue where you left off.',
  },
};

export const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onOpenChange,
  action = 'generic',
  callbackUrl,
  pendingAction,
  source = 'modal',
  title,
  description,
}) => {
  const router = useRouter();
  const { login, loginWithOtp } = useAuth();
  const { getRecaptchaToken } = useRecaptcha();
  const { toast } = useToast();

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const copy = ACTION_COPY[action] || ACTION_COPY.generic;
  const resolvedTitle = title || copy.title;
  const resolvedDescription = description || copy.description;

  useEffect(() => {
    if (!open) {
      setError('');
      setPassword('');
      setCode('');
      return;
    }
    trackEvent('auth_prompt_shown', { source, action, expired: false });
    // Prompt analytics is intentionally once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const currentPath = () => {
    if (typeof window === 'undefined') return '/';
    return `${window.location.pathname}${window.location.search}`;
  };

  const finishLogin = async (method: 'password' | 'otp') => {
    const session = await getSession();
    const role = (session?.user as any)?.role as string | undefined;
    const target = callbackUrl || currentPath();
    const staff = isStaffRole(role);

    trackEvent('auth_login_success', { method, role, returnedTo: target });

    onOpenChange(false);

    // A staff account that tried to shop is sent to the dashboard; generic
    // staff logins still land wherever they were (no dashboard hijack).
    if (staff && pendingAction) {
      clearCommerceAction();
      toast({
        title: 'Staff account',
        description: 'Shopping is for customer accounts. Use the dashboard to manage the store.',
      });
      router.push(getRoleDashboard(role));
      return;
    }

    if (pendingAction) {
      queueCommerceAction({ ...pendingAction, returnTo: target });
      // Full reload so Cart/Wishlist providers pick up the new session before
      // PendingActionRunner replays the intent.
      window.location.assign(target);
      return;
    }

    if (callbackUrl && callbackUrl !== currentPath()) {
      window.location.assign(callbackUrl);
      return;
    }

    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Keep the existing reCAPTCHA call for environments that enable it.
      await getRecaptchaToken().catch(() => null);
      await login(email.trim(), password);
      await finishLogin('password');
    } catch (err: any) {
      if (err?.message?.includes('Backend server is not running')) {
        setError('The store is temporarily unavailable. Please try again in a moment.');
      } else {
        setError('Email or password is incorrect. Please try again.');
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
      await otpApi.send(phone.trim());
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Could not send the OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithOtp(phone.trim(), code);
      await finishLogin('otp');
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signUpHref = callbackUrl
    ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/register';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-sand-deep p-0 sm:max-w-[880px]">
        <div className="grid md:grid-cols-[0.92fr_1.08fr]">
          {/* Editorial side — desktop only, so the form stays the focus on mobile. */}
          <div className="relative hidden min-h-[560px] overflow-hidden bg-ink md:block">
            <Image
              src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80"
              alt="Mentoos menswear editorial"
              fill
              sizes="400px"
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur">
                <Sparkles className="h-3 w-3 text-amber-300" />
                Mentoos
              </span>
              <p className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
                Modern menswear,
                <br />
                made easy.
              </p>
              <p className="mt-2 max-w-[230px] text-xs leading-relaxed text-white/70">
                Sign in once to save your bag, wishlist and addresses across every visit.
              </p>
            </div>
          </div>

          {/* Form side */}
          <div className="bg-white p-6 sm:p-8">
            <DialogHeader className="pr-7 text-left">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Lock className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-extrabold leading-tight tracking-tight text-slate-950">
                {resolvedTitle}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-600">
                {resolvedDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setMode('password'); setError(''); }}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  mode === 'password' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="mr-1.5 inline h-3.5 w-3.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => { setMode('otp'); setError(''); }}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  mode === 'otp' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="mr-1.5 inline h-3.5 w-3.5" />
                Mobile OTP
              </button>
            </div>

            {error && (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {mode === 'password' ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                <div>
                  <Label htmlFor="login-modal-email" className="text-xs font-bold text-slate-700">
                    Email address
                  </Label>
                  <Input
                    id="login-modal-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1 h-11 rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-modal-password" className="text-xs font-bold text-slate-700">
                      Password
                    </Label>
                    <Link href="/support" className="text-[11px] font-semibold text-slate-500 hover:text-slate-900">
                      Need help?
                    </Link>
                  </div>
                  <Input
                    id="login-modal-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1 h-11 rounded-xl border-slate-200"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white hover:bg-amber-500 hover:text-slate-950"
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpLogin} className="mt-4 space-y-3.5">
                <div>
                  <Label htmlFor="login-modal-phone" className="text-xs font-bold text-slate-700">
                    Mobile number
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="login-modal-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={13}
                      required
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setOtpSent(false); }}
                      placeholder="9876543210"
                      className="h-11 flex-1 rounded-xl border-slate-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOtp}
                      disabled={loading || !phone.trim()}
                      className="h-11 rounded-xl px-3 text-xs font-bold"
                    >
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </Button>
                  </div>
                  {otpSent && (
                    <p className="mt-1 text-[11px] font-medium text-emerald-700">
                      OTP sent. It is valid for 5 minutes.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="login-modal-code" className="text-xs font-bold text-slate-700">
                    6-digit OTP
                  </Label>
                  <Input
                    id="login-modal-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="mt-1 h-11 rounded-xl border-slate-200 text-center font-bold tracking-[0.5em]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white hover:bg-amber-500 hover:text-slate-950"
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : 'Verify and sign in'}
                </Button>
              </form>
            )}

            <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
              New to Mentoos?{' '}
              <Link href={signUpHref} className="font-bold text-slate-900 underline decoration-amber-400 decoration-2 underline-offset-2 hover:text-amber-700">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
