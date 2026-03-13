import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.heroTitle}>
        <span className={styles.heroBrand}>Artifigenz.</span>
        Built for the
        <br />
        agentic era
      </h1>
      <p className={styles.heroTagline}>agents. building. agents.</p>
    </section>
  );
}
