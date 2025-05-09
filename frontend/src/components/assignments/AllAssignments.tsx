import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classService from '../../services/classService';
import type { Assignment } from '../../services/classService';
import {
  FaSearch,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFilter,
  FaCalendarAlt,
  FaBook,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaLayerGroup
} from 'react-icons/fa';
import './AllAssignments.css';

// Define the Class interface if it's not properly imported
interface Class {
  classId: number;
  className: string;
  // Add other properties as needed
}

interface AssignmentWithClass extends Assignment {
  className: string;
  classId: number;
  status?: string;
  grade?: number;
}

const AllAssignments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentWithClass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'upcoming', 'past'
  const [retryCount, setRetryCount] = useState<number>(0);
  const [userClasses, setUserClasses] = useState<Class[]>([]);

  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('dueDate'); // 'dueDate', 'title', 'class', 'status'
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [groupByClass, setGroupByClass] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all'); // 'all', 'high', 'medium', 'low'

  const fetchAllAssignments = async () => {
    if (!user) {
      setError('You must be logged in to view assignments');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching assignments - User:', user);

      // First, fetch all classes the user is part of
      let userClasses: any[] = [];
      try {
        if (user.userRole === 'teacher') {
          console.log('Fetching teacher classes for user ID:', user.userId);
          // Add timeout for class fetching
          userClasses = await Promise.race([
            classService.getTeacherClasses(user.userId),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Classes fetch timeout')), 10000)
            )
          ]) as any[];
          console.log('Teacher classes fetched:', userClasses);
        } else {
          console.log('Fetching student classes for user ID:', user.userId);
          // Add timeout for class fetching
          userClasses = await Promise.race([
            classService.getStudentClasses(user.userId),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Classes fetch timeout')), 10000)
            )
          ]) as any[];
          console.log('Student classes fetched:', userClasses);
        }
      } catch (err: any) {
        console.error('Error fetching classes:', err);

        // Check if it's a network error and provide a more specific message
        if (err.message.includes('Network') || err.message.includes('Failed to fetch') || err.message.includes('timeout')) {
          setError(`Network error: Could not connect to the server. Please check your internet connection and verify the server is running.`);
        } else {
          setError(`Failed to fetch classes: ${err.message || 'Unknown error'}`);
        }

        setIsLoading(false);
        return;
      }

      if (!userClasses || userClasses.length === 0) {
        console.log('No classes found for user');
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      // Then fetch assignments for each class
      const allAssignments: AssignmentWithClass[] = [];
      let hasError = false;
      let errorMessages: string[] = [];

      // Use Promise.allSettled to fetch all assignments in parallel and handle errors
      const promises = userClasses.map(async (classItem) => {
        // Handle both possible property names (classId or id)
        const classId = classItem.classId || classItem.id;
        const className = classItem.className || classItem.name;

        if (!classId) {
          console.error('Invalid class object:', classItem);
          return Promise.reject('Invalid class object');
        }

        try {
          console.log(`Fetching assignments for class ${classId}`);
          const classAssignments = await classService.getAssignments(classId);
          console.log(`Assignments for class ${classId}:`, classAssignments);

          // Add class name to each assignment
          return classAssignments.map(assignment => ({
            ...assignment,
            className: className || `Class ${classId}`,
            classId: classId
          }));
        } catch (err: any) {
          console.error(`Error fetching assignments for class ${classId}:`, err);
          errorMessages.push(`Class ${className || classId}: ${err.message}`);
          return Promise.reject(err.message);
        }
      });

      const results = await Promise.allSettled(promises);

      // Process the results
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allAssignments.push(...result.value);
        } else {
          hasError = true;
        }
      });

      if (hasError && allAssignments.length === 0) {
        // If we have specific error messages, display them (limited to first 3)
        if (errorMessages.length > 0) {
          const errorDetail = errorMessages.length > 3
            ? `${errorMessages.slice(0, 3).join('\n')}... and ${errorMessages.length - 3} more errors`
            : errorMessages.join('\n');
          setError(`Failed to fetch assignments: ${errorDetail}`);
        } else {
          setError('Failed to fetch assignments. Please try again.');
        }
      } else if (hasError) {
        // Show a partial error message if we have some assignments but not all
        setError('Some assignments could not be loaded. Showing available assignments.');
      }

      console.log('All assignments fetched:', allAssignments);

      // Sort assignments by due date (closest first)
      allAssignments.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setAssignments(allAssignments);
      setUserClasses(userClasses as Class[]);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error in fetchAllAssignments:', err);
      setError(`Failed to load assignments: ${err.message || 'Network error'}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAssignments();
  }, [user, retryCount]);

  // Handle manual retry
  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Toggle direction if clicking the same sort option
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort option and reset direction to ascending
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  // Handle class filter change
  const handleClassFilterChange = (classId: number | null) => {
    setSelectedClass(classId);
  };

  // Toggle group by class
  const toggleGroupByClass = () => {
    setGroupByClass(!groupByClass);
  };

  // Get priority level based on due date and status
  const getPriorityLevel = useCallback((assignment: AssignmentWithClass): string => {
    const now = new Date();
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

    if (!dueDate) return 'low';

    // If already submitted or graded, it's low priority
    if (assignment.status === 'submitted' || assignment.status === 'graded') {
      return 'low';
    }

    // If it's past due and not submitted, it's high priority
    if (dueDate < now && assignment.status !== 'submitted') {
      return 'high';
    }

    // If due within 48 hours, it's high priority
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDue <= 48) {
      return 'high';
    }

    // If due within a week, it's medium priority
    if (hoursUntilDue <= 168) { // 7 days * 24 hours
      return 'medium';
    }

    return 'low';
  }, []);

  // Filter and sort assignments
  const processedAssignments = useMemo(() => {
    // Step 1: Apply basic filters (upcoming, past, missing)
    let result = assignments.filter(assignment => {
      const now = new Date();
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

      // Apply status/time filter
      let statusFilterPassed = true;
      switch (filter) {
        case 'upcoming':
          statusFilterPassed = !!dueDate && dueDate > now;
          break;
        case 'past':
          statusFilterPassed = !!dueDate && dueDate < now;
          break;
        default:
          statusFilterPassed = true; // 'all' filter
      }

      // Apply class filter if selected
      const classFilterPassed = selectedClass === null || assignment.classId === selectedClass;

      // Apply priority filter
      const priority = getPriorityLevel(assignment);
      const priorityFilterPassed = priorityFilter === 'all' || priority === priorityFilter;

      // Apply search term filter
      const searchFilterPassed = !searchTerm ||
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.className.toLowerCase().includes(searchTerm.toLowerCase());

      return statusFilterPassed && classFilterPassed && priorityFilterPassed && searchFilterPassed;
    });

    // Step 2: Sort the filtered assignments
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'dueDate':
          // Handle null due dates
          if (!a.dueDate) return sortDirection === 'asc' ? 1 : -1;
          if (!b.dueDate) return sortDirection === 'asc' ? -1 : 1;

          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;

        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;

        case 'class':
          comparison = a.className.localeCompare(b.className);
          break;

        case 'status':
          // Sort by status priority: missing > not_submitted > late > submitted > graded
          const statusOrder = {
            'missing': 0,
            'not_submitted': 1,
            'late': 2,
            'submitted': 3,
            'graded': 4,
            'assigned': 5
          };

          const aStatus = a.status || 'assigned';
          const bStatus = b.status || 'assigned';

          comparison = (statusOrder[aStatus as keyof typeof statusOrder] || 999) -
                      (statusOrder[bStatus as keyof typeof statusOrder] || 999);
          break;

        case 'priority':
          const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
          const aPriority = getPriorityLevel(a);
          const bPriority = getPriorityLevel(b);

          comparison = priorityOrder[aPriority as keyof typeof priorityOrder] -
                      priorityOrder[bPriority as keyof typeof priorityOrder];
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [assignments, filter, searchTerm, sortBy, sortDirection, selectedClass, priorityFilter, getPriorityLevel]);

  // Group assignments by class if enabled
  const groupedAssignments = useMemo(() => {
    if (!groupByClass) return null;

    const groups: Record<string, AssignmentWithClass[]> = {};

    processedAssignments.forEach(assignment => {
      const className = assignment.className;
      if (!groups[className]) {
        groups[className] = [];
      }
      groups[className].push(assignment);
    });

    return groups;
  }, [processedAssignments, groupByClass]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate time remaining until due date
  const getTimeRemaining = (dueDate: string) => {
    if (!dueDate) return 'No due date';

    // Create date objects with time components
    const due = new Date(dueDate);
    const now = new Date();

    // Check if date is valid
    if (isNaN(due.getTime())) {
      console.error('Invalid due date format:', dueDate);
      return 'Invalid date';
    }

    // Calculate the difference in milliseconds
    const diffMs = due.getTime() - now.getTime();

    // Calculate the difference in days (rounded down)
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Calculate hours difference for same-day assignments
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffMs <= 0) {
      // Past due
      if (diffDays === 0 && diffHours > -24) {
        // Due today but past time
        return 'Due today (past due)';
      } else if (diffDays === -1) {
        return 'Due yesterday';
      } else {
        return `Past due (${Math.abs(diffDays)} days ago)`;
      }
    } else {
      // Still time left
      if (diffDays === 0) {
        // Due today with hours remaining
        if (diffHours === 0) {
          return 'Due within an hour';
        } else if (diffHours === 1) {
          return 'Due in 1 hour';
        } else {
          return `Due today (${diffHours} hours left)`;
        }
      } else if (diffDays === 1) {
        return 'Due tomorrow';
      } else {
        return `Due in ${diffDays} days`;
      }
    }
  };

  // Get status color class
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'submitted': return 'status-submitted';
      case 'graded': return 'status-graded';
      case 'late': return 'status-late';
      case 'not_submitted': return 'status-not-submitted';
      default: return 'status-assigned';
    }
  };

  // Handle assignment click to navigate to assignment detail
  const handleAssignmentClick = (classId: number, assignmentId: number) => {
    const basePath = user?.userRole === 'teacher' ? '/teacher' : '/student';

    // Different navigation based on user role
    if (user?.userRole === 'teacher') {
      // Teachers go to submissions page
      navigate(`${basePath}/classes/${classId}/assignment/${assignmentId}/submissions`);
    } else {
      // Students go directly to assignment page
      navigate(`${basePath}/classes/${classId}/assignment/${assignmentId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="assignments-loading">
        <div className="spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignments-error">
        <h2>Error</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
          <button onClick={() => navigate(-1)} className="back-btn">
            Go Back
          </button>
        </div>
        <div className="error-help">
          <p>If the issue persists:</p>
          <ul>
            <li>Check your internet connection</li>
            <li>Make sure the backend server is running</li>
            <li>Refresh the page</li>
            <li>Log out and log back in</li>
            {error.includes('Network') && (
              <>
                <li>If you're on a school or work network, check if there are any firewall restrictions</li>
                <li>Try using a different browser or device</li>
              </>
            )}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="all-assignments-container">
      <div className="assignments-header">
        <div className="header-top">
          <h1>All Assignments</h1>

          {/* Search bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="controls-container">
          {/* Status filter buttons */}
          <div className="filter-controls">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              <FaCalendarAlt className="btn-icon" />
              Upcoming
            </button>
            <button
              className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
              onClick={() => setFilter('past')}
            >
              <FaClock className="btn-icon" />
              Past
            </button>
          </div>

          {/* Advanced controls */}
          <div className="advanced-controls">
            {/* Sort dropdown */}
            <div className="sort-dropdown">
              <button
                className="sort-btn"
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              >
                <FaSort className="btn-icon" />
                <span>Sort & Filter</span>
              </button>

              {isFilterMenuOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-section">
                    <h4>Sort By</h4>
                    <div className="sort-options">
                      <button
                        className={`sort-option ${sortBy === 'dueDate' ? 'active' : ''}`}
                        onClick={() => handleSortChange('dueDate')}
                      >
                        <FaCalendarAlt className="option-icon" />
                        Due Date
                        {sortBy === 'dueDate' && (
                          sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                        )}
                      </button>
                      <button
                        className={`sort-option ${sortBy === 'title' ? 'active' : ''}`}
                        onClick={() => handleSortChange('title')}
                      >
                        Title
                        {sortBy === 'title' && (
                          sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                        )}
                      </button>
                      <button
                        className={`sort-option ${sortBy === 'class' ? 'active' : ''}`}
                        onClick={() => handleSortChange('class')}
                      >
                        <FaBook className="option-icon" />
                        Class
                        {sortBy === 'class' && (
                          sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                        )}
                      </button>
                      <button
                        className={`sort-option ${sortBy === 'status' ? 'active' : ''}`}
                        onClick={() => handleSortChange('status')}
                      >
                        <FaCheckCircle className="option-icon" />
                        Status
                        {sortBy === 'status' && (
                          sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                        )}
                      </button>
                      <button
                        className={`sort-option ${sortBy === 'priority' ? 'active' : ''}`}
                        onClick={() => handleSortChange('priority')}
                      >
                        <FaExclamationTriangle className="option-icon" />
                        Priority
                        {sortBy === 'priority' && (
                          sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="dropdown-section">
                    <h4>Filter By Class</h4>
                    <div className="class-filter-options">
                      <button
                        className={`class-option ${selectedClass === null ? 'active' : ''}`}
                        onClick={() => handleClassFilterChange(null)}
                      >
                        All Classes
                      </button>
                      {userClasses.map(classItem => (
                        <button
                          key={classItem.classId}
                          className={`class-option ${selectedClass === classItem.classId ? 'active' : ''}`}
                          onClick={() => handleClassFilterChange(classItem.classId)}
                        >
                          {classItem.className}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="dropdown-section">
                    <h4>Priority</h4>
                    <div className="priority-filter-options">
                      <button
                        className={`priority-option ${priorityFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setPriorityFilter('all')}
                      >
                        All Priorities
                      </button>
                      <button
                        className={`priority-option priority-high ${priorityFilter === 'high' ? 'active' : ''}`}
                        onClick={() => setPriorityFilter('high')}
                      >
                        High Priority
                      </button>
                      <button
                        className={`priority-option priority-medium ${priorityFilter === 'medium' ? 'active' : ''}`}
                        onClick={() => setPriorityFilter('medium')}
                      >
                        Medium Priority
                      </button>
                      <button
                        className={`priority-option priority-low ${priorityFilter === 'low' ? 'active' : ''}`}
                        onClick={() => setPriorityFilter('low')}
                      >
                        Low Priority
                      </button>
                    </div>
                  </div>

                  <div className="dropdown-section">
                    <h4>View Options</h4>
                    <div className="view-options">
                      <button
                        className={`view-option ${groupByClass ? 'active' : ''}`}
                        onClick={toggleGroupByClass}
                      >
                        <FaLayerGroup className="option-icon" />
                        Group by Class
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="no-assignments">
          {userClasses && userClasses.length === 0 ? (
            <>
              <p>{user?.userRole === 'teacher' ?
                'You are not teaching any classes yet.' :
                'You are not enrolled in any classes yet.'}</p>
              <div className="no-assignments-actions">
                {user?.userRole === 'teacher' ? (
                  <button
                    onClick={() => navigate('/teacher/classes')}
                    className="create-class-btn"
                  >
                    Create Your First Class
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/student/classes')}
                    className="join-class-btn"
                  >
                    Join a Class
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p>{user?.userRole === 'teacher' ?
                'You have no assignments created in any of your classes.' :
                'You have no assignments in any of your classes.'}</p>
              <div className="no-assignments-actions">
                {user?.userRole === 'teacher' && (
                  <button
                    onClick={() => navigate('/teacher/classes')}
                    className="create-assignment-btn"
                  >
                    Go to Classes to Create Assignments
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : processedAssignments.length === 0 ? (
        <div className="no-assignments">
          <p>No assignments found for the selected filters.</p>
          <div className="reset-filters-actions">
            <button
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
                setSelectedClass(null);
                setPriorityFilter('all');
              }}
              className="reset-filter-btn"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Results summary */}
          <div className="results-summary">
            <p>
              Showing {processedAssignments.length} {processedAssignments.length === 1 ? 'assignment' : 'assignments'}
              {searchTerm && <span> matching "{searchTerm}"</span>}
              {selectedClass !== null && <span> in {userClasses.find(c => c.classId === selectedClass)?.className}</span>}
              {filter !== 'all' && <span> ({filter})</span>}
              {priorityFilter !== 'all' && <span> with {priorityFilter} priority</span>}
            </p>
          </div>

          {/* Grouped view */}
          {groupByClass && groupedAssignments ? (
            <div className="grouped-assignments">
              {Object.entries(groupedAssignments).map(([className, classAssignments]) => (
                <div key={className} className="class-group">
                  <div className="class-group-header">
                    <h2 className="class-name">{className}</h2>
                    <span className="assignment-count">{classAssignments.length} {classAssignments.length === 1 ? 'assignment' : 'assignments'}</span>
                  </div>

                  <div className="assignments-list">
                    {classAssignments.map((assignment) => (
                      <AssignmentCard
                        key={`${assignment.classId}-${assignment.id}`}
                        assignment={assignment}
                        getStatusColor={getStatusColor}
                        getPriorityLevel={getPriorityLevel}
                        formatDate={formatDate}
                        getTimeRemaining={getTimeRemaining}
                        onClick={() => handleAssignmentClick(assignment.classId, assignment.id)}
                        showClassName={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Regular list view
            <div className="assignments-list">
              {processedAssignments.map((assignment) => (
                <AssignmentCard
                  key={`${assignment.classId}-${assignment.id}`}
                  assignment={assignment}
                  getStatusColor={getStatusColor}
                  getPriorityLevel={getPriorityLevel}
                  formatDate={formatDate}
                  getTimeRemaining={getTimeRemaining}
                  onClick={() => handleAssignmentClick(assignment.classId, assignment.id)}
                  showClassName={true}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Assignment Card Component
interface AssignmentCardProps {
  assignment: AssignmentWithClass;
  getStatusColor: (status?: string) => string;
  getPriorityLevel: (assignment: AssignmentWithClass) => string;
  formatDate: (dateString: string) => string;
  getTimeRemaining: (dueDate: string) => string;
  onClick: () => void;
  showClassName: boolean;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  getStatusColor,
  getPriorityLevel,
  formatDate,
  getTimeRemaining,
  onClick,
  showClassName
}) => {
  const priorityLevel = getPriorityLevel(assignment);

  return (
    <div
      className={`assignment-card ${getStatusColor(assignment.status)} priority-${priorityLevel}`}
      onClick={onClick}
    >
      <div className="assignment-card-header">
        <div className="title-section">
          <h3 className="assignment-title">{assignment.title}</h3>
          {showClassName && (
            <span className="assignment-class">{assignment.className}</span>
          )}
        </div>

        <div className="priority-indicator" title={`${priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1)} Priority`}>
          {priorityLevel === 'high' && <span className="priority-dot high"></span>}
          {priorityLevel === 'medium' && <span className="priority-dot medium"></span>}
          {priorityLevel === 'low' && <span className="priority-dot low"></span>}
        </div>
      </div>

      <div className="assignment-card-body">
        <p className="assignment-description">
          {assignment.description?.length > 100
            ? assignment.description.substring(0, 100) + '...'
            : assignment.description}
        </p>
      </div>

      <div className="assignment-card-footer">
        <div className="assignment-due-date">
          <span className="due-label">Due:</span>
          <span className="due-value">{formatDate(assignment.dueDate)}</span>
        </div>

        <div className="assignment-meta">
          <span className="assignment-points">{assignment.pointsPossible} pts</span>

          {assignment.status && (
            <span className={`assignment-status ${getStatusColor(assignment.status)}`}>
              {assignment.status === 'not_submitted' ? 'Not Submitted' :
               assignment.status === 'submitted' ? 'Submitted' :
               assignment.status === 'graded' ? 'Graded' :
               assignment.status === 'late' ? 'Late' : 'Assigned'}
            </span>
          )}

          {assignment.grade !== undefined && (
            <span className="assignment-grade">
              {assignment.grade}/{assignment.pointsPossible}
            </span>
          )}
        </div>

        <div className="assignment-time-remaining">
          {getTimeRemaining(assignment.dueDate)}
        </div>
      </div>
    </div>
  );
};
export default AllAssignments;