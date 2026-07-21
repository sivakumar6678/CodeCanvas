import Link from 'next/link';
import { FiExternalLink, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import TrackClickLink from './TrackClickLink';
import UpvoteButton from './UpvoteButton';
import BookmarkButton from './BookmarkButton';
import styles from './AIToolCard.module.scss';

export default function AIToolCard({ tool }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.logoContainer}>
          {tool.logo ? (
            <img src={tool.logo} alt={`${tool.name} logo`} className={styles.logo} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
          ) : (
            <div className={styles.placeholderLogo}>{tool.name.charAt(0)}</div>
          )}
        </div>
        <div className={styles.badges}>
          {tool.featured && <span className={styles.badgeFeatured}>Featured</span>}
          {tool.new && <span className={styles.badgeNew}>New</span>}
          <span className={styles.badgePricing}>{tool.pricing}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>
          {tool.name}
          {tool.verified && <FiCheckCircle className={styles.verifiedIcon} title="Verified Tool" />}
        </h3>
        <p className={styles.description}>{tool.description}</p>
        
        <div className={styles.tags}>
          {tool.tags?.slice(0, 3).map((tag, i) => (
            <span key={i} className={styles.tag}>{tag}</span>
          ))}
          {tool.tags?.length > 3 && (
            <span className={styles.tag}>+{tool.tags.length - 3}</span>
          )}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <UpvoteButton slug={tool.slug} compact={true} />
        <BookmarkButton slug={tool.slug} />
        <Link href={`/ai-tools/tool/${tool.slug}`} className={styles.detailsBtn}>
          Details <FiArrowRight />
        </Link>
        <TrackClickLink href={tool.website} slug={tool.slug} className={styles.websiteBtn}>
          Visit <FiExternalLink />
        </TrackClickLink>
      </div>
    </div>
  );
}
