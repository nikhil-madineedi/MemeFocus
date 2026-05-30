import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} MemeFocus. Focus, stop scrolling, and get roasted.</p>
        <div className="footer-links">
          <a href="https://www.linkedin.com/in/nikhilendra-madineedi/" target="_blank" rel="noopener noreferrer" className="footer-link">About</a>
          <a href="https://github.com/nikhil-madineedi/MemeFocus" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          <a href="mailto:nikhilmadineedi@gmail.com" className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  );
}
