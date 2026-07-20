import React from 'react';
import Link from 'next/link';
import { FaRocket, FaTools, FaShieldAlt, FaCode, FaArrowRight } from 'react-icons/fa';
import styles from './page.module.scss';

export const metadata = {
  title: 'About CodeCraft | The Developer Productivity Platform',
  description: 'Learn about CodeCraft mission to streamline web development with intelligent tools and curated AI productivity resources.',
};

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.badge}>About CodeCraft</span>
        <h1 className={styles.title}>Supercharging Developer Workflows</h1>
        <p className={styles.subtitle}>
          CodeCraft is a high-performance directory and suite of developer utilities designed to accelerate visual styling, code generation, and AI tool discovery.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <FaTools />
          </div>
          <h3>Built-in Utilities</h3>
          <p>
            Instant in-browser generators for CSS glassmorphism, box shadows, gradients, and image compression—no installs or API keys required.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <FaRocket />
          </div>
          <h3>Curated AI Directory</h3>
          <p>
            Explore and compare top-tier AI coding assistants, UI generators, and developer productivity tools with community ratings and upvotes.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <FaShieldAlt />
          </div>
          <h3>Privacy & Speed</h3>
          <p>
            Client-side browser processing ensures zero data retention for your code snippets and image files while maintaining sub-millisecond execution.
          </p>
        </div>
      </div>

      <div className={styles.ctaCard}>
        <h2>Ready to boost your coding efficiency?</h2>
        <p>Explore our full library of interactive developer tools and AI resources.</p>
        <div className={styles.ctaButtons}>
          <Link href="/tools" className="btn-primary">
            Explore Utilities <FaArrowRight />
          </Link>
          <Link href="/ai-tools" className="btn-secondary">
            View AI Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
