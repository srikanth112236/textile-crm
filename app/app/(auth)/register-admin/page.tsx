'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { Shield } from 'lucide-react';

export default function RegisterAdminPage() {
  const router = useRouter();
  const { getRecaptchaToken } = useRecaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (!adminSecret) {
      setError('Admin registration secret is required');
      return;
    }

    setLoading(true);

    try {
      // Get reCAPTCHA token (may be null if not configured - that's OK for dev)
      const recaptchaToken = await getRecaptchaToken();
      
      // Call registration API with role and secret
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
          adminSecret,
          ...(recaptchaToken && { recaptchaToken }),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        
        // Redirect based on role
        if (role === 'superadmin') {
          router.push('/superadmin/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      } else {
        setError(data.error?.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      if (err.message?.includes('Backend server is not running')) {
        setError('Backend server is not running. Please start it with: cd server && npm run dev');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Admin Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Register as Admin or Superadmin
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Requires admin registration secret from environment variables
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
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              required
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {role === 'superadmin' 
                ? 'Full system access (only one superadmin allowed)'
                : 'Administrative access with permissions'}
            </p>
          </div>

          <div>
            <Label htmlFor="adminSecret">Admin Registration Secret</Label>
            <Input
              id="adminSecret"
              name="adminSecret"
              type="password"
              required
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="mt-1"
              placeholder="Enter admin registration secret"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Get this from ADMIN_REGISTRATION_SECRET in server/.env
            </p>
          </div>

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
              placeholder="admin@example.com"
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
        </div>

        <div className="flex flex-col space-y-2">
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Registering...' : `Register as ${role === 'superadmin' ? 'Superadmin' : 'Admin'}`}
          </Button>
          
          <Link href="/register">
            <Button type="button" variant="outline" className="w-full">
              Register as Regular User
            </Button>
          </Link>

          <Link href="/login">
            <Button type="button" variant="ghost" className="w-full">
              Already have an account? Sign in
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

