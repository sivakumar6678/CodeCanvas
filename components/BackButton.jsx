"use client";
import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import '../app/backbutton.scss';

/**
 * BackButton — top-level, page-wide back navigation.
 * Renders OUTSIDE the main tool container for proper placement.
 */
const BackButton = ({ href = '/tools', label = 'Back to Tools' }) => {
  return (
    <div className="tool-back-row">
      <Link href={href} className="back-btn">
        <span className="back-btn-icon">
          <FiArrowLeft size={15} />
        </span>
        <span className="back-btn-text">{label}</span>
      </Link>
    </div>
  );
};

export default BackButton;
