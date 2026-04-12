import React from 'react';
import '../styles/about.scss';

const About = () => {
  return (
    <div className="about-us-container">
      <div className="about-us-header">
        <h1>Welcome to Code Canvas</h1>
      </div>
      <div className="about-us-content">
        <p>
          Code Canvas is an innovative platform developed to help frontend developers improve their workflow. This tool combines AI-powered features to assist in various aspects of frontend development, from code generation to design tools.
        </p>
        <h2>Our Features</h2>
        <ul>
          <li>AI-powered color palette generation</li>
          <li>Smart shadow and gradient tools</li>
          <li>Responsive design utilities</li>
          <li>Image optimization and enhancement</li>
        </ul>
        <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Our project simplifies the process to enhance your development experience. Here’s how it works:</p>
        </div>
        <div className="steps">
          <div className="step">
            <h3>Step 1: Choose a Tool</h3>
            <p>Select the right tool for your needs from our extensive library of AI-powered tools.</p>
          </div>
          <div className="step">
            <h3>Step 2: Customize</h3>
            <p>Use the provided customization options to tailor the tool to your project specifications.</p>
          </div>
          <div className="step">
            <h3>Step 3: Get Results</h3>
            <p>Receive real-time results and suggestions, directly integrated into your workflow.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="section-header">
          <h2>What Our Users Say</h2>
          <p>Don’t just take our word for it! See what our users have to say about their experience.</p>
        </div>
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <p>"This platform has been a game-changer for my workflow. The AI-powered tools are intuitive and save so much time!"</p>
            <h4>- Alex, Frontend Developer</h4>
          </div>
          <div className="testimonial-card">
            <p>"As a beginner, I found the step-by-step instructions extremely helpful. The tools are super easy to use."</p>
            <h4>- Emily, Junior Developer</h4>
          </div>
        </div>
      </section>
      </div>
      
    </div>
  );
};

export default About;
