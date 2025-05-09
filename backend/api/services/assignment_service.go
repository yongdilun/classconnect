package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/yongdilun/classconnect-backend/api/models"
	"gorm.io/gorm"
)

// AssignmentService provides methods for working with assignments
type AssignmentService interface {
	Service
	GetAssignments(classID int) ([]models.AssignmentResponse, error)
	GetAssignment(classID, assignmentID int) (models.AssignmentResponse, error)
	CreateAssignment(classID, teacherID int, assignment models.Assignment) (models.AssignmentResponse, error)
	UpdateAssignment(classID, assignmentID int, assignment models.Assignment) (models.AssignmentResponse, error)
	DeleteAssignment(classID, assignmentID int) error
	SubmitAssignment(classID, assignmentID, studentID int, content string, fileURL string) (models.SubmissionResponse, error)
	GetSubmission(classID, assignmentID, studentID int) (models.SubmissionResponse, error)
	GradeSubmission(classID, assignmentID, studentID, teacherID int, grade int, feedback string) (models.SubmissionResponse, error)
	GetAssignmentSubmissions(classID, assignmentID int) ([]models.SubmissionResponse, error)
}

// AssignmentServiceImpl implements AssignmentService
type AssignmentServiceImpl struct {
	*BaseService
}

// NewAssignmentService creates a new AssignmentService
func NewAssignmentService(db *gorm.DB) AssignmentService {
	return &AssignmentServiceImpl{
		BaseService: NewBaseService(db),
	}
}

// GetAssignments retrieves all assignments for a class
func (s *AssignmentServiceImpl) GetAssignments(classID int) ([]models.AssignmentResponse, error) {
	// Check if class exists
	var class models.Class
	if err := s.db.Where("class_id = ?", classID).First(&class).Error; err != nil {
		return nil, fmt.Errorf("class not found: %w", err)
	}

	// Get all assignments for the class
	var assignments []models.Assignment
	if err := s.db.Where("class_id = ?", classID).Find(&assignments).Error; err != nil {
		return nil, fmt.Errorf("failed to get assignments: %w", err)
	}

	// Convert to response format
	responses := make([]models.AssignmentResponse, 0, len(assignments))
	for _, assignment := range assignments {
		responses = append(responses, assignment.ToResponse())
	}

	return responses, nil
}

// GetAssignment retrieves a specific assignment
func (s *AssignmentServiceImpl) GetAssignment(classID, assignmentID int) (models.AssignmentResponse, error) {
	// Check if class exists
	var class models.Class
	if err := s.db.Where("class_id = ?", classID).First(&class).Error; err != nil {
		return models.AssignmentResponse{}, fmt.Errorf("class not found: %w", err)
	}

	// Get the assignment
	var assignment models.Assignment
	if err := s.db.Where("assignment_id = ? AND class_id = ?", assignmentID, classID).First(&assignment).Error; err != nil {
		return models.AssignmentResponse{}, fmt.Errorf("assignment not found: %w", err)
	}

	// Convert to response
	response := assignment.ToResponse()

	return response, nil
}

// CreateAssignment creates a new assignment
func (s *AssignmentServiceImpl) CreateAssignment(classID, teacherID int, assignment models.Assignment) (models.AssignmentResponse, error) {
	// Check if class exists
	var class models.Class
	if err := s.db.Where("class_id = ?", classID).First(&class).Error; err != nil {
		return models.AssignmentResponse{}, fmt.Errorf("class not found: %w", err)
	}

	// Check if user is a teacher for this class
	var classTeacher models.ClassTeacher
	if err := s.db.Where("class_id = ? AND user_id = ?", classID, teacherID).First(&classTeacher).Error; err != nil {
		return models.AssignmentResponse{}, errors.New("user is not a teacher for this class")
	}

	// Set class ID and created_by
	assignment.ClassID = classID
	assignment.CreatedBy = teacherID

	// Create the assignment
	if err := s.db.Create(&assignment).Error; err != nil {
		return models.AssignmentResponse{}, fmt.Errorf("failed to create assignment: %w", err)
	}

	return assignment.ToResponse(), nil
}

// UpdateAssignment updates an existing assignment
func (s *AssignmentServiceImpl) UpdateAssignment(classID, assignmentID int, assignment models.Assignment) (models.AssignmentResponse, error) {
	// Check if assignment exists
	var existingAssignment models.Assignment
	if err := s.db.Where("assignment_id = ? AND class_id = ?", assignmentID, classID).First(&existingAssignment).Error; err != nil {
		return models.AssignmentResponse{}, fmt.Errorf("assignment not found: %w", err)
	}

	// Store original due date to check if it changed
	originalDueDate := existingAssignment.DueDate

	// Update fields
	existingAssignment.Title = assignment.Title
	existingAssignment.Description = assignment.Description
	existingAssignment.DueDate = assignment.DueDate
	existingAssignment.PointsPossible = assignment.PointsPossible
	existingAssignment.IsPublished = assignment.IsPublished

	// Preserve the created_by field if it's set in the update
	if assignment.CreatedBy > 0 {
		existingAssignment.CreatedBy = assignment.CreatedBy
	}

	// Save changes (updated_at will be set by GORM or database defaults)
	if err := s.db.Save(&existingAssignment).Error; err != nil {
		return models.AssignmentResponse{}, fmt.Errorf("failed to update assignment: %w", err)
	}

	// If due date changed, update is_late flag for all submissions
	dueDateChanged := !originalDueDate.Equal(existingAssignment.DueDate)
	if dueDateChanged {
		var submissions []models.Submission
		if err := s.db.Where("assignment_id = ?", assignmentID).Find(&submissions).Error; err != nil {
			log.Printf("Warning: Failed to fetch submissions when updating assignment: %v", err)
		} else {
			for _, submission := range submissions {
				// Check if the submission should be marked as late based on the new due date
				isLate := false
				if !existingAssignment.DueDate.IsZero() && !submission.SubmissionDate.IsZero() && 
					submission.SubmissionDate.After(existingAssignment.DueDate) {
					isLate = true
				}
				
				// Only update if the is_late status changed
				if submission.IsLate != isLate {
					// Update the is_late flag
					if err := s.db.Model(&models.Submission{}).
						Where("submission_id = ?", submission.SubmissionID).
						Update("is_late", isLate).Error; err != nil {
						log.Printf("Warning: Failed to update is_late flag for submission %d: %v", submission.SubmissionID, err)
					} else {
						log.Printf("Updated is_late status to %v for submission %d", isLate, submission.SubmissionID)
					}
				}
			}
		}
	}

	return existingAssignment.ToResponse(), nil
}

// DeleteAssignment deletes an assignment
func (s *AssignmentServiceImpl) DeleteAssignment(classID, assignmentID int) error {
	// Check if assignment exists
	var assignment models.Assignment
	if err := s.db.Where("assignment_id = ? AND class_id = ?", assignmentID, classID).First(&assignment).Error; err != nil {
		return fmt.Errorf("assignment not found: %w", err)
	}

	// Delete the assignment
	if err := s.db.Delete(&assignment).Error; err != nil {
		return fmt.Errorf("failed to delete assignment: %w", err)
	}

	return nil
}

// SubmitAssignment submits an assignment
func (s *AssignmentServiceImpl) SubmitAssignment(classID, assignmentID, studentID int, content string, fileURL string) (models.SubmissionResponse, error) {
	// Check if assignment exists
	var assignment models.Assignment
	if err := s.db.Where("assignment_id = ? AND class_id = ?", assignmentID, classID).First(&assignment).Error; err != nil {
		return models.SubmissionResponse{}, fmt.Errorf("assignment not found: %w", err)
	}

	// Check if student is enrolled in the class
	var classEnrollment models.ClassEnrollment
	if err := s.db.Where("class_id = ? AND user_id = ?", classID, studentID).First(&classEnrollment).Error; err != nil {
		return models.SubmissionResponse{}, errors.New("student is not enrolled in this class")
	}

	// Check if the due date has passed to determine if submission is late
	isLate := false
	if !assignment.DueDate.IsZero() && time.Now().After(assignment.DueDate) {
		isLate = true
	}

	// Check if submission already exists
	var existingSubmission models.Submission
	result := s.db.Where("assignment_id = ? AND user_id = ?", assignmentID, studentID).First(&existingSubmission)

	if result.Error == nil {
		// Update existing submission
		existingSubmission.Content = content
		existingSubmission.SubmissionDate = time.Now()
		existingSubmission.Status = "submitted"
		existingSubmission.IsLate = isLate

		// Update file URL if provided
		if fileURL != "" {
			existingSubmission.FileURL = fileURL
		}

		if err := s.db.Save(&existingSubmission).Error; err != nil {
			return models.SubmissionResponse{}, fmt.Errorf("failed to update submission: %w", err)
		}

		// Get student name
		var student models.StudentProfile
		if err := s.db.Where("user_id = ?", studentID).First(&student).Error; err == nil {
			existingSubmission.StudentName = fmt.Sprintf("%s %s", student.FirstName, student.LastName)
		}

		// Set the assignment for the submission
		existingSubmission.Assignment = &assignment

		// Create the response with assignment data
		response := existingSubmission.ToResponse()

		// Log that we're including assignment data
		log.Printf("Including assignment data in submission response: %s", assignment.Title)

		return response, nil
	}

	// Create new submission
	submission := models.Submission{
		AssignmentID:   assignmentID,
		StudentID:      studentID,
		Content:        content,
		FileURL:        fileURL,
		SubmissionDate: time.Now(),
		IsLate:         isLate,
		Status:         "submitted",
	}

	if err := s.db.Create(&submission).Error; err != nil {
		return models.SubmissionResponse{}, fmt.Errorf("failed to create submission: %w", err)
	}

	// Get student name
	var student models.StudentProfile
	if err := s.db.Where("user_id = ?", studentID).First(&student).Error; err == nil {
		submission.StudentName = fmt.Sprintf("%s %s", student.FirstName, student.LastName)
	}

	// Set the assignment for the submission
	submission.Assignment = &assignment

	// Create the response with assignment data
	response := submission.ToResponse()

	// Log that we're including assignment data
	log.Printf("Including assignment data in submission response: %s", assignment.Title)

	return response, nil
}

// GetSubmission retrieves a submission
func (s *AssignmentServiceImpl) GetSubmission(classID, assignmentID, studentID int) (models.SubmissionResponse, error) {
	// Check if assignment exists
	var assignment models.Assignment
	if err := s.db.Where("assignment_id = ? AND class_id = ?", assignmentID, classID).First(&assignment).Error; err != nil {
		return models.SubmissionResponse{}, fmt.Errorf("assignment not found: %w", err)
	}

	// Get the submission
	var submission models.Submission
	result := s.db.Where("assignment_id = ? AND user_id = ?", assignmentID, studentID).First(&submission)

	// If no submission is found, create a default response
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Get student name for the response
			var studentName string
			var student models.StudentProfile
			if err := s.db.Where("user_id = ?", studentID).First(&student).Error; err == nil {
				studentName = fmt.Sprintf("%s %s", student.FirstName, student.LastName)
			}

			// Create assignment response
			assignmentResponse := assignment.ToResponse()

			// Return a default submission response with assignment data
			return models.SubmissionResponse{
				AssignmentID:   assignmentID,
				StudentID:      studentID,
				StudentName:    studentName,
				Content:        "",
				FileURL:        "",
				Status:         "not_submitted",
				SubmissionDate: time.Time{}, // Zero time
				IsLate:         false,
				Assignment:     &assignmentResponse, // Include assignment data
			}, nil
		}

		// If it's another error, return it
		return models.SubmissionResponse{}, fmt.Errorf("error retrieving submission: %w", result.Error)
	}

	// Get student name
	var student models.StudentProfile
	if err := s.db.Where("user_id = ?", studentID).First(&student).Error; err == nil {
		submission.StudentName = fmt.Sprintf("%s %s", student.FirstName, student.LastName)
	}

	// Set the assignment for the submission
	submission.Assignment = &assignment

	// Create the response with assignment data
	response := submission.ToResponse()

	// Log that we're including assignment data
	log.Printf("Including assignment data in submission response: %s", assignment.Title)

	return response, nil
}

// GetAssignmentSubmissions retrieves all submissions for an assignment
func (s *AssignmentServiceImpl) GetAssignmentSubmissions(classID, assignmentID int) ([]models.SubmissionResponse, error) {
	// Check if class exists
	var class models.Class
	if err := s.db.Where("class_id = ?", classID).First(&class).Error; err != nil {
		return nil, fmt.Errorf("class not found: %w", err)
	}

	// Check if assignment exists
	var assignment models.Assignment
	if err := s.db.Where("assignment_id = ? AND class_id = ?", assignmentID, classID).First(&assignment).Error; err != nil {
		return nil, fmt.Errorf("assignment not found: %w", err)
	}

	// Get all submissions for this assignment
	var submissions []models.Submission
	if err := s.db.Where("assignment_id = ?", assignmentID).Find(&submissions).Error; err != nil {
		return nil, fmt.Errorf("failed to get submissions: %w", err)
	}

	// For each submission, get the student name
	for i := range submissions {
		// Set the assignment for the submission
		submissions[i].Assignment = &assignment

		// Get student name
		var student models.StudentProfile
		if err := s.db.Where("user_id = ?", submissions[i].StudentID).First(&student).Error; err == nil {
			submissions[i].StudentName = fmt.Sprintf("%s %s", student.FirstName, student.LastName)
		} else {
			submissions[i].StudentName = fmt.Sprintf("Student #%d", submissions[i].StudentID)
		}
	}

	// Convert to response format
	responses := make([]models.SubmissionResponse, 0, len(submissions))
	for _, submission := range submissions {
		responses = append(responses, submission.ToResponse())
	}

	// Also get students enrolled in the class who haven't submitted yet
	type EnrolledStudent struct {
		UserID     int    `gorm:"column:user_id"`
		FirstName  string `gorm:"column:first_name"`
		LastName   string `gorm:"column:last_name"`
	}
	
	var enrolledStudents []EnrolledStudent
	enrollmentQuery := `
		SELECT ce.user_id, sp.first_name, sp.last_name
		FROM class_enrollments ce
		JOIN student_profiles sp ON ce.user_id = sp.user_id
		WHERE ce.class_id = ? AND ce.is_active = 1
	`
	if err := s.db.Raw(enrollmentQuery, classID).Scan(&enrolledStudents).Error; err != nil {
		log.Printf("Error querying enrolled students: %v", err)
		// Continue processing even if we can't get enrolled students
	}

	// Create a map of students who have already submitted
	submittedStudents := make(map[int]bool)
	for _, submission := range submissions {
		submittedStudents[submission.StudentID] = true
	}

	// For each enrolled student who hasn't submitted yet, create a "not_submitted" response
	for _, student := range enrolledStudents {
		if !submittedStudents[student.UserID] {
			// Create a default "not_submitted" response
			assignmentResponse := assignment.ToResponse()
			
			responses = append(responses, models.SubmissionResponse{
				AssignmentID:   assignmentID,
				StudentID:      student.UserID,
				StudentName:    fmt.Sprintf("%s %s", student.FirstName, student.LastName),
				Content:        "",
				Status:         "not_submitted",
				SubmissionDate: time.Time{}, // Zero time
				IsLate:         false,
				Assignment:     &assignmentResponse,
			})
		}
	}

	return responses, nil
}

// GradeSubmission grades a submission
func (s *AssignmentServiceImpl) GradeSubmission(classID, assignmentID, studentID, teacherID int, grade int, feedback string) (models.SubmissionResponse, error) {
	// Check if assignment exists
	var assignment models.Assignment
	if err := s.db.Where("assignment_id = ? AND class_id = ?", assignmentID, classID).First(&assignment).Error; err != nil {
		return models.SubmissionResponse{}, fmt.Errorf("assignment not found: %w", err)
	}

	// Check if teacher is assigned to the class
	var classTeacher models.ClassTeacher
	if err := s.db.Where("class_id = ? AND user_id = ?", classID, teacherID).First(&classTeacher).Error; err != nil {
		return models.SubmissionResponse{}, errors.New("user is not a teacher for this class")
	}

	// Get the submission
	var submission models.Submission
	if err := s.db.Where("assignment_id = ? AND user_id = ?", assignmentID, studentID).First(&submission).Error; err != nil {
		return models.SubmissionResponse{}, fmt.Errorf("submission not found: %w", err)
	}

	// Update grade and feedback
	gradeValue := grade
	gradedBy := teacherID
	gradedDate := time.Now()

	submission.Grade = &gradeValue
	submission.Feedback = feedback
	submission.Status = "graded"
	submission.GradedBy = &gradedBy
	submission.GradedDate = &gradedDate

	if err := s.db.Save(&submission).Error; err != nil {
		return models.SubmissionResponse{}, fmt.Errorf("failed to update submission: %w", err)
	}

	// Get student name
	var student models.StudentProfile
	if err := s.db.Where("user_id = ?", studentID).First(&student).Error; err == nil {
		submission.StudentName = fmt.Sprintf("%s %s", student.FirstName, student.LastName)
	}

	return submission.ToResponse(), nil
}
