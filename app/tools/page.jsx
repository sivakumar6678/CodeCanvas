"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ToolCard from '../../components/ToolCard';
import { allTools, builtinTools, externalTools, getAllCategories, getBuiltinCategories, getExternalCategories } from '../../lib/toolData';
import '../tools.scss';

const Tools = () => {
  const [toolType, setToolType] = useState('all'); // 'all', 'builtin', 'external'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Get tools based on type filter
  const getFilteredToolsByType = () => {
    switch(toolType) {
      case 'builtin': return builtinTools;
      case 'external': return externalTools;
      default: return allTools;
    }
  };

  // Get categories based on type filter
  const getCategories = () => {
    switch(toolType) {
      case 'builtin': return getBuiltinCategories();
      case 'external': return getExternalCategories();
      default: return getAllCategories();
    }
  };

  // Apply all filters
  const filteredTools = getFilteredToolsByType().filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = getCategories();

  return (
    <section className="tools" id="tools">
      <div className="container">
        <div className="tools-header">
          <h1>Developer Tools</h1>
          <p className="tools-subtitle">AI-powered tools and curated resources to accelerate your workflow</p>
        </div>

        {/* Type Tabs */}
        <div className="type-tabs">
          <button
            className={`type-tab ${toolType === 'all' ? 'active' : ''}`}
            onClick={() => {
              setToolType('all');
              setCategoryFilter('All');
            }}
          >
            All Tools
          </button>
          <button
            className={`type-tab ${toolType === 'builtin' ? 'active' : ''}`}
            onClick={() => {
              setToolType('builtin');
              setCategoryFilter('All');
            }}
          >
            Built-in Tools
          </button>
          <button
            className={`type-tab ${toolType === 'external' ? 'active' : ''}`}
            onClick={() => {
              setToolType('external');
              setCategoryFilter('All');
            }}
          >
            External Tools
          </button>
        </div>

        {/* Search and Category Filters */}
        <div className="tools-filters">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tools-search-input"
          />
          
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${categoryFilter === category ? 'active' : ''}`}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Count */}
        <div className="tools-count">
          Showing {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
        </div>

        {/* Tools Grid */}
        <div className="tools-grid">
          {filteredTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="no-results">
            <p>No tools found matching your criteria.</p>
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('All');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Tools; 