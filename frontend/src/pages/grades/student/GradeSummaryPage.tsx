import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import gradeService from '../../../services/gradeService';
import type {
  StudentGradeSummary,
  ClassGradeSummary,
  GradeFilterOptions,
  GradeSortConfig
} from '../../../types/grades';
import './GradeSummaryPage.css';

const GradeSummaryPage: React.FC = () => {
  const { user } = useAuth();
  const [gradeSummary, setGradeSummary] = useState<StudentGradeSummary | null>(null);
  const [filteredClasses, setFilteredClasses] = useState<ClassGradeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [filterOptions, setFilterOptions] = useState<GradeFilterOptions>({
    status: 'all'
  });
  const [sortConfig, setSortConfig] = useState<GradeSortConfig>({
    field: 'className',
    direction: 'asc'
  });

  useEffect(() => {
    const fetchGradeSummary = async () => {
      if (!user?.userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const summary = await gradeService.getStudentGradeSummary(user.userId);
        setGradeSummary(summary);
        setFilteredClasses(summary.classes);
      } catch (err: any) {
        console.error('Error fetching grade summary:', err);
        setError(err.message || 'Failed to load grade summary');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGradeSummary();
  }, [user?.userId]);

  useEffect(() => {
    if (!gradeSummary) return;

    // Apply filters
    let filtered = [...gradeSummary.classes];

    if (filterOptions.classId) {
      filtered = filtered.filter(cls => cls.classId === filterOptions.classId);
    }

    if (filterOptions.minGrade !== undefined) {
      filtered = filtered.filter(cls => cls.percentage >= (filterOptions.minGrade || 0));
    }

    if (filterOptions.maxGrade !== undefined) {
      filtered = filtered.filter(cls => cls.percentage <= (filterOptions.maxGrade || 100));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'className':
          comparison = a.className.localeCompare(b.className);
          break;
        case 'percentage':
          comparison = a.percentage - b.percentage;
          break;
        case 'totalPoints':
          comparison = a.totalPoints - b.totalPoints;
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    setFilteredClasses(filtered);
  }, [gradeSummary, filterOptions, sortConfig]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    setFilterOptions(prev => ({
      ...prev,
      [name]: name === 'classId' || name === 'minGrade' || name === 'maxGrade'
        ? Number(value) || undefined
        : value
    }));
  };

  const handleSortChange = (field: GradeSortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (isLoading) {
    return (
      <div className="grade-summary-loading">
        <div className="spinner"></div>
        <p>Loading grade summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grade-summary-error">
        <h2>Error Loading Grades</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!gradeSummary) {
    return (
      <div className="grade-summary-empty">
        <h2>No Grade Information</h2>
        <p>There are no grades available at this time.</p>
      </div>
    );
  }

  return (
    <div className="grade-summary-container">
      <div className="grade-summary-header">
        <h1>Grade Summary</h1>
        <div className="overall-grade">
          <div className="grade-circle">
            <span className="grade-percentage">{gradeSummary.overallPercentage.toFixed(1)}%</span>
          </div>
          <div className="grade-label">Overall Grade</div>
        </div>
      </div>

      <div className="grade-filters">
        <div className="filter-group">
          <label htmlFor="classFilter">Class:</label>
          <select
            id="classFilter"
            name="classId"
            value={filterOptions.classId || ''}
            onChange={handleFilterChange}
          >
            <option value="">All Classes</option>
            {gradeSummary.classes.map(cls => (
              <option key={cls.classId} value={cls.classId}>
                {cls.className}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="minGrade">Min Grade:</label>
          <input
            type="number"
            id="minGrade"
            name="minGrade"
            min="0"
            max="100"
            value={filterOptions.minGrade || ''}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="maxGrade">Max Grade:</label>
          <input
            type="number"
            id="maxGrade"
            name="maxGrade"
            min="0"
            max="100"
            value={filterOptions.maxGrade || ''}
            onChange={handleFilterChange}
          />
        </div>

        <div className="sort-group">
          <span>Sort by:</span>
          <button
            className={`sort-button ${sortConfig.field === 'className' ? 'active' : ''}`}
            onClick={() => handleSortChange('className')}
          >
            Class Name {sortConfig.field === 'className' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-button ${sortConfig.field === 'percentage' ? 'active' : ''}`}
            onClick={() => handleSortChange('percentage')}
          >
            Grade {sortConfig.field === 'percentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="class-grades-list">
        {filteredClasses.length === 0 ? (
          <div className="no-classes-message">
            <p>No classes match the current filters.</p>
          </div>
        ) : (
          filteredClasses.map(classGrade => (
            <ClassGradeCard key={classGrade.classId} classGrade={classGrade} />
          ))
        )}
      </div>
    </div>
  );
};

interface ClassGradeCardProps {
  classGrade: ClassGradeSummary;
}

const ClassGradeCard: React.FC<ClassGradeCardProps> = ({ classGrade }) => {
  const [expanded, setExpanded] = useState(false);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#4CAF50'; // A - Green
    if (percentage >= 80) return '#8BC34A'; // B - Light Green
    if (percentage >= 70) return '#FFC107'; // C - Amber
    if (percentage >= 60) return '#FF9800'; // D - Orange
    return '#F44336'; // F - Red
  };

  return (
    <div className="class-grade-card" style={{ borderColor: classGrade.themeColor || '#6264A7' }}>
      <div className="class-grade-header">
        <div className="class-info">
          <h3>{classGrade.className}</h3>
          <span className="class-code">{classGrade.classCode}</span>
          {classGrade.subject && <span className="class-subject">{classGrade.subject}</span>}
        </div>

        <div className="class-grade">
          <div
            className="grade-circle"
            style={{ backgroundColor: getGradeColor(classGrade.percentage) }}
          >
            <span className="grade-percentage">{classGrade.percentage.toFixed(1)}%</span>
          </div>
          <div className="grade-details">
            <div className="grade-letter">{classGrade.letterGrade}</div>
            <div className="grade-points">{classGrade.earnedPoints}/{classGrade.totalPoints} pts</div>
          </div>
        </div>
      </div>

      <div className="class-grade-actions">
        <button
          className="toggle-details-button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {expanded && (
        <div className="assignment-list">
          <table className="assignment-table">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {classGrade.assignments.map(assignment => (
                <tr key={assignment.assignmentId}>
                  <td>{assignment.assignmentTitle}</td>
                  <td>{new Date(assignment.dueDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge status-${assignment.status}`}>
                      {assignment.status === 'not_submitted' ? 'Not Submitted' :
                       assignment.status === 'submitted' ? 'Submitted' : 'Graded'}
                    </span>
                  </td>
                  <td>
                    {assignment.grade !== null ? (
                      <div className="assignment-grade">
                        <span className="grade-value">{assignment.grade}/{assignment.pointsPossible}</span>
                        <span className="grade-percentage">
                          ({((assignment.grade / assignment.pointsPossible) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ) : (
                      <span className="no-grade">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GradeSummaryPage;
