'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useApiClient } from '@/hooks/useApiClient';
import styles from './page.module.css';

interface BriefNumber {
  value: string;
  phrase: string;
}

interface Brief {
  id: string;
  verdict: string;
  numbers: BriefNumber[];
  paragraph: string;
  data_scope: string;
  generated_at: string;
}

export default function FinanceBriefPage() {
  const api = useApiClient();
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getCurrentBrief();
        if (!cancelled) setBrief(data);
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          // No brief yet — go run the pipeline.
          router.replace('/finance/loading');
          return;
        }
        setError(
          (err as { message?: string })?.message ??
            'Failed to load your brief',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, router]);

  if (error) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.container}>
          <div className={styles.eyebrow}>Your brief</div>
          <p className={styles.paragraph}>{error}</p>
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className={styles.page}>
        <Header />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <div className={`${styles.eyebrow} ${styles.fadeIn}`}>Your brief</div>

        <h1 className={`${styles.verdict} ${styles.fadeIn}`}>{brief.verdict}</h1>

        <div className={`${styles.numbers} ${styles.fadeIn}`}>
          {brief.numbers.map((n, i) => (
            <div key={`${n.value}-${i}`} className={styles.numberRow}>
              <span className={styles.numberValue}>{n.value}</span>
              <span className={styles.numberPhrase}>{n.phrase}</span>
            </div>
          ))}
        </div>

        <p className={`${styles.paragraph} ${styles.fadeIn}`}>{brief.paragraph}</p>

        <p className={`${styles.dataScope} ${styles.fadeIn}`}>{brief.data_scope}</p>

        <p className={`${styles.closeLine} ${styles.fadeIn}`}>
          Your brief updates weekly. I&apos;ll flag anything that matters. — your finance agent
        </p>
      </div>
    </div>
  );
}
