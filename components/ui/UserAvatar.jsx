'use client';

import React from 'react';
import { resolveAvatarDisplay } from '../../lib/avatars';
import styles from './UserAvatar.module.scss';

export default function UserAvatar({
  avatarUrl = '',
  username = 'User',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' or number
  className = '',
  style = {},
}) {
  const display = resolveAvatarDisplay(avatarUrl, username);

  const sizeClass =
    typeof size === 'string'
      ? styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`] || styles.sizeMd
      : '';

  const customDimensions =
    typeof size === 'number'
      ? {
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${Math.max(12, Math.floor(size * 0.4))}px`,
        }
      : {};

  if (display.type === 'preset') {
    return (
      <div
        className={`${styles.avatar} ${sizeClass} ${className}`}
        style={{ ...display.style, ...customDimensions, ...style }}
        title={display.label || username}
        aria-label={display.label || username}
      >
        <span className={styles.presetIcon}>{display.icon}</span>
      </div>
    );
  }

  if (display.type === 'url') {
    return (
      <div
        className={`${styles.avatar} ${sizeClass} ${className}`}
        style={{ ...customDimensions, ...style }}
        title={username}
      >
        <img
          src={display.url}
          alt={username}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback if remote image fails
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.avatar} ${sizeClass} ${className}`}
      style={{ ...display.style, ...customDimensions, ...style }}
      title={username}
    >
      {display.initial}
    </div>
  );
}
