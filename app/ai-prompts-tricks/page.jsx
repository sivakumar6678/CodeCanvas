import PromptLibrary from '../../components/prompts/PromptLibrary';
import styles from '../prompts/page.module.scss';

export const metadata = { title: 'AI Prompts & Tricks | CodeCraft', description: 'Browse practical AI prompts, tricks, slash commands, and techniques.' };

export default function AIPromptsTricksPage() { return <main className={styles.page}><section className={styles.intro}><p className={styles.kicker}>AI Prompts &amp; Tricks</p><h1>Useful AI patterns, ready to run.</h1><p>Browse prompts, tricks, slash commands, and techniques by model and use case.</p></section><PromptLibrary /></main>; }