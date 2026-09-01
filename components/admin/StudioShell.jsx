'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiBarChart2, FiBookOpen, FiBox, FiGrid, FiLogOut, FiMenu, FiMessageSquare, FiSettings, FiUsers, FiX } from 'react-icons/fi';
import { createClient } from '../../lib/supabase/client';
import styles from '../../app/studio/layout.module.scss';

const navigation = [
  { href: '/studio', label: 'Overview', icon: FiGrid, exact: true },
  { href: '/studio/tools', label: 'AI Tools', icon: FiBox },
  { href: '/studio/knowledge', label: 'AI Knowledge', icon: FiBookOpen },
  { href: '/studio/suggestions', label: 'Suggestions', icon: FiMessageSquare },
  { href: '/studio/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: '/studio/users', label: 'Users', icon: FiUsers },
  { href: '/studio/settings', label: 'Settings', icon: FiSettings },
];

export default function StudioShell({ children, email }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [supabase] = useState(() => createClient());
  const isActive = (item) => item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const closeMenu = () => setMenuOpen(false);
  const handleLogout = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) { console.error('[auth] studio-logout:failed', { code: error.code, message: error.message }); setLoggingOut(false); return; }
    router.replace('/'); router.refresh();
  };

  return <div className={styles.adminLayout}>
    <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`} aria-label="Studio navigation">
      <div className={styles.sidebarTop}><Link href="/studio" className={styles.brand} onClick={closeMenu}><span className={styles.brandMark}>C</span><span>CodeCraft <strong>Studio</strong></span></Link><button type="button" className={styles.closeMenu} onClick={closeMenu} aria-label="Close menu"><FiX /></button></div>
      <nav className={styles.nav}><p className={styles.navLabel}>Workspace</p>{navigation.map(({ href, label, icon: Icon, exact }) => <Link key={href} href={href} className={`${styles.navItem} ${isActive({ href, exact }) ? styles.active : ''}`} onClick={closeMenu}><Icon aria-hidden="true" /><span>{label}</span></Link>)}</nav>
      <div className={styles.sidebarBottom}><div className={styles.userSummary} title={email}><span className={styles.avatar}>{email?.charAt(0)?.toUpperCase() || 'A'}</span><span><strong>Administrator</strong><small>{email}</small></span></div><button type="button" onClick={handleLogout} disabled={loggingOut} className={styles.logoutBtn}><FiLogOut /> {loggingOut ? 'Logging out…' : 'Logout'}</button></div>
    </aside>
    {menuOpen && <button type="button" aria-label="Close menu" className={styles.backdrop} onClick={closeMenu} />}
    <section className={styles.contentArea}><header className={styles.adminHeader}><button type="button" className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open menu"><FiMenu /></button><div><p className={styles.eyebrow}>Administration</p><p className={styles.headerTitle}>CodeCraft Studio</p></div><Link href="/" className={styles.siteLink}>View site</Link></header><main className={styles.mainContent}>{children}</main></section>
  </div>;
}
