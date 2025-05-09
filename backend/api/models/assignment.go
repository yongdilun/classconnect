package models

import (
	"time"
)

// Assignment represents a class assignment
type Assignment struct {
	AssignmentID    int       `json:"assignmentId" gorm:"column:assignment_id;primaryKey;autoIncrement"`
	ClassID         int       `json:"classId" gorm:"column:class_id"`
	Title           string    `json:"title" gorm:"column:title"`
	Description     string    `json:"description" gorm:"column:description"`
	DueDate         time.Time `json:"dueDate" gorm:"column:due_date"`
	PointsPossible  int       `json:"pointsPossible" gorm:"column:points_possible;default:100"`
	IsPublished     bool      `json:"isPublished" gorm:"column:is_published;default:true"`
	CreatedBy       int       `json:"createdBy" gorm:"column:created_by"`
	CreatedAt       time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	AllowLateSubmit bool      `json:"allowLateSubmit" gorm:"column:allow_late_submissions;default:true"`
}

// TableName specifies the table name for the Assignment model
func (Assignment) TableName() string {
	return "assignments"
}

// AssignmentResponse represents the response format for assignments
type AssignmentResponse struct {
	AssignmentID    int       `json:"id"`
	ClassID         int       `json:"classId"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	DueDate         time.Time `json:"dueDate"`
	PointsPossible  int       `json:"pointsPossible"`
	IsPublished     bool      `json:"isPublished"`
	CreatedBy       int       `json:"createdBy"`
	CreatedAt       time.Time `json:"createdAt"`
	AllowLateSubmit bool      `json:"allowLateSubmit"`

	// Optional fields for student view
	Status string `json:"status,omitempty"`
	Grade  *int   `json:"grade,omitempty"`
}

// ToResponse converts an Assignment to an AssignmentResponse
func (a Assignment) ToResponse() AssignmentResponse {
	return AssignmentResponse{
		AssignmentID:    a.AssignmentID,
		ClassID:         a.ClassID,
		Title:           a.Title,
		Description:     a.Description,
		DueDate:         a.DueDate,
		PointsPossible:  a.PointsPossible,
		IsPublished:     a.IsPublished,
		CreatedBy:       a.CreatedBy,
		CreatedAt:       a.CreatedAt,
		AllowLateSubmit: a.AllowLateSubmit,
	}
}
