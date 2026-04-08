'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Client-side route protection — redirects unauthenticated users to /sign-in.
 * Use this to wrap the contents of any page that requires auth.
 *
 * Static-export-compatible (no middleware).
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          opacity: 0.6,
        }}
      >
        Loading…
      </div>
    );
  }

  if (!isSignedIn) return null;

  return <>{children}</>;
}
