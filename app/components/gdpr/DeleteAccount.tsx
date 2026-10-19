'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/lib/api/profile';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteAccount() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    // Require typing "DELETE" to confirm
    if (confirmText !== 'DELETE') {
      setError('Please type "DELETE" exactly to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      await profileApi.deleteAccount();

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }

      // Redirect to home with a login prompt
      router.push('/?authRequired=1&callbackUrl=/user/settings');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete account';
      setError(errorMessage);
      console.error('Delete account error:', err);
      setIsDeleting(false);
      setShowConfirm(false);
      setConfirmText('');
      
      // If it's an auth error, redirect to login
      if (err.response?.status === 401) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm">
            {typeof error === 'string' ? error : 'An error occurred. Please try again.'}
          </div>
        )}

        {!showConfirm ? (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive font-medium mb-2">
                Warning: This action is permanent
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>All your personal data will be anonymized</li>
                <li>Your account will be permanently deleted</li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete My Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-md">
              <p className="text-sm font-medium mb-2 text-destructive">
                ⚠️ Final Confirmation Required
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                This action is <strong>PERMANENT</strong> and cannot be undone. All your data will be anonymized.
              </p>
              <p className="text-sm font-medium mb-2">
                Type <strong>&quot;DELETE&quot;</strong> in the box below to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError(null);
                }}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 border border-destructive rounded-md focus:outline-none focus:ring-2 focus:ring-destructive"
                disabled={isDeleting}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== 'DELETE'}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Permanent Deletion'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                  setError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

