'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiAlertTriangle, FiXCircle, FiHelpCircle, FiLoader, FiEdit2 } from 'react-icons/fi';
import { IMAGE_STATUS, classifyImageUrl, probeImageUrl } from '../../lib/image-validation';
import styles from './ToolImageStatus.module.scss';

export default function ToolImageStatus({
  url,
  type = 'logo',
  alt = 'Tool image',
  showBadge = true,
  showUrl = false,
  className = '',
  onStatusChange,
  onEdit,
  editLabel,
}) {
  const initialStatus = classifyImageUrl(url);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const currentClass = classifyImageUrl(url);
    setStatus(currentClass);

    if (currentClass === IMAGE_STATUS.LOADING) {
      let active = true;
      probeImageUrl(url).then((resolvedStatus) => {
        if (active) {
          setStatus(resolvedStatus);
          if (typeof onStatusChange === 'function') {
            onStatusChange(resolvedStatus, url);
          }
        }
      });
      return () => {
        active = false;
      };
    } else if (typeof onStatusChange === 'function') {
      onStatusChange(currentClass, url);
    }
  }, [url, onStatusChange]);

  const isBanner = type === 'banner';
  const labelPrefix = isBanner ? 'Banner' : 'Logo';

  const handleImgLoad = () => {
    if (status !== IMAGE_STATUS.VALID) {
      setStatus(IMAGE_STATUS.VALID);
      if (typeof onStatusChange === 'function') {
        onStatusChange(IMAGE_STATUS.VALID, url);
      }
    }
  };

  const handleImgError = () => {
    if (status !== IMAGE_STATUS.BROKEN) {
      setStatus(IMAGE_STATUS.BROKEN);
      if (typeof onStatusChange === 'function') {
        onStatusChange(IMAGE_STATUS.BROKEN, url);
      }
    }
  };

  return (
    <div
      className={`${styles.container} ${isBanner ? styles.bannerContainer : styles.logoContainer} ${className}`}
      data-status={status}
    >
      <div className={`${styles.previewBox} ${isBanner ? styles.bannerBox : styles.logoBox}`}>
        {status === IMAGE_STATUS.MISSING ? (
          <div className={styles.missingPlaceholder} title={`No ${labelPrefix.toLowerCase()} image URL provided`}>
            <span>No {labelPrefix}</span>
          </div>
        ) : status === IMAGE_STATUS.BROKEN ? (
          <div className={styles.brokenPlaceholder} title={`Failed to load ${labelPrefix.toLowerCase()} image`}>
            <FiXCircle className={styles.statusIcon} />
            <span>Broken</span>
          </div>
        ) : (
          <img
            src={url}
            alt={alt}
            className={`${styles.image} ${isBanner ? styles.bannerImage : styles.logoImage} ${
              status === IMAGE_STATUS.UNKNOWN ? styles.unknownImage : ''
            }`}
            onLoad={handleImgLoad}
            onError={handleImgError}
            loading="lazy"
          />
        )}

        {status === IMAGE_STATUS.LOADING && (
          <div className={styles.loadingOverlay}>
            <FiLoader className={styles.spin} />
          </div>
        )}
      </div>

      {showBadge && (
        <div className={styles.badgeWrapper}>
          {status === IMAGE_STATUS.VALID && (
            <span className={`${styles.badge} ${styles.validBadge}`}>
              <FiCheck /> Valid {labelPrefix}
            </span>
          )}
          {status === IMAGE_STATUS.MISSING && (
            <span className={`${styles.badge} ${styles.missingBadge}`}>
              <FiAlertTriangle /> Missing {labelPrefix}
            </span>
          )}
          {status === IMAGE_STATUS.BROKEN && (
            <span className={`${styles.badge} ${styles.brokenBadge}`}>
              <FiXCircle /> Broken {labelPrefix}
            </span>
          )}
          {status === IMAGE_STATUS.UNKNOWN && (
            <span className={`${styles.badge} ${styles.unknownBadge}`} title="Inconclusive or external host verification pending">
              <FiHelpCircle /> Inconclusive {labelPrefix}
            </span>
          )}
          {status === IMAGE_STATUS.LOADING && (
            <span className={`${styles.badge} ${styles.loadingBadge}`}>
              <FiLoader className={styles.spin} /> Checking {labelPrefix}...
            </span>
          )}
          {typeof onEdit === 'function' && (
            <button
              type="button"
              className={styles.editActionBtn}
              data-urgent={status === IMAGE_STATUS.BROKEN || status === IMAGE_STATUS.MISSING}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              title={editLabel || (status === IMAGE_STATUS.BROKEN || status === IMAGE_STATUS.MISSING ? `Fix ${labelPrefix}` : `Edit ${labelPrefix}`)}
            >
              <FiEdit2 />
              <span>{editLabel || (status === IMAGE_STATUS.BROKEN || status === IMAGE_STATUS.MISSING ? `Fix ${labelPrefix}` : `Edit ${labelPrefix}`)}</span>
            </button>
          )}
        </div>
      )}

      {!showBadge && typeof onEdit === 'function' && (
        <button
          type="button"
          className={styles.editActionBtn}
          data-urgent={status === IMAGE_STATUS.BROKEN || status === IMAGE_STATUS.MISSING}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          title={editLabel || (status === IMAGE_STATUS.BROKEN || status === IMAGE_STATUS.MISSING ? `Fix ${labelPrefix}` : `Edit ${labelPrefix}`)}
        >
          <FiEdit2 />
          <span>{editLabel || (status === IMAGE_STATUS.BROKEN || status === IMAGE_STATUS.MISSING ? `Fix ${labelPrefix}` : `Edit ${labelPrefix}`)}</span>
        </button>
      )}

      {showUrl && url && (
        <span className={styles.urlText} title={url}>
          {url}
        </span>
      )}
    </div>
  );
}

