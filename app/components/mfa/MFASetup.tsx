'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mfaApi } from '@/lib/api/mfa';
import Image from 'next/image';

export function MFASetup() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await mfaApi.setup();
      setQrCodeUrl(response.qrCodeUrl);
      setSecret(response.secret);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await mfaApi.verify(token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to verify MFA token');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            MFA enabled successfully!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!qrCodeUrl ? (
        <div>
          <Button onClick={handleSetup} disabled={loading}>
            {loading ? 'Setting up...' : 'Setup MFA'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Scan this QR code with your authenticator app:</Label>
            <div className="mt-2 flex justify-center">
              <Image
                src={qrCodeUrl}
                alt="MFA QR Code"
                width={200}
                height={200}
                className="border rounded"
              />
            </div>
          </div>

          <div>
            <Label>Or enter this secret manually:</Label>
            <code className="block mt-2 p-2 bg-muted rounded text-sm break-all">
              {secret}
            </code>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="mfa-token">Enter 6-digit code from your app:</Label>
              <Input
                id="mfa-token"
                type="text"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="mt-1"
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading || token.length !== 6}>
              {loading ? 'Verifying...' : 'Verify and Enable MFA'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

