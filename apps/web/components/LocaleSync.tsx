'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApiClient } from '@/hooks/useApiClient';
import { detectLocale } from '@/lib/locale';

/**
 * Mount once in the root layout. After the user is signed in, detects the
 * browser's timezone + currency and syncs them to the user profile IF the
 * backend hasn't stored real values yet (or they differ). Silent — no UI.
 */
export default function LocaleSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApiClient();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      try {
        const me = await api.getMe();
        const detected = detectLocale();

        const updates: Record<string, string> = {};
        if (!me.timezone || me.timezone !== detected.timezone) {
          updates.timezone = detected.timezone;
        }
        if (!me.locale || me.locale !== detected.locale) {
          updates.locale = detected.locale;
        }
        if (!me.currency || me.currency !== detected.currency) {
          updates.currency = detected.currency;
        }

        if (Object.keys(updates).length > 0) {
          await api.patchMe(updates);
        }
      } catch {
        // Silent — non-critical
        syncedRef.current = false;
      }
    })();
  }, [isLoaded, isSignedIn, api]);

  return null;
}
