import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classService from '../../services/classService';
import type { Assignment, Submission } from '../../services/classService';
import '../../components/classes/AssignmentDetail.css';
import { FaArrowLeft, FaCalendarAlt, FaClipboardCheck, FaMedal, FaLink, FaCheckCircle, FaClock } from 'react-icons/fa';
import './AssignmentPage.css'; // We'll create this file next

const AssignmentPage: React.FC = () => {
  const { id, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const classIdNum = id ? parseInt(id) : 0;
  const assignmentIdNum = assignmentId ? parseInt(assignmentId) : 0;
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.userRole === 'teacher';

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [fileURL, setFileURL] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  // Fetch assignment details
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!user) {
        setError('You must be logged in to view this assignment');
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
        
        // Use the service layer instead of direct API calls
        console.log(`Fetching assignment details for class: ${classIdNum}, assignment: ${assignmentIdNum}`);
        
        try {
          // Get the assignment through the service
          const assignmentData = await classService.getAssignment(classIdNum, assignmentIdNum);
          console.log('Assignment data received:', assignmentData);
          setAssignment(assignmentData);
          
          // For students, also try to get the submission
          if (!isTeacher && user) {
            try {
              console.log(`Fetching submission for user: ${user.userId}`);
              const submissionData = await classService.getSubmission(
                classIdNum,
                assignmentIdNum,
                user.userId
              );
              
              console.log('Submission data received:', submissionData);

              // If we got a submission with a real status (not "not_submitted"), use it
              if (submissionData && submissionData.status && submissionData.status !== 'not_submitted') {
                // Set the submission data
                setSubmission(submissionData);
                if (submissionData.content) {
                  setSubmissionContent(submissionData.content);
                }
                if (submissionData.fileURL) {
                  setFileURL(submissionData.fileURL);
                }
              } else {
                // Create a default submission with status "not_submitted"
                setSubmission({
                  assignmentId: assignmentIdNum,
                  studentId: user.userId,
                  content: '',
                  status: 'not_submitted',
                  isLate: false,
                  assignment: assignmentData
                });
              }
            } catch (submissionErr: any) {
              console.warn('No submission found, using default:', submissionErr.message);
              // Create a default submission with status "not_submitted"
              setSubmission({
                assignmentId: assignmentIdNum,
                studentId: user.userId,
                content: '',
                status: 'not_submitted',
                isLate: false,
                assignment: assignmentData
              });
            }
          }
        } catch (err: any) {
          console.error('Error fetching assignment data:', err);
          throw new Error(`Failed to fetch assignment: ${err.message}`);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching assignment details:', err);
        setError(err.message || 'Failed to load assignment details');
        setIsLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [classIdNum, assignmentIdNum, isTeacher, user]);

  // Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require either content or file URL
    if ((!submissionContent.trim() && !fileURL.trim()) || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Submit the assignment
      const submissionData = await classService.submitAssignment(
        classIdNum,
        assignmentIdNum,
        submissionContent,
        fileURL
      );

      setSubmission(submissionData);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setError(err.message || 'Failed to submit assignment');
      setIsSubmitting(false);
    }
  };

  // Handle submission content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSubmissionContent(e.target.value);
  };

  // Handle file URL change
  const handleFileURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileURL(e.target.value);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle back button click
  const handleBackClick = () => {
    const basePath = isTeacher ? '/teacher' : '/student';
    navigate(`${basePath}/classes/${classIdNum}/assignments`);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="assignment-loading">
        <div className="loader"></div>
        <p>Loading assignment details...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="assignment-error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="error-back-btn"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render assignment not found
  if (!assignment) {
    return (
      <div className="assignment-not-found">
        <div className="not-found-message">
          <h3>Assignment Not Found</h3>
          <p>The assignment you're looking for does not exist or has been removed.</p>
          <button 
            onClick={() => window.history.back()}
            className="not-found-back-btn"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-page">
      <div className="assignment-nav">
        <button
          onClick={handleBackClick}
          className="back-button"
        >
          <FaArrowLeft /> Back to Assignments
        </button>
        
        {!isTeacher && submission && (
          <div className="submission-status">
            <div className={`status-badge ${submission.status}`}>
              {submission.status === 'graded' ? 'Graded' : 
               submission.status === 'submitted' ? 'Submitted' : 'Not Submitted'}
            </div>
          </div>
        )}
      </div>

      <div className="assignment-container">
        {/* Assignment Header */}
        <div className="assignment-header">
          <h2>{assignment.title}</h2>
          
          <div className="assignment-meta">
            <div className="meta-item">
              <FaCalendarAlt className="meta-icon" />
              <span className="meta-label">Due: </span> 
              <span className="meta-value">{formatDate(assignment.dueDate)}</span>
            </div>
            
            <div className="meta-item">
              <FaClipboardCheck className="meta-icon" />
              <span className="meta-label">Points: </span>
              <span className="meta-value">{assignment.pointsPossible}</span>
            </div>
            
            {!isTeacher && submission && submission.status === 'graded' && (
              <div className="meta-item">
                <FaMedal className="meta-icon grade" />
                <span className="meta-label">Your Grade: </span>
                <span className="meta-value">{submission.grade} / {assignment.pointsPossible}</span>
                <span className="grade-percent">
                  ({Math.round((submission.grade || 0) / assignment.pointsPossible * 100)}%)
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Assignment Content */}
        <div className="assignment-content">
          <div className="assignment-instructions">
            <h3>Instructions</h3>
            <div className="instructions-text">{assignment.description}</div>
          </div>
          
          {/* Student submission area */}
          {!isTeacher && (
            <div className="submission-section">
              <div className="submission-header">
                <h3>Your Submission</h3>
              </div>
              
              <div className="submission-body">
                {submission && ['graded', 'submitted'].includes(submission.status) ? (
                  <div className="submitted-content">
                    <div className="submission-badges">
                      <span className={`badge ${submission.status}`}>
                        {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                      </span>
                      {submission.isLate && (
                        <span className="badge late">
                          Late
                        </span>
                      )}
                    </div>
                    
                    {submission.submissionDate && (
                      <p className="submission-date">
                        <FaClock />
                        Submitted on {formatDate(submission.submissionDate)}
                      </p>
                    )}
                    
                    {submission.content && (
                      <div className="submission-answer">
                        <h4>Your Answer:</h4>
                        <div className="answer-content">
                          {submission.content}
                        </div>
                      </div>
                    )}
                    
                    {submission.fileURL && (
                      <div className="submission-file">
                        <h4>Your File:</h4>
                        <a 
                          href={submission.fileURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          <FaLink />
                          View Attached File
                        </a>
                      </div>
                    )}
                    
                    {submission.status === 'graded' && (
                      <div className="graded-feedback">
                        <h4>
                          <FaCheckCircle />
                          Grade: {submission.grade} / {assignment.pointsPossible} 
                          <span className="grade-percent">
                            ({Math.round((submission.grade || 0) / assignment.pointsPossible * 100)}%)
                          </span>
                        </h4>
                        {submission.feedback && (
                          <div className="feedback-section">
                            <h5>Teacher Feedback:</h5>
                            <div className="feedback-content">
                              {submission.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="submission-form-container">
                    {/* Submission progress indicator */}
                    <div className="submission-progress">
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: submissionContent ? '50%' : '0%' }}></div>
                      </div>
                      <p className="progress-status">
                        Status: <span className="not-submitted">Not yet submitted</span>
                      </p>
                    </div>
                  
                    <form onSubmit={handleSubmit} className="submission-form">
                      <div className="form-group">
                        <label htmlFor="content">
                          Your Answer
                        </label>
                        <textarea
                          id="content"
                          value={submissionContent}
                          onChange={handleContentChange}
                          className="answer-textarea"
                          placeholder="Type your answer here..."
                        ></textarea>
                        <p className="form-hint">
                          Write your response to the assignment prompt above.
                        </p>
                      </div>
                      
                      <div className="form-group file-group">
                        <label htmlFor="fileURL">
                          <FaLink />
                          File URL (Optional)
                        </label>
                        <input
                          id="fileURL"
                          type="text"
                          value={fileURL}
                          onChange={handleFileURLChange}
                          className="file-input"
                          placeholder="Paste a link to your file here (Google Drive, Dropbox, etc.)"
                        />
                        <p className="form-hint">
                          Upload your file to a cloud storage service and paste the share link above.
                        </p>
                      </div>
                      
                      <div className="form-actions">
                        <button
                          type="submit"
                          disabled={isSubmitting || (!submissionContent.trim() && !fileURL.trim())}
                          className={`submit-button ${
                            isSubmitting || (!submissionContent.trim() && !fileURL.trim())
                              ? 'disabled'
                              : ''
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="button-loader"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <FaCheckCircle />
                              Submit Assignment
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage; 