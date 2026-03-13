'use client';

import { useEffect, useState } from 'react';
import { PRODUCTS } from '@/lib/constants';
import styles from './ProductList.module.css';

export default function ProductList() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    PRODUCTS.forEach((product, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems((prev) => new Set(prev).add(index));
      }, 600 + product.delay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <section className={styles.products}>
      <div className={styles.productsLabel}>the fleet</div>
      <div className={styles.productsList}>
        {PRODUCTS.map((product, index) => (
          <div
            key={product.name}
            className={`${styles.productItem} ${visibleItems.has(index) ? styles.visible : ''}`}
          >
            <div className={styles.productName}>{product.name}</div>
            <div className={styles.productDesc}>{product.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
