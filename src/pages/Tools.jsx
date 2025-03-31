import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/tools.scss';

const tools = [
  {
    id: 1,
    name: 'Color Palette Generator',
    description: 'Generate beautiful color palettes using AI',
    fullDescription: 'Create harmonious color combinations for your projects using our AI-powered color palette generator. Get suggestions based on color theory and current design trends.',
    icon: '🎨',
    category: 'Colors',
    path: '/tools/color-palette-generator'
  },
  {
    id: 2,
    name: 'Gradient Generator',
    description: 'Create stunning gradients with ease',
    fullDescription: 'Design beautiful gradients with our intuitive gradient generator. Choose from preset styles or create custom gradients with multiple color stops.',
    icon: '🌈',
    category: 'Colors',
    path: '/tools/gradient-generator'
  },
  {
    id: 3,
    name: 'Shadow Generator',
    description: 'Generate CSS box shadows instantly',
    fullDescription: 'Create perfect box shadows for your elements with our shadow generator. Customize spread, blur, and color to match your design.',
    icon: '💫',
    category: 'Effects',
    path: '/tools/box-shadow-generator'
  },
  {
    id: 4,
    name: 'Image Optimizer',
    description: 'Optimize images for web performance',
    fullDescription: 'Optimize your images for web use with our image optimizer. Reduce file size while maintaining quality, and get different format options.',
    icon: '🖼️',
    category: 'Images',
    path: '/tools/image-optimizer'
  },
  {
    id: 5,
    name: 'Typography Scale',
    description: 'Generate consistent typography scales',
    fullDescription: 'Create consistent typography scales for your projects with our typography scale generator.',
    icon: '📝',
    category: 'Typography',
    path: '/tools/typography'
  },
  {
    id: 6,
    name: 'Layout Generator',
    description: 'Create responsive layouts with AI',
    fullDescription: 'Generate responsive layouts using AI-powered suggestions and best practices.',
    icon: '📐',
    category: 'Layout',
    path: '/tools/layout'
  },
  {
    id: 7,
    name: 'Brainstorming',
    description: 'Brainstorming with AI',
    fullDescription: 'Use AI to help brainstorm and refine your project ideas with intelligent suggestions.',
    icon: '💡',
    category: 'Brainstorming',
    path: '/tools/brainstorming'
  },
  {
    id: 8,
    name: 'Code Snippet Generator',
    description: 'Generate code snippets with AI',
    fullDescription: 'Create code snippets with our AI-powered code snippet generator. Get suggestions based on your project requirements.',
    icon: '💻',
    category: 'Code',
    path: '/tools/code-snippet-generator'
  },
  {
    id: 9,
    name: 'Project Suggestion',
    description: 'Generate project ideas with AI',
    fullDescription: 'Generate project ideas with our AI-powered project suggestion tool.',
    icon: '💡',
    category: 'Project',
    path: '/tools/project-suggestion'
  }
];

const Tools = () => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const filteredTools = filter === 'all'
    ? tools
    : tools.filter(tool => tool.category === filter);

  const categories = ['all', ...new Set(tools.map(tool => tool.category))];

  const handleToolClick = (tool) => {
    setSelectedTool(selectedTool?.id === tool.id ? null : tool);
  };

  const handleTryTool = (e, path) => {
    e.stopPropagation(); // Prevent the card click event
    navigate(path);
  };

  return (
    <section className="tools" id="tools">
      <div className="container">
        <h1>Our Tools</h1>
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${filter === category ? 'active' : ''}`}
              onClick={() => setFilter(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="tools-grid">
          {filteredTools.map(tool => (
            <motion.div
              key={tool.id}
              className={`tool-card ${selectedTool?.id === tool.id ? 'expanded' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleToolClick(tool)}
            >
              <div className="tool-header">
                <span className="tool-icon">{tool.icon}</span>
                <h3>{tool.name}</h3>
              </div>
              <p className="tool-description">{tool.description}</p>
              <AnimatePresence>
                {selectedTool?.id === tool.id && (
                  <motion.div
                    className="tool-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{tool.fullDescription}</p>
                    {tool.path && (
                      <button 
                        className="try-tool-btn"
                        onClick={(e) => handleTryTool(e, tool.path)}
                      >
                        Try Tool
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tools; 