import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classService from '../../services/classService';
import type { Class } from '../../services/classService';
import Button from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

const ClassList: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        let fetchedClasses: Class[] = [];
        // Try to use profileId first, fall back to userId if profileId is not available
        const userId = user.profileId || user.userId;

        if (!userId) {
          console.error('No valid user ID found');
          setError('User profile information is incomplete. Please try logging in again.');
          setLoading(false);
          return;
        }

        console.log(`Fetching classes for ${user.userRole} ID: ${userId}`);

        if (user.userRole === 'teacher') {
          fetchedClasses = await classService.getTeacherClasses(userId);
        } else if (user.userRole === 'student') {
          fetchedClasses = await classService.getStudentClasses(userId);
        }

        setClasses(fetchedClasses);
      } catch (err: any) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again later.');
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="teams-loading">
        <div className="teams-spinner"></div>
        <p>Loading your classes</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teams-error">
        <p>{error}</p>
        <button
          className="teams-button teams-button-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="teams-dashboard">
      {/* Welcome section */}
      <div className="teams-welcome-section">
        <h2 className="teams-section-title">My Classes</h2>
        <p className="teams-section-subtitle">
          {user?.userRole === 'teacher'
            ? 'Manage your virtual classrooms and assignments'
            : 'Access your enrolled classes and assignments'}
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
        {user?.userRole === 'teacher' ? (
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
        ) : (
          <Link to="/student/classes/join" className="teams-action-card">
            <div className="teams-action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
            </div>
            <div className="teams-action-content">
              <h3>Join Class</h3>
              <p>Enter a class code to join</p>
            </div>
          </Link>
        )}

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
            <h3>View Assignments</h3>
            <p>Check your pending assignments</p>
          </div>
        </div>
      </div>

      {/* Classes section */}
      <div className="teams-section">
        <div className="teams-section-header">
          <h2>All Classes</h2>
        </div>

        {classes.length === 0 ? (
          <div className="teams-empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="teams-empty-icon">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3>No Classes Yet</h3>
            {user?.userRole === 'teacher' ? (
              <p>Create your first class to get started</p>
            ) : (
              <p>Join a class using a class code from your teacher</p>
            )}

            {user?.userRole === 'teacher' ? (
              <Link to="/teacher/classes/create" className="teams-button teams-button-primary">
                Create Class
              </Link>
            ) : (
              <Link to="/student/classes/join" className="teams-button teams-button-primary">
                Join Class
              </Link>
            )}
          </div>
        ) : (
          <div className="teams-classes-grid">
            {classes.map((classItem, index) => (
              <Link
                to={user?.userRole === 'teacher' ? `/teacher/classes/${classItem.classId}` : `/student/classes/${classItem.classId}`}
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
                  {classItem.isArchived && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">Archived</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassList;
