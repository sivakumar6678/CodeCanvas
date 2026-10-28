import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './BrandLogo.module.scss';

const SIZES = {
  sm: { img: 28, className: styles.sizeSm },
  md: { img: 36, className: styles.sizeMd },
  lg: { img: 48, className: styles.sizeLg },
  xl: { img: 64, className: styles.sizeXl },
  full: { img: 1536, className: styles.sizeFull },
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
  const isWideLogo = variant === 'wide';
  const imgWidth = isWideLogo ? 1536 : sizeConfig.img;
  const imgHeight = isWideLogo ? 1024 : sizeConfig.img;

  const content = (
    <>
      <span className={styles.logoMarkWrapper}>
        <Image
          src={isWideLogo ? '/assets/Glossy CodeCanvas Tech Logo.png' : '/assets/codecanvas-icon.png'}
          alt={isWideLogo ? 'CodeCanvas — Your AI & Developer Toolkit. Discover. Build. Learn.' : ''}
          width={imgWidth}
          height={imgHeight}
          sizes={isWideLogo ? '(max-width: 480px) 90vw, (max-width: 768px) 60vw, 460px' : undefined}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className={styles.logoImage}
          aria-hidden={isWideLogo ? undefined : true}
        />
      </span>
      {showText && !isWideLogo && (
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
      <Link href={href} className={combinedClass} onClick={onClick} aria-label={!showText || isWideLogo ? 'CodeCanvas' : undefined}>
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
