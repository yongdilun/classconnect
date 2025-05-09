import React from 'react';
import type { Announcement } from '../../services/classService';
import './AnnouncementList.css';

interface AnnouncementListProps {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({ announcements, isLoading, error }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    // Format time
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

    // Format date
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${dayName} at ${timeString}`;
    } else {
      return `${monthName} ${dayOfMonth}, ${year} at ${timeString}`;
    }
  };

  if (isLoading) {
    return (
      <div className="announcements-loading">
        <div className="spinner"></div>
        <p>Loading announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="announcements-error">
        <p>Error loading announcements: {error}</p>
        <button className="retry-button">Retry</button>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="no-announcements">
        <p>No announcements yet.</p>
      </div>
    );
  }

  return (
    <div className="announcements-list">
      {announcements.map((announcement) => (
        <div key={announcement.announcementId} className="announcement-card">
          <div className="announcement-header">
            <div className="announcement-author">
              <div className="author-avatar">
                {announcement.userName.charAt(0)}
              </div>
              <div className="author-info">
                <span className="author-name">{announcement.userName}</span>
                <span className="announcement-date">{formatDate(announcement.createdAt)}</span>
              </div>
            </div>
          </div>

          {announcement.title && (
            <h3 className="announcement-title">{announcement.title}</h3>
          )}

          <div className="announcement-content">
            <p>{announcement.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementList;
