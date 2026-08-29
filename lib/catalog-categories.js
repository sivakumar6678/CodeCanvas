export const CATEGORY_CATALOG_FILES = {
  // Primary 6 core taxonomy categories
  'ai-assistants': 'ai-assistants.json',
  'ai-development': 'ai-development.json',
  'ai-app-building': 'ai-app-building.json',
  'creative-ai': 'creative-ai.json',
  'productivity-ai': 'productivity-ai.json',
  'business-ai': 'business-ai.json',

  // Backward-compatible category aliases
  development: 'ai-development.json',
  'developer-utilities': 'ai-development.json',
  'website-app-builders': 'ai-app-building.json',
  'no-code-automation': 'ai-app-building.json',
  design: 'creative-ai.json',
  image: 'creative-ai.json',
  video: 'creative-ai.json',
  'audio-voice': 'creative-ai.json',
  productivity: 'productivity-ai.json',
  documents: 'productivity-ai.json',
  presentations: 'productivity-ai.json',
  writing: 'productivity-ai.json',
  business: 'business-ai.json',
  'marketing-seo': 'business-ai.json',
  research: 'ai-assistants.json',
  education: 'ai-assistants.json',
  security: 'ai-development.json',
};

export function getCatalogFileForCategory(categorySlug) {
  return CATEGORY_CATALOG_FILES[categorySlug] || null;
}

export function getCatalogCategorySlugs() {
  return Object.keys(CATEGORY_CATALOG_FILES);
}