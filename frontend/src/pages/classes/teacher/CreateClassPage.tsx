import React from 'react';
import CreateClass from '../../../components/classes/CreateClass';
import '../../../pages/dashboard/teacher/Dashboard.css';

const CreateClassPage: React.FC = () => {
  return (
    <div className="teams-dashboard">
      {/* Welcome section */}
      <div className="teams-welcome-section">
        <h2 className="teams-section-title">Create a New Class</h2>
        <p className="teams-section-subtitle">
          Set up a virtual classroom for your students
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
        <CreateClass />
      </div>
    </div>
  );
};

export default CreateClassPage;
