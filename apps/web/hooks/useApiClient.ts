'use client';

import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';
import { ApiClient } from '@/lib/api-client';

/**
 * Returns a memoized ApiClient instance bound to the current Clerk session.
 * Automatically attaches the Clerk JWT to every request.
 */
export function useApiClient(): ApiClient {
  const { getToken } = useAuth();
  return useMemo(() => new ApiClient(() => getToken()), [getToken]);
}
