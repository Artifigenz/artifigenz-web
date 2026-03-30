'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AGENTS } from '@/lib/constants';
import styles from './ChatInput.module.css';

const SUGGESTED = AGENTS.filter((a) => !a.active).slice(0, 5);

const QUICK_AGENTS = [
  { name: 'Finance', icon: '$' },
  { name: 'Travel', icon: '✈' },
  { name: 'Research', icon: '⌕' },
];

export default function ChatInput() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.box}>
          <textarea
            className={styles.input}
            placeholder={selectedAgent ? `Ask ${selectedAgent} agent...` : 'Ask anything or give a task...'}
            rows={1}
          />
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.addWrap} ref={menuRef}>
                <button
                  className={styles.addBtn}
                  aria-label="Add agent"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className={styles.menu}>
                    {SUGGESTED.map((agent) => (
                      <button
                        key={agent.name}
                        className={styles.menuItem}
                        onClick={() => {
                          setSelectedAgent(agent.name);
                          setMenuOpen(false);
                        }}
                      >
                        <span className={styles.menuName}>{agent.name}</span>
                        <span className={styles.menuPitch}>{agent.pitch}</span>
                      </button>
                    ))}
                    <Link
                      href="/explore"
                      className={styles.menuExplore}
                      onClick={() => setMenuOpen(false)}
                    >
                      Explore all agents →
                    </Link>
                  </div>
                )}
              </div>
              {QUICK_AGENTS.map((a) => (
                <button
                  key={a.name}
                  className={`${styles.agentChip} ${selectedAgent === a.name ? styles.agentChipActive : ''}`}
                  onClick={() => setSelectedAgent(selectedAgent === a.name ? null : a.name)}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <button className={styles.sendBtn} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
