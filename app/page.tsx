import ParticleCanvas from '@/components/effects/ParticleCanvas';
import GrainOverlay from '@/components/effects/GrainOverlay';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import ProductList from '@/components/sections/ProductList';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <ParticleCanvas />
      <GrainOverlay />
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.mainInner}>
            <Hero />
            <ProductList />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
