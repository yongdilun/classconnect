import React from 'react';
import JoinClass from '../../../components/classes/JoinClass';
import '../../../pages/dashboard/teacher/Dashboard.css';

const JoinClassPage: React.FC = () => {
  return (
    <div className="teams-dashboard">
      {/* Welcome section */}
      <div className="teams-welcome-section">
        <h2 className="teams-section-title">Join a Class</h2>
        <p className="teams-section-subtitle">
          Enter a class code to join your teacher's virtual classroom
        </p>
        <div className="welcome-decoration-dots">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Form section */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <JoinClass />
      </div>
    </div>
  );
};

export default JoinClassPage;
