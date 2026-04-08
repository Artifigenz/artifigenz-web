'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useTheme } from '@/components/ThemeProvider';
import { useApiClient } from '@/hooks/useApiClient';
import type { ApiError } from '@/lib/api-client';
import styles from './page.module.css';

const THEMES = [
  { id: 'terminal' as const, name: 'Terminal', description: 'Monospace. Black and white. Raw.' },
  { id: 'aura' as const, name: 'Aura', description: 'Gradients. Glass. Warm and luminous.' },
];

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
  currency: string;
  onboardingCompleted: boolean;
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { theme, setTheme, visualTheme, setVisualTheme } = useTheme();
  const api = useApiClient();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: ApiError) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>Settings</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          {error ? (
            <p className={styles.fieldHint} style={{ color: 'crimson' }}>
              Failed to load profile: {error}
            </p>
          ) : !profile ? (
            <p className={styles.fieldHint}>Loading…</p>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input
                  className={styles.input}
                  defaultValue={profile.name ?? ''}
                  readOnly
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} defaultValue={profile.email} readOnly />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Timezone</label>
                <input className={styles.input} defaultValue={profile.timezone} readOnly />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Currency</label>
                <input className={styles.input} defaultValue={profile.currency} readOnly />
              </div>
            </>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <div className={styles.field}>
            <label className={styles.label}>Mode</label>
            <div className={styles.modeRow}>
              {(['system', 'light', 'dark'] as const).map((m) => (
                <button
                  key={m}
                  className={`${styles.modeBtn} ${theme === m ? styles.modeBtnActive : ''}`}
                  onClick={() => setTheme(m)}
                >
                  {m === 'system' ? 'Auto' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Theme</label>
            <div className={styles.themeGrid}>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.themeCard} ${visualTheme === t.id ? styles.themeCardActive : ''}`}
                  onClick={() => setVisualTheme(t.id)}
                >
                  <span className={styles.themeName}>{t.name}</span>
                  <span className={styles.themeDesc}>{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          <div className={styles.field}>
            <label className={styles.label}>Agent insights</label>
            <span className={styles.fieldHint}>Coming soon</span>
          </div>
        </section>
      </main>
    </div>
  );
}
