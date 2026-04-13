// lib/apiService.js

const trackToolClick = async (toolId, action = 'click') => {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, action })
    });
  } catch (err) {
    console.error('Tracking error:', err);
  }
};

const callAIGenerate = async (prompt, config = {}) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, config })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI Service Error');
  }

  return await response.json();
};

export const generateCodeSnippet = async (description) => {
  if (!description.trim()) {
    throw new Error('Description cannot be empty');
  }
  
  await trackToolClick('code-snippet-generator');

  return await callAIGenerate(`Generate a code snippet for: ${description}. 
    Please provide only the code without any explanations or comments. 
    Format the response as:
    LANGUAGE: [language]
    CODE: [code]`);
};

export const generateProjectIdeas = async ({ technologies, difficulty, projectType, targetUsers }) => {
  if (!technologies || !difficulty || !projectType || !targetUsers) {
    throw new Error('All fields are required');
  }

  await trackToolClick('project-suggestion');

  return await callAIGenerate(`Generate 5 structured project ideas based on the following inputs:
    - Known Technologies: ${technologies}
    - Difficulty Level: ${difficulty}
    - Project Type: ${projectType}
    - Target Users: ${targetUsers}

    Each idea should follow this format:
    Title: [Project Title]
    Description: [Brief Description]
    Key Features: 
    - [Feature 1]
    - [Feature 2]
    - [Feature 3]
    Potential Challenges:
    - [Challenge 1]
    - [Challenge 2]
    Recommended Tech Stack:
    - [Technology 1]
    - [Technology 2]
    - [Technology 3]`);
};

export const generateColorPalette = async (theme) => {
  if (!theme) {
    throw new Error('Theme is required');
  }

  await trackToolClick('color-palette-generator');

  const data = await callAIGenerate(`Generate a modern, cohesive color palette for a ${theme} project. 
    The palette should only contain a list of hex color codes in this format:
    #FF5733, #33FF57, #3357FF, #AABBCC, #DDEEFF`);

  const aiResponse = data.candidates[0]?.content?.parts[0]?.text || '';
  const hexColors = aiResponse.match(/#[0-9A-Fa-f]{6}/g) || [];
  
  if (hexColors.length === 0) {
    throw new Error('No valid hex color codes found in the response.');
  }

  return hexColors;
};

export const generateGradients = async (projectType, mood, theme) => {
  await trackToolClick('gradient-generator');

  const data = await callAIGenerate(`Suggest 5 to 15 unique CSS gradients for a ${projectType} with a ${mood} mood and ${theme} theme.
    Return only a list of gradients, formatted exactly like this:
    linear-gradient(to right, #ff7e5f, #feb47b)
    Do not include explanations, markdown, or extra text.`);

  const responseText = data.candidates[0]?.content?.parts[0]?.text || '';
  const gradientRegex = /linear-gradient\([^)]*\)|radial-gradient\([^)]*\)|conic-gradient\([^)]*\)/g;
  const extractedGradients = responseText.match(gradientRegex);

  if (!extractedGradients) {
    throw new Error('No valid gradients found in API response');
  }

  return extractedGradients.slice(0, 15);
};

export const generateBoxShadow = async (projectType, mood, theme) => {
  await trackToolClick('box-shadow-generator');

  const data = await callAIGenerate(`Suggest a beautiful box shadow for a ${projectType} with a ${mood} mood and ${theme} theme. 
    Return only the box shadow in CSS format like: '10px 10px 20px rgba(0, 0, 0, 0.5)'.`);

  const boxShadowString = data.candidates[0]?.content?.parts[0]?.text || '';
  if (!boxShadowString) {
    throw new Error('No box shadow string found in the response.');
  }

  return boxShadowString;
};
