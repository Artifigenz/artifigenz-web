import { FOUNDERS, SOCIAL } from '@/lib/constants';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerLeft}>
        Founded by{' '}
        <a href={FOUNDERS[0].url} target="_blank" rel="noopener noreferrer">
          {FOUNDERS[0].name}
        </a>{' '}
        and{' '}
        <a href={FOUNDERS[1].url} target="_blank" rel="noopener noreferrer">
          {FOUNDERS[1].name}
        </a>
      </p>
      <div className={styles.footerRight}>
        <a
          href={SOCIAL.x.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
        >
          <svg viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {SOCIAL.x.handle}
        </a>
      </div>
    </footer>
  );
}
