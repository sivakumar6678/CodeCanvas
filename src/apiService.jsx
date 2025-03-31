// src/apiService.js
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const generateCodeSnippet = async (description) => {
    if (!description.trim()) {
      throw new Error('Description cannot be empty');
    }
  
    const response = await fetch(BASE_URL + `?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a code snippet for: ${description}. 
                   Please provide only the code without any explanations or comments. 
                   Format the response as:
                   LANGUAGE: [language]
                   CODE: [code]`
          }]
        }]
      })
    });
  
    if (!response.ok) {
      throw new Error('Error connecting to AI service');
    }
  
    const data = await response.json();
    return data;
  };


// Function to generate project ideas
export const generateProjectIdeas = async ({ technologies, difficulty, projectType, targetUsers }) => {
  if (!technologies || !difficulty || !projectType || !targetUsers) {
    throw new Error('All fields are required');
  }
  
  const response = await fetch(BASE_URL + `?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate 5 structured project ideas based on the following inputs:
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
          - [Technology 3]
          `
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Error connecting to AI service');
  }

  const data = await response.json();
  return data;
};


// Function to generate color palette
export const generateColorPalette = async (theme) => {
  if (!theme) {
      throw new Error('Theme is required');
  }

  try {
      const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              contents: [{
                  parts: [{
                      text: `Generate a modern, cohesive color palette for a ${theme} project. 
                      The palette should only contain a list of hex color codes in this format:
                      #FF5733, #33FF57, #3357FF, #AABBCC, #DDEEFF`
                  }]
              }]
          })
      });

      if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🔥 Full API Response:", data);

      if (!data || !data.candidates || data.candidates.length === 0) {
          throw new Error('Invalid or empty response from AI.');
      }

      // Extract AI-generated text response
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text || '';
      console.log("🟢 Raw AI Response:", aiResponse);

      // Extract hex codes using regex
      const hexColors = aiResponse.match(/#[0-9A-Fa-f]{6}/g) || [];

      if (hexColors.length === 0) {
          throw new Error('No valid hex color codes found in the response.');
      }

      console.log("🎨 Extracted Palette:", hexColors);
      return hexColors;
  } catch (error) {
      console.error('❌ API Error:', error);
      throw new Error(error.message || 'Failed to fetch color palette.');
  }
};
