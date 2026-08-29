import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import PromptActions from '../../../components/prompts/PromptActions';
import styles from '../../prompts/[id]/page.module.scss';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('prompt_submissions').select('title,description').eq('id', id).eq('status', 'approved').maybeSingle();
  return data ? { title: `${data.title} | AI Prompts & Tricks` } : { title: 'Content Not Found' };
}

export default async function PromptDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: prompt } = await supabase.from('prompt_submissions').select('id,title,type,prompt_content,ai_model,category,use_case,description,display_name,is_anonymous').eq('id', id).eq('status', 'approved').maybeSingle();
  if (!prompt) notFound();
  return (
    <main className={styles.page}>
      <Link href="/ai-prompts-tricks" className={styles.back}><FiArrowLeft /> AI Prompts &amp; Tricks</Link>
      <article className={styles.article}>
        <div className={styles.meta}>
          <span>{prompt.type || 'prompt'}</span>
          <span>{prompt.ai_model}</span>
          <span>{prompt.category}</span>
          <span>{prompt.use_case}</span>
        </div>
        <h1>{prompt.title}</h1>
        <p className={styles.description}>{prompt.description}</p>
        <div className={styles.promptBox}>
          <pre>{prompt.prompt_content}</pre>
        </div>
        <div className={styles.footer}>
          <span>Contributed by {prompt.is_anonymous ? 'Anonymous contributor' : prompt.display_name}</span>
          <PromptActions promptId={prompt.id} content={prompt.prompt_content} />
        </div>
      </article>
    </main>
  );
}