import React from 'react';
import Link from 'next/link';
import { FaUsers, FaComments, FaLayerGroup, FaRocket, FaHeart, FaCodeBranch } from 'react-icons/fa';
import styles from './page.module.scss';

export const metadata = {
  title: 'Developer Community | CodeCraft',
  description: 'Join the CodeCraft developer community. Discover curated AI stacks, share workflows, and connect with creators.',
};

export default function CommunityPage() {
  const communityStats = [
    { label: 'Active Developers', value: '12,500+', icon: <FaUsers /> },
    { label: 'Curated Workflows', value: '1,400+', icon: <FaLayerGroup /> },
    { label: 'Community Contributions', value: '3,200+', icon: <FaCodeBranch /> },
    { label: 'Tools Upvoted', value: '45,000+', icon: <FaHeart /> },
  ];

  const featuredDiscussions = [
    {
      id: 1,
      title: 'What is your go-to AI coding assistant in 2026?',
      author: 'alex_dev',
      replies: 42,
      category: 'Discussion',
      tag: 'AI Tools',
    },
    {
      id: 2,
      title: 'Top 5 open-source color palette generators for Next.js apps',
      author: 'sarah_design',
      replies: 28,
      category: 'Showcase',
      tag: 'Design',
    },
    {
      id: 3,
      title: 'How to automate boilerplate generation using custom AI prompts',
      author: 'michael_tech',
      replies: 35,
      category: 'Tutorial',
      tag: 'Productivity',
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.heroSection}>
        <div className={styles.badge}>
          <FaUsers /> Developer Community
        </div>
        <h1 className={styles.title}>
          Build, Share & Scale with <span className={styles.highlight}>AI-Powered Workflows</span>
        </h1>
        <p className={styles.subtitle}>
          Connect with thousands of developers, UI/UX architects, and tech creators. Explore community insights, upvote tools, and level up your software engineering workflow.
        </p>

        <div className={styles.heroActions}>
          <Link href="/ai-tools" className={styles.primaryBtn}>
            Explore AI Directory <FaRocket />
          </Link>
          <Link href="/tools" className={styles.secondaryBtn}>
            Try Internal AI Tools
          </Link>
        </div>
      </header>

      {/* Community Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {communityStats.map((stat, idx) => (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Discussions Showcase */}
      <section className={styles.discussionsSection}>
        <div className={styles.sectionHeader}>
          <h2>Popular Community Topics</h2>
          <p>Join conversations and exchange insights with fellow engineers.</p>
        </div>

        <div className={styles.discussionsGrid}>
          {featuredDiscussions.map((topic) => (
            <div key={topic.id} className={styles.discussionCard}>
              <div className={styles.cardHeader}>
                <span className={styles.topicTag}>{topic.tag}</span>
                <span className={styles.topicReplies}><FaComments /> {topic.replies} replies</span>
              </div>
              <h3 className={styles.topicTitle}>{topic.title}</h3>
              <div className={styles.cardFooter}>
                <span className={styles.author}>Posted by @{topic.author}</span>
                <span className={styles.categoryBadge}>{topic.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community CTA */}
      <section className={styles.ctaCard}>
        <h2>Want to contribute or share your workflow?</h2>
        <p>Sign up to upvote your favorite tools, write reviews, and save personalized toolkits.</p>
        <Link href="/login" className={styles.ctaBtn}>
          Join CodeCraft Community
        </Link>
      </section>
    </div>
  );
}
