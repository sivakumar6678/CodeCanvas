import React from 'react';
import Link from 'next/link';
import { FaRocket, FaTools, FaCode, FaArrowRight } from 'react-icons/fa';
import styles from './page.module.scss';

export const metadata = {
  title: 'About CodeCanvas | Your AI & Developer Toolkit',
  description: 'CodeCanvas is your AI & Developer Toolkit for discovering tools, building practical workflows, and learning faster.',
};

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.badge}>About CodeCanvas</span>
        <h1 className={styles.title}>Your AI &amp; Developer Toolkit</h1>
        <p className={styles.subtitle}>
          Discover. Build. Learn. CodeCanvas helps developers find useful tools, shape practical workflows, and keep learning.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <FaTools />
          </div>
          <h3>Discover and Compare</h3>
          <p>
            Browse a curated directory of AI and developer tools, filter by what matters, compare options, and save the tools you want to revisit.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <FaRocket />
          </div>
          <h3>Build Your Kit</h3>
          <p>
            Turn a goal and a little context into a considered workflow, with recommendations and alternatives you can review before choosing.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <FaCode />
          </div>
          <h3>Learn with the Community</h3>
          <p>
            Explore AI Knowledge, contribute useful tools and learning resources, and use built-in developer utilities for everyday tasks.
          </p>
        </div>
      </div>

      <div className={styles.ctaCard}>
        <h2>Built for developers who want to move with more clarity.</h2>
        <p>CodeCanvas brings curated discovery, practical building tools, and shared knowledge into one place.</p>
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
