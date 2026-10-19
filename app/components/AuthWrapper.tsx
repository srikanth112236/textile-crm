'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types/roles';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

export function AuthWrapper({
  children,
  requiredRole,
  redirectTo = '/?authRequired=1',
}: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole) {
      const userRole = session.user?.role as UserRole;
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      if (!roles.includes(userRole)) {
        router.push('/'); // Redirect to home if unauthorized
        return;
      }
    }
  }, [session, status, requiredRole, redirectTo, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (requiredRole) {
    const userRole = session.user?.role as UserRole;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!roles.includes(userRole)) {
      return null;
    }
  }

  return <>{children}</>;
}

