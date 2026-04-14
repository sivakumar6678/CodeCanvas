// lib/apiService.js
// AI API wrapper with retry logic and user-friendly error handling

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const trackToolClick = async (toolId, action = 'click') => {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, action }),
    });
  } catch (err) {
    console.error('Tracking error:', err);
  }
};

/**
 * Core AI call with one automatic retry on retryable failures (503, 429, network errors).
 * Returns the raw Gemini response JSON on success.
 * Throws a user-friendly Error on final failure.
 */
const callAIGenerate = async (prompt, config = {}, attempt = 0) => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, config }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const status = response.status;
      const isRetryable = [429, 503, 500, 408].includes(status);

      // Retry once on retryable server errors
      if (isRetryable && attempt === 0) {
        await sleep(1800);
        return callAIGenerate(prompt, config, 1);
      }

      // Map status codes to user-friendly messages
      const messages = {
        429: 'Rate limit reached. Please wait a moment and try again.',
        503: 'The AI service is temporarily overloaded. Please try again shortly.',
        408: 'Request timed out. Please check your connection and try again.',
        401: 'API authentication failed. Please contact support.',
        400: 'Invalid request. Please adjust your input and try again.',
      };

      throw new Error(
        messages[status] ||
        errorData.error ||
        'Something went wrong. Please try again.'
      );
    }

    return await response.json();
  } catch (err) {
    // Network / fetch errors — retry once
    if (err.name === 'TypeError' && attempt === 0) {
      await sleep(1800);
      return callAIGenerate(prompt, config, 1);
    }
    // Re-throw already user-friendly errors as-is
    throw err;
  }
};

// ── Tool-specific API methods ─────────────────────────────────

export const generateCodeSnippet = async (description) => {
  if (!description.trim()) throw new Error('Please describe the code you want to generate.');

  await trackToolClick('code-snippet-generator');

  return await callAIGenerate(
    `Generate a code snippet for: ${description}. 
     Please provide only the code without any explanations or comments. 
     Format the response as:
     LANGUAGE: [language]
     CODE: [code]`
  );
};

export const generateProjectIdeas = async ({ technologies, difficulty, projectType, targetUsers }) => {
  if (!technologies || !difficulty || !projectType || !targetUsers) {
    throw new Error('All fields are required.');
  }

  await trackToolClick('project-suggestion');

  return await callAIGenerate(
    `Generate 5 structured project ideas based on the following inputs:
     - Known Technologies: ${technologies}
     - Difficulty Level: ${difficulty}
     - Project Type: ${projectType}
     - Target Users: ${targetUsers}

     Each idea should follow this format:
     Project Idea: [Title]
     A [brief description]
     Key Features:
     - [Feature 1]
     - [Feature 2]
     Potential Challenges:
     - [Challenge 1]
     Tech Stack:
     - [Technology 1]`
  );
};

export const generateColorPalette = async (theme) => {
  if (!theme) throw new Error('Theme is required.');

  await trackToolClick('color-palette-generator');

  const data = await callAIGenerate(
    `Generate a modern, cohesive color palette for a ${theme} project. 
     Return only a list of hex color codes in this exact format:
     #FF5733, #33FF57, #3357FF, #AABBCC, #DDEEFF`
  );

  const aiResponse = data.candidates[0]?.content?.parts[0]?.text || '';
  const hexColors = aiResponse.match(/#[0-9A-Fa-f]{6}/g) || [];

  if (hexColors.length === 0) {
    throw new Error('Could not extract color codes. Please try again.');
  }

  return hexColors;
};

export const generateGradients = async (projectType, mood, theme) => {
  await trackToolClick('gradient-generator');

  const data = await callAIGenerate(
    `Suggest 5 to 15 unique CSS gradients for a ${projectType} with a ${mood} mood and ${theme} theme.
     Return only a list of gradients, one per line, formatted exactly like this:
     linear-gradient(to right, #ff7e5f, #feb47b)
     Do not include explanations, markdown, or extra text.`
  );

  const responseText = data.candidates[0]?.content?.parts[0]?.text || '';
  const gradientRegex = /linear-gradient\([^)]*\)|radial-gradient\([^)]*\)|conic-gradient\([^)]*\)/g;
  const extracted = responseText.match(gradientRegex);

  if (!extracted || extracted.length === 0) {
    throw new Error('No valid gradients found. Please try different settings.');
  }

  return extracted.slice(0, 15);
};

export const generateBoxShadow = async (projectType, mood, theme) => {
  await trackToolClick('box-shadow-generator');

  const data = await callAIGenerate(
    `Suggest a beautiful box shadow for a ${projectType} with a ${mood} mood and ${theme} theme. 
     Return only the box shadow value in CSS format like: '10px 10px 20px rgba(0, 0, 0, 0.5)'.`
  );

  const boxShadowString = data.candidates[0]?.content?.parts[0]?.text?.trim() || '';
  if (!boxShadowString) {
    throw new Error('Could not generate a box shadow. Please try again.');
  }

  return boxShadowString;
};
