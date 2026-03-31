'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AGENTS, type Agent } from '@artifigenz/shared';
import * as Icons from './AgentIcons';
import styles from './AgentGrid.module.css';

const ICON_MAP: Record<string, ReactNode> = {
  Finance: <Icons.FinanceIcon />,
  Travel: <Icons.TravelIcon />,
  Health: <Icons.HealthIcon />,
  Research: <Icons.ResearchIcon />,
};

function CyclingInsight({ insights, tick }: { insights: string[]; tick: number }) {
  const index = tick % insights.length;
  const [visible, setVisible] = useState(true);
  const [display, setDisplay] = useState(index);

  useEffect(() => {
    if (index === display) return;
    setVisible(false);
    const t = setTimeout(() => {
      setDisplay(index);
      setVisible(true);
    }, 250);
    return () => clearTimeout(t);
  }, [index, display]);

  return (
    <p
      key={display}
      className={`${styles.activeInsight} ${!visible ? styles.insightOut : ''}`}
    >
      {insights[display]}
    </p>
  );
}

export default function AgentGrid() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [ticks, setTicks] = useState<number[]>([0, 0, 0, 0]);
  const active = AGENTS.filter((a) => a.active);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    active.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems((prev) => new Set(prev).add(index));
      }, 300 + index * 70);
      timeouts.push(timeout);
    });
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, []);

  // Cycle one agent at a time
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      setTicks((prev) => {
        const next = [...prev];
        next[current] = prev[current] + 1;
        return next;
      });
      current = (current + 1) % active.length;
    }, 4000);
    return () => clearInterval(interval);
  }, [active.length]);

  return (
    <section className={styles.section}>
      <div className={styles.activeList}>
        {active.map((agent, index) => (
          <div
            key={agent.name}
            className={`${styles.activeCard} ${visibleItems.has(index) ? styles.visible : ''}`}
          >
            <div className={styles.activeLeft}>
              <div className={styles.activeIcon}>{ICON_MAP[agent.name]}</div>
              <div className={styles.activeInfo}>
                <div className={styles.activeNameRow}>
                  <span className={styles.activeName}>{agent.name}</span>
                  <span className={styles.dot} />
                  <span className={styles.activeTime}>{agent.lastActive}</span>
                </div>
                {agent.insights && <CyclingInsight insights={agent.insights} tick={ticks[index]} />}
              </div>
            </div>
            <span className={styles.activeArrow}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
