import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const AI_TOOLS_DIR = path.join(DATA_DIR, 'ai-tools');

export async function getCategories() {
  try {
    const filePath = path.join(DATA_DIR, 'categories.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading categories:', error);
    return [];
  }
}

export async function getAllTools() {
  try {
    const files = await fs.readdir(AI_TOOLS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    let allTools = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(AI_TOOLS_DIR, file);
      const fileContents = await fs.readFile(filePath, 'utf8');
      const tools = JSON.parse(fileContents);
      allTools = allTools.concat(tools);
    }
    
    return allTools;
  } catch (error) {
    console.error('Error reading all tools:', error);
    return [];
  }
}

export async function getToolsByCategory(categorySlug) {
  try {
    const filePath = path.join(AI_TOOLS_DIR, `${categorySlug}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error reading tools for category ${categorySlug}:`, error);
    return [];
  }
}

export async function getToolBySlug(slug) {
  const allTools = await getAllTools();
  return allTools.find(tool => tool.slug === slug) || null;
}

export async function getFeaturedTools() {
  try {
    const filePath = path.join(DATA_DIR, 'featured.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const featuredSlugs = JSON.parse(fileContents);
    
    const allTools = await getAllTools();
    return allTools.filter(tool => featuredSlugs.includes(tool.slug));
  } catch (error) {
    console.error('Error reading featured tools:', error);
    return [];
  }
}

export async function getRelatedTools(tool, limit = 4) {
  if (!tool) return [];
  
  const allTools = await getAllTools();
  
  // Filter out the current tool
  const otherTools = allTools.filter(t => t.slug !== tool.slug);
  
  // Scoring system for relatedness
  const scoredTools = otherTools.map(t => {
    let score = 0;
    // Same category is a strong signal
    if (t.category === tool.category) score += 3;
    // Same subcategory is a very strong signal
    if (t.subCategory && t.subCategory === tool.subCategory) score += 5;
    // Matching tags
    if (t.tags && tool.tags) {
      const commonTags = t.tags.filter(tag => tool.tags.includes(tag));
      score += commonTags.length * 2;
    }
    return { ...t, _score: score };
  });
  
  // Sort by score descending and take the top N
  return scoredTools
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(t => {
      // Clean up internal _score property
      const { _score, ...cleanTool } = t;
      return cleanTool;
    });
}
