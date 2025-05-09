import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classService from '../../services/classService';
import type { Assignment, Submission } from '../../services/classService';
import './AssignmentSubmissions.css';

const AssignmentSubmissions: React.FC = () => {
  const { id, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const classIdNum = id ? parseInt(id) : 0;
  const assignmentIdNum = assignmentId ? parseInt(assignmentId) : 0;
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.userRole === 'teacher';

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradeValue, setGradeValue] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);

  // Fetch assignment and submissions
  useEffect(() => {
    const fetchData = async () => {
      if (!isTeacher) {
        setError('Only teachers can view all submissions');
        setIsLoading(false);
        return;
      }

      if (isNaN(classIdNum) || isNaN(assignmentIdNum) || classIdNum <= 0 || assignmentIdNum <= 0) {
        setError('Invalid class or assignment ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log(`Fetching data for class=${classIdNum}, assignment=${assignmentIdNum}`);

        // Fetch assignment data
        try {
          const assignmentData = await classService.getAssignment(classIdNum, assignmentIdNum);
          console.log('Assignment data fetched successfully:', assignmentData);
          setAssignment(assignmentData);
        } catch (assignmentErr: any) {
          console.error('Error fetching assignment:', assignmentErr);
          setError(`Failed to load assignment: ${assignmentErr.message}`);
          setIsLoading(false);
          return;
        }

        // Fetch all submissions for this assignment
        try {
          console.log('Fetching submissions...');
          const submissionsData = await classService.getAssignmentSubmissions(classIdNum, assignmentIdNum);
          console.log('Submissions data fetched successfully:', submissionsData);
          setSubmissions(submissionsData);
        } catch (submissionsErr: any) {
          console.error('Error fetching submissions:', submissionsErr);
          // We can still show the assignment details even if submissions fail
          setError(`Failed to load submissions: ${submissionsErr.message}. Try refreshing the page.`);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('General error in fetchData:', err);
        setError(err.message || 'Failed to load data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classIdNum, assignmentIdNum, isTeacher]);

  // Add a function to retry fetching submissions
  const retryFetchSubmissions = async () => {
    try {
      setIsRetrying(true);
      setError(null);
      
      console.log('Retrying submission fetch...');
      const submissionsData = await classService.getAssignmentSubmissions(classIdNum, assignmentIdNum);
      setSubmissions(submissionsData);
      setError(null);
    } catch (err: any) {
      console.error('Error retrying submissions fetch:', err);
      setError(`Retry failed: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  // Add a function to retry fetching assignment
  const retryFetchAssignment = async () => {
    try {
      setIsRetrying(true);
      setError(null);
      
      console.log('Retrying assignment fetch...');
      const assignmentData = await classService.getAssignment(classIdNum, assignmentIdNum);
      setAssignment(assignmentData);
      
      // If assignment fetch is successful, also try to fetch submissions
      try {
        const submissionsData = await classService.getAssignmentSubmissions(classIdNum, assignmentIdNum);
        setSubmissions(submissionsData);
      } catch (submissionsErr: any) {
        console.error('Error fetching submissions during retry:', submissionsErr);
        // We can still show the assignment details even if submissions fail
        setError(`Assignment loaded, but failed to load submissions: ${submissionsErr.message}. Try the retry button below.`);
      }
    } catch (err: any) {
      console.error('Error retrying assignment fetch:', err);
      setError(`Failed to load assignment: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Open grade modal
  const openGradeModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeValue(submission.grade || 0);
    setFeedback(submission.feedback || '');
    setGradeModalOpen(true);
  };

  // Close grade modal
  const closeGradeModal = () => {
    setGradeModalOpen(false);
    setSelectedSubmission(null);
    setGradeValue(0);
    setFeedback('');
  };

  // Handle grade submission
  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !assignment) return;
    
    // Validate grade value
    if (gradeValue < 0 || gradeValue > assignment.pointsPossible) {
      alert(`Grade must be between 0 and ${assignment.pointsPossible}`);
      return;
    }

    try {
      setIsGrading(true);
      await classService.gradeSubmission(
        classIdNum, 
        assignmentIdNum, 
        selectedSubmission.studentId, 
        gradeValue, 
        feedback
      );
      
      // Update the submissions list
      const updatedSubmissions = submissions.map(s => 
        s.studentId === selectedSubmission.studentId 
          ? { 
              ...s, 
              grade: gradeValue, 
              feedback: feedback,
              status: 'graded' as 'graded' | 'not_submitted' | 'submitted'
            } 
          : s
      );
      setSubmissions(updatedSubmissions);
      
      // Close the modal
      closeGradeModal();
    } catch (err: any) {
      alert(`Failed to grade submission: ${err.message}`);
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="submissions-loading">
        <div className="spinner"></div>
        <p>Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    // If we have an assignment but error with submissions, show a partial view
    if (assignment) {
      return (
        <div className="submissions-container">
          <div className="submissions-header">
            <div className="submissions-breadcrumb">
              <button onClick={() => navigate(-1)} className="back-link">
                &larr; Back to Assignments
              </button>
            </div>
            <h1 className="submissions-title">Submissions for: {assignment.title}</h1>
            <div className="submissions-meta">
              <div className="meta-item">
                <span className="meta-label">Due Date:</span>
                <span className="meta-value">{formatDate(assignment.dueDate.toString())}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Points Possible:</span>
                <span className="meta-value">{assignment.pointsPossible}</span>
              </div>
            </div>
          </div>
          
          <div className="submissions-error">
            <h2>Error Loading Submissions</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button 
                onClick={retryFetchSubmissions} 
                className={`retry-button ${isRetrying ? 'loading' : ''}`}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <div className="button-spinner"></div>
                    Retrying...
                  </>
                ) : (
                  'Retry Loading Submissions'
                )}
              </button>
              <button onClick={() => navigate(-1)} className="back-button">
                Back to Assignments
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Complete error (no assignment data)
    return (
      <div className="submissions-error">
        <h2>Error</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button 
            onClick={retryFetchAssignment} 
            className={`retry-button ${isRetrying ? 'loading' : ''}`}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <div className="button-spinner"></div>
                Retrying...
              </>
            ) : (
              'Retry Loading Assignment'
            )}
          </button>
          <button onClick={() => navigate(-1)} className="back-button">
            Back to Assignments
          </button>
          <button onClick={() => window.location.reload()} className="retry-button">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="submissions-error">
        <h2>Assignment Not Found</h2>
        <p>The assignment you're looking for doesn't exist or you don't have permission to view it.</p>
        <button onClick={() => navigate(-1)} className="back-button">Go Back</button>
      </div>
    );
  }

  return (
    <div className="submissions-container">
      <div className="submissions-header">
        <div className="submissions-breadcrumb">
          <button onClick={() => navigate(-1)} className="back-link">
            &larr; Back to Assignments
          </button>
        </div>
        <h1 className="submissions-title">Submissions for: {assignment.title}</h1>
        <div className="submissions-meta">
          <div className="meta-item">
            <span className="meta-label">Due Date:</span>
            <span className="meta-value">{formatDate(assignment.dueDate.toString())}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Points Possible:</span>
            <span className="meta-value">{assignment.pointsPossible}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Total Submissions:</span>
            <span className="meta-value">{submissions.filter(s => s.status !== 'not_submitted').length} of {submissions.length}</span>
          </div>
        </div>
      </div>

      <div className="submissions-content">
        {submissions.length === 0 ? (
          <div className="empty-submissions">
            <p>No submissions yet for this assignment.</p>
          </div>
        ) : (
          <div className="submissions-table-container">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Late</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.studentId} className={`submission-row ${submission.status}`}>
                    <td className="student-name">{submission.studentName || `Student #${submission.studentId}`}</td>
                    <td className={`submission-status`}>
                      <span className={`status-${submission.status}`}>
                        {submission.status === 'submitted' ? 'Submitted' : 
                         submission.status === 'graded' ? 'Graded' : 
                         submission.status === 'not_submitted' ? 'Not Submitted' : submission.status}
                      </span>
                    </td>
                    <td className="submission-date">
                      {submission.submissionDate ? formatDate(submission.submissionDate) : 'N/A'}
                    </td>
                    <td className="submission-late">
                      {submission.isLate ? <span className="late-badge">Late</span> : 'No'}
                    </td>
                    <td className="submission-grade">
                      {submission.status === 'graded' && submission.grade !== undefined ? (
                        <div className="grade-display">
                          <span className="grade-score">{submission.grade}/{assignment.pointsPossible}</span>
                          <span className="grade-percentage">
                            ({Math.round((submission.grade / assignment.pointsPossible) * 100)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="not-graded">Not Graded</span>
                      )}
                    </td>
                    <td className="submission-actions">
                      <div className="action-buttons">
                        <button 
                          className="grade-btn"
                          onClick={() => openGradeModal(submission)}
                          disabled={submission.status === 'not_submitted'}
                        >
                          {submission.status === 'graded' ? 'Update Grade' : 'Grade'}
                        </button>
                        <button className="view-btn" onClick={() => {
                          // Navigate to a detail view for this submission
                          navigate(`/teacher/classes/${classIdNum}/assignment/${assignmentIdNum}/submissions/${submission.studentId}`);
                        }}>
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Submission Modal */}
      {gradeModalOpen && selectedSubmission && (
        <div className="grade-modal-overlay">
          <div className="grade-modal">
            <div className="grade-modal-header">
              <h3>Grade Submission</h3>
              <button className="close-modal-btn" onClick={closeGradeModal}>×</button>
            </div>
            <div className="grade-modal-content">
              <div className="student-info">
                <p><strong>Student:</strong> {selectedSubmission.studentName || `Student #${selectedSubmission.studentId}`}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-${selectedSubmission.status}`}>
                    {selectedSubmission.status === 'submitted' ? 'Submitted' : 
                    selectedSubmission.status === 'graded' ? 'Graded' : 'Not Submitted'}
                  </span>
                </p>
                <p><strong>Submission Date:</strong> {selectedSubmission.submissionDate ? formatDate(selectedSubmission.submissionDate) : 'N/A'}</p>
                {selectedSubmission.isLate && <p className="late-notice">This submission was turned in late</p>}
              </div>

              <div className="grade-input-container">
                <label htmlFor="grade-input">Grade (out of {assignment.pointsPossible}):</label>
                <input
                  id="grade-input"
                  type="number"
                  min="0"
                  max={assignment.pointsPossible}
                  value={gradeValue}
                  onChange={(e) => setGradeValue(parseInt(e.target.value) || 0)}
                  className="grade-input"
                />
              </div>

              <div className="feedback-container">
                <label htmlFor="feedback-input">Feedback (optional):</label>
                <textarea
                  id="feedback-input"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="feedback-input"
                  rows={4}
                  placeholder="Add feedback for the student..."
                ></textarea>
              </div>
            </div>
            <div className="grade-modal-footer">
              <button className="cancel-btn" onClick={closeGradeModal} disabled={isGrading}>Cancel</button>
              <button 
                className={`submit-grade-btn ${isGrading ? 'loading' : ''}`}
                onClick={handleGradeSubmission}
                disabled={isGrading}
              >
                {isGrading ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissions; 