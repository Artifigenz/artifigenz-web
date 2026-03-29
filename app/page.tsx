import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import AgentGrid from '@/components/sections/AgentGrid';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Hero />
        <AgentGrid />
      </main>
      <Footer />
    </div>
  );
}
