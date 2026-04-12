import React, { useState } from 'react';
import { FaSync, FaTrash } from 'react-icons/fa';
import { generateProjectIdeas } from '../apiService'; // Import the API service
import '../styles/tools_styles/projectSuggestion.scss';

const ProjectSuggestion = () => {
  const [knownLanguages, setKnownLanguages] = useState([]);
  const [inputLanguage, setInputLanguage] = useState(""); // For input field
  const [difficulty, setDifficulty] = useState("Beginner");
  const [projectType, setProjectType] = useState("Web App");
  const [targetUsers, setTargetUsers] = useState("Students");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to add language to list
  const handleAddLanguage = () => {
    if (inputLanguage.trim() !== "" && !knownLanguages.includes(inputLanguage.trim())) {
      setKnownLanguages([...knownLanguages, inputLanguage.trim()]);
      setInputLanguage(""); // Clear input field
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddLanguage();
    }
  };

  // Function to remove language from list
  const handleRemoveLanguage = (lang) => {
    setKnownLanguages(knownLanguages.filter((l) => l !== lang));
  };

  // Function to generate project ideas
  const handleGenerateIdeas = async () => {
    if (!knownLanguages.length || !difficulty || !projectType || !targetUsers) {
      setError("All fields are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await generateProjectIdeas({
        technologies: knownLanguages.join(", "),
        difficulty,
        projectType,
        targetUsers,
      });

      if (data && data.candidates && Array.isArray(data.candidates)) {
        const ideasText = data.candidates[0]?.content?.parts[0]?.text || "";
        if (ideasText) {
          const parsedIdeas = parseProjectIdeas(ideasText);
          setSuggestions(parsedIdeas);
        } else {
          setError("Failed to extract project ideas");
        }
      } else {
        setError("Unexpected response structure");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to parse structured AI response
  const parseProjectIdeas = (text) => {
    console.log("Raw AI Response:", text); // Debugging
  
    // Remove unwanted asterisks (*) from the response
    text = text.replace(/\*\*/g, "").trim();
  
    const ideas = text.split("Project Idea").slice(1).map(block => {
      const title = block.match(/:\s*(.*)/)?.[1]?.trim() || "Untitled Project";
      const description = block.match(/A (.*)/)?.[1]?.trim() || "No description provided.";
      const features = block.match(/Key Features:\s*([\s\S]*?)\s*Potential Challenges:/)?.[1]?.trim().split("\n").map(f => f.replace(/[*-]/g, "").trim()).filter(Boolean) || ["No features listed."];
      const challenges = block.match(/Potential Challenges:\s*([\s\S]*?)\s*Tech Stack:/)?.[1]?.trim().split("\n").map(c => c.replace(/[*-]/g, "").trim()).filter(Boolean) || ["No challenges mentioned."];
      const techStack = block.match(/Tech Stack:\s*([\s\S]*)/)?.[1]?.trim().split("\n").map(t => t.replace(/[*-]/g, "").trim()).filter(Boolean) || ["Tech stack not specified."];
  
      return { title, description, features, challenges, techStack };
    });
  
    return ideas.length > 0 ? ideas : [{ title: "No Projects Found", description: "Try changing your input parameters.", features: [], challenges: [], techStack: [] }];
  };
  
  

  return (
    <div className="project-suggestion">
      <h2>Project Suggestion Tool</h2>

      {/* Known Languages Input */}
      <label>Known Languages:</label>
      <div className="language-input">
        <input
          type="text"
          value={inputLanguage}
          onChange={(e) => setInputLanguage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a language (e.g., Python, JavaScript)"
          className="input-field"
        />
        <button onClick={handleAddLanguage} className="add-button">Add</button>
      </div>

      {/* Display Added Languages */}
      <div className="language-list">
        {knownLanguages.map((lang, index) => (
          <span key={index} className="language-item">
            {lang} <button onClick={() => handleRemoveLanguage(lang)} className="remove-button">  <FaTrash /> </button>
          </span>
        ))}
      </div>

      {/* Other Inputs */}
      <label>Difficulty:</label>
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field">
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
      </select>

      <label>Project Type:</label>
      <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="input-field">
        <option value="Web App">Web App</option>
        <option value="AI Tool">AI Tool</option>
        <option value="Blockchain">Blockchain</option>
        {/* Add more project types as needed */}
      </select>

      <label>Target Users:</label>
      <select value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)} className="input-field">
        <option value="Students">Students</option>
        <option value="Developers">Developers</option>
        <option value="Businesses">Businesses</option>
        {/* Add more target users as needed */}
      </select>

      <button onClick={handleGenerateIdeas} disabled={isLoading} className="generate-btn">
        {isLoading ? "Generating..." : "Generate Project Ideas"}
      </button>

      {error && <p className="error">{error}</p>}

      {/* Display Project Ideas */}
      <div className="suggestions">
        {suggestions.map((idea, index) => (
          <div key={index} className="idea-card">
            <h3>{idea.title}</h3>
            <p>{idea.description}</p>
            <strong>Key Features:</strong>
            <ul>
              {idea.features.map((feature, i) => <li key={i}>{feature}</li>)}
            </ul>
            <strong>Potential Challenges:</strong>
            <ul>
              {idea.challenges.map((challenge, i) => <li key={i}>{challenge}</li>)}
            </ul>
            <strong>Tech Stack:</strong>
            <ul>
              {idea.techStack.map((tech, i) => <li key={i}>{tech}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectSuggestion;
