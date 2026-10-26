import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './BrandLogo.module.scss';

const SIZES = {
  sm: { img: 28, className: styles.sizeSm },
  md: { img: 36, className: styles.sizeMd },
  lg: { img: 48, className: styles.sizeLg },
  xl: { img: 64, className: styles.sizeXl },
  full: { img: 1254, className: styles.sizeFull },
};

export default function BrandLogo({
  size = 'md',
  variant = 'symbol',
  showText = true,
  subtitle = '',
  href = '/',
  priority = false,
  className = '',
  onClick,
}) {
  const sizeConfig = SIZES[size] || SIZES.md;
  const isFullLogo = variant === 'full';
  const imgPixelSize = isFullLogo ? 1254 : sizeConfig.img;

  const content = (
    <>
      <span className={styles.logoMarkWrapper}>
        <Image
          src={isFullLogo ? '/assets/codecanvas-full.png' : '/assets/codecanvas-icon.png'}
          alt={isFullLogo ? 'CodeCanvas — Your AI & Developer Toolkit. Discover. Build. Learn.' : ''}
          width={imgPixelSize}
          height={imgPixelSize}
          priority={priority}
          unoptimized={isFullLogo}
          className={styles.logoImage}
          aria-hidden={isFullLogo ? undefined : true}
        />
      </span>
      {showText && !isFullLogo && (
        <span className={styles.brandText}>
          <span className={styles.brandName}>
            Code<span className={styles.accent}>Canvas</span>
          </span>
          {subtitle && (
            <span className={styles.brandSubtitle}>{subtitle}</span>
          )}
        </span>
      )}
    </>
  );

  const combinedClass = `${styles.brandLogo} ${sizeConfig.className} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={combinedClass} onClick={onClick} aria-label={!showText || isFullLogo ? 'CodeCanvas' : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <div className={combinedClass} onClick={onClick}>
      {content}
    </div>
  );
}
