import React from 'react';
import AssignmentPage from './AssignmentPage';

const AssignmentViewPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Assignment Details</h1>
      <AssignmentPage />
    </div>
  );
};

export default AssignmentViewPage; 