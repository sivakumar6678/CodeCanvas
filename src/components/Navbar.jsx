import React from "react";
import "../styles/navbar.scss";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">Frontend Toolbox</div>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#"> About </a></li>
        <li><a href="#">Tools</a></li>
        <li><a href="#">Contact</a></li>
        {/* <li><a href="#">Color Palettes</a></li>
        <li><a href="#">Gradients</a></li>
        <li><a href="#">Images</a></li>
        <li><a href="#">Shadows</a></li> */}
      </ul>
    </nav>
  );
};

export default Navbar;


