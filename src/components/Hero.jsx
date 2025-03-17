import React from "react";
import "../styles/hero.scss";

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <h1>Enhance Your Frontend Development</h1>
        <p>AI Powered Tools suggestion</p>
        <p>Find the best color palettes, gradients, images, and shadow generators for your projects using the AI .</p>
        <div className="hero-buttons">
          <button>Explore Colors</button>
          <button>Generate Shadows</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;



