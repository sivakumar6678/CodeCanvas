import { getToolBySlug, getRelatedTools, getCategories } from '../../../../lib/data-fetchers';
import { notFound } from 'next/navigation';
import TrackView from '../../../../components/ai-tools/TrackView';
import Breadcrumb from '../../../../components/ai-tools/Breadcrumb';
import ToolHero from '../../../../components/ai-tools/ToolHero';
import ContentSection from '../../../../components/ai-tools/ContentSection';
import RelatedTools from '../../../../components/ai-tools/RelatedTools';
import ReviewsSection from '../../../../components/ai-tools/ReviewsSection';
import CommentsSection from '../../../../components/ai-tools/CommentsSection';
import styles from './page.module.scss';

export async function generateMetadata({ params }) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) return { title: 'Tool Not Found' };
  
  // Dynamic SEO generation based on JSON data
  return {
    title: `${tool.name} - ${tool.description}`,
    description: tool.overview ? tool.overview.substring(0, 160) : tool.description,
    openGraph: {
      title: `${tool.name} AI Tool Profile`,
      description: tool.description,
      images: [tool.banner || tool.logo || ''],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.name,
      description: tool.description,
      images: [tool.banner || tool.logo || ''],
    },
    alternates: {
      canonical: `https://yourplatform.com/ai-tools/tool/${tool.slug}`,
    },
  };
}

export default async function ToolDetailPage({ params }) {
  const tool = await getToolBySlug(params.slug);
  
  if (!tool) {
    notFound();
  }

  const categories = await getCategories();
  const categoryData = categories.find(c => c.slug === tool.category);
  const relatedTools = await getRelatedTools(tool);

  const breadcrumbItems = [
    { label: 'AI Tools', href: '/ai-tools' },
    { label: categoryData?.name || tool.category, href: `/ai-tools/${tool.category}` },
    { label: tool.name }
  ];

  return (
    <div className={styles.container}>
      <TrackView slug={tool.slug} />
      
      <Breadcrumb items={breadcrumbItems} />
      
      <ToolHero tool={tool} />
      
      <ContentSection tool={tool} />

      <ReviewsSection slug={tool.slug} />

      <CommentsSection slug={tool.slug} />

      <RelatedTools tools={relatedTools} />
    </div>
  );
}
