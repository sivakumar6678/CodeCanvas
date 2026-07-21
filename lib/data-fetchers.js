import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';

const DATA_DIR = path.join(process.cwd(), 'data');
const AI_TOOLS_DIR = path.join(DATA_DIR, 'ai-tools');

const readJsonFile = cache(async (filePath) => {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}:`, error);
    return [];
  }
});

const getCategoryFiles = cache(async () => {
  try {
    const files = await fs.readdir(AI_TOOLS_DIR);
    return files.filter((file) => file.endsWith('.json'));
  } catch (error) {
    console.error('Error reading AI tool directory:', error);
    return [];
  }
});

export const getCategories = cache(async () => {
  const filePath = path.join(DATA_DIR, 'categories.json');
  return readJsonFile(filePath);
});

export const getAllTools = cache(async () => {
  const jsonFiles = await getCategoryFiles();
  const toolGroups = await Promise.all(
    jsonFiles.map((file) => readJsonFile(path.join(AI_TOOLS_DIR, file)))
  );

  return toolGroups.flat();
});

export const getToolsByCategory = cache(async (categorySlug) => {
  const filePath = path.join(AI_TOOLS_DIR, `${categorySlug}.json`);
  return readJsonFile(filePath);
});

export const getToolBySlug = cache(async (slug) => {
  const allTools = await getAllTools();
  return allTools.find((tool) => tool.slug === slug) || null;
});

export const getFeaturedTools = cache(async () => {
  const filePath = path.join(DATA_DIR, 'featured.json');
  const featuredSlugs = await readJsonFile(filePath);
  const allTools = await getAllTools();

  return featuredSlugs
    .map((slug) => allTools.find((tool) => tool.slug === slug))
    .filter(Boolean);
});

export async function getRelatedTools(tool, limit = 4) {
  if (!tool) return [];

  const sameCategoryTools = await getToolsByCategory(tool.category);
  const sameCategoryMatches = sameCategoryTools.filter((candidate) => candidate.slug !== tool.slug);
  const allTools = sameCategoryMatches.length >= limit ? sameCategoryMatches : await getAllTools();
  const otherTools = allTools.filter((candidate) => candidate.slug !== tool.slug);

  const scoredTools = otherTools.map((candidate) => {
    let score = 0;

    if (candidate.category === tool.category) score += 3;
    if (candidate.subCategory && candidate.subCategory === tool.subCategory) score += 5;

    if (candidate.tags && tool.tags) {
      const commonTags = candidate.tags.filter((tag) => tool.tags.includes(tag));
      score += commonTags.length * 2;
    }

    return { ...candidate, _score: score };
  });

  return scoredTools
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...cleanTool }) => cleanTool);
}
