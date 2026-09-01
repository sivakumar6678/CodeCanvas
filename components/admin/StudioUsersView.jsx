'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiShield, FiUser, FiCheckCircle } from 'react-icons/fi';
import styles from './StudioUsersView.module.scss';
import UserAvatar from '../ui/UserAvatar';

export default function StudioUsersView({ users = [] }) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.full_name || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      const q = query.toLowerCase().trim();
      const matchesQuery = !q || name.includes(q) || username.includes(q);

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'admin' && u.isAdmin) ||
        (roleFilter === 'member' && !u.isAdmin);

      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const adminCount = users.filter((u) => u.isAdmin).length;
  const memberCount = users.length - adminCount;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Platform Members</p>
        <h1>Studio Users Directory</h1>
        <p>Overview of registered community members, contributors, and administrators.</p>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statVal}>{users.length}</span>
          <span className={styles.statLabel}>Registered Profiles</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statVal}>{adminCount}</span>
          <span className={styles.statLabel}>Admin Accounts</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statVal}>{memberCount}</span>
          <span className={styles.statLabel}>Community Members</span>
        </div>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.controlsRow}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or name..."
              aria-label="Search users"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.roleSelect}
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="member">Community Members</option>
          </select>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.userCell}>
                      <UserAvatar
                        avatarUrl={user.avatar_url}
                        username={user.username || user.full_name || 'User'}
                        size="sm"
                      />
                      <span className={styles.userName}>{user.full_name || user.username || 'Community Member'}</span>
                    </td>
                    <td className={styles.usernameCell}>@{user.username || 'user'}</td>
                    <td>
                      {user.isAdmin ? (
                        <span className={styles.adminBadge}>
                          <FiShield /> Admin
                        </span>
                      ) : (
                        <span className={styles.memberBadge}>
                          <FiUser /> Member
                        </span>
                      )}
                    </td>
                    <td className={styles.dateCell}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    {users.length === 0
                      ? 'No user profiles found in local database yet. Profiles are provisioned on Supabase registration.'
                      : 'No users match the search filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

