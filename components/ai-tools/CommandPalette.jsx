'use client';
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiArrowRight, FiCommand, FiCornerDownLeft } from 'react-icons/fi';
import styles from './CommandPalette.module.scss';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Global keydown shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      fetchResults(query);
    }, 160);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, query]);

  const fetchResults = async (q) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/tools/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setSelectedIndex(0);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('CommandPalette error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDownInInput = (e) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigateToTool(results[selectedIndex].slug);
      }
    }
  };

  const navigateToTool = (slug) => {
    setIsOpen(false);
    router.push(`/ai-tools/tool/${slug}`);
  };

  return (
    <>
      {/* Optional Trigger Button for Navbar / Mobile */}
      <button onClick={() => setIsOpen(true)} className={styles.triggerBtn} title="Global Search (Cmd + K)">
        <FiSearch className={styles.searchIcon} />
        <span className={styles.triggerText}>Search tools...</span>
        <kbd className={styles.shortcut}><FiCommand /> K</kbd>
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.inputWrapper}>
              <FiSearch className={styles.inputIcon} />
              <input
                ref={inputRef}
                type="text"
                className={styles.input}
                placeholder="Search AI tools by name, category, or tag..."
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDownInInput}
              />
              {query && (
                <button onClick={() => { setQuery(''); fetchResults(''); }} className={styles.clearBtn}>
                  <FiX />
                </button>
              )}
            </div>

            <div className={styles.resultsList}>
              {loading ? (
                <div className={styles.statusMsg}>Searching tools...</div>
              ) : results.length === 0 ? (
                <div className={styles.statusMsg}>No tools matching "{query}"</div>
              ) : (
                results.map((tool, idx) => (
                  <div
                    key={tool.id}
                    className={`${styles.resultItem} ${idx === selectedIndex ? styles.selected : ''}`}
                    onClick={() => navigateToTool(tool.slug)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className={styles.logoWrapper}>
                      {tool.logo ? (
                        <img src={tool.logo} alt="logo" className={styles.logo} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={styles.placeholderLogo}>{tool.name.charAt(0)}</div>
                      )}
                    </div>

                    <div className={styles.itemInfo}>
                      <div className={styles.itemHeader}>
                        <span className={styles.name}>{tool.name}</span>
                        <span className={styles.categoryBadge}>{tool.category}</span>
                      </div>
                      <p className={styles.description}>{tool.description}</p>
                    </div>

                    <div className={styles.enterIcon}>
                      <FiCornerDownLeft />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.footer}>
              <span>Navigation: <kbd>↑</kbd> <kbd>↓</kbd></span>
              <span>Open: <kbd>↵</kbd></span>
              <span>Close: <kbd>esc</kbd></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
