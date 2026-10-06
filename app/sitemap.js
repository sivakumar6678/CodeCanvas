import { getAllPrompts, getAllTools } from '../lib/data-fetchers';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://codecraft.dev').replace(/\/$/, '');

export default async function sitemap() {
  const [tools, prompts] = await Promise.all([getAllTools(), getAllPrompts()]);
  const staticRoutes = ['/', '/about', '/ai-tools', '/ai-knowledge', '/tools', '/build-toolkit', '/community', '/users'];

  return [
    ...staticRoutes.map((route, index) => ({
      url: `${siteUrl}${route}`,
      changeFrequency: index === 0 ? 'weekly' : 'monthly',
      priority: index === 0 ? 1 : 0.7,
    })),
    ...tools.filter((tool) => tool?.slug).map((tool) => ({
      url: `${siteUrl}/ai-tools/tool/${tool.slug}`,
      lastModified: tool.createdDate || undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...prompts.filter((prompt) => prompt?.id).map((prompt) => ({
      url: `${siteUrl}/ai-knowledge/${prompt.id}`,
      lastModified: prompt.updated_at || prompt.created_at || undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ];
}
