import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import gradeService from '../../../services/gradeService';
import type {
  ClassStudentsGradeSummary,
  StudentClassSummary
} from '../../../types/grades';
import './GradeSummaryPage.css';

const GradeSummaryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classSummaries, setClassSummaries] = useState<ClassStudentsGradeSummary[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGradeSummaries = async () => {
      if (!user?.userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const summaries = await gradeService.getTeacherClassesGradeSummaries(user.userId);
        setClassSummaries(summaries);

        // Initialize expanded state
        const expanded: Record<number, boolean> = {};
        summaries.forEach(cls => {
          expanded[cls.classId] = false;
        });
        setExpandedClasses(expanded);
      } catch (err: any) {
        console.error('Error fetching grade summaries:', err);
        setError(err.message || 'Failed to load grade summaries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGradeSummaries();
  }, [user?.userId]);

  const toggleClassExpanded = (classId: number) => {
    setExpandedClasses(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  const navigateToStudentGrades = (classId: number, studentId: number) => {
    navigate(`/teacher/classes/${classId}/students/${studentId}/grades`);
  };

  if (isLoading) {
    return (
      <div className="grade-summary-loading">
        <div className="spinner"></div>
        <p>Loading grade summaries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grade-summary-error">
        <h2>Error Loading Grade Summaries</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (classSummaries.length === 0) {
    return (
      <div className="grade-summary-empty">
        <h2>No Classes Found</h2>
        <p>You don't have any classes with grade information.</p>
      </div>
    );
  }

  return (
    <div className="grade-summary-container">
      <div className="grade-summary-header">
        <h1>Class Grade Summaries</h1>
      </div>

      <div className="class-summaries-list">
        {classSummaries.map(classSummary => (
          <div key={classSummary.classId} className="class-summary-card">
            <div className="class-summary-header" style={{ borderColor: classSummary.themeColor || '#6264A7' }}>
              <div className="class-info">
                <h2>{classSummary.className}</h2>
                <div className="class-details">
                  <span className="class-code">{classSummary.classCode}</span>
                  {classSummary.subject && <span className="class-subject">{classSummary.subject}</span>}
                </div>
              </div>

              <div className="class-stats">
                <div className="stat-item">
                  <span className="stat-label">Students</span>
                  <span className="stat-value">{classSummary.students.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average</span>
                  <span className="stat-value">{classSummary.averagePercentage.toFixed(1)}%</span>
                </div>
              </div>

              <button
                className={`expand-button ${expandedClasses[classSummary.classId] ? 'expanded' : ''}`}
                onClick={() => toggleClassExpanded(classSummary.classId)}
              >
                {expandedClasses[classSummary.classId] ? 'Hide Students' : 'Show Students'}
              </button>
            </div>

            {expandedClasses[classSummary.classId] && (
              <div className="students-list">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Grade</th>
                      <th>Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classSummary.students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-students-message">
                          No students enrolled in this class.
                        </td>
                      </tr>
                    ) : (
                      classSummary.students.map(student => (
                        <StudentRow
                          key={student.studentId}
                          student={student}
                          classId={classSummary.classId}
                          onViewGrades={navigateToStudentGrades}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface StudentRowProps {
  student: StudentClassSummary;
  classId: number;
  onViewGrades: (classId: number, studentId: number) => void;
}

const StudentRow: React.FC<StudentRowProps> = ({ student, classId, onViewGrades }) => {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#4CAF50'; // A - Green
    if (percentage >= 80) return '#8BC34A'; // B - Light Green
    if (percentage >= 70) return '#FFC107'; // C - Amber
    if (percentage >= 60) return '#FF9800'; // D - Orange
    return '#F44336'; // F - Red
  };

  return (
    <tr className="student-row">
      <td className="student-name">{student.studentName}</td>
      <td className="student-email">{student.email}</td>
      <td className="student-grade">
        <div className="grade-display">
          <div
            className="grade-indicator"
            style={{ backgroundColor: getGradeColor(student.percentage) }}
          ></div>
          <span className="grade-value">
            {student.percentage.toFixed(1)}% ({student.letterGrade})
          </span>
        </div>
      </td>
      <td className="student-points">
        {student.earnedPoints}/{student.totalPoints}
      </td>
      <td className="student-actions">
        <button
          className="view-grades-button"
          onClick={() => onViewGrades(classId, student.studentId)}
        >
          View Grades
        </button>
      </td>
    </tr>
  );
};

export default GradeSummaryPage;
