import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';
import Button from '../common/Button';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    // Get user role from context or localStorage
    if (user) {
      setUserRole(user.userRole);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserRole(parsedUser.userRole);
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    }

    // Set active tab based on current path
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      setActiveTab('dashboard');
    } else if (path.includes('/classes')) {
      setActiveTab('classes');
    } else if (path.includes('/assignments')) {
      setActiveTab('assignments');
    } else if (path.includes('/grades')) {
      setActiveTab('grades');
    }
  }, [location.pathname, user]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Generate paths based on user role
  const getDashboardPath = () => {
    return userRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
  };

  const getClassesPath = () => {
    return userRole === 'teacher' ? '/teacher/classes' : '/student/classes';
  };

  // Now that we have a dedicated assignments page, use the assignments path
  const getAssignmentsPath = () => {
    return userRole === 'teacher' ? '/teacher/assignments' : '/student/assignments';
  };

  const getGradesPath = () => {
    return userRole === 'teacher' ? '/teacher/grades' : '/student/grades';
  };

  return (
    <div className="layout">
      {/* Left sidebar / Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-container">
              <span className="logo">
                ClassConnect
              </span>
            </div>
          </div>

          <nav className="desktop-nav">
            <Link
              to={getDashboardPath()}
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', marginRight: '12px' }}>
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link
              to={getClassesPath()}
              className={`nav-link ${activeTab === 'classes' ? 'active' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', marginRight: '12px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Classes</span>
            </Link>
            <Link
              to={getAssignmentsPath()}
              className={`nav-link ${activeTab === 'assignments' ? 'active' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', marginRight: '12px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Assignments</span>
            </Link>
            <Link
              to={getGradesPath()}
              className={`nav-link ${activeTab === 'grades' ? 'active' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', marginRight: '12px' }}>
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
              <span>Grades</span>
            </Link>
          </nav>

          <div className="desktop-actions">
            <Button variant="secondary" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800 mr-4">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'classes' && 'Classes'}
              {activeTab === 'assignments' && 'Assignments'}
              {activeTab === 'grades' && 'Grades'}
            </h1>
          </div>
          <div className="flex items-center">
            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <span className="text-sm text-gray-700">{user?.firstName || 'User'}</span>
          </div>
        </div>
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