import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import { useAuth } from '../../../contexts/AuthContext';
import classService from '../../../services/classService';
import './Dashboard.css';

interface Class {
  classId: number;
  className: string;
  classCode: string;
  description?: string;
  subject?: string;
  themeColor?: string;
  creatorId: number;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Always use userId for API calls
        const teacherId = user.userId;

        if (!teacherId) {
          console.error('No valid user ID found');
          setError('User profile information is incomplete. Please try logging in again.');
          setIsLoading(false);
          return;
        }

        console.log('User object:', user);
        console.log('Using teacher ID for API call:', teacherId);

        console.log(`Fetching classes for teacher ID: ${teacherId}`);

        try {
          // First try using the service
          const teacherClasses = await classService.getTeacherClasses(teacherId);
          console.log('Received teacher classes from service:', teacherClasses);

          // Ensure we have a valid array of classes
          if (Array.isArray(teacherClasses) && teacherClasses.length > 0) {
            setClasses(teacherClasses);
          } else {
            console.warn('Teacher classes from service is empty or not an array, trying direct fetch');

            // If the service doesn't return valid data, try a direct fetch
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`/api/classes/teacher/${teacherId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              credentials: 'include',
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Direct fetch response:', data);

              if (Array.isArray(data)) {
                setClasses(data);
              } else if (typeof data === 'object' && data !== null) {
                // Try to extract classes from the response
                if (Array.isArray(data.data)) {
                  setClasses(data.data);
                } else if (Array.isArray(data.classes)) {
                  setClasses(data.classes);
                } else {
                  console.warn('Direct fetch response is not an array:', data);
                  setClasses([]);
                }
              } else {
                console.warn('Direct fetch response is not valid:', data);
                setClasses([]);
              }
            } else {
              console.error('Direct fetch failed:', response.status, response.statusText);
              throw new Error(`Failed to load classes: ${response.status} ${response.statusText}`);
            }
          }
        } catch (serviceError) {
          console.error('Service error, trying direct fetch:', serviceError);

          // If the service throws an error, try a direct fetch
          try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`/api/classes/teacher/${teacherId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              credentials: 'include',
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Direct fetch response after service error:', data);

              if (Array.isArray(data)) {
                setClasses(data);
              } else {
                console.warn('Direct fetch response is not an array:', data);
                setClasses([]);
              }
            } else {
              console.error('Direct fetch failed after service error:', response.status, response.statusText);
              throw new Error(`Direct fetch failed: ${response.status} ${response.statusText}`);
            }
          } catch (directError) {
            console.error('Both service and direct fetch failed:', directError);
            throw directError; // Re-throw to be caught by the outer catch block
          }
        }
      } catch (err: any) {
        console.error('Error fetching classes:', err);

        // Check if the error is related to authentication
        if (err.message && (
          err.message.includes('401') ||
          err.message.includes('unauthorized') ||
          err.message.includes('Unauthorized') ||
          err.message.includes('token')
        )) {
          setError('Authentication error. Please try logging in again.');
        } else {
          setError('Failed to load your classes. Please try again later.');
        }

        // Log detailed error information
        console.error('Error details:', err.message);
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', err.response.data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  // Generate a random color for classes without a theme color
  const getRandomColor = () => {
    const colors = [
      '#6264A7', // Teams purple
      '#4F6bed', // Teams blue
      '#13A10E', // Teams green
      '#CF3F05', // Teams red
      '#C239B3', // Teams pink
      '#0099BC', // Teams teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="teams-dashboard">
      {/* Welcome section */}
      <div className="teams-welcome-section">
        <h2 className="teams-section-title">Welcome, {user?.firstName || 'Teacher'}!</h2>
        <p className="teams-section-subtitle">
          Here's what's happening in your virtual classroom today.
        </p>
        <div className="welcome-decoration-dots">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="teams-quick-actions">
        <Link to="/teacher/classes/create" className="teams-action-card">
          <div className="teams-action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div className="teams-action-content">
            <h3>Create Class</h3>
            <p>Start a new virtual classroom</p>
          </div>
        </Link>
        <div className="teams-action-card">
          <div className="teams-action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="teams-action-content">
            <h3>Create Assignment</h3>
            <p>Add new work for your students</p>
          </div>
        </div>
        <div className="teams-action-card">
          <div className="teams-action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <div className="teams-action-content">
            <h3>Grade Submissions</h3>
            <p>Review and grade student work</p>
          </div>
        </div>
      </div>

      {/* Classes section */}
      <div className="teams-section">
        <div className="teams-section-header">
          <h2>Your Classes</h2>
          <Link to="/teacher/classes" className="teams-view-all">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="teams-loading">
            <div className="teams-spinner"></div>
            <p>Loading your classes</p>
          </div>
        ) : error ? (
          <div className="teams-error">
            <p>{error}</p>
            {error.includes('Authentication') || error.includes('logging in') ? (
              <Link to="/teacher/login" className="teams-button teams-button-primary">
                Log In Again
              </Link>
            ) : (
              <button
                className="teams-button teams-button-primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            )}
          </div>
        ) : (
          <div className="teams-classes-grid">
            {classes.length === 0 ? (
              <div className="teams-empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="teams-empty-icon">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3>No Classes Yet</h3>
                <p>Create your first class to get started</p>
                <Link to="/teacher/classes/create" className="teams-button teams-button-primary">
                  Create Class
                </Link>
              </div>
            ) : (
              classes.map((classItem, index) => (
                <Link
                  to={`/teacher/classes/${classItem.classId}`}
                  key={classItem.classId}
                  className="teams-class-card"
                  style={{
                    borderTop: `4px solid ${classItem.themeColor || getRandomColor()}`,
                    '--item-index': index
                  } as React.CSSProperties}
                >
                  <div className="teams-class-header">
                    <h3 className="teams-class-name">{classItem.className}</h3>
                    <span className="teams-class-code">{classItem.classCode}</span>
                  </div>
                  <div className="teams-class-body">
                    <p className="teams-class-subject">{classItem.subject || 'No subject'}</p>
                    <p className="teams-class-description">
                      {classItem.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="teams-class-footer">
                    <span className="teams-class-students">0 students</span>
                    <span className="teams-class-assignments">0 assignments</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
