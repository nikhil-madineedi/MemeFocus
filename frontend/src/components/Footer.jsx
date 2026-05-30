import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} MemeFocus. Focus, stop scrolling, and get roasted.</p>
        <div className="footer-links">
          <a href="#about" className="footer-link">About</a>
          <a href="#github" className="footer-link">GitHub</a>
          <a href="#contact" className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  );
}
