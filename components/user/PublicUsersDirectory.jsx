'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch, FiUsers } from 'react-icons/fi';
import UserAvatar from '../ui/UserAvatar';
import styles from './PublicUsersDirectory.module.scss';

const PAGE_SIZES = [12, 24, 48];

function displayRole(role) {
  if (!role) return 'Community member';
  return String(role)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PublicUsersDirectory({ users = [] }) {
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const searchable = `${user.username || ''}`.toLowerCase();
      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [query, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const rangeStart = filteredUsers.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredUsers.length);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}><FiUsers aria-hidden="true" /> CodeCanvas Community</div>
        <h1>Meet the builders</h1>
        <p>Explore the people shaping better workflows with CodeCanvas.</p>
      </header>

      <section className={styles.directory} aria-label="Users directory">
        <div className={styles.controls}>
          <label className={styles.search}>
            <FiSearch aria-hidden="true" />
            <span className={styles.visuallyHidden}>Search users</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or username" />
          </label>
        </div>

        {visibleUsers.length > 0 ? (
          <div className={styles.grid}>
            {visibleUsers.map((user, index) => {
              const label = user.username || 'Community member';
              return (
                <article key={`${user.username || 'user'}-${index}`} className={styles.userCard}>
                  <UserAvatar avatarUrl={user.avatar_url} avatarId={user.avatar_id} username={label} size="lg" />
                  <div className={styles.userInfo}>
                    <h2>{label}</h2>
                    <p>{user.username ? `@${user.username}` : 'CodeCanvas member'}</p>
                    <span>Community member</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <FiUsers aria-hidden="true" />
            <h2>{users.length === 0 ? 'The directory is getting started' : 'No users found'}</h2>
            <p>{users.length === 0 ? 'Public profiles will appear here as the community grows.' : 'Try a different search or role filter.'}</p>
          </div>
        )}

        <div className={styles.pagination}>
          <span>Showing {rangeStart}-{rangeEnd} of {filteredUsers.length}</span>
          <div className={styles.paginationControls}>
            <label>Per page <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
            <button type="button" onClick={() => setPage((currentPage) => currentPage - 1)} disabled={page === 1} aria-label="Previous page"><FiChevronLeft /></button>
            <strong>Page {page} of {totalPages}</strong>
            <button type="button" onClick={() => setPage((currentPage) => currentPage + 1)} disabled={page === totalPages} aria-label="Next page"><FiChevronRight /></button>
          </div>
        </div>
      </section>
    </main>
  );
}
