'use client';

import { useState } from 'react';
import { FaPlus, FaRocket } from 'react-icons/fa';
import Link from 'next/link';
import CommunitySubmissionModal from './CommunitySubmissionModal';

export default function CommunityPageClient({ styles }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={styles.heroActions}>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={styles.primaryBtn}
          suppressHydrationWarning
        >
          <FaPlus /> Submit Tool or Prompt
        </button>
        <Link href="/ai-tools" className={styles.secondaryBtn}>
          Explore AI Directory <FaRocket />
        </Link>
      </div>

      <CommunitySubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

