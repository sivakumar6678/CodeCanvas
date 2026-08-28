import { getCategories } from '../../lib/data-fetchers';
import ContributionForms from '../../components/contributions/ContributionForms';
import styles from '../suggest/page.module.scss';

export const metadata = { title: 'Contribute | CodeCraft', description: 'Submit an AI tool, prompt, trick, slash command, or technique for review.' };

export default async function ContributePage() {
  const categories = await getCategories();
  return <main className={styles.page}><section className={styles.intro}><p className={styles.kicker}>Contribute to CodeCraft</p><h1>Submit something useful.</h1><p>Share a tool, prompt, trick, slash command, or technique. Every contribution is reviewed before publication.</p></section><ContributionForms categories={categories} /></main>;
}