package models

import (
	"time"
)

// Submission represents a student's submission for an assignment
type Submission struct {
	SubmissionID   int        `json:"submissionId" gorm:"column:submission_id;primaryKey;autoIncrement"`
	AssignmentID   int        `json:"assignmentId" gorm:"column:assignment_id"`
	StudentID      int        `json:"studentId" gorm:"column:user_id"` // Maps to user_id in the database
	Content        string     `json:"content" gorm:"column:content"`
	FileURL        string     `json:"fileURL" gorm:"column:file_url"` // URL to the submitted file
	SubmissionDate time.Time  `json:"submissionDate" gorm:"column:submission_date;autoCreateTime"`
	IsLate         bool       `json:"isLate" gorm:"column:is_late;default:false"`
	Status         string     `json:"status" gorm:"column:status;default:'submitted'"`
	Grade          *int       `json:"grade" gorm:"column:grade"`
	Feedback       string     `json:"feedback" gorm:"column:feedback"`
	GradedBy       *int       `json:"gradedBy" gorm:"column:graded_by"`
	GradedDate     *time.Time `json:"gradedDate" gorm:"column:graded_date"`

	// Virtual fields (not stored in database)
	StudentName string      `json:"studentName" gorm:"-"`
	Assignment  *Assignment `json:"-" gorm:"foreignKey:AssignmentID"`
}

// TableName specifies the table name for the Submission model
func (Submission) TableName() string {
	return "submissions"
}

// SubmissionResponse represents the response format for submissions
type SubmissionResponse struct {
	SubmissionID   int        `json:"id"`
	AssignmentID   int        `json:"assignmentId"`
	StudentID      int        `json:"studentId"`
	StudentName    string     `json:"studentName"`
	Content        string     `json:"content"`
	FileURL        string     `json:"fileURL,omitempty"`
	SubmissionDate time.Time  `json:"submissionDate"`
	IsLate         bool       `json:"isLate"`
	Grade          *int       `json:"grade,omitempty"`
	Feedback       string     `json:"feedback,omitempty"`
	Status         string     `json:"status"`
	GradedBy       *int       `json:"gradedBy,omitempty"`
	GradedDate     *time.Time `json:"gradedDate,omitempty"`

	// Optional assignment details
	Assignment *AssignmentResponse `json:"assignment,omitempty"`
}

// ToResponse converts a Submission to a SubmissionResponse
func (s Submission) ToResponse() SubmissionResponse {
	response := SubmissionResponse{
		SubmissionID:   s.SubmissionID,
		AssignmentID:   s.AssignmentID,
		StudentID:      s.StudentID,
		StudentName:    s.StudentName,
		Content:        s.Content,
		FileURL:        s.FileURL,
		SubmissionDate: s.SubmissionDate,
		IsLate:         s.IsLate,
		Grade:          s.Grade,
		Feedback:       s.Feedback,
		Status:         s.Status,
		GradedBy:       s.GradedBy,
		GradedDate:     s.GradedDate,
	}

	// Include assignment details if available
	if s.Assignment != nil {
		assignmentResponse := s.Assignment.ToResponse()
		response.Assignment = &assignmentResponse
	}

	return response
}
