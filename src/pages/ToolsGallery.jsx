import React, { useState } from 'react';
import '../styles/toolsgalary.scss';
import { tools } from './tools';

const ToolsGallery = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All",...new Set(tools.map(tool => tool.category))];


  return (
<div className="tools-gallery">
  <input
    type="text"
    placeholder="Search tools..."
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    className="search-input"
  />
  <div className="category-buttons">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
          >
            {category}
          </button>
        ))}
      </div>
  <div className="tools-list">
    {filteredTools.map(tool => (
      <div key={tool.name} className="tool-card">
        <span className="tool-icon">{tool.icon}</span>
        <h3 className="tool-name">{tool.name}</h3>
        <p className="tool-description">{tool.description}</p>
        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="tool-link">Visit</a>
      </div>
    ))}
  </div>
</div>

  );
};
export default ToolsGallery;