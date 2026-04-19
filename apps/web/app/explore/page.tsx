'use client';

import Header from '@/components/layout/Header';
import { AGENTS } from '@artifigenz/shared';
import { useActivatedAgents, agentSlug } from '@/hooks/useActivatedAgents';
import ExploreGrid from '@/components/sections/ExploreGrid';
import styles from './page.module.css';

export default function ExplorePage() {
  const { slugs } = useActivatedAgents();
  const explore = AGENTS.filter((a) => !slugs.includes(agentSlug(a.name)));

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Explore Agents</h1>
          <p className={styles.sub}>Specialists ready to work for you. Activate any agent and it starts immediately.</p>
        </div>
        <ExploreGrid agents={explore} />
      </main>
    </div>
  );
}
