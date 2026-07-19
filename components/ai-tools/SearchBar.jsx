'use client';
import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './SearchBar.module.scss';

export default function SearchBar({ placeholder = "Search AI tools..." }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e) => {
    e.preventDefault();
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (query.trim()) {
      current.set('q', query.trim());
    } else {
      current.delete('q');
    }
    const search = current.toString();
    const queryStr = search ? `?${search}` : '';
    router.push(`/ai-tools${queryStr}`);
  };

  return (
    <form className={styles.searchForm} onSubmit={handleSearch}>
      <FiSearch className={styles.searchIcon} />
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
      />
      {query && (
        <button type="button" onClick={() => setQuery('')} className={styles.clearBtn}>
          <FiX />
        </button>
      )}
      <button type="submit" className={styles.submitBtn}>Search</button>
    </form>
  );
}
