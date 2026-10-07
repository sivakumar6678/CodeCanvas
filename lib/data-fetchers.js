import fs from 'fs/promises';
import path from 'path';
import React from 'react';
import { getCatalogFileForCategory } from './catalog-categories.js';

const cache = React.cache || ((fn) => fn);

const DATA_DIR = path.join(process.cwd(), 'data');
const AI_TOOLS_DIR = path.join(DATA_DIR, 'ai-tools');

async function getPersistenceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    return null;
  }
  try {
    const { createClient } = await import('./supabase/server.js');
    return await createClient();
  } catch {
    return null;
  }
}

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

const getFileTools = cache(async () => {
  const jsonFiles = await getCategoryFiles();
  const toolGroups = await Promise.all(
    jsonFiles.map((file) => readJsonFile(path.join(AI_TOOLS_DIR, file)))
  );

  return toolGroups.flat();
});

export async function getAllTools() {
  const supabase = await getPersistenceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('catalog_tools')
        .select('data')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((row) => row.data).filter(Boolean);
        if (mapped.length > 0) return mapped;
      }
    } catch {
      // Fall through to local files on exception
    }
  }
  return getFileTools();
}

const getFileToolsByCategory = cache(async (categorySlug) => {
  const catalogFile = getCatalogFileForCategory(categorySlug);
  if (!catalogFile) return [];
  const filePath = path.join(AI_TOOLS_DIR, catalogFile);
  return readJsonFile(filePath);
});

export async function getToolsByCategory(categorySlug) {
  const supabase = await getPersistenceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('catalog_tools')
        .select('data')
        .eq('published', true)
        .eq('category', categorySlug)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((row) => row.data).filter(Boolean);
        if (mapped.length > 0) return mapped;
      }
    } catch {
      // Fall through to local files on exception
    }
  }
  return getFileToolsByCategory(categorySlug);
}

export async function getToolBySlug(slug) {
  const allTools = await getAllTools();
  return allTools.find((tool) => tool.slug === slug) || null;
}

export const getFeaturedTools = cache(async () => {
  const filePath = path.join(DATA_DIR, 'featured.json');
  const featuredSlugs = await readJsonFile(filePath);
  const allTools = await getAllTools();

  return featuredSlugs
    .map((slug) => allTools.find((tool) => tool.slug === slug))
    .filter(Boolean);
});

const getFilePrompts = cache(async () => {
  const filePath = path.join(DATA_DIR, 'default-prompts.json');
  return readJsonFile(filePath);
});

export async function getAllPrompts() {
  const supabase = await getPersistenceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('data')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((row) => row.data).filter(Boolean);
        if (mapped.length > 0) return mapped;
      }
    } catch {
      // Fall through to local files on exception
    }
  }
  return getFilePrompts();
}

export async function getRelatedTools(tool, limit = 4) {
  if (!tool) return [];

  const sameCategoryTools = await getToolsByCategory(tool.category);
  const sameCategoryMatches = sameCategoryTools.filter((candidate) => candidate.slug !== tool.slug);
  const allTools = sameCategoryMatches.length >= limit ? sameCategoryMatches : await getAllTools();
  const otherTools = allTools.filter((candidate) => candidate.slug !== tool.slug);

  const scoredTools = otherTools.map((candidate) => {
    let score = 0;

    // 1. Taxonomy Category match (+5)
    if (candidate.category === tool.category) score += 5;

    // 2. Subcategory match (+4)
    if (candidate.subCategory && tool.subCategory && candidate.subCategory.toLowerCase() === tool.subCategory.toLowerCase()) {
      score += 4;
    }

    // 3. Shared Tags (+2 per tag)
    if (candidate.tags && tool.tags) {
      const toolTags = tool.tags.map((t) => (t || '').toLowerCase());
      const commonTags = candidate.tags.filter((tag) => toolTags.includes((tag || '').toLowerCase()));
      score += commonTags.length * 2;
    }

    // 4. Shared Platforms (+1 per platform)
    const candidatePlatforms = (candidate.platforms || candidate.platform || []).map((p) => (p || '').toLowerCase());
    const toolPlatforms = (tool.platforms || tool.platform || []).map((p) => (p || '').toLowerCase());
    const commonPlatforms = candidatePlatforms.filter((p) => toolPlatforms.includes(p));
    score += commonPlatforms.length;

    // 5. Matching Pricing Model (+1)
    const candidatePricing = (candidate.pricingModel || candidate.pricing || '').toLowerCase();
    const toolPricing = (tool.pricingModel || tool.pricing || '').toLowerCase();
    if (candidatePricing && toolPricing && candidatePricing === toolPricing) {
      score += 1;
    }

    return { ...candidate, _score: score };
  });

  return scoredTools
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...cleanTool }) => cleanTool);
}
