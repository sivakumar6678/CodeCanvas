import React from 'react';
import '../styles/about.scss';

const About = () => {
  return (
    <section className="about">
      <div className="container">
        <h1>About Frontend Developer Toolbox</h1>
        <div className="about-content">
          <div className="about-text">
            <p>
              Frontend Developer Toolbox is your one-stop destination for AI-powered tools
              that enhance your frontend development workflow. Our platform combines
              cutting-edge artificial intelligence with practical design tools to help
              you create stunning web applications.
            </p>
            <h2>Our Features</h2>
            <ul>
              <li>AI-powered color palette generation</li>
              <li>Smart shadow and gradient tools</li>
              <li>Image optimization and enhancement</li>
              <li>Responsive design utilities</li>
            </ul>
          </div>
          <div className="about-stats">
            <div className="stat-item">
              <h3>1000+</h3>
              <p>Active Users</p>
            </div>
            <div className="stat-item">
              <h3>50+</h3>
              <p>AI Tools</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 