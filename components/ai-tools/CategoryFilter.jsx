'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './CategoryFilter.module.scss';

export default function CategoryFilter({ categories }) {
  const pathname = usePathname();

  return (
    <div className={styles.categoryFilter}>
      <Link 
        href="/ai-tools" 
        className={`${styles.categoryBtn} ${pathname === '/ai-tools' ? styles.active : ''}`}
      >
        All Tools
      </Link>
      
      {categories.map((category) => {
        const isActive = pathname === `/ai-tools/${category.slug}`;
        return (
          <Link 
            key={category.id} 
            href={`/ai-tools/${category.slug}`}
            className={`${styles.categoryBtn} ${isActive ? styles.active : ''}`}
          >
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
