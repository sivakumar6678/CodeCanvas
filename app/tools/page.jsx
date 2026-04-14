"use client";
import React, { useState } from 'react';
import { FaFilter, FaChevronRight, FaTimes } from 'react-icons/fa';
import ToolCard from '../../components/ToolCard';
import {
  allTools,
  builtinTools,
  externalTools,
  getAllCategories,
  getBuiltinCategories,
  getExternalCategories,
  categoryStructure,
} from '../../lib/toolData';
import '../tools.scss';

const Tools = () => {
  const [toolType, setToolType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const toggleCategory = (parentCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [parentCategory]: !prev[parentCategory],
    }));
  };

  // Get tools based on type filter
  const getFilteredToolsByType = () => {
    switch (toolType) {
      case 'builtin': return builtinTools;
      case 'external': return externalTools;
      default: return allTools;
    }
  };

  // Get categories based on type filter
  const getCategories = () => {
    switch (toolType) {
      case 'builtin': return getBuiltinCategories();
      case 'external': return getExternalCategories();
      default: return getAllCategories();
    }
  };

  // Apply all filters
  const filteredTools = getFilteredToolsByType().filter(tool => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = getCategories();

  // Check if a category is a subcategory
  const isSubcategory = (category) =>
    Object.values(categoryStructure).some(group =>
      group.subcategories.includes(category)
    );

  return (
    <section className="tools" id="tools">

      {/* ── Full-width gradient header ── */}
      <div className="tools-header-section">
        <div className="tools-header-inner">
          <div className="tools-header">
            <h1>Developer Tools</h1>
            <p className="tools-subtitle">
              AI-powered tools and curated resources to accelerate your workflow
            </p>
          </div>

          {/* Type Tabs */}
          <div className="type-tabs">
            {[
              { id: 'all',      label: 'All Tools' },
              { id: 'builtin',  label: 'Built-in Tools' },
              { id: 'external', label: 'External Tools' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`type-tab${toolType === tab.id ? ' active' : ''}`}
                onClick={() => { setToolType(tab.id); setCategoryFilter('All'); }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full-width body: sidebar + grid ── */}
      <div className="tools-body">

        {/* Mobile sidebar toggle */}
        <button
          className="mobile-filter-toggle"
          onClick={() => setShowMobileSidebar(v => !v)}
          aria-label="Toggle category filter"
        >
          <FaFilter />
          <span>Filter by Category</span>
        </button>

        {/* Mobile sidebar overlay */}
        {showMobileSidebar && (
          <div
            className="mobile-sidebar-overlay"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* ── LEFT STICKY SIDEBAR ── */}
        <aside className={`tools-sidebar${showMobileSidebar ? ' mobile-open' : ''}`}>
          <div className="sidebar-card">

            {/* Sidebar header */}
            <div className="sidebar-header">
              <h3>Categories</h3>
              <span className="sidebar-count">{categories.length}</span>
              {/* Mobile close */}
              <button
                className="sidebar-close"
                onClick={() => setShowMobileSidebar(false)}
                aria-label="Close sidebar"
              >
                <FaTimes />
              </button>
            </div>

            {/* All Categories shortcut */}
            <button
              className={`sidebar-item${categoryFilter === 'All' ? ' active' : ''}`}
              onClick={() => { setCategoryFilter('All'); setShowMobileSidebar(false); }}
            >
              <span className="sidebar-item-icon">📋</span>
              <span className="sidebar-item-label">All Categories</span>
            </button>

            {/* Structured parent → subcategory groups */}
            {Object.entries(categoryStructure).map(([parentCategory, data]) => {
              const availableSubcategories = data.subcategories.filter(sub =>
                categories.includes(sub)
              );
              if (availableSubcategories.length === 0) return null;

              const isExpanded = expandedCategories[parentCategory];

              return (
                <div key={parentCategory} className="sidebar-group">
                  <button
                    className="sidebar-group-header"
                    onClick={() => toggleCategory(parentCategory)}
                  >
                    <span className="sidebar-group-icon">{data.icon}</span>
                    <span className="sidebar-group-label">{parentCategory}</span>
                    <FaChevronRight
                      className={`sidebar-chevron${isExpanded ? ' rotated' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="sidebar-subcategories">
                      {availableSubcategories.map(sub => (
                        <button
                          key={sub}
                          className={`sidebar-subitem${categoryFilter === sub ? ' active' : ''}`}
                          onClick={() => { setCategoryFilter(sub); setShowMobileSidebar(false); }}
                        >
                          <span className="sidebar-subitem-icon">🔖</span>
                          <span className="sidebar-subitem-label">{sub}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Orphan categories (not in structure) */}
            {categories
              .filter(cat => cat !== 'All' && !isSubcategory(cat))
              .map(category => (
                <button
                  key={category}
                  className={`sidebar-item${categoryFilter === category ? ' active' : ''}`}
                  onClick={() => { setCategoryFilter(category); setShowMobileSidebar(false); }}
                >
                  <span className="sidebar-item-icon">🔖</span>
                  <span className="sidebar-item-label">{category}</span>
                </button>
              ))}
          </div>
        </aside>

        {/* ── RIGHT MAIN CONTENT ── */}
        <div className="tools-main">

          {/* Search bar */}
          <div className="tools-search-wrapper">
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="tools-search-input"
            />
          </div>

          {/* Count */}
          <p className="tools-count">
            Showing <strong>{filteredTools.length}</strong> tool
            {filteredTools.length !== 1 ? 's' : ''}
          </p>

          {/* Tools Grid */}
          {filteredTools.length > 0 ? (
            <div className="tools-grid">
              {filteredTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="tools-empty">
              <p>No tools found matching your criteria.</p>
              <button
                className="clear-filters-btn"
                onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default Tools;