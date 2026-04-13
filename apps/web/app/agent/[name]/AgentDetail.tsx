'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import ChatPanel from '@/components/sections/ChatPanel';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AGENTS } from '@artifigenz/shared';
import { useActivatedAgents, agentSlug } from '@/hooks/useActivatedAgents';
import { useApiClient } from '@/hooks/useApiClient';
import * as Icons from '@/components/sections/AgentIcons';
import styles from './page.module.css';

const ICON_MAP: Record<string, React.ComponentType> = {
  Finance: Icons.FinanceIcon,
  Travel: Icons.TravelIcon,
  Health: Icons.HealthIcon,
  Research: Icons.ResearchIcon,
  'Job Search': Icons.JobSearchIcon,
};

interface Insight {
  id: string;
  title: string;
  description: string | null;
  insightTypeId: string;
  isCritical: boolean;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown>;
}

export default function AgentDetail({ params }: { params: Promise<{ name: string }> }) {
  return (
    <ProtectedRoute>
      <AgentDetailContent params={params} />
    </ProtectedRoute>
  );
}

function AgentDetailContent({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const { isActivated, hydrated, getActivation } = useActivatedAgents();
  const api = useApiClient();

  const slug = name.toLowerCase();
  const activation = getActivation(slug);
  const agent = AGENTS.find((a) => agentSlug(a.name) === slug);
  const IconComponent = agent ? ICON_MAP[agent.name] : undefined;

  // ─── Real data from API ───────────────────────────────────────
  const [insights, setInsights] = useState<Insight[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInsights = useCallback(async () => {
    try {
      const data = await api.getInsights({ agentTypeId: slug, limit: 50 });
      setInsights(data.insights);
      setUnreadCount(data.unreadCount);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  }, [api, slug]);

  useEffect(() => {
    if (!hydrated || !isActivated(slug)) {
      setLoading(false);
      return;
    }
    fetchInsights();
  }, [hydrated, isActivated, slug, fetchInsights]);

  // ─── File upload ──────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadStatus('Uploading and analyzing... this may take up to 30 seconds');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.uploadFile(formData);
      setUploadStatus(
        `Found ${res.transactions} transactions and generated ${res.insights} insights.`,
      );
      await fetchInsights();
      setTimeout(() => setUploadStatus(null), 6000);
    } catch (err) {
      setUploadStatus(`Error: ${err instanceof Error ? err.message : 'Upload failed'}`);
      setTimeout(() => setUploadStatus(null), 6000);
    } finally {
      setUploading(false);
    }
  };

  // ─── Mark read ────────────────────────────────────────────────
  const markRead = async (insightId: string) => {
    try {
      await api.markInsightRead(insightId);
      setInsights((prev) =>
        prev.map((i) => (i.id === insightId ? { ...i, isRead: true } : i)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  // ─── Not found ────────────────────────────────────────────────
  if (!agent) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}><p>Agent not found.</p></main>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <Link href="/app" className={styles.back}>← Back</Link>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Loading...</p>
        </main>
      </div>
    );
  }

  // ─── Not activated ────────────────────────────────────────────
  if (!isActivated(slug)) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <Link href="/app" className={styles.back}>← Back</Link>
          <div className={styles.agentHeader}>
            <div>
              <div className={styles.nameRow}>
                {IconComponent && <span className={styles.icon}><IconComponent /></span>}
                <h1 className={styles.agentName}>{agent.name}</h1>
              </div>
              <p className={styles.since}>{agent.pitch}</p>
            </div>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            This agent is not activated yet.{' '}
            <Link
              href={`/agent/${slug}/activate`}
              style={{ color: 'var(--text)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Activate it
            </Link>{' '}
            to start getting insights.
          </p>
        </main>
      </div>
    );
  }

  // ─── Stats from insight data ──────────────────────────────────
  const visibilityInsight = insights.find((i) => i.insightTypeId === 'finance.subscriptions.visibility');
  const subCount = (visibilityInsight?.data as { count?: number })?.count ?? 0;
  const monthlyTotal = (visibilityInsight?.data as { monthlyTotal?: number })?.monthlyTotal ?? 0;
  const chargeReminders = insights.filter((i) => i.insightTypeId === 'finance.subscriptions.charge-reminder');

  const stats = [
    { value: String(subCount), label: 'Subscriptions' },
    { value: `$${monthlyTotal.toFixed(0)}`, label: 'Monthly recurring' },
    { value: String(chargeReminders.length), label: 'Upcoming charges' },
    { value: String(unreadCount), label: 'Unread insights' },
  ];

  // ─── Group insights by date ───────────────────────────────────
  const groups = new Map<string, Insight[]>();
  for (const insight of insights) {
    const date = new Date(insight.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    const existing = groups.get(label) ?? [];
    existing.push(insight);
    groups.set(label, existing);
  }

  const categoryLabel = (typeId: string): string => {
    if (typeId.includes('charge-reminder')) return 'Charge Reminder';
    if (typeId.includes('visibility')) return 'Overview';
    if (typeId.includes('price-change')) return 'Price Change';
    if (typeId.includes('new-detected')) return 'New Subscription';
    if (typeId.includes('duplicate')) return 'Duplicate';
    if (typeId.includes('summary')) return 'Summary';
    return 'Insight';
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Link href="/app" className={styles.back}>← Back</Link>

        {/* Agent header */}
        <div className={styles.agentHeader}>
          <div>
            <div className={styles.nameRow}>
              {IconComponent && <span className={styles.icon}><IconComponent /></span>}
              <h1 className={styles.agentName}>{agent.name}</h1>
            </div>
            <p className={styles.since}>{agent.pitch}</p>
          </div>
          <div className={styles.badges}>
            <span className={styles.activeBadge}><span className={styles.dot} />Active</span>
          </div>
        </div>

        {/* Upload bank statement */}
        <div
          style={{
            border: '1px dashed var(--border-light)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', margin: '0 0 4px' }}>
              Upload a bank statement
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
              PDF, CSV, or image. We&rsquo;ll find your subscriptions automatically.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {uploadStatus && (
              <span style={{
                fontSize: '0.75rem',
                color: uploadStatus.startsWith('Error') ? '#c44' : 'var(--text-dim)',
                maxWidth: '300px',
              }}>
                {uploadStatus}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.txt,.jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                fontFamily: 'inherit',
                fontSize: '0.78rem',
                fontWeight: 500,
                color: 'var(--accent-text)',
                background: 'var(--accent)',
                border: '1px solid var(--accent)',
                padding: '9px 18px',
                borderRadius: '9999px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {uploading ? 'Analyzing...' : 'Choose file'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {insights.length > 0 && (
          <div className={styles.statsSection}>
            <span className={styles.statsTitle}>Financial Health</span>
            <div className={styles.statsGrid}>
              {stats.map((s) => (
                <div key={s.label}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights timeline */}
        {loading ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Loading insights...</p>
        ) : insights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '8px' }}>No insights yet</p>
            <p style={{ fontSize: '0.78rem' }}>
              Upload a bank statement above to get started. We&rsquo;ll find your subscriptions,
              detect price changes, and alert you about upcoming charges.
            </p>
          </div>
        ) : (
          Array.from(groups.entries()).map(([date, groupInsights]) => (
            <div key={date} className={styles.timelineGroup}>
              <span className={`${styles.timelineDate} ${groupInsights.every((i) => i.isRead) ? styles.timelineDateRead : ''}`}>
                {date}
              </span>
              <div className={styles.timelineCards}>
                {groupInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`${styles.insightCard} ${insight.isRead ? styles.insightRead : ''}`}
                    onClick={() => !insight.isRead && markRead(insight.id)}
                    style={{ cursor: insight.isRead ? 'default' : 'pointer' }}
                  >
                    <div className={styles.insightTop}>
                      <span className={styles.insightCategory}>
                        {!insight.isRead && <span className={styles.insightDot} />}
                        {categoryLabel(insight.insightTypeId)}
                      </span>
                      {insight.isCritical && <span className={styles.mustSee}>Critical</span>}
                    </div>
                    <p className={styles.insightTitle}>{insight.title}</p>
                    {insight.description && (
                      <p className={styles.insightDetail}>{insight.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
      <ChatPanel agentName={agent.name} agentInstanceId={activation?.agentInstanceId} />
    </div>
  );
}
