import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import './NavBar.css';

interface NavBarProps {
  showLinks?: boolean;
  transparent?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ 
  showLinks = true,
  transparent = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className={`navbar ${transparent ? 'navbar-transparent' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-text">ClassConnect</span>
        </Link>

        {/* Desktop Navigation Links */}
        {showLinks && (
          <div className="navbar-links">
            <a href="/#features" className="navbar-link">Features</a>
            <a href="/#how-it-works" className="navbar-link">How It Works</a>
            <a href="/#testimonials" className="navbar-link">Testimonials</a>
          </div>
        )}

        {/* Desktop Navigation Buttons */}
        <div className="navbar-buttons">
          <Link to="/teacher/login">
            <Button variant="secondary" size="sm">Teacher Login</Button>
          </Link>
          <Link to="/student/login">
            <Button variant="primary" size="sm">Student Login</Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="navbar-mobile-toggle" 
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
      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {showLinks && (
          <div className="navbar-mobile-links">
            <a href="/#features" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="/#how-it-works" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="/#testimonials" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
          </div>
        )}
        <div className="navbar-mobile-buttons">
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

export default NavBar;
