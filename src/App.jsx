import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import "./styles/global.scss";

const App = () => {
  return (
    <div className="main-page">
      <Navbar />
      <Hero />
    </div>
  );
};

export default App;
