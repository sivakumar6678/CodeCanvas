'use client';

import { useState } from 'react';
import { FiCheck, FiX, FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import styles from './ToolComparisonMatrix.module.scss';
import TrackClickLink from './TrackClickLink';

export default function ToolComparisonMatrix({ allTools = [], initialSlugs = ['cursor', 'github-copilot'] }) {
  // Find initial tool objects
  const getToolBySlug = (slug) => allTools.find((t) => t.slug === slug);

  const [selectedSlugs, setSelectedSlugs] = useState(() => {
    const valid = initialSlugs.map(getToolBySlug).filter(Boolean);
    if (valid.length > 0) return valid.map((t) => t.slug);
    return allTools.slice(0, 2).map((t) => t.slug);
  });

  const selectedTools = selectedSlugs.map(getToolBySlug).filter(Boolean);

  const handleSelectTool = (index, newSlug) => {
    const updated = [...selectedSlugs];
    updated[index] = newSlug;
    setSelectedSlugs(updated);
  };

  const handleAddColumn = () => {
    if (selectedSlugs.length < 4) {
      const unused = allTools.find((t) => !selectedSlugs.includes(t.slug));
      if (unused) {
        setSelectedSlugs([...selectedSlugs, unused.slug]);
      }
    }
  };

  const handleRemoveColumn = (index) => {
    if (selectedSlugs.length > 2) {
      setSelectedSlugs(selectedSlugs.filter((_, i) => i !== index));
    }
  };

  return (
    <div className={styles.matrixWrapper}>
      <div className={styles.controls}>
        {selectedSlugs.length < 4 && (
          <button
            type="button"
            onClick={handleAddColumn}
            className={styles.addBtn}
            suppressHydrationWarning
          >
            <FiPlus /> Add Tool to Compare ({selectedSlugs.length}/4)
          </button>
        )}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th className={styles.featureCol}>Features</th>
              {selectedTools.map((tool, idx) => (
                <th key={idx} className={styles.toolCol}>
                  <div className={styles.toolHeaderControl}>
                    <select
                      value={tool.slug}
                      onChange={(e) => handleSelectTool(idx, e.target.value)}
                      className={styles.toolSelect}
                      aria-label={`Select tool ${idx + 1}`}
                    >
                      {allTools.map((t) => (
                        <option key={t.id} value={t.slug}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {selectedSlugs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(idx)}
                        className={styles.removeBtn}
                        title="Remove tool"
                        aria-label="Remove tool"
                        suppressHydrationWarning
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>

                  <div className={styles.toolCardHeader}>
                    <div className={styles.logoWrapper}>
                      {tool.logoImageUrl || tool.logo ? (
                        <img
                          src={tool.logoImageUrl || tool.logo}
                          alt={tool.name}
                          className={styles.logo}
                        />
                      ) : (
                        <div className={styles.placeholderLogo}>
                          {tool.name ? tool.name.charAt(0) : 'T'}
                        </div>
                      )}
                    </div>
                    <h3 className={styles.toolName}>{tool.name}</h3>
                    <span className={styles.pricingBadge}>
                      {tool.pricingModel || tool.pricing || 'Free'}
                    </span>

                    {tool.website && (
                      <TrackClickLink href={tool.website} slug={tool.slug} className={styles.visitBtn}>
                        Visit <FiExternalLink />
                      </TrackClickLink>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Category Row */}
            <tr>
              <td className={styles.featureLabel}>Category</td>
              {selectedTools.map((t, idx) => (
                <td key={idx} className={styles.cellText}>
                  {t.category} {t.subCategory ? `(${t.subCategory})` : ''}
                </td>
              ))}
            </tr>

            {/* Overview Row */}
            <tr>
              <td className={styles.featureLabel}>Overview</td>
              {selectedTools.map((t, idx) => (
                <td key={idx} className={styles.cellText}>
                  {t.fullOverview || t.description}
                </td>
              ))}
            </tr>

            {/* Free Plan / Trial Available */}
            <tr>
              <td className={styles.featureLabel}>Free Tier / Trial</td>
              {selectedTools.map((t, idx) => {
                const hasFreeOption = t.hasFree || t.freeTrial || (t.pricingModel || t.pricing || '').toLowerCase().includes('free');
                return (
                  <td key={idx} className={styles.cellText}>
                    {hasFreeOption ? (
                      <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                        <FiCheck /> Available
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FiX /> Paid Only
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Platforms Row */}
            <tr>
              <td className={styles.featureLabel}>Platforms</td>
              {selectedTools.map((t, idx) => {
                const platforms = t.platforms || t.platform || [];
                return (
                  <td key={idx} className={styles.cellText}>
                    {platforms.length > 0 ? platforms.join(', ') : 'Web'}
                  </td>
                );
              })}
            </tr>

            {/* Key Features Row */}
            <tr>
              <td className={styles.featureLabel}>Key Features</td>
              {selectedTools.map((t, idx) => {
                const features = t.keyFeatures || t.features || [];
                return (
                  <td key={idx} className={styles.cellList}>
                    {features.length > 0 ? (
                      <ul>
                        {features.map((feat, fIdx) => (
                          <li key={fIdx}>
                            <FiCheck className={styles.checkIcon} /> {feat}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className={styles.muted}>Standard features</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Best For Row */}
            <tr>
              <td className={styles.featureLabel}>Best For</td>
              {selectedTools.map((t, idx) => {
                const bestFor = t.bestFor || t.best_for || [];
                return (
                  <td key={idx} className={styles.cellList}>
                    {bestFor.length > 0 ? (
                      <ul>
                        {bestFor.map((item, bIdx) => (
                          <li key={bIdx}>
                            <FiCheck className={styles.checkIcon} /> {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className={styles.muted}>General users</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Use Cases Row */}
            <tr>
              <td className={styles.featureLabel}>Use Cases</td>
              {selectedTools.map((t, idx) => {
                const useCases = t.useCases || t.use_cases || [];
                return (
                  <td key={idx} className={styles.cellList}>
                    {useCases.length > 0 ? (
                      <ul>
                        {useCases.map((uc, uIdx) => (
                          <li key={uIdx}>
                            <FiCheck className={styles.checkIcon} /> {uc}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className={styles.muted}>Various workflows</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Pros Row */}
            <tr>
              <td className={styles.featureLabel}>Pros</td>
              {selectedTools.map((t, idx) => (
                <td key={idx} className={styles.cellList}>
                  {t.pros && t.pros.length > 0 ? (
                    <ul className={styles.prosList}>
                      {t.pros.map((pro, pIdx) => (
                        <li key={pIdx}>
                          <FiCheck className={styles.proIcon} /> {pro}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className={styles.muted}>N/A</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Cons Row */}
            <tr>
              <td className={styles.featureLabel}>Cons</td>
              {selectedTools.map((t, idx) => (
                <td key={idx} className={styles.cellList}>
                  {t.cons && t.cons.length > 0 ? (
                    <ul className={styles.consList}>
                      {t.cons.map((con, cIdx) => (
                        <li key={cIdx}>
                          <FiX className={styles.conIcon} /> {con}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className={styles.muted}>None listed</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
