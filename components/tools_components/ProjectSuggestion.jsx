"use client";
import React, { useState } from 'react';
import { FaSync, FaTrash } from 'react-icons/fa';
import { generateProjectIdeas } from '../../lib/apiService';
import '../../app/tools_styles/projectSuggestion.scss';

const ProjectSuggestion = () => {
  const [knownLanguages, setKnownLanguages] = useState([]);
  const [inputLanguage, setInputLanguage] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [projectType, setProjectType] = useState("Web App");
  const [targetUsers, setTargetUsers] = useState("Students");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddLanguage = () => {
    if (inputLanguage.trim() !== "" && !knownLanguages.includes(inputLanguage.trim())) {
      setKnownLanguages([...knownLanguages, inputLanguage.trim()]);
      setInputLanguage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddLanguage();
  };

  const handleRemoveLanguage = (lang) => {
    setKnownLanguages(knownLanguages.filter((l) => l !== lang));
  };

  const handleGenerateIdeas = async () => {
    if (!knownLanguages.length) {
      setError("Please add at least one known technology.");
      return;
    }
    if (!difficulty || !projectType || !targetUsers) {
      setError("All fields are required.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuggestions([]);

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
          throw new Error("Failed to extract project ideas from AI response.");
        }
      } else {
         throw new Error("Unexpected response structure from AI service.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const parseProjectIdeas = (text) => {
    text = text.replace(/\*\*/g, "").trim();
  
    const ideas = text.split("Project Idea").slice(1).map(block => {
      const title = block.match(/:\s*(.*)/)?.[1]?.trim() || "Untitled Project";
      const description = block.match(/A (.*)/)?.[1]?.trim() || "No description provided.";
      
      const featuresBlock = block.match(/Key Features:\s*([\s\S]*?)\s*Potential Challenges:/)?.[1]?.trim() || "";
      const features = featuresBlock.split("\n").map(f => f.replace(/^[*-]/, "").trim()).filter(Boolean);
      
      const challengesBlock = block.match(/Potential Challenges:\s*([\s\S]*?)\s*Tech Stack:/)?.[1]?.trim() || "";
      const challenges = challengesBlock.split("\n").map(c => c.replace(/^[*-]/, "").trim()).filter(Boolean);
      
      const techStackBlock = block.match(/Tech Stack:\s*([\s\S]*)/)?.[1]?.trim() || "";
      const techStack = techStackBlock.split("\n").map(t => t.replace(/^[*-]/, "").trim()).filter(Boolean);
  
      return { 
        title, 
        description, 
        features: features.length ? features : ["No specific features listed."], 
        challenges: challenges.length ? challenges : ["No major challenges identified."], 
        techStack: techStack.length ? techStack : ["Tech stack open."] 
      };
    });
  
    return ideas.length > 0 ? ideas : [];
  };

  return (
    <div className="project-suggestion">
      {/* ── LEFT: Inputs ──────────────────────────────── */}
      <div className="tool-inputs-pane">
        <div className="input-group">
          <label>Known Technologies</label>
          <div className="language-input flex gap-2">
            <input
              type="text"
              value={inputLanguage}
              onChange={(e) => setInputLanguage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., React, Node, Python"
              className="input-field flex-grow"
            />
            <button onClick={handleAddLanguage} className="secondary-btn shrink-0">Add</button>
          </div>
        </div>

        {/* Tags */}
        <div className="language-list flex flex-wrap gap-2 mt-3 mb-6">
          {knownLanguages.map((lang, index) => (
            <span key={index} className="language-item inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100">
              {lang} 
              <button onClick={() => handleRemoveLanguage(lang)} className="text-indigo-400 hover:text-red-500 transition-colors">
                <FaTrash size={12} />
              </button>
            </span>
          ))}
          {knownLanguages.length === 0 && <span className="text-sm text-gray-400 italic">No technologies added yet.</span>}
        </div>

        <div className="controls-grid grid gap-4">
          <div className="input-group">
            <label>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field w-full">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="input-group">
            <label>Project Type</label>
            <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="input-field w-full">
              <option value="Web App">Web App</option>
              <option value="Mobile App">Mobile App</option>
              <option value="API Component">API Component</option>
              <option value="AI Tool">AI Tool</option>
              <option value="Script/CLI">Script / CLI</option>
              <option value="Blockchain">Blockchain</option>
            </select>
          </div>

          <div className="input-group">
            <label>Target Users</label>
            <select value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)} className="input-field w-full">
              <option value="Students">Students</option>
              <option value="Developers">Developers</option>
              <option value="Businesses">Businesses</option>
              <option value="General Public">General Public</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleGenerateIdeas} 
          disabled={isLoading || knownLanguages.length === 0} 
          className="primary-btn mt-6 w-full flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <><FaSync className="animate-spin mr-2" /> Brainstorming...</> : "Generate Ideas 💡"}
        </button>
      </div>

      {/* ── RIGHT: Outputs ────────────────────────────── */}
      <div className="tool-outputs-pane">
        {error && <div className="error text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg mb-4 text-sm font-medium">⚠️ {error}</div>}

        {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400">
                <FaSync className="animate-spin text-indigo-400 text-2xl mb-3" />
                <p className="text-sm">Analyzing your tech stack...</p>
            </div>
        )}

        {!isLoading && suggestions.length > 0 && (
          <div className="suggestions flex flex-col gap-4">
            {suggestions.map((idea, index) => (
              <div key={index} className="idea-card bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{idea.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{idea.description}</p>
                
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-indigo-600 block mb-1">Key Features:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-gray-600">
                      {idea.features.map((feature, i) => <li key={i}>{feature}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-orange-600 block mb-1">Challenges:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-gray-600">
                      {idea.challenges.map((challenge, i) => <li key={i}>{challenge}</li>)}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <strong className="text-gray-700 text-xs uppercase tracking-wider block mb-2">Recommended Stack:</strong>
                  <div className="flex flex-wrap gap-2">
                    {idea.techStack.map((tech, i) => (
                        <span key={i} className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded shadow-sm">{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && suggestions.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-gray-400">
                <span className="text-3xl mb-3">🚀</span>
                <p className="text-sm font-medium">Your project ideas will live here</p>
                <p className="text-xs text-gray-300 mt-1">Add your known tech stack and hit generate</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSuggestion;
