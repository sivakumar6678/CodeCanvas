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