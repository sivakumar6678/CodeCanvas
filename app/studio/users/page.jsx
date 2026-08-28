import { FiUsers } from 'react-icons/fi';
import styles from '../future.module.scss';

export const metadata = { title: 'Users | Studio' };

export default function StudioUsersPage() {
  return <section className={styles.page}><span className={styles.icon}><FiUsers /></span><p className={styles.kicker}>Future workspace</p><h1>Users</h1><p>Member oversight will live here when the product has an approved user-management model. Existing profile data and authorization remain unchanged.</p><div className={styles.note}>No user data is exposed or editable from this section yet.</div></section>;
}
