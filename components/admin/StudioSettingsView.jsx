'use client';

import { FiCheckCircle, FiAlertCircle, FiDatabase, FiLayers, FiShield, FiGlobe } from 'react-icons/fi';
import styles from './StudioSettingsView.module.scss';

export default function StudioSettingsView({ status }) {
  const {
    supabase = {},
    catalog = {},
    auth = {},
    platform = {}
  } = status;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Platform health</p>
        <h1>Studio Settings & Diagnostics</h1>
        <p>Live status of your database, catalog registry, environment, and authorization rules.</p>
      </header>

      <div className={styles.grid}>
        {/* Supabase Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <FiDatabase />
            </div>
            <div>
              <h3>Supabase Backend</h3>
              <p>Database & authentication connectivity</p>
            </div>
          </div>

          <div className={styles.statusList}>
            <div className={styles.statusRow}>
              <span>Supabase URL</span>
              <span className={supabase.urlConfigured ? styles.ok : styles.missing}>
                {supabase.urlConfigured ? <FiCheckCircle /> : <FiAlertCircle />}
                {supabase.urlConfigured ? 'Configured' : 'Missing'}
              </span>
            </div>

            <div className={styles.statusRow}>
              <span>Anon / Publishable Key</span>
              <span className={supabase.anonConfigured ? styles.ok : styles.missing}>
                {supabase.anonConfigured ? <FiCheckCircle /> : <FiAlertCircle />}
                {supabase.anonConfigured ? 'Active' : 'Missing'}
              </span>
            </div>

            <div className={styles.statusRow}>
              <span>Service Role Key</span>
              <span className={supabase.serviceRoleConfigured ? styles.ok : styles.warn}>
                {supabase.serviceRoleConfigured ? <FiCheckCircle /> : <FiAlertCircle />}
                {supabase.serviceRoleConfigured ? 'Configured' : 'Optional (Admin only)'}
              </span>
            </div>
          </div>
        </div>

        {/* Catalog Categories Registry */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
              <FiLayers />
            </div>
            <div>
              <h3>Catalog Integrity</h3>
              <p>JSON taxonomy and category registry</p>
            </div>
          </div>

          <div className={styles.statusList}>
            <div className={styles.statusRow}>
              <span>Category Registry</span>
              <span className={styles.ok}>
                <FiCheckCircle /> {catalog.categoryCount || 18} Categories Active
              </span>
            </div>

            <div className={styles.statusRow}>
              <span>Category Files Mapped</span>
              <span className={styles.ok}>
                <FiCheckCircle /> {catalog.mappedFilesCount || 18} / {catalog.categoryCount || 18}
              </span>
            </div>

            <div className={styles.statusRow}>
              <span>Total Catalog Tools</span>
              <span className={styles.badge}>{catalog.totalTools || 0} Tools</span>
            </div>
          </div>
        </div>

        {/* Admin Authorization */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed' }}>
              <FiShield />
            </div>
            <div>
              <h3>Authorization</h3>
              <p>Studio access control & admin policy</p>
            </div>
          </div>

          <div className={styles.statusList}>
            <div className={styles.statusRow}>
              <span>Active Admin User</span>
              <span className={auth.currentUserIsAdmin ? styles.ok : styles.missing}>
                {auth.currentUserIsAdmin ? <FiCheckCircle /> : <FiAlertCircle />}
                {auth.currentUserIsAdmin ? (auth.currentUserEmail || 'Admin Verified') : 'Unverified'}
              </span>
            </div>

            <div className={styles.statusRow}>
              <span>Admin Allowlist Count</span>
              <span className={styles.badge}>{auth.adminCount || 1} Admin Account(s)</span>
            </div>
          </div>
        </div>

        {/* Platform & Environment */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
              <FiGlobe />
            </div>
            <div>
              <h3>Platform & Environment</h3>
              <p>Next.js server configuration</p>
            </div>
          </div>

          <div className={styles.statusList}>
            <div className={styles.statusRow}>
              <span>Environment Mode</span>
              <span className={styles.badge}>{platform.env || 'development'}</span>
            </div>

            <div className={styles.statusRow}>
              <span>App Router Version</span>
              <span className={styles.badge}>Next.js 16</span>
            </div>

            <div className={styles.statusRow}>
              <span>Site URL</span>
              <span className={styles.textMuted}>{platform.siteUrl || 'http://localhost:3000'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

