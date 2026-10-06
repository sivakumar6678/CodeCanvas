'use client';

import { useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import AIToolCard from './AIToolCard';
import styles from './FeaturedToolsShowcase.module.scss';

export default function FeaturedToolsShowcase({ tools = [], featuredSlugs = [] }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const updateScrollControls = () => {
      const maxScrollLeft = track.scrollWidth - track.clientWidth;
      setCanScrollLeft(track.scrollLeft > 0);
      setCanScrollRight(track.scrollLeft < maxScrollLeft - 1);
    };

    updateScrollControls();
    track.addEventListener('scroll', updateScrollControls, { passive: true });
    window.addEventListener('resize', updateScrollControls);
    const resizeObserver = new ResizeObserver(updateScrollControls);
    resizeObserver.observe(track);
    const frameId = requestAnimationFrame(updateScrollControls);
    const timeoutId = window.setTimeout(updateScrollControls, 250);

    return () => {
      track.removeEventListener('scroll', updateScrollControls);
      window.removeEventListener('resize', updateScrollControls);
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [tools.length]);

  const scrollShowcase = (direction) => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.8, 280),
      behavior: 'smooth',
    });
  };

  return (
    <div className={styles.showcase}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.control}
          onClick={() => scrollShowcase(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll featured tools left"
          title="Scroll featured tools left"
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={() => scrollShowcase(1)}
          disabled={!canScrollRight}
          aria-label="Scroll featured tools right"
          title="Scroll featured tools right"
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
      <div
        ref={trackRef}
        className={styles.track}
        tabIndex="0"
        aria-label="Featured AI tools"
      >
        {tools.map((tool) => (
          <div className={styles.card} key={tool.id}>
            <AIToolCard tool={tool} isFeatured={featuredSlugs.includes(tool.slug)} />
          </div>
        ))}
      </div>
    </div>
  );
}
