"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaFilter, FaChevronRight } from 'react-icons/fa';
import ToolCard from '../../components/ToolCard';
import { allTools, builtinTools, externalTools, getAllCategories, getBuiltinCategories, getExternalCategories, categoryStructure } from '../../lib/toolData';
import '../tools.scss';

const Tools = () => {
  const [toolType, setToolType] = useState('all'); // 'all', 'builtin', 'external'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const toggleCategory = (parentCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [parentCategory]: !prev[parentCategory]
    }));
  };

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

  // Check if a category is a subcategory
  const isSubcategory = (category) => {
    return Object.values(categoryStructure).some(
      group => group.subcategories.includes(category)
    );
  };

  // Get parent category for a subcategory
  const getParentCategory = (subcategory) => {
    for (const [parent, data] of Object.entries(categoryStructure)) {
      if (data.subcategories.includes(subcategory)) {
        return parent;
      }
    }
    return null;
  };

  return (
    <section className="tools" id="tools">
      {/* Full-width header section */}
      <div className="tools-header-section">
        <div className="tools-header-content">
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
        </div>
      </div>

      {/* Full-width main layout */}
      <div className="tools-main-section">
        <div className="tools-layout">
          {/* Left: Main Content */}
          <div className="tools-main-content">
            {/* Mobile Filter Toggle */}
            <button 
              className="mobile-filter-toggle"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            >
              <FaFilter /> Filter by Category
            </button>

            {/* Search Bar */}
            <div className="tools-search-wrapper">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tools-search-input"
              />
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

          {/* Right: Sticky Sidebar */}
          <aside className={`tools-sidebar ${showMobileSidebar ? 'mobile-visible' : ''}`}>
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h3>Categories</h3>
                <span className="category-count">{categories.length}</span>
              </div>
              
              {/* Structured Categories with Subcategories */}
              <div className="sidebar-filters">
                <button
                  className={`sidebar-filter-btn ${categoryFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('All')}
                >
                  <span className="filter-icon">📋</span>
                  <span className="filter-text">All Categories</span>
                </button>

                {Object.entries(categoryStructure).map(([parentCategory, data]) => {
                  // Filter subcategories that exist in current categories list
                  const availableSubcategories = data.subcategories.filter(
                    sub => categories.includes(sub)
                  );
                  
                  if (availableSubcategories.length === 0) return null;

                  const isExpanded = expandedCategories[parentCategory];

                  return (
                    <div key={parentCategory} className="category-section">
                      <button
                        className={`category-header ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleCategory(parentCategory)}
                      >
                        <span className="category-icon">{data.icon}</span>
                        <span className="category-name">{parentCategory}</span>
                        <FaChevronRight className="expand-icon" />
                      </button>
                      
                      {isExpanded && (
                        <div className="subcategory-list">
                          {availableSubcategories.map(subcategory => (
                            <button
                              key={subcategory}
                              className={`sidebar-filter-btn subcategory ${categoryFilter === subcategory ? 'active' : ''}`}
                              onClick={() => setCategoryFilter(subcategory)}
                            >
                              <span className="filter-icon">🔖</span>
                              <span className="filter-text">{subcategory}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Show any categories not in the structured system */}
                {categories
                  .filter(cat => cat !== 'All' && !isSubcategory(cat))
                  .map(category => (
                    <button
                      key={category}
                      className={`sidebar-filter-btn ${categoryFilter === category ? 'active' : ''}`}
                      onClick={() => setCategoryFilter(category)}
                    >
                      <span className="filter-icon">🔖</span>
                      <span className="filter-text">{category}</span>
                    </button>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Tools; 