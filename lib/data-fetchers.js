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
