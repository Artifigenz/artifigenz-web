'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AGENTS } from '@/lib/constants';
import * as Icons from './AgentIcons';
import styles from './AgentGrid.module.css';

const ICON_MAP: Record<string, ReactNode> = {
  Finance: <Icons.FinanceIcon />,
  Travel: <Icons.TravelIcon />,
  Health: <Icons.HealthIcon />,
  Research: <Icons.ResearchIcon />,
  Learning: <Icons.LearningIcon />,
  Shopping: <Icons.ShoppingIcon />,
  Content: <Icons.ContentIcon />,
  Time: <Icons.TimeIcon />,
  Legal: <Icons.LegalIcon />,
  Career: <Icons.CareerIcon />,
  'Real Estate': <Icons.RealEstateIcon />,
  Parenting: <Icons.ParentingIcon />,
  Fitness: <Icons.FitnessIcon />,
  Nutrition: <Icons.NutritionIcon />,
  Events: <Icons.EventsIcon />,
  Tax: <Icons.TaxIcon />,
  News: <Icons.NewsIcon />,
  Relationships: <Icons.RelationshipsIcon />,
  Home: <Icons.HomeIcon />,
  Investments: <Icons.InvestmentsIcon />,
};

const MAX_SKILLS = 3;

export default function AgentGrid() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  const active = AGENTS.filter((a) => a.active);
  const explore = AGENTS.filter((a) => !a.active);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    AGENTS.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems((prev) => new Set(prev).add(index));
      }, 300 + index * 50);
      timeouts.push(timeout);
    });
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <section className={styles.section}>
      {/* Active agents — row cards */}
      <div className={styles.category}>
        <div className={styles.categoryHeader}>
          <h2 className={styles.categoryTitle}>Active</h2>
          <span className={styles.categoryCount}>{active.length} agents working</span>
        </div>
        <div className={styles.activeList}>
          {active.map((agent) => {
            const gi = AGENTS.indexOf(agent);
            return (
              <div
                key={agent.name}
                className={`${styles.activeCard} ${visibleItems.has(gi) ? styles.visible : ''}`}
              >
                <div className={styles.activeLeft}>
                  <div className={styles.activeIcon}>{ICON_MAP[agent.name]}</div>
                  <div className={styles.activeInfo}>
                    <div className={styles.activeNameRow}>
                      <span className={styles.activeName}>{agent.name}</span>
                      <span className={styles.dot} />
                      <span className={styles.activeTime}>{agent.lastActive}</span>
                    </div>
                    <p className={styles.activeInsight}>{agent.insight}</p>
                  </div>
                </div>
                <span className={styles.activeArrow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explore agents — tile cards */}
      <div className={styles.category}>
        <div className={styles.categoryHeader}>
          <h2 className={styles.categoryTitle}>Explore</h2>
          <span className={styles.categoryCount}>{explore.length} available</span>
        </div>
        <div className={styles.grid}>
          {explore.map((agent) => {
            const gi = AGENTS.indexOf(agent);
            const shown = agent.skills.slice(0, MAX_SKILLS);
            const remaining = agent.skills.length - MAX_SKILLS;
            const skillText = shown.join(' · ') + (remaining > 0 ? ` · +${remaining} more` : '');

            return (
              <div
                key={agent.name}
                className={`${styles.card} ${visibleItems.has(gi) ? styles.visible : ''}`}
              >
                <div className={styles.top}>
                  <div className={styles.icon}>{ICON_MAP[agent.name]}</div>
                  <div className={styles.name}>{agent.name}</div>
                </div>
                <p className={styles.pitch}>{agent.pitch}</p>
                <div className={styles.skills}>{skillText}</div>
                <div className={styles.bottom}>
                  <button className={styles.activate}>
                    Activate
                    <span className={styles.activateIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
