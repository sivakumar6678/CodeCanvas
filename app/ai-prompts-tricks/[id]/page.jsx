import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import PromptCustomizer from '../../../components/prompts/PromptCustomizer';
import SavePromptButton from '../../../components/prompts/SavePromptButton';
import { generatePromptSchema } from '../../../lib/seo-schema';
import styles from '../../prompts/[id]/page.module.scss';

import defaultPrompts from '../../../data/default-prompts.json';

export async function generateMetadata({ params }) {
  const { id } = await params;
  let title = 'Content Not Found';
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('prompt_submissions')
      .select('title,description')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (data?.title) title = `${data.title} | AI Knowledge`;
  } catch (e) {}

  if (title === 'Content Not Found') {
    const fallback = defaultPrompts.find((p) => String(p.id) === String(id));
    if (fallback?.title) title = `${fallback.title} | AI Knowledge`;
  }

  return { title };
}

export default async function PromptDetailPage({ params }) {
  const { id } = await params;
  let prompt = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('prompt_submissions')
      .select('id,title,type,prompt_content,ai_model,category,use_case,description,display_name,is_anonymous')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();
    prompt = data;
  } catch (e) {}

  if (!prompt) {
    prompt = defaultPrompts.find((p) => String(p.id) === String(id)) || null;
  }

  if (!prompt) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://codecraft.dev';
  const jsonLd = generatePromptSchema(prompt, siteUrl);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/ai-prompts-tricks" className={styles.back}>
          <FiArrowLeft /> Back to AI Knowledge
        </Link>
        <SavePromptButton promptId={prompt.id} showLabel={true} />
      </div>
      <article className={styles.article}>
        <div className={styles.meta}>
          <span>{prompt.type || 'prompt'}</span>
          <span>{prompt.ai_model}</span>
          <span>{prompt.category}</span>
          <span>{prompt.use_case}</span>
        </div>
        <h1>{prompt.title}</h1>
        <p className={styles.description}>{prompt.description}</p>

        <PromptCustomizer promptContent={prompt.prompt_content} title={prompt.title} />

        <div className={styles.footer} style={{ marginTop: '24px' }}>
          <span>Contributed by {prompt.is_anonymous ? 'Anonymous contributor' : (prompt.display_name || 'Community contributor')}</span>
        </div>
      </article>
    </main>
  );
}