import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import classService from '../../../services/classService';
import type { Class, Announcement } from '../../../services/classService';
import AnnouncementList from '../../../components/classes/AnnouncementList';
import '../teacher/ClassDetailPage.css';

const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const classId = parseInt(id || '0');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classData, setClassData] = useState<Class | null>(null);
  const [activeTab, setActiveTab] = useState<'stream' | 'assignments' | 'chat'>('stream');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Announcement state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) {
        setError('Invalid class ID');
        setIsLoading(false);
        return;
      }

      if (!user) {
        setError('You must be logged in to view this class');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`Fetching class data for class ID: ${classId}`);

        // First try using the service
        try {
          const data = await classService.getClass(classId);
          console.log('Received class data from service:', data);

          if (data && data.classId) {
            setClassData(data);
          } else {
            throw new Error('Invalid class data received');
          }
        } catch (serviceError) {
          console.error('Service error, trying direct fetch:', serviceError);

          // If the service throws an error, try a direct fetch
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const response = await fetch(`/api/classes/${classId}`, {
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

            if (data && data.classId) {
              setClassData(data);
            } else {
              throw new Error('Invalid class data received from direct fetch');
            }
          } else {
            console.error('Direct fetch failed:', response.status, response.statusText);
            throw new Error(`Failed to load class: ${response.status} ${response.statusText}`);
          }
        }
      } catch (err: any) {
        console.error('Error fetching class:', err);

        // Check if the error is related to authentication
        if (err.message && (
          err.message.includes('401') ||
          err.message.includes('unauthorized') ||
          err.message.includes('Unauthorized') ||
          err.message.includes('token')
        )) {
          setError('Authentication error. Please try logging in again.');
        } else {
          setError(err.message || 'Failed to load class details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId, user]);

  // Set the initial active tab based on the current URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/assignments')) {
      setActiveTab('assignments');
    } else if (path.includes('/chat')) {
      setActiveTab('chat');
    } else {
      setActiveTab('stream');
    }
  }, []);

  // Fetch announcements when the class is loaded and the active tab is 'stream'
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!classId || activeTab !== 'stream') return;

      setIsLoadingAnnouncements(true);
      setAnnouncementError(null);

      try {
        const data = await classService.getAnnouncements(classId);
        setAnnouncements(data);
      } catch (err: any) {
        console.error('Error fetching announcements:', err);
        setAnnouncementError(err.message || 'Failed to load announcements');
      } finally {
        setIsLoadingAnnouncements(false);
      }
    };

    if (classData) {
      fetchAnnouncements();
    }
  }, [classId, classData, activeTab]);

  const handleTabChange = (tab: 'stream' | 'assignments' | 'chat') => {
    setActiveTab(tab);

    // Navigate to the correct URL
    if (tab === 'stream') {
      navigate(`/student/classes/${classId}`);
    } else {
      navigate(`/student/classes/${classId}/${tab}`);
    }

    console.log(`Tab changed to ${tab}, navigating to: /student/classes/${classId}/${tab === 'stream' ? '' : tab}`);
  };

  if (isLoading) {
    return (
      <div className="class-detail-loading">
        <div className="spinner"></div>
        <p>Loading class details...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="class-detail-error">
        <h2>Error Loading Class</h2>
        <p>{error || 'Class not found'}</p>
        {error && error.includes('Authentication') ? (
          <div className="error-actions">
            <button
              onClick={() => navigate('/student/login')}
              className="login-button"
            >
              Log In Again
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="back-button"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/student/dashboard')}
            className="back-button"
          >
            Back to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="class-detail-container">
      {/* Class Header */}
      <div
        className="class-detail-header"
        style={{ backgroundColor: classData.themeColor || '#6264A7' }}
      >
        <div className="class-detail-header-content">
          <h1 className="class-detail-title">{classData.className}</h1>
          <div className="class-detail-meta">
            <span className="class-detail-code">Class Code: {classData.classCode}</span>
            {classData.subject && (
              <span className="class-detail-subject">{classData.subject}</span>
            )}
          </div>
          {classData.description && (
            <p className="class-detail-description">{classData.description}</p>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="class-detail-tabs">
        <button
          className={`class-detail-tab ${activeTab === 'stream' ? 'active' : ''}`}
          onClick={() => handleTabChange('stream')}
        >
          <i className="tab-icon stream-icon"></i>
          Stream
        </button>
        <button
          className={`class-detail-tab ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => handleTabChange('assignments')}
        >
          <i className="tab-icon assignments-icon"></i>
          Assignments
        </button>
        <button
          className={`class-detail-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => handleTabChange('chat')}
        >
          <i className="tab-icon chat-icon"></i>
          Class Chat
        </button>
      </div>

      {/* Tab Content */}
      <div className="class-detail-content">
        {activeTab === 'stream' && (
          <div className="class-stream">
            <div className="class-stream-header">
              <h2>Class Stream</h2>
            </div>

            <div className="class-stream-content">
              <AnnouncementList
                announcements={announcements}
                isLoading={isLoadingAnnouncements}
                error={announcementError}
              />
            </div>
          </div>
        )}

        {/* Always render the Outlet for nested routes */}
        <Outlet />
      </div>
    </div>
  );
};

export default ClassDetailPage;
