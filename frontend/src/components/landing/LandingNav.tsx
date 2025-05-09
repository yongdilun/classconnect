import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import './LandingNav.css';

const LandingNav: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="landing-nav">
      <div className="landing-nav-container">
        {/* Logo */}
        <Link to="/" className="landing-nav-logo">
          <span className="logo-text">ClassConnect</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          <a href="#testimonials" className="landing-nav-link">Testimonials</a>
        </div>

        {/* Desktop Navigation Buttons */}
        <div className="landing-nav-buttons">
          <Link to="/teacher/login">
            <Button variant="secondary" size="sm">Teacher Login</Button>
          </Link>
          <Link to="/student/login">
            <Button variant="primary" size="sm">Student Login</Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="landing-nav-mobile-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`landing-nav-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="landing-nav-mobile-links">
          <a href="#features" className="landing-nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#how-it-works" className="landing-nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#testimonials" className="landing-nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
        </div>
        <div className="landing-nav-mobile-buttons">
          <Link to="/teacher/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="secondary" className="w-full">Teacher Login</Button>
          </Link>
          <Link to="/student/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="primary" className="w-full">Student Login</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
