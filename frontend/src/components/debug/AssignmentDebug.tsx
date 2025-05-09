import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classService from '../../services/classService';
import './AssignmentDebug.css';

const AssignmentDebug: React.FC = () => {
  const [classId, setClassId] = useState('3');
  const [assignmentId, setAssignmentId] = useState('2');
  const [userRole, setUserRole] = useState('student');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoToAssignment = () => {
    const path = userRole === 'teacher' 
      ? `/teacher/classes/${classId}/assignments/${assignmentId}`
      : `/student/classes/${classId}/assignments/${assignmentId}`;
    
    console.log('Navigating to:', path);
    navigate(path);
  };

  const handleDebugAssignment = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Fetch assignment directly
      const assignmentData = await classService.getAssignment(parseInt(classId), parseInt(assignmentId));
      
      let submissionData = null;
      if (user && user.userRole === 'student') {
        try {
          // Try to fetch submission
          submissionData = await classService.getSubmission(
            parseInt(classId),
            parseInt(assignmentId),
            user.userId
          );
        } catch (submissionErr: any) {
          console.log('No submission found:', submissionErr);
        }
      }

      setDebugInfo({
        assignment: assignmentData,
        submission: submissionData,
        user: user
      });
    } catch (err: any) {
      console.error('Debug error:', err);
      setError(err.message || 'Failed to debug assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assignment-debug-container">
      <h1>Assignment Debug Tool</h1>
      <div className="debug-form">
        <div className="form-group">
          <label htmlFor="classId">Class ID:</label>
          <input
            type="text"
            id="classId"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="assignmentId">Assignment ID:</label>
          <input
            type="text"
            id="assignmentId"
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="userRole">User Role:</label>
          <select
            id="userRole"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        
        <div className="debug-buttons">
          <button onClick={handleGoToAssignment} className="debug-button">
            Go to Assignment
          </button>
          <button onClick={handleDebugAssignment} className="debug-button debug-info-button">
            Debug Assignment
          </button>
        </div>
      </div>

      {loading && <div className="debug-loading">Loading debug information...</div>}
      
      {error && <div className="debug-error">{error}</div>}
      
      {debugInfo && (
        <div className="debug-info-container">
          <h2>Debug Information</h2>
          
          <div className="debug-section">
            <h3>User</h3>
            <pre>{JSON.stringify(debugInfo.user, null, 2)}</pre>
          </div>
          
          <div className="debug-section">
            <h3>Assignment</h3>
            <pre>{JSON.stringify(debugInfo.assignment, null, 2)}</pre>
          </div>
          
          <div className="debug-section">
            <h3>Submission</h3>
            <pre>{JSON.stringify(debugInfo.submission, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDebug;
