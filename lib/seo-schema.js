/**
 * Generates Schema.org SoftwareApplication JSON-LD for AI Tools
 */
export function generateToolSchema(tool, siteUrl = 'https://codecraft.dev') {
  if (!tool) return null;

  const url = `${siteUrl}/ai-tools/tool/${tool.slug}`;
  const priceFormatted = (tool.pricingModel || tool.pricing || 'Free');
  const isFree = tool.hasFree || priceFormatted.toLowerCase().includes('free');

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description || tool.fullOverview || `${tool.name} AI Tool`,
    applicationCategory: tool.category ? `${tool.category}Application` : 'DeveloperApplication',
    operatingSystem: (tool.platforms && tool.platforms.length > 0) ? tool.platforms.join(', ') : 'All',
    url,
    offers: {
      '@type': 'Offer',
      price: isFree ? '0.00' : '0',
      priceCurrency: 'USD',
      description: priceFormatted,
    },
    ...(tool.logoImageUrl || tool.logo ? { image: tool.logoImageUrl || tool.logo } : {}),
  };
}

/**
 * Generates Schema.org CreativeWork / HowTo JSON-LD for AI Prompts & Tricks
 */
export function generatePromptSchema(prompt, siteUrl = 'https://codecraft.dev') {
  if (!prompt) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: prompt.title,
    description: prompt.description || `${prompt.title} - AI prompt for ${prompt.ai_model || 'AI models'}`,
    text: prompt.prompt_content,
    keywords: [prompt.ai_model, prompt.category, prompt.type, prompt.use_case].filter(Boolean).join(', '),
    author: {
      '@type': 'Person',
      name: prompt.is_anonymous ? 'Community Contributor' : (prompt.display_name || 'Community Contributor'),
    },
  };
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD
 */
export function generateBreadcrumbSchema(items = [], siteUrl = 'https://codecraft.dev') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url?.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}

