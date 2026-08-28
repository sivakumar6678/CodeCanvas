import { FiSettings } from 'react-icons/fi';
import styles from '../future.module.scss';

export const metadata = { title: 'Settings | Studio' };

export default function StudioSettingsPage() {
  return <section className={styles.page}><span className={styles.icon}><FiSettings /></span><p className={styles.kicker}>Future workspace</p><h1>Settings</h1><p>Studio-level configuration will be added here when its persistence and authorization requirements are defined.</p><div className={styles.note}>No application settings are changed from this section yet.</div></section>;
}
