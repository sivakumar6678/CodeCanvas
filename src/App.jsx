import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './pages/About';
import Tools from './pages/Tools';
import Contact from './pages/Contact';
import FeaturedTools from './components/FeaturedTools';
import Brainstorming from './Tools/Brainstroming';
import CodeSnippetGenerator from './Tools/CodeSnippetGenerator';
import ProjectSuggestion from './Tools/ProjectSuggestion';
import ColorPaletteGenerator from './Tools/ColorPaletteGenerator';
import GradientGenerator from './Tools/Gradient';
import ImageOptimizer from './Tools/ImageOptimizer';
import "./styles/global.scss";
import BoxShadowGenerator from './Tools/BoxShadowGenerator';
import ToolsGallery from './pages/ToolsGallery';
import LayoutGenerator from './Tools/LayoutGenerator';
const App = () => {
  return (
    <Router>
      <div className="main-page">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <>
                <Hero />
                <About />
                <FeaturedTools />
                <Contact />
              </>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/tools-galery" element={<ToolsGallery />} />
            <Route path="/tools/brainstorming" element={<Brainstorming />} />
            <Route path="/tools/code-snippet-generator" element={<CodeSnippetGenerator />} />
            <Route path="/tools/project-suggestion" element={<ProjectSuggestion />} />
            <Route path="/tools/color-palette-generator" element={<ColorPaletteGenerator />} />
            <Route path="/tools/gradient-generator" element={<GradientGenerator />} />
            <Route path="/tools/box-shadow-generator" element={<BoxShadowGenerator />} />
            <Route path="/tools/image-optimizer" element={<ImageOptimizer />} />
            <Route path='/tools/layout' element={<LayoutGenerator />} />
          </Routes>
        </main>
        <footer style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            © {new Date().getFullYear()} CHANDRAGARI SIVAKUMAR. All rights reserved.
          </p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
