'use client';

import { useState, useMemo } from 'react';
import { FiCheck, FiCopy, FiEdit3, FiRotateCcw } from 'react-icons/fi';
import styles from './PromptCustomizer.module.scss';

// Regex to capture variables like {{var}}, [VAR], <VAR>
const PLACEHOLDER_REGEX = /(\{\{[^}]+\}\}|\[[A-Z0-9_\s-]+\]|<[A-Z0-9_\s-]+>)/g;

function extractVariables(content = '') {
  const matches = content.match(PLACEHOLDER_REGEX) || [];
  const unique = [];
  matches.forEach((raw) => {
    // Normalize raw variable to human-readable label
    const cleanKey = raw.replace(/^(\{\{|\[|<)/, '').replace(/(\}\}|\]|>)$/, '').trim();
    if (cleanKey && !unique.some((u) => u.raw === raw)) {
      unique.push({ raw, key: cleanKey });
    }
  });
  return unique;
}

export default function PromptCustomizer({ promptContent = '', title = '' }) {
  const variables = useMemo(() => extractVariables(promptContent), [promptContent]);
  const [values, setValues] = useState({});
  const [copiedCustom, setCopiedCustom] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);

  const handleInputChange = (rawKey, value) => {
    setValues((prev) => ({ ...prev, [rawKey]: value }));
  };

  const handleReset = () => {
    setValues({});
  };

  const customizedContent = useMemo(() => {
    if (!variables.length) return promptContent;
    let result = promptContent;
    variables.forEach(({ raw }) => {
      const userVal = values[raw];
      if (userVal !== undefined && userVal !== '') {
        result = result.split(raw).join(userVal);
      }
    });
    return result;
  }, [promptContent, variables, values]);

  const handleCopyCustom = async () => {
    try {
      await navigator.clipboard.writeText(customizedContent);
      setCopiedCustom(true);
      setTimeout(() => setCopiedCustom(false), 2000);
    } catch (err) {
      console.error('Failed to copy customized prompt:', err);
    }
  };

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(promptContent);
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } catch (err) {
      console.error('Failed to copy original prompt:', err);
    }
  };

  const hasFilledAny = Object.values(values).some((v) => v !== '');

  return (
    <div className={styles.container}>
      {variables.length > 0 && (
        <div className={styles.customizerSection}>
          <div className={styles.customizerHeader}>
            <div className={styles.titleRow}>
              <FiEdit3 className={styles.icon} />
              <h3>Customize Prompt Variables</h3>
            </div>
            {hasFilledAny && (
              <button
                type="button"
                onClick={handleReset}
                className={styles.resetBtn}
                suppressHydrationWarning
              >
                <FiRotateCcw /> Reset Values
              </button>
            )}
          </div>

          <p className={styles.customizerDesc}>
            Fill in the parameters below to customize this prompt for your project before copying.
          </p>

          <div className={styles.fieldsGrid}>
            {variables.map(({ raw, key }) => (
              <label key={raw} className={styles.fieldLabel}>
                <span>{key}</span>
                <input
                  type="text"
                  placeholder={`Enter ${key.toLowerCase()}...`}
                  value={values[raw] || ''}
                  onChange={(e) => handleInputChange(raw, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={styles.previewBox}>
        <div className={styles.boxHeader}>
          <span>{variables.length > 0 && hasFilledAny ? 'Customized Output' : 'Prompt Content'}</span>
          <div className={styles.actionBtns}>
            {variables.length > 0 && (
              <button
                type="button"
                onClick={handleCopyOriginal}
                className={styles.secondaryCopyBtn}
                title="Copy original template with placeholders"
                suppressHydrationWarning
              >
                {copiedOriginal ? <FiCheck className={styles.checkIcon} /> : <FiCopy />}
                {copiedOriginal ? 'Copied Template!' : 'Copy Template'}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyCustom}
              className={styles.primaryCopyBtn}
              title="Copy ready-to-use prompt"
              suppressHydrationWarning
            >
              {copiedCustom ? <FiCheck className={styles.checkIcon} /> : <FiCopy />}
              {copiedCustom ? 'Copied Prompt!' : (variables.length > 0 ? 'Copy Customized Prompt' : 'Copy Prompt')}
            </button>
          </div>
        </div>

        <pre className={styles.codeView}>{customizedContent}</pre>
      </div>
    </div>
  );
}

