import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './pages/About';
import Tools from './pages/Tools';
import Contact from './pages/Contact';
import FeaturedTools from './components/FeaturedTools';
import "./styles/global.scss";

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
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
