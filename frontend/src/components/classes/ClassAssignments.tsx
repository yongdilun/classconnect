import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classService from '../../services/classService';
import type { Assignment, Submission } from '../../services/classService';
import {
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFilter,
  FaCalendarAlt,
  FaEdit,
  FaPlus,
  FaCheck,
  FaTrophy,
  FaFileAlt
} from 'react-icons/fa';
import './ClassAssignments.css';

// Extended Assignment interface with client-side properties
interface ExtendedAssignment extends Assignment {
  status?: 'assigned' | 'submitted' | 'graded' | 'missing' | 'late' | 'not_submitted';
  grade?: number;
  submission?: Submission;
}

const ClassAssignments: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const classId = parseInt(id || '0');
  const { user } = useAuth();
  const isTeacher = user?.userRole === 'teacher';
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<ExtendedAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<ExtendedAssignment | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    pointsPossible: 100
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('dueDate'); // 'dueDate', 'title', 'points'
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'assigned', 'submitted', 'graded', 'late'
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Function to fetch assignments from the API
  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching assignments for class ID:', classId);

      // Get assignments from the API
      const apiAssignments = await classService.getAssignments(classId);
      console.log('Received assignments:', apiAssignments);

      // If user is a student, fetch their submissions for these assignments
      let extendedAssignments: ExtendedAssignment[] = [...apiAssignments];

      // Helper function to determine assignment status
      const determineAssignmentStatus = (assignment: ExtendedAssignment, submission?: Submission) => {
        // If there's a submission, use its status
        if (submission) {
          // If submission is graded, that's our primary status
          if (submission.status === 'graded') {
            assignment.status = 'graded';
            assignment.grade = submission.grade;
            return;
          }

          // If submission is submitted, check if it was late
          if (submission.status === 'submitted') {
            assignment.status = submission.isLate ? 'late' : 'submitted';
            return;
          }
        }

        // No submission or status is not_submitted - check due date
        if (assignment.dueDate) {
          const dueDate = new Date(assignment.dueDate);
          const now = new Date();

          if (dueDate < now) {
            // Past due date with no submission = missing/late
            assignment.status = 'late';
          } else {
            // Not yet due
            assignment.status = 'assigned';
          }
        } else {
          // No due date set
          assignment.status = 'assigned';
        }
      };

      if (!isTeacher && user) {
        // For each assignment, check if the student has a submission
        for (let i = 0; i < extendedAssignments.length; i++) {
          try {
            const submission = await classService.getSubmission(
              classId,
              extendedAssignments[i].id,
              user.userId
            );

            // Add submission to the assignment
            extendedAssignments[i].submission = submission;
            extendedAssignments[i].grade = submission.grade;

            // Determine the status based on submission and due date
            determineAssignmentStatus(extendedAssignments[i], submission);
          } catch (submissionErr) {
            // No submission found, determine status based on due date only
            determineAssignmentStatus(extendedAssignments[i]);
          }
        }
      }

      setAssignments(extendedAssignments);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
      setIsLoading(false);
    }
  };

  // Fetch assignments on component mount
  useEffect(() => {
    if (classId) {
      console.log(`ClassAssignments: Fetching assignments for class ID ${classId}`);
      fetchAssignments();
    } else {
      console.error('ClassAssignments: No valid class ID provided');
      setError('Invalid class ID');
      setIsLoading(false);
    }
  }, [classId, user]);

  // Function to show a success message and auto-hide it after 3 seconds
  const showSuccessMessage = (message: string) => {
    setErrorMessage(null); // Clear any error messages
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000); // Hide after 3 seconds
  };

  // Function to show an error message and auto-hide it after 3 seconds
  const showErrorMessage = (message: string) => {
    setSuccessMessage(null); // Clear any success messages
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 3000); // Hide after 3 seconds
  };

  const handleCreateAssignment = async (e?: React.FormEvent) => {
    // Prevent default if this is called from a form submit
    if (e) {
      e.preventDefault();
    }

    if (!newAssignment.title.trim()) return;

    try {
      // Log the date format for debugging
      console.log('Creating assignment with date input (exact time):', newAssignment.dueDate);

      // Parse the date to verify what's being sent
      if (newAssignment.dueDate) {
        const inputDate = new Date(newAssignment.dueDate);
        console.log('Date object from input:', inputDate);
        console.log('Date UTC string:', inputDate.toUTCString());
        console.log('Date ISO string:', inputDate.toISOString());
      }

      // Create the assignment data object
      const assignmentData = {
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate, // Send the exact datetime-local input
        pointsPossible: newAssignment.pointsPossible,
        isPublished: false
      };

      console.log('Creating assignment with data:', assignmentData);

      // Call the API to create the assignment
      const createdAssignment = await classService.createAssignment(classId, assignmentData);
      console.log('Assignment created:', createdAssignment);

      // Reset the form
      setNewAssignment({
        title: '',
        description: '',
        dueDate: '',
        pointsPossible: 100
      });
      setShowCreateForm(false);

      // Show success message instead of alert
      showSuccessMessage('Assignment created successfully!');

      // Give the server a moment to process before refreshing
      setTimeout(async () => {
        try {
          await fetchAssignments();
        } catch (fetchErr) {
          console.error('Error refreshing assignments:', fetchErr);
        }
      }, 500);
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      // Replace alert with error message component
      showErrorMessage('Failed to create assignment. Please try again.');

      // Try to refresh the assignments list anyway in case the creation actually succeeded
      setTimeout(async () => {
        try {
          await fetchAssignments();
        } catch (fetchErr) {
          console.error('Failed to refresh assignments after creation attempt:', fetchErr);
        }
      }, 1000);
    }
  };

  // Handle editing an assignment
  const handleEditAssignment = async (e?: React.FormEvent) => {
    // Prevent default if this is called from a form submit
    if (e) {
      e.preventDefault();
    }

    if (!currentAssignment) return;

    try {
      // Log the date format for debugging
      console.log('Updating assignment with date input (exact time):', newAssignment.dueDate);

      // Parse the date to verify what's being sent
      if (newAssignment.dueDate) {
        const inputDate = new Date(newAssignment.dueDate);
        console.log('Date object from input:', inputDate);
        console.log('Date UTC string:', inputDate.toUTCString());
        console.log('Date ISO string:', inputDate.toISOString());
      }

      // Create the assignment data object
      const assignmentData = {
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate, // Send the exact datetime-local input
        pointsPossible: newAssignment.pointsPossible
      };

      console.log('Updating assignment with data:', assignmentData);

      // Call the API to update the assignment
      const updatedAssignment = await classService.updateAssignment(classId, currentAssignment.id, assignmentData);
      console.log('Assignment updated:', updatedAssignment);

      // Reset the form
      setNewAssignment({
        title: '',
        description: '',
        dueDate: '',
        pointsPossible: 100
      });
      setShowEditForm(false);
      setCurrentAssignment(null);

      // Show success message instead of alert
      showSuccessMessage('Assignment updated successfully!');

      // Give the server a moment to process before refreshing
      setTimeout(async () => {
        try {
          await fetchAssignments();
        } catch (fetchErr) {
          console.error('Error refreshing assignments:', fetchErr);
        }
      }, 500);
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      // Replace alert with error message component
      showErrorMessage('Failed to update assignment. Please try again.');

      // Try to refresh the assignments list anyway in case the update actually succeeded
      setTimeout(async () => {
        try {
          await fetchAssignments();
        } catch (fetchErr) {
          console.error('Failed to refresh assignments after update attempt:', fetchErr);
        }
      }, 1000);
    }
  };

  // Open the edit form for an assignment
  const openEditForm = (assignment: ExtendedAssignment) => {
    setCurrentAssignment(assignment);

    // Format the date properly for datetime-local input
    // This preserves both date and time components without timezone adjustments
    let formattedDate = '';
    if (assignment.dueDate) {
      // Parse the date in UTC to avoid timezone shifts
      const date = new Date(assignment.dueDate);

      // Format as YYYY-MM-DDThh:mm (format required by datetime-local input)
      // Use UTC methods to avoid timezone shifts
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');

      formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('Original date from DB:', date);
      console.log('UTC date components:', {year, month, day, hours, minutes});
      console.log('Formatted date for form (preserving exact time):', formattedDate);
    }

    setNewAssignment({
      title: assignment.title,
      description: assignment.description,
      dueDate: formattedDate,
      pointsPossible: assignment.pointsPossible
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // When we have a date input, make sure we log what we're sending to the API
    if (name === 'dueDate') {
      console.log('Date input changed to:', value);
    }

    setNewAssignment({
      ...newAssignment,
      [name]: name === 'pointsPossible' ? parseInt(value) || 0 : value
    });
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

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get priority level based on due date and status
  const getPriorityLevel = (assignment: ExtendedAssignment): 'high' | 'medium' | 'low' => {
    const now = new Date();
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

    if (!dueDate) return 'low';

    // If already submitted or graded, it's low priority
    if (assignment.status === 'submitted' || assignment.status === 'graded') {
      return 'low';
    }

    // If it's past due, it's high priority (unless already submitted/graded, which is handled above)
    if (dueDate < now) {
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
  };

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    // Step 1: Apply search and status filters
    let result = assignments.filter(assignment => {
      // Apply search filter
      const searchFilterPassed = !searchTerm ||
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply status filter
      const statusFilterPassed = statusFilter === 'all' || assignment.status === statusFilter;

      return searchFilterPassed && statusFilterPassed;
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

        case 'points':
          comparison = a.pointsPossible - b.pointsPossible;
          break;

        case 'status':
          // Sort by status priority: late > missing > not_submitted > assigned > submitted > graded
          const statusOrder = {
            'late': 0,
            'missing': 1,
            'not_submitted': 2,
            'assigned': 3,
            'submitted': 4,
            'graded': 5
          };

          const aStatus = a.status || 'assigned';
          const bStatus = b.status || 'assigned';

          comparison = (statusOrder[aStatus as keyof typeof statusOrder] || 999) -
                      (statusOrder[bStatus as keyof typeof statusOrder] || 999);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [assignments, searchTerm, statusFilter, sortBy, sortDirection]);

  // Calculate time remaining or past due status
  const getTimeStatus = (dueDate: string) => {
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'submitted': return 'status-submitted';
      case 'graded': return 'status-graded';
      case 'missing': return 'status-missing';
      case 'late': return 'status-late';
      case 'not_submitted': return 'status-not-submitted';
      default: return 'status-assigned';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'graded': return 'Graded';
      case 'missing': return 'Missing';
      case 'late': return 'Late';
      case 'not_submitted': return 'Not Submitted';
      default: return 'Assigned';
    }
  };

  if (isLoading) {
    return (
      <div className="assignments-loading">
        <div className="assignments-spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignments-error">
        <h3>Error Loading Assignments</h3>
        <p>{error}</p>
        <div className="error-actions">
          {error.includes('Authentication') || error.includes('logged in') ? (
            <Link to={`/${user?.userRole}/login`} className="retry-button">
              Log In Again
            </Link>
          ) : (
            <button onClick={fetchAssignments} className="retry-button">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="class-assignments-container">
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="assignments-header">
        <div className="header-top">
          <h2>Assignments</h2>
          <div className="header-actions">
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

            <button
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={toggleFilters}
            >
              <FaFilter />
              <span>Filter</span>
            </button>

            {isTeacher && (
              <button
                className="create-assignment-btn"
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setShowEditForm(false);
                }}
              >
                <FaPlus />
                <span>{showCreateForm ? 'Cancel' : 'Create Assignment'}</span>
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="filters-container">
            <div className="filter-section">
              <h3>Sort By</h3>
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
                  <FaFileAlt className="option-icon" />
                  Title
                  {sortBy === 'title' && (
                    sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                  )}
                </button>
                <button
                  className={`sort-option ${sortBy === 'points' ? 'active' : ''}`}
                  onClick={() => handleSortChange('points')}
                >
                  <FaTrophy className="option-icon" />
                  Points
                  {sortBy === 'points' && (
                    sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                  )}
                </button>
                <button
                  className={`sort-option ${sortBy === 'status' ? 'active' : ''}`}
                  onClick={() => handleSortChange('status')}
                >
                  <FaCheck className="option-icon" />
                  Status
                  {sortBy === 'status' && (
                    sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                  )}
                </button>
              </div>
            </div>

            <div className="filter-section">
              <h3>Filter By Status</h3>
              <div className="status-filter-options">
                <button
                  className={`status-option ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('all')}
                >
                  All
                </button>
                <button
                  className={`status-option status-assigned ${statusFilter === 'assigned' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('assigned')}
                >
                  Assigned
                </button>
                <button
                  className={`status-option status-submitted ${statusFilter === 'submitted' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('submitted')}
                >
                  Submitted
                </button>
                <button
                  className={`status-option status-graded ${statusFilter === 'graded' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('graded')}
                >
                  Graded
                </button>
                <button
                  className={`status-option status-late ${statusFilter === 'late' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('late')}
                >
                  Late
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditForm && isTeacher && currentAssignment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Assignment</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditForm(false);
                  setCurrentAssignment(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditAssignment}>
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newAssignment.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newAssignment.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dueDate">Due Date</label>
                    <input
                      type="datetime-local"
                      id="dueDate"
                      name="dueDate"
                      value={newAssignment.dueDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pointsPossible">Points</label>
                    <input
                      type="number"
                      id="pointsPossible"
                      name="pointsPossible"
                      value={newAssignment.pointsPossible}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => {
                setShowEditForm(false);
                setCurrentAssignment(null);
              }} className="cancel-btn">
                Cancel
              </button>
              <button type="button" onClick={handleEditAssignment} className="submit-btn">
                Update Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && isTeacher && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Assignment</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateAssignment}>
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newAssignment.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newAssignment.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dueDate">Due Date</label>
                    <input
                      type="datetime-local"
                      id="dueDate"
                      name="dueDate"
                      value={newAssignment.dueDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pointsPossible">Points</label>
                    <input
                      type="number"
                      id="pointsPossible"
                      name="pointsPossible"
                      value={newAssignment.pointsPossible}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowCreateForm(false)} className="cancel-btn">
                Cancel
              </button>
              <button type="button" onClick={handleCreateAssignment} className="submit-btn">
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="no-assignments">
          <p>No assignments found for this class.</p>
          {isTeacher && (
            <div className="no-assignments-actions">
              <button
                className="create-assignment-btn"
                onClick={() => setShowCreateForm(true)}
              >
                <FaPlus />
                Create First Assignment
              </button>
            </div>
          )}
        </div>
      ) : filteredAndSortedAssignments.length === 0 ? (
        <div className="no-assignments">
          <p>No assignments match your search or filter criteria.</p>
          <div className="reset-filters-actions">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="reset-filter-btn"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="assignments-list">
          {filteredAndSortedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                id={`assignment-card-${assignment.id}`}
                className={`assignment-card ${getStatusColor(assignment.status)} priority-${getPriorityLevel(assignment)}`}
                onClick={() => {
                  const path = `${isTeacher ? '/teacher' : '/student'}/classes/${classId}/assignment/${assignment.id}`;
                  if (isTeacher) {
                    navigate(`${path}/submissions`);
                  } else {
                    navigate(path);
                  }
                }}
              >
                <div className="assignment-card-header">
                  <div className="title-section">
                    <h3 className="assignment-title">{assignment.title}</h3>
                  </div>
                  <div className="priority-indicator" title={`${getPriorityLevel(assignment).charAt(0).toUpperCase() + getPriorityLevel(assignment).slice(1)} Priority`}>
                    {getPriorityLevel(assignment) === 'high' && <span className="priority-dot high"></span>}
                    {getPriorityLevel(assignment) === 'medium' && <span className="priority-dot medium"></span>}
                    {getPriorityLevel(assignment) === 'low' && <span className="priority-dot low"></span>}
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
                    <span className="due-value">{getTimeStatus(assignment.dueDate)}</span>
                  </div>

                  <div className="assignment-meta">
                    <span className="assignment-points">{assignment.pointsPossible} pts</span>

                    {assignment.status && (
                      <span className={`assignment-status ${getStatusColor(assignment.status)}`}>
                        {getStatusLabel(assignment.status)}
                      </span>
                    )}

                    {assignment.grade !== undefined && (
                      <span className="assignment-grade">
                        {assignment.grade}/{assignment.pointsPossible}
                      </span>
                    )}
                  </div>

                  {isTeacher && (
                    <div className="assignment-actions">
                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(assignment);
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default ClassAssignments;
