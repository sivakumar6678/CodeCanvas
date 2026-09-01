'use client';

import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { PREDEFINED_AVATARS } from '../../lib/avatars';
import styles from './AvatarPicker.module.scss';

export default function AvatarPicker({ selectedAvatarId = '', onSelect, label = 'Choose Your Avatar' }) {
  return (
    <div className={styles.pickerContainer}>
      {label && <label className={styles.pickerLabel}>{label}</label>}
      <div className={styles.avatarGrid} role="radiogroup" aria-label="Avatar options">
        {PREDEFINED_AVATARS.map((avatar) => {
          const isSelected = selectedAvatarId === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`${styles.avatarOption} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect?.(avatar.id)}
              title={avatar.label}
            >
              <div
                className={styles.avatarPreview}
                style={{
                  background: avatar.bg,
                  color: avatar.textColor,
                  border: `2px solid ${avatar.borderColor}`,
                }}
              >
                <span>{avatar.icon}</span>
              </div>
              <span className={styles.avatarName}>{avatar.label}</span>
              {isSelected && (
                <span className={styles.checkBadge} aria-hidden="true">
                  <FiCheck />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
