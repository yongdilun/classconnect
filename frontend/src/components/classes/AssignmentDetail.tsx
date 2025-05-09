import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classService from '../../services/classService';
import type { Assignment, Submission } from '../../services/classService';
import './AssignmentDetail.css';

interface AssignmentDetailProps {
  showSubmission?: boolean;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ showSubmission = false }) => {
  const { id, assignmentId, studentId } = useParams<{ id: string; assignmentId: string; studentId?: string }>();
  const classIdNum = id ? parseInt(id) : 0;
  const assignmentIdNum = assignmentId ? parseInt(assignmentId) : 0;
  const studentIdNum = studentId ? parseInt(studentId) : undefined;
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.userRole === 'teacher';

  // Detailed parameter logging
  console.log('AssignmentDetail: URL parameters:', window.location.pathname);
  console.log('AssignmentDetail: Parsed params:', {
    id,
    assignmentId,
    studentId,
    classIdNum,
    assignmentIdNum,
    studentIdNum
  });
  console.log('AssignmentDetail: User:', user);
  console.log('AssignmentDetail: Is teacher:', isTeacher);
  console.log('AssignmentDetail: showSubmission prop:', showSubmission);

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
      console.log('Fetching assignment details for class:', classIdNum, 'assignment:', assignmentIdNum);
      console.log('URL contains id:', id, 'assignmentId:', assignmentId);
      console.log('User authentication state:', user ? 'Logged in' : 'Not logged in');

      // Check if user is logged in
      if (!user) {
        console.error('User is not logged in');
        setError('You must be logged in to view this assignment');
        setIsLoading(false);
        return;
      }

      if (isNaN(classIdNum) || isNaN(assignmentIdNum) || classIdNum <= 0 || assignmentIdNum <= 0) {
        console.error('Missing or invalid class ID or assignment ID');
        console.error('id:', id, 'assignmentId:', assignmentId);
        console.error('classIdNum:', classIdNum, 'assignmentIdNum:', assignmentIdNum);
        setError('Invalid class or assignment ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // IMPORTANT: Always fetch the assignment data directly first
        console.log(`DIRECT API CALL: GET /api/classes/${classIdNum}/assignments/${assignmentIdNum}`);

        // Use the fetch API directly to ensure the request is made
        // Get the token from localStorage or sessionStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        console.log('Token for assignment request:', token ? 'Found' : 'Not found');

        const assignmentResponse = await fetch(`/api/classes/${classIdNum}/assignments/${assignmentIdNum}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          credentials: 'include',
        });

        if (!assignmentResponse.ok) {
          throw new Error(`Failed to fetch assignment: ${assignmentResponse.status} ${assignmentResponse.statusText}`);
        }

        const assignmentData = await assignmentResponse.json();
        console.log('Assignment data received directly:', assignmentData);
        setAssignment(assignmentData);

        // For students, also try to get the submission
        if (!isTeacher && user) {
          console.log('Student view: Now fetching submission data');
          try {
            console.log(`Submission API call: GET /api/classes/${classIdNum}/assignments/${assignmentIdNum}/submissions/${user.userId}`);

            // Use the fetch API directly to ensure the request is made
            // Get the token from localStorage or sessionStorage
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            console.log('Token for submission request:', token ? 'Found' : 'Not found');

            const submissionResponse = await fetch(`/api/classes/${classIdNum}/assignments/${assignmentIdNum}/submissions/${user.userId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              credentials: 'include',
            });

            if (!submissionResponse.ok) {
              throw new Error(`Failed to fetch submission: ${submissionResponse.status} ${submissionResponse.statusText}`);
            }

            const submissionData = await submissionResponse.json();
            console.log('Submission data received:', submissionData);

            // If we got a submission with a real status (not "not_submitted"), use it
            if (submissionData && submissionData.status && submissionData.status !== 'not_submitted') {
              console.log('Found existing submission with status:', submissionData.status);

              // Set the submission data
              setSubmission(submissionData);
              if (submissionData.content) {
                setSubmissionContent(submissionData.content);
              }
              if (submissionData.fileURL) {
                setFileURL(submissionData.fileURL);
              }
            } else {
              console.log('Submission status is "not_submitted", using default submission object');
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
            console.log('No submission found, creating default submission object:', submissionErr.message);
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
        // For teachers when showSubmission is true, we need to fetch the selected student's submission
        else if (isTeacher && showSubmission) {
          console.log('Teacher view with showSubmission=true: Fetching student submission');
          try {
            // Extract studentId from the URL
            const pathParts = window.location.pathname.split('/');
            const studentIdIndex = pathParts.indexOf('submissions') + 1;
            if (studentIdIndex > 0 && studentIdIndex < pathParts.length) {
              const studentId = parseInt(pathParts[studentIdIndex]);
              console.log(`Fetching submission for student ID: ${studentId}`);

              if (!isNaN(studentId)) {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                
                const submissionResponse = await fetch(`/api/classes/${classIdNum}/assignments/${assignmentIdNum}/submissions/${studentId}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                  },
                  credentials: 'include',
                });

                if (!submissionResponse.ok) {
                  throw new Error(`Failed to fetch submission: ${submissionResponse.status} ${submissionResponse.statusText}`);
                }

                const submissionData = await submissionResponse.json();
                console.log('Student submission data received:', submissionData);
                
                setSubmission(submissionData);
                if (submissionData.content) {
                  setSubmissionContent(submissionData.content);
                }
                if (submissionData.fileURL) {
                  setFileURL(submissionData.fileURL);
                }
              }
            }
          } catch (submissionErr: any) {
            console.error('Error fetching student submission:', submissionErr);
            // Don't set an error here, just log it
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error in fetchAssignmentDetails:', err);
        setError(err.message || 'Failed to load assignment details');
        setIsLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [classIdNum, assignmentIdNum, isTeacher, user, showSubmission]);

  // Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('handleSubmit called');
    console.log('submissionContent:', submissionContent);
    console.log('fileURL:', fileURL);
    console.log('isSubmitting:', isSubmitting);

    // Require either content or file URL
    if ((!submissionContent.trim() && !fileURL.trim()) || isSubmitting) {
      console.log('Validation failed - empty content/fileURL or already submitting');
      return;
    }

    try {
      console.log('Starting submission process');
      setIsSubmitting(true);

      // Submit the assignment
      console.log('Calling submitAssignment with:', {
        classIdNum,
        assignmentIdNum,
        submissionContent,
        fileURL
      });

      const submissionData = await classService.submitAssignment(
        classIdNum,
        assignmentIdNum,
        submissionContent,
        fileURL
      );

      console.log('Submission successful:', submissionData);

      // Update the submission state
      setSubmission(submissionData);
      setIsSubmitting(false);

      // If the submission has assignment data, update the assignment state
      if (submissionData.assignment) {
        console.log('Setting assignment from submission response:', submissionData.assignment);
        setAssignment(submissionData.assignment);
      }

      // Show success message
      alert('Assignment submitted successfully!');
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      alert('Failed to submit assignment. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle file URL input
  const handleFileURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileURL(e.target.value);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Extract student info from submission if in teacher view with showSubmission
  const studentInfo = showSubmission && submission && submission.studentId ? {
    id: submission.studentId,
    name: submission.studentName || `Student #${submission.studentId}`,
  } : null;

  // Handle grade submission
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('handleGradeSubmission called');
    console.log('gradeInput:', gradeInput);
    console.log('feedbackInput:', feedbackInput);
    console.log('isGrading:', isGrading);

    // Require grade input
    if (!gradeInput.trim() || isGrading) {
      console.log('Validation failed - empty grade input or already grading');
      return;
    }

    try {
      console.log('Starting grade submission process');
      setIsGrading(true);

      if (!submission || !submission.studentId) {
        throw new Error('Invalid submission data');
      }

      const gradeValue = parseInt(gradeInput);
      if (isNaN(gradeValue)) {
        throw new Error('Invalid grade value');
      }

      // Submit the grade
      console.log('Calling gradeSubmission with:', {
        classIdNum,
        assignmentIdNum,
        studentId: submission.studentId,
        grade: gradeValue,
        feedback: feedbackInput
      });

      const gradeData = await classService.gradeSubmission(
        classIdNum,
        assignmentIdNum,
        submission.studentId,
        gradeValue,
        feedbackInput
      );

      console.log('Grade submission successful:', gradeData);

      // Update the submission state
      setSubmission(gradeData);
      setIsGrading(false);

      // If the submission has assignment data, update the assignment state
      if (gradeData.assignment) {
        console.log('Setting assignment from grade response:', gradeData.assignment);
        setAssignment(gradeData.assignment);
      }

      // Show success message
      alert('Grade submitted successfully!');
    } catch (err: any) {
      console.error('Error submitting grade:', err);
      alert('Failed to submit grade. Please try again.');
      setIsGrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="assignment-detail-loading">
        <div className="spinner"></div>
        <p>Loading assignment details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignment-detail-error">
        <h2>Error</h2>
        <p>{error}</p>
        {error.includes('logged in') ? (
          <div className="error-actions">
            <button onClick={() => navigate('/student/login')}>Log In</button>
            <button onClick={() => navigate('/')}>Go to Home</button>
          </div>
        ) : (
          <button onClick={() => navigate(-1)}>Go Back</button>
        )}
      </div>
    );
  }

  if (!assignment) {
    console.log('AssignmentDetail: No assignment data available');
    return (
      <div className="assignment-detail-error">
        <h2>Assignment Not Found</h2>
        <p>The assignment you're looking for doesn't exist or you don't have permission to view it.</p>
        <p className="error-details">Class ID: {classIdNum}, Assignment ID: {assignmentIdNum}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Debug submission status
  console.log('Submission data:', submission);
  console.log('Submission status:', submission?.status);
  console.log('Is not_submitted?', submission?.status === 'not_submitted');
  console.log('Assignment data:', assignment);

  return (
    <div className="assignment-detail-container">
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading assignment details...</p>
        </div>
      ) : error ? (
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      ) : assignment ? (
        <div className="assignment-detail">
          <div className="assignment-header">
            <h1>{assignment.title}</h1>
            {showSubmission && studentInfo && (
              <div className="student-info-banner">
                <h3>Viewing submission from: {studentInfo.name}</h3>
              </div>
            )}
            <div className="assignment-meta">
              <p className="points">{assignment.pointsPossible} points</p>
              <p className="due-date">
                <span>Due: </span>
                {formatDate(assignment.dueDate)}
              </p>
              {submission && submission.grade !== undefined && submission.status === 'graded' && (
                <div className="grade-display">
                  <span>Grade: </span>
                  <strong>{submission.grade} / {assignment.pointsPossible}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="assignment-description">
            <h2>Description</h2>
            <div className="description-content">
              {assignment.description ? (
                <p>{assignment.description}</p>
              ) : (
                <p className="no-description">No description provided.</p>
              )}
            </div>
          </div>

          {/* Student submission section (for teacher view) */}
          {isTeacher && showSubmission && submission && (
            <div className="student-submission-section">
              <h2>Student Submission</h2>
              <div className="submission-status">
                <span className={`status-badge status-${submission.status}`}>
                  {submission.status === 'submitted' ? 'Submitted' :
                   submission.status === 'graded' ? 'Graded' :
                   'Not Submitted'}
                  {submission.isLate && ' (Late)'}
                </span>
                {submission.submissionDate && (
                  <span className="submission-date">
                    Submitted on: {formatDate(submission.submissionDate)}
                  </span>
                )}
              </div>
              
              {submission.content && (
                <div className="submission-content">
                  <h3>Submission Content</h3>
                  <div className="content-box">
                    {submission.content}
                  </div>
                </div>
              )}
              
              {submission.fileURL && (
                <div className="submission-file">
                  <h3>Attached File</h3>
                  <a 
                    href={submission.fileURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    View File
                  </a>
                </div>
              )}
              
              {(!submission.content && !submission.fileURL) && (
                <p className="no-content">No content submitted.</p>
              )}
              
              {submission.status === 'submitted' && (
                <div className="grading-form">
                  <h3>Grade Submission</h3>
                  <form onSubmit={handleGradeSubmission}>
                    <div className="form-group">
                      <label htmlFor="grade">Grade (out of {assignment.pointsPossible})</label>
                      <input
                        type="number"
                        id="grade"
                        min="0"
                        max={assignment.pointsPossible}
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="feedback">Feedback</label>
                      <textarea
                        id="feedback"
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        rows={4}
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="submit-grade-btn"
                      disabled={isGrading}
                    >
                      {isGrading ? 'Submitting...' : 'Submit Grade'}
                    </button>
                  </form>
                </div>
              )}
              
              {submission.status === 'graded' && (
                <div className="grade-information">
                  <div className="grade-display">
                    <h3>Grade</h3>
                    <div className="grade-value">
                      {submission.grade} / {assignment.pointsPossible}
                    </div>
                  </div>
                  
                  {submission.feedback && (
                    <div className="feedback-display">
                      <h3>Feedback</h3>
                      <div className="feedback-content">
                        {submission.feedback}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Student submission form (for student view) */}
          {!isTeacher && !showSubmission && submission && submission.status !== 'graded' && (
            <div className="submission-form">
              <h2>Submit Your Work</h2>
              {/* Debug info is hidden in production */}
              {false && (
                <div className="debug-info" style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  marginBottom: '15px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}>
                  <p><strong>Debug - Submission Form:</strong></p>
                  <p>Showing form because:</p>
                  <ul>
                    <li>submission is {submission ? 'defined' : 'undefined'}</li>
                    <li>submission.status is {submission?.status || 'undefined'}</li>
                    <li>status === 'not_submitted': {submission?.status === 'not_submitted' ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="submissionContent">Your Answer</label>
                  <textarea
                    id="submissionContent"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={10}
                    placeholder="Type your answer here..."
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fileURL">File URL (Optional)</label>
                  <input
                    type="url"
                    id="fileURL"
                    value={fileURL}
                    onChange={handleFileURLChange}
                    placeholder="Enter URL to your file (Google Drive, Dropbox, etc.)"
                    disabled={isSubmitting}
                  />
                  <p className="file-url-help">
                    Upload your file to a cloud storage service and paste the link here.
                  </p>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="cancel-btn"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={(!submissionContent.trim() && !fileURL.trim()) || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="no-assignment">
          <h2>No Assignment Found</h2>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetail;
