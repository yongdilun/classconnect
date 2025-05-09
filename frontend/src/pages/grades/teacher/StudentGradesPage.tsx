import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import gradeService from '../../../services/gradeService';
import classService from '../../../services/classService';
import type { ClassGradeSummary, AssignmentGrade } from '../../../types/grades';
import './StudentGradesPage.css';

const StudentGradesPage: React.FC = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [studentName, setStudentName] = useState<string>('');
  const [gradeSummary, setGradeSummary] = useState<ClassGradeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentGrades = async () => {
      if (!classId || !studentId || !user?.userId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get student info
        const studentInfo = await gradeService.getUserInfo(parseInt(studentId));
        setStudentName(`${studentInfo.firstName} ${studentInfo.lastName}`);

        // Get grade summary for the student in this class
        const summary = await gradeService.getStudentClassGradeSummary(
          parseInt(studentId),
          parseInt(classId)
        );

        setGradeSummary(summary);
      } catch (err: any) {
        console.error('Error fetching student grades:', err);
        setError(err.message || 'Failed to load student grades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentGrades();
  }, [classId, studentId, user?.userId]);

  const navigateToSubmission = (assignmentId: number) => {
    if (!classId || !studentId) return;
    navigate(`/teacher/classes/${classId}/assignments/${assignmentId}/submissions/${studentId}`);
  };

  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="student-grades-loading">
        <div className="spinner"></div>
        <p>Loading student grades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-grades-error">
        <h2>Error Loading Student Grades</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!gradeSummary) {
    return (
      <div className="student-grades-empty">
        <h2>No Grade Information</h2>
        <p>There are no grades available for this student.</p>
        <button onClick={goBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="student-grades-container">
      <div className="student-grades-header">
        <button className="back-button" onClick={goBack}>
          &larr; Back to Class Grades
        </button>

        <div className="student-info">
          <h1>{studentName}'s Grades</h1>
          <h2>{gradeSummary.className}</h2>
        </div>

        <div className="grade-summary">
          <div
            className="grade-circle"
            style={{
              backgroundColor: getGradeColor(gradeSummary.percentage)
            }}
          >
            <span className="grade-percentage">{gradeSummary.percentage.toFixed(1)}%</span>
          </div>
          <div className="grade-details">
            <div className="grade-letter">{gradeSummary.letterGrade}</div>
            <div className="grade-points">{gradeSummary.earnedPoints}/{gradeSummary.totalPoints} pts</div>
          </div>
        </div>
      </div>

      <div className="assignments-list">
        <h3>Assignments</h3>

        <table className="assignments-table">
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Grade</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gradeSummary.assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-assignments-message">
                  No assignments in this class.
                </td>
              </tr>
            ) : (
              gradeSummary.assignments.map(assignment => (
                <AssignmentRow
                  key={assignment.assignmentId}
                  assignment={assignment}
                  onViewSubmission={() => navigateToSubmission(assignment.assignmentId)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface AssignmentRowProps {
  assignment: AssignmentGrade;
  onViewSubmission: () => void;
}

const AssignmentRow: React.FC<AssignmentRowProps> = ({ assignment, onViewSubmission }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <tr className="assignment-row">
      <td className="assignment-title">{assignment.assignmentTitle}</td>
      <td className="assignment-due-date">{formatDate(assignment.dueDate)}</td>
      <td className="assignment-status">
        <span className={`status-badge status-${assignment.status}`}>
          {assignment.status === 'not_submitted' ? 'Not Submitted' :
           assignment.status === 'submitted' ? 'Submitted' : 'Graded'}
        </span>
      </td>
      <td className="assignment-grade">
        {assignment.grade !== null ? (
          <div className="grade-display">
            <span className="grade-value">{assignment.grade}/{assignment.pointsPossible}</span>
            <span className="grade-percentage">
              ({((assignment.grade / assignment.pointsPossible) * 100).toFixed(1)}%)
            </span>
          </div>
        ) : (
          <span className="no-grade">—</span>
        )}
      </td>
      <td className="assignment-actions">
        <button
          className="view-submission-button"
          onClick={onViewSubmission}
        >
          View Submission
        </button>
      </td>
    </tr>
  );
};

// Helper function to get color based on grade percentage
const getGradeColor = (percentage: number) => {
  if (percentage >= 90) return '#4CAF50'; // A - Green
  if (percentage >= 80) return '#8BC34A'; // B - Light Green
  if (percentage >= 70) return '#FFC107'; // C - Amber
  if (percentage >= 60) return '#FF9800'; // D - Orange
  return '#F44336'; // F - Red
};

export default StudentGradesPage;
