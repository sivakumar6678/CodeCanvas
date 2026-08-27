'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiGrid, FiList, FiTrendingUp, FiLogOut } from 'react-icons/fi';
import { createClient } from '../../lib/supabase/client';
import styles from '../../app/studio/layout.module.scss';

export default function StudioHeader({ email }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[auth] studio-logout:failed', { code: error.code, message: error.message });
      setLoggingOut(false);
      return;
    }
    console.info('[auth] studio-logout:success');
    router.replace('/');
    router.refresh();
  };

  return (
    <header className={styles.header}>
      <Link href="/studio" className={styles.brand}>CodeCraft Studio</Link>
      <nav className={styles.nav} aria-label="Studio navigation">
        <Link href="/studio" className={styles.navItem}><FiGrid /> Dashboard</Link>
        <Link href="/studio/tools" className={styles.navItem}><FiList /> AI Tools</Link>
        <Link href="/studio/analytics" className={styles.navItem}><FiTrendingUp /> Analytics</Link>
      </nav>
      <div className={styles.headerActions}>
        <span className={styles.userEmail}>{email}</span>
        <button type="button" onClick={handleLogout} disabled={loggingOut} className={styles.logoutBtn}>
          <FiLogOut /> {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}
