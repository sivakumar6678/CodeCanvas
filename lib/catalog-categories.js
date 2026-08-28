export const CATEGORY_CATALOG_FILES = {
  development: 'development.json',
  design: 'design.json',
  image: 'image.json',
  video: 'video.json',
  'audio-voice': 'audio-voice.json',
  writing: 'writing.json',
  research: 'research.json',
  education: 'education.json',
  productivity: 'productivity.json',
  business: 'business.json',
  'ai-assistants': 'ai-assistants.json',
  'developer-utilities': 'developer-utilities.json',
  'no-code-automation': 'no-code-automation.json',
  'website-app-builders': 'website-app-builders.json',
  'marketing-seo': 'marketing-seo.json',
  documents: 'documents.json',
  presentations: 'presentations.json',
  security: 'security.json',
};

export function getCatalogFileForCategory(categorySlug) {
  return CATEGORY_CATALOG_FILES[categorySlug] || null;
}

export function getCatalogCategorySlugs() {
  return Object.keys(CATEGORY_CATALOG_FILES);
}