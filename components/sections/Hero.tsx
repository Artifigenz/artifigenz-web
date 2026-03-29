'use client';

import { useEffect, useState } from 'react';
import styles from './Hero.module.css';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

export default function Hero() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  if (!greeting) return null;

  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>
        {greeting}, Suba
      </h1>
      <p className={styles.sub}>
        3 agents worked overnight. 2 need your approval.
      </p>
    </section>
  );
}
