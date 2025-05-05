import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Layout.css';
import Button from '../common/Button';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="flex">
              <div className="logo-container">
                <Link to="/" className="logo">
                  ClassConnect
                </Link>
              </div>
              <nav className="desktop-nav">
                <Link to="/" className="nav-link">
                  Dashboard
                </Link>
                <Link to="/classes" className="nav-link">
                  Classes
                </Link>
                <Link to="/assignments" className="nav-link">
                  Assignments
                </Link>
              </nav>
            </div>
            <div className="desktop-actions">
              <Button variant="primary" onClick={handleLogout}>
                Logout
              </Button>
            </div>
            <button
              className="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon for menu */}
              <svg
                className={isMobileMenuOpen ? 'hidden' : 'block'}
                style={{ width: '1.5rem', height: '1.5rem' }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon for close */}
              <svg
                className={isMobileMenuOpen ? 'block' : 'hidden'}
                style={{ width: '1.5rem', height: '1.5rem' }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? '' : 'hidden'}`}>
          <div className="mobile-menu-items">
            <Link to="/" className="mobile-menu-link">
              Dashboard
            </Link>
            <Link to="/classes" className="mobile-menu-link">
              Classes
            </Link>
            <Link to="/assignments" className="mobile-menu-link">
              Assignments
            </Link>
            <button onClick={handleLogout} className="mobile-menu-button-link">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <p className="footer-text">
            &copy; {new Date().getFullYear()} ClassConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
