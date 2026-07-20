import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FiGrid, FiList, FiTrendingUp, FiLogOut, FiSettings } from 'react-icons/fi';
import { logout } from '../login/actions';
import styles from './layout.module.scss';

export const metadata = {
  title: 'Admin Dashboard - Developer Productivity Platform',
  description: 'Manage AI Tools and Platform configuration',
};

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Platform Admin</h2>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navItem}>
            <FiGrid /> Dashboard
          </Link>
          <Link href="/admin/tools" className={styles.navItem}>
            <FiList /> AI Tools
          </Link>
          <Link href="/admin/analytics" className={styles.navItem}>
            <FiTrendingUp /> Analytics
          </Link>
          <Link href="/admin/settings" className={styles.navItem}>
            <FiSettings /> Settings
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
          <form action={logout}>
            <button type="submit" className={styles.logoutBtn}>
              <FiLogOut /> Logout
            </button>
          </form>
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
