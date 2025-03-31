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

export const generateGradients = async (projectType, mood, theme) => {
  const response = await fetch(BASE_URL + `?key=${API_KEY}`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          contents: [{
              parts: [{
                  text: `Suggest 5 to 15 unique CSS gradients for a ${projectType} with a ${mood} mood and ${theme} theme.
                  Return only a list of gradients, formatted exactly like this:
                  linear-gradient(to right, #ff7e5f, #feb47b)
                  linear-gradient(to bottom, #4facfe, #00f2fe)
                  linear-gradient(45deg, #ff9a9e, #fad0c4)
                  radial-gradient(circle, #ff9a9e, #fad0c4)
                  radial-gradient(circle, #ff9a9e, #fad0c4)
                  conic-gradient(#ff0000, #ffd800, #00ff00)
                  radial-gradient(#ff0000, #ffff00, #00ff00)
                  radial-gradient(#ff0000 5%, #ffff00 15%, #00ff00 60%)
                  repeating-radial-gradient(#ff0000, #ffff00 10%, #00ff00 15%)
                  radial-gradient(closest-side at 60% 55%, #ff0000, #ffff00, #000000)
                  Do not include explanations, markdown, bullet points, or extra text. Just the raw CSS gradient values, one per line.`
              }]
          }]
      })
  });

  if (!response.ok) {
      throw new Error('Error connecting to AI service');
  }

  const data = await response.json();
  console.log("API Response:", data);

  if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];

      let responseText = "";
      if (candidate.content && Array.isArray(candidate.content.parts)) {
          responseText = candidate.content.parts.map(part => part.text).join(' ').trim();
      }

      console.log("Extracted Response:", responseText);

      // ✅ Extract all CSS gradients using regex
      const gradientRegex = /linear-gradient\([^)]*\)|radial-gradient\([^)]*\)|conic-gradient\([^)]*\)/g;
      const extractedGradients = responseText.match(gradientRegex);

      if (Array.isArray(extractedGradients) && extractedGradients.length > 0) {
          console.log("Extracted Gradients:", extractedGradients);
          return extractedGradients.slice(0, 15); // Limit to 15 gradients
      }
  }

  throw new Error('No valid gradients found in API response');
};


export const generateBoxShadow = async (projectType, mood, theme) => {
    const response = await fetch(BASE_URL + `?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `Suggest a beautiful box shadow for a ${projectType} with a ${mood} mood and ${theme} theme. 
                    Return only the box shadow in CSS format like: '10px 10px 20px rgba(0, 0, 0, 0.5)'. 
                    Do not include explanations or additional text.`
                }]
            }]
        })
    });

    if (!response.ok) {
        throw new Error('Error connecting to AI service');
    }

    const data = await response.json();
    console.log("API Response:", data); // Debugging line

    // Ensure to extract the box shadow string from the response
    const boxShadowString = data.candidates[0]?.content?.parts[0]?.text || '';
    if (!boxShadowString) {
        throw new Error('No box shadow string found in the response.');
    }

    return boxShadowString; // Return the box shadow string
}
