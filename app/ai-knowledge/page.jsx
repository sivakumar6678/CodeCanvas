import PromptLibrary from '../../components/prompts/PromptLibrary';
import styles from '../prompts/page.module.scss';

export const metadata = {
  title: 'AI Knowledge | CodeCraft',
  description: 'Explore curated AI knowledge: prompts, tricks, shortcuts, slash commands, and prompting techniques.',
};

export default function AIKnowledgePage() {
  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <p className={styles.kicker}>AI Knowledge Base</p>
        <h1>Practical AI patterns, shortcuts &amp; prompts.</h1>
        <p>
          Discover curated prompts, techniques, shortcuts, and practical AI workflows by model, use case, and category.
        </p>
      </section>
      <PromptLibrary />
    </main>
  );
}
