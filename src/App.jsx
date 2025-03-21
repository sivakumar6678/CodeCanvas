import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './pages/About';
import Tools from './pages/Tools';
import Contact from './pages/Contact';
import './styles/App.scss';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <About />
                <Tools />
                <Contact />
              </>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
