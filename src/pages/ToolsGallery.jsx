import React, { useState } from 'react';
import '../styles/toolsgalary.scss';

// Sample tool data (could be fetched from a JSON or API)
const tools = [
  {
    name: "Unsplash",
    description: "A collection of high-quality, free-to-use images.",
    url: "https://unsplash.com",
    category: "Design"
  },
  {
    name: "Font Awesome",
    description: "A collection of vector icons for your projects.",
    url: "https://fontawesome.com",
    category: "Design"
  },
  {
    name: "TinyPNG",
    description: "Compresses your images for faster loading.",
    url: "https://tinypng.com",
    category: "Performance"
  }
  // Add more tools here...
];

const ToolsGallery = () => {
  const [search, setSearch] = useState("");

  // Filter tools based on search input
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(search.toLowerCase()) ||
    tool.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1>Tools Gallery</h1>
      <input 
        type="text" 
        placeholder="Search tools..." 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
      />
      <div className="tools-grid">
        {filteredTools.map((tool, index) => (
          <div className="tool-card" key={index}>
            <h2>{tool.name}</h2>
            <p>{tool.description}</p>
            <a href={tool.url} target="_blank" rel="noopener noreferrer">Go to Tool</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsGallery;
