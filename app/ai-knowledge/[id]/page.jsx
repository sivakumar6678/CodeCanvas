import { notFound } from 'next/navigation';
import { FiArrowLeft, FiArrowUpRight } from 'react-icons/fi';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import PromptCustomizer from '../../../components/prompts/PromptCustomizer';
import SavePromptButton from '../../../components/prompts/SavePromptButton';
import { generatePromptSchema } from '../../../lib/seo-schema';
import { KNOWLEDGE_TYPE_LABELS } from '../../../lib/knowledge-schema';
import styles from './page.module.scss';
import defaultPrompts from '../../../data/default-prompts.json';

async function fetchKnowledgeItem(id) {
  let item = null;

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from('prompt_submissions')
        .select('id,title,type,prompt_content,ai_model,category,use_case,use_cases,tags,description,display_name,is_anonymous')
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();
      item = data;
    }
  } catch (e) {
    // Supabase unavailable or table empty
  }

  if (!item) {
    item = defaultPrompts.find((p) => String(p.id).toLowerCase() === String(id).toLowerCase()) || null;
  }

  return item;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = await fetchKnowledgeItem(id);

  if (!item) {
    return { title: 'AI Knowledge Item Not Found | CodeCraft' };
  }

  const typeLabel = KNOWLEDGE_TYPE_LABELS[item.type] || 'Prompt';
  return {
    title: `${item.title} | ${typeLabel} | AI Knowledge`,
    description: item.description || `Explore "${item.title}" in CodeCraft AI Knowledge base.`,
  };
}

export default async function KnowledgeDetailPage({ params }) {
  const { id } = await params;
  const item = await fetchKnowledgeItem(id);

  if (!item) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://codecraft.dev';
  const jsonLd = generatePromptSchema(item, siteUrl);

  const typeLabel = KNOWLEDGE_TYPE_LABELS[item.type] || item.type || 'Prompt';

  // Find 3 related items from same category or model
  const relatedItems = defaultPrompts
    .filter((p) => String(p.id) !== String(item.id) && (p.category === item.category || p.ai_model === item.ai_model))
    .slice(0, 3);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={styles.topBar}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumbs">
          <Link href="/">Home</Link>
          <span className={styles.separator}>/</span>
          <Link href="/ai-knowledge">AI Knowledge</Link>
          <span className={styles.separator}>/</span>
          {item.category && (
            <>
              <Link href={`/ai-knowledge?category=${encodeURIComponent(item.category)}`}>
                {item.category}
              </Link>
              <span className={styles.separator}>/</span>
            </>
          )}
          <span className={styles.current}>{item.title}</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/ai-knowledge" className={styles.back}>
            <FiArrowLeft /> Back to AI Knowledge
          </Link>
          <SavePromptButton promptId={item.id} showLabel={true} />
        </div>
      </div>

      <article className={styles.article}>
        <div className={styles.metaRow}>
          <span className={`${styles.badge} ${styles.typeBadge}`}>{typeLabel}</span>
          {item.ai_model && (
            <span className={`${styles.badge} ${styles.modelBadge}`}>{item.ai_model}</span>
          )}
          {item.category && (
            <span className={`${styles.badge} ${styles.categoryBadge}`}>{item.category}</span>
          )}
          {item.use_case && (
            <span className={`${styles.badge} ${styles.useCaseBadge}`}>{item.use_case}</span>
          )}
        </div>

        <h1>{item.title}</h1>
        <p className={styles.description}>{item.description}</p>

        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className={styles.tagsRow}>
            {item.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className={styles.contentWrapper}>
          <PromptCustomizer promptContent={item.prompt_content} title={item.title} />
        </div>

        <div className={styles.tipBox}>
          <strong>Usage Tip:</strong> Replace any template placeholders (like <code>{'{{variable}}'}</code>) above with your project's specific context. When working with AI coding assistants (like Claude Code, Cursor, or Windsurf), pair this pattern with relevant file references for maximum accuracy.
        </div>

        <div className={styles.footer}>
          <span>
            Contributed by{' '}
            <strong>
              {item.is_anonymous ? 'Anonymous contributor' : (item.display_name || 'CodeCraft Team')}
            </strong>
          </span>
          <span>Added {item.created_date || 'recently'}</span>
        </div>
      </article>

      {relatedItems.length > 0 && (
        <section className={styles.relatedSection}>
          <h2>Related AI Knowledge</h2>
          <div className={styles.relatedGrid}>
            {relatedItems.map((rel) => (
              <Link key={rel.id} href={`/ai-knowledge/${rel.id}`} className={styles.relatedCard}>
                <div>
                  <span className={`${styles.badge} ${styles.typeBadge}`}>
                    {KNOWLEDGE_TYPE_LABELS[rel.type] || rel.type}
                  </span>
                  <h3>{rel.title}</h3>
                  <p>{rel.description ? rel.description.slice(0, 100) + '...' : ''}</p>
                </div>
                <div className={styles.relatedFooter}>
                  <span>{rel.ai_model}</span>
                  <span>
                    View <FiArrowUpRight />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

