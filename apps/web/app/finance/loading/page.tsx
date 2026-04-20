'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useApiClient } from '@/hooks/useApiClient';
import styles from './page.module.css';

const CHECKLIST_LINES = [
  'Reviewing your accounts',
  'Mapping your recurring obligations',
  'Finding the patterns in your spending',
  'Preparing your brief',
];

const PHASE_PACE_MS = 2000;
const MIN_TOTAL_MS = 8000;

type Status = 'pending' | 'active' | 'done';

type ServerEvent =
  | { type: 'progress'; phase: 1 | 2 | 3 | 4 }
  | { type: 'complete'; brief_id: string }
  | { type: 'insufficient_data'; days_available: number; min_required: number }
  | { type: 'error'; message: string };

interface QueuedEvent {
  minShowAt: number;
  event: ServerEvent;
}

/**
 * Parse an SSE stream from a fetch Response body. Yields each parsed event.
 */
async function* parseSseStream(res: Response): AsyncGenerator<ServerEvent> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIdx;
    while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);
      const dataLine = block
        .split('\n')
        .find((l) => l.startsWith('data:'));
      if (!dataLine) continue;
      try {
        const parsed = JSON.parse(dataLine.slice(5).trim()) as ServerEvent;
        yield parsed;
      } catch {
        // ignore malformed frame
      }
    }
  }
}

export default function FinanceLoadingPage() {
  const api = useApiClient();
  const router = useRouter();
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<{ days: number; min: number } | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    setPhase(0);
    setErrorMessage(null);
    setInsufficient(null);

    const startedAt = Date.now();
    const queue: QueuedEvent[] = [];
    let releaseTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Hold each event until the 2s-per-phase / 8s-min schedule permits it.
     * If the backend is slower, we just wait for the next real event.
     */
    function scheduleRelease() {
      if (releaseTimer) return;
      const now = Date.now();
      const next = queue[0];
      if (!next) return;
      const delay = Math.max(0, next.minShowAt - now);
      releaseTimer = setTimeout(() => {
        releaseTimer = null;
        const item = queue.shift();
        if (!item || cancelled.current) return;
        apply(item.event);
        scheduleRelease();
      }, delay);
    }

    function enqueue(event: ServerEvent) {
      let minShowAt: number;
      if (event.type === 'progress') {
        // phase 1 shows at >= 0ms, phase 2 at >= 2000ms, etc. (spec §2.3)
        minShowAt = startedAt + (event.phase - 1) * PHASE_PACE_MS;
      } else if (event.type === 'complete') {
        minShowAt = startedAt + MIN_TOTAL_MS;
      } else {
        minShowAt = startedAt; // errors / insufficient_data surface immediately
      }
      queue.push({ minShowAt, event });
      scheduleRelease();
    }

    function apply(event: ServerEvent) {
      if (event.type === 'progress') {
        setPhase(event.phase);
      } else if (event.type === 'complete') {
        router.replace('/finance');
      } else if (event.type === 'insufficient_data') {
        setInsufficient({ days: event.days_available, min: event.min_required });
      } else if (event.type === 'error') {
        setErrorMessage(event.message);
      }
    }

    (async () => {
      try {
        const { generation_id } = await api.generateBrief();
        const res = await api.briefEventsResponse(generation_id);
        for await (const event of parseSseStream(res)) {
          if (cancelled.current) break;
          enqueue(event);
          if (
            event.type === 'complete' ||
            event.type === 'error' ||
            event.type === 'insufficient_data'
          ) {
            break;
          }
        }
      } catch (err) {
        if (cancelled.current) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : (err as { message?: string })?.message ?? 'Failed to start brief generation',
        );
      }
    })();

    return () => {
      cancelled.current = true;
      if (releaseTimer) clearTimeout(releaseTimer);
    };
  }, [api, router, attemptKey]);

  const lines = CHECKLIST_LINES.map((label, i): { label: string; state: Status } => {
    if (insufficient && i === 2) return { label: 'Gathering more signal', state: 'active' };
    if (insufficient && i >= 2) return { label, state: 'pending' };
    const lineIndex = i + 1; // 1..4
    let state: Status = 'pending';
    if (phase >= lineIndex) state = 'done';
    else if (phase + 1 === lineIndex && phase > 0) state = 'active';
    else if (phase === 0 && i === 0) state = 'active';
    return { label, state };
  });

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.card}>
        <div className={styles.eyebrow}>Your agent is analyzing your accounts</div>

        <div className={styles.checklist}>
          {lines.map((line) => {
            const bulletCls =
              line.state === 'done'
                ? `${styles.bullet} ${styles.bulletDone}`
                : line.state === 'active'
                  ? `${styles.bullet} ${styles.bulletActive}`
                  : `${styles.bullet} ${styles.bulletPending}`;
            const textCls =
              line.state === 'done'
                ? styles.textDone
                : line.state === 'active'
                  ? styles.textActive
                  : styles.textPending;
            return (
              <div key={line.label} className={styles.line}>
                <span className={bulletCls}>{line.state === 'done' ? '✓' : ''}</span>
                <span className={textCls}>
                  {line.label}
                  {line.state === 'active' ? '…' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {insufficient ? (
          <p className={styles.note}>
            I need a little more history before I can give you a real read. Come back tomorrow — I&apos;ll have something for you.
          </p>
        ) : errorMessage ? (
          <>
            <p className={`${styles.note} ${styles.errorNote}`}>
              Something went wrong: {errorMessage}
            </p>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={() => setAttemptKey((k) => k + 1)}
            >
              Try again
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
