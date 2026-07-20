import Link from 'next/link';
import { FiExternalLink, FiCheckCircle, FiMonitor, FiTag, FiColumns } from 'react-icons/fi';
import TrackClickLink from './TrackClickLink';
import BookmarkButton from './BookmarkButton';
import UpvoteButton from './UpvoteButton';
import styles from './ToolHero.module.scss';

export default function ToolHero({ tool }) {
  return (
    <div className={styles.hero}>
      <div className={styles.leftPanel}>
        <div className={styles.logoWrapper}>
          {tool.logo ? (
            <img src={tool.logo} alt={`${tool.name} logo`} className={styles.logo} />
          ) : (
            <div className={styles.placeholderLogo}>{tool.name.charAt(0)}</div>
          )}
        </div>

        <div className={styles.badges}>
          {tool.featured && <span className={styles.badgeFeatured}>Featured</span>}
          {tool.new && <span className={styles.badgeNew}>New</span>}
          <span className={styles.badgePricing}>{tool.pricing}</span>
        </div>

        <h1 className={styles.title}>
          {tool.name}
          {tool.verified && <FiCheckCircle className={styles.verifiedIcon} title="Verified Tool" />}
        </h1>

        <p className={styles.description}>{tool.description}</p>

        <div className={styles.metaInfo}>
          <div className={styles.metaItem}>
            <strong>Category:</strong> 
            <span style={{textTransform: 'capitalize'}}>{tool.category}</span>
            {tool.subCategory && <span> ({tool.subCategory})</span>}
          </div>
          
          {tool.platform && tool.platform.length > 0 && (
            <div className={styles.metaItem}>
              <FiMonitor className={styles.icon} />
              <span>{tool.platform.join(', ')}</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <TrackClickLink href={tool.website} slug={tool.slug} className={styles.primaryBtn}>
            Visit Official Website <FiExternalLink />
          </TrackClickLink>
          <Link href={`/ai-tools/compare?tools=${tool.slug}`} className={styles.secondaryBtn}>
            Compare <FiColumns />
          </Link>
          <UpvoteButton slug={tool.slug} />
          <BookmarkButton slug={tool.slug} showLabel={true} />
        </div>
      </div>

      <div className={styles.rightPanel}>
        {tool.banner ? (
          <div className={styles.bannerWrapper}>
            <img src={tool.banner} alt={`${tool.name} preview`} className={styles.banner} />
            <div className={styles.bannerOverlay}></div>
          </div>
        ) : (
          <div className={styles.placeholderBanner}>
            No preview available
          </div>
        )}
      </div>
    </div>
  );
}
