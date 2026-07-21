import Link from 'next/link';
import { FiGrid, FiList, FiTrendingUp, FiLogOut } from 'react-icons/fi';
import { logout } from '../login/actions';
import { requireAdminAccess } from '../../lib/auth/server';
import styles from './layout.module.scss';

export const metadata = {
  title: 'Studio | CodeCraft',
  description: 'Private administration studio for the CodeCraft platform.',
};

export default async function StudioLayout({ children }) {
  const { user } = await requireAdminAccess();

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>CodeCraft Studio</h2>
        </div>

        <nav className={styles.nav}>
          <Link href="/studio" className={styles.navItem}>
            <FiGrid /> Dashboard
          </Link>
          <Link href="/studio/tools" className={styles.navItem}>
            <FiList /> AI Tools
          </Link>
          <Link href="/studio/analytics" className={styles.navItem}>
            <FiTrendingUp /> Analytics
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

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
