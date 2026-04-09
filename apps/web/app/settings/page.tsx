'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
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

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function SettingsContent() {
  const { theme, setTheme, visualTheme, setVisualTheme } = useTheme();
  const api = useApiClient();

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>Settings</h1>

        <ProfileSection />
        <NotificationsSection />
        <ChatInstructionsSection />

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

        <DangerZone api={api} />
      </main>
    </div>
  );
}

// ─── Profile ────────────────────────────────────────────────────

function ProfileSection() {
  const api = useApiClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      .then((data) => {
        if (cancelled) return;
        setEmail(data.email);
        setName(data.name ?? '');
        setOriginalName(data.name ?? '');
      })
      .catch((err: ApiError) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function saveName() {
    if (name === originalName) return;
    setStatus('saving');
    setError(null);
    try {
      await api.patchMe({ name });
      setOriginalName(name);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setError((err as ApiError).message);
      setStatus('error');
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Profile</h2>

      {error && <p className={styles.fieldHint} style={{ color: '#c44' }}>{error}</p>}

      <div className={styles.field}>
        <label className={styles.label}>Name</label>
        <input
          className={styles.input}
          value={name}
          placeholder={loading ? 'Loading…' : 'Your name'}
          disabled={loading}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
        />
        {status === 'saved' && <span className={`${styles.status} ${styles.statusSaved}`}>Saved</span>}
        {status === 'saving' && <span className={styles.status}>Saving…</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input className={styles.input} value={email} readOnly />
      </div>
    </section>
  );
}

// ─── Notifications ──────────────────────────────────────────────

function NotificationsSection() {
  const api = useApiClient();
  const [prefs, setPrefs] = useState<{
    email: { enabled: boolean; address: string | null };
    telegram: { enabled: boolean; chatId: string | null };
  } | null>(null);
  const [emailAddr, setEmailAddr] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getDeliveryPreferences()
      .then((data) => {
        if (cancelled) return;
        setPrefs(data);
        setEmailAddr(data.email.address ?? '');
        setTelegramChatId(data.telegram.chatId ?? '');
      })
      .catch((err: ApiError) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function update(partial: Parameters<typeof api.updateDeliveryPreferences>[0]) {
    setSaving(true);
    setError(null);
    try {
      await api.updateDeliveryPreferences(partial);
      const fresh = await api.getDeliveryPreferences();
      setPrefs(fresh);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  const emailEnabled = prefs?.email.enabled ?? false;
  const telegramEnabled = prefs?.telegram.enabled ?? false;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Notifications</h2>
      {error && <p className={styles.fieldHint} style={{ color: '#c44', marginBottom: 12 }}>{error}</p>}

      {/* Email */}
      <div className={styles.toggleRow}>
        <div className={styles.toggleInfo}>
          <span className={styles.toggleTitle}>Email</span>
          <span className={styles.toggleSubtitle}>
            Receive charge reminders and weekly summaries via email
          </span>
        </div>
        <button
          type="button"
          className={`${styles.switch} ${emailEnabled ? styles.switchOn : ''}`}
          onClick={() =>
            update({ email: { enabled: !emailEnabled, address: emailAddr } })
          }
          disabled={saving}
          aria-label={emailEnabled ? 'Disable email' : 'Enable email'}
        >
          <span className={styles.switchThumb} />
        </button>
      </div>

      {emailEnabled && (
        <div className={styles.field} style={{ marginTop: 12 }}>
          <label className={styles.label}>Email address</label>
          <div className={styles.inlineField}>
            <input
              className={styles.input}
              type="email"
              value={emailAddr}
              onChange={(e) => setEmailAddr(e.target.value)}
              placeholder="you@example.com"
            />
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={saving || !emailAddr}
              onClick={() => update({ email: { enabled: true, address: emailAddr } })}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Telegram */}
      <div className={styles.toggleRow}>
        <div className={styles.toggleInfo}>
          <span className={styles.toggleTitle}>Telegram</span>
          <span className={styles.toggleSubtitle}>
            Receive charge reminders via Telegram bot
          </span>
        </div>
        <button
          type="button"
          className={`${styles.switch} ${telegramEnabled ? styles.switchOn : ''}`}
          onClick={() =>
            update({ telegram: { enabled: !telegramEnabled, chatId: telegramChatId } })
          }
          disabled={saving}
          aria-label={telegramEnabled ? 'Disable Telegram' : 'Enable Telegram'}
        >
          <span className={styles.switchThumb} />
        </button>
      </div>

      {telegramEnabled && (
        <div className={styles.field} style={{ marginTop: 12 }}>
          <label className={styles.label}>How to connect</label>
          <p className={styles.fieldHint} style={{ lineHeight: 1.55, marginBottom: 10 }}>
            1. Open Telegram and search for{' '}
            <strong style={{ color: 'var(--text)' }}>@Artifigenz_bot</strong>
            <br />
            2. Tap Start and send any message
            <br />
            3. Search for <strong style={{ color: 'var(--text)' }}>@userinfobot</strong>, tap Start — it replies with your ID
            <br />
            4. Paste your ID below
          </p>
          <div className={styles.inlineField}>
            <input
              className={styles.input}
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Your Telegram user ID"
            />
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={saving || !telegramChatId}
              onClick={() =>
                update({ telegram: { enabled: true, chatId: telegramChatId } })
              }
            >
              Save
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Chat custom instructions ───────────────────────────────────

function ChatInstructionsSection() {
  const api = useApiClient();
  const [value, setValue] = useState('');
  const [original, setOriginal] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getChatInstructions()
      .then((data) => {
        if (cancelled) return;
        setValue(data.instructions ?? '');
        setOriginal(data.instructions ?? '');
      })
      .catch((err: ApiError) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function save() {
    setSaving(true);
    setStatus('saving');
    setError(null);
    try {
      await api.updateChatInstructions(value.trim() ? value.trim() : null);
      setOriginal(value);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setError((err as ApiError).message);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  const dirty = value !== original;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Chat</h2>

      <div className={styles.field}>
        <label className={styles.label}>Custom instructions</label>
        <p className={styles.fieldHint} style={{ marginBottom: 10, lineHeight: 1.55 }}>
          Anything you say here is included in every chat. Example: &quot;I prefer concise answers. I&apos;m based in SF.
          Always show amounts in USD.&quot;
        </p>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={4000}
          rows={5}
          placeholder="Tell Artifigenz how you&rsquo;d like it to respond…"
        />
        {error && <p className={styles.fieldHint} style={{ color: '#c44', marginTop: 8 }}>{error}</p>}
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={save}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {status === 'saved' && <span className={`${styles.status} ${styles.statusSaved}`}>Saved</span>}
        </div>
      </div>
    </section>
  );
}

// ─── Danger zone: delete account with email verification ────────

function DangerZone({ api }: { api: ReturnType<typeof useApiClient> }) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'verify'>('idle');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useClerk();
  const router = useRouter();

  async function requestDeletion() {
    setBusy(true);
    setError(null);
    try {
      await api.requestAccountDeletion();
      setStep('verify');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeletion() {
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await api.confirmAccountDeletion(code);
      // User is deleted in our DB and from Clerk — sign out client-side and go home
      await signOut();
      router.replace('/');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className={styles.section}>
        <div className={styles.dangerSection}>
          <h3 className={styles.dangerTitle}>Delete account</h3>
          <p className={styles.dangerCopy}>
            Permanently remove your account, all connected data sources, insights, subscriptions, and chat history.
            This cannot be undone. We&rsquo;ll send a verification code to your email to confirm.
          </p>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => {
              setStep('confirm');
              setError(null);
              setCode('');
            }}
          >
            Delete my account
          </button>
        </div>
      </section>

      {step === 'confirm' && (
        <div className={styles.modalOverlay} onClick={() => !busy && setStep('idle')}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Delete your account?</h2>
            <p className={styles.modalCopy}>
              This will permanently delete your Artifigenz account and all associated data. We&rsquo;ll send a
              6-digit verification code to your email. You have 10 minutes to enter it.
            </p>
            {error && <p className={styles.fieldHint} style={{ color: '#c44' }}>{error}</p>}
            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={() => setStep('idle')} disabled={busy}>
                Cancel
              </button>
              <button className={styles.dangerBtn} onClick={requestDeletion} disabled={busy}>
                {busy ? 'Sending code…' : 'Send code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className={styles.modalOverlay} onClick={() => !busy && setStep('idle')}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Enter verification code</h2>
            <p className={styles.modalCopy}>
              We sent a 6-digit code to your email. Enter it below to confirm deletion. This cannot be undone.
            </p>
            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              autoFocus
              style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: '1rem', maxWidth: '100%' }}
            />
            {error && <p className={styles.fieldHint} style={{ color: '#c44', marginTop: 8 }}>{error}</p>}
            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={() => setStep('idle')} disabled={busy}>
                Cancel
              </button>
              <button
                className={styles.dangerBtn}
                onClick={confirmDeletion}
                disabled={busy || code.length !== 6}
              >
                {busy ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
