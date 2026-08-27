import { requireAdminAccess } from '../../lib/auth/server';
import styles from './layout.module.scss';
import StudioHeader from '../../components/admin/StudioHeader';

export const metadata = {
  title: 'Studio | CodeCraft',
  description: 'Private administration studio for the CodeCraft platform.',
};

export default async function StudioLayout({ children }) {
  const { user } = await requireAdminAccess();

  return (
    <div className={styles.adminLayout}>
      <StudioHeader email={user.email} />

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
