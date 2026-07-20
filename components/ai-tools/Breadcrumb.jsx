import Link from 'next/link';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import styles from './Breadcrumb.module.scss';

export default function Breadcrumb({ items }) {
  return (
    <nav className={styles.breadcrumb}>
      <Link href="/" className={styles.item}>
        <FiHome className={styles.icon} /> Home
      </Link>
      
      {items.map((item, index) => (
        <span key={index} className={styles.itemWrapper}>
          <FiChevronRight className={styles.separator} />
          {item.href ? (
            <Link href={item.href} className={styles.item}>
              {item.label}
            </Link>
          ) : (
            <span className={`${styles.item} ${styles.active}`}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
