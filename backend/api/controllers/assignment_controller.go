package controllers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/api/models"
	"github.com/yongdilun/classconnect-backend/api/services"
)

// Helper function to get the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// AssignmentController handles assignment-related requests
type AssignmentController struct {
	assignmentService services.AssignmentService
}

// NewAssignmentController creates a new AssignmentController
func NewAssignmentController(assignmentService services.AssignmentService) *AssignmentController {
	return &AssignmentController{
		assignmentService: assignmentService,
	}
}

// GetAssignments handles GET /api/classes/:id/assignments
func (c *AssignmentController) GetAssignments(ctx *gin.Context) {
	// Parse class ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	// Get assignments for the class
	assignments, err := c.assignmentService.GetAssignments(classID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, assignments)
}

// GetAssignment handles GET /api/classes/:id/assignments/:assignmentId
func (c *AssignmentController) GetAssignment(ctx *gin.Context) {
	// Parse class ID and assignment ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	assignmentIDStr := ctx.Param("assignmentId")
	assignmentID, err := strconv.Atoi(assignmentIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignment ID"})
		return
	}

	// Log the request details
	userID, _ := ctx.Get("userId")
	userRole, _ := ctx.Get("userRole")
	log.Printf("GetAssignment request: classID=%d, assignmentID=%d, userID=%v, userRole=%v",
		classID, assignmentID, userID, userRole)

	// Get the assignment
	assignment, err := c.assignmentService.GetAssignment(classID, assignmentID)
	if err != nil {
		log.Printf("Error getting assignment: %v", err)

		// Check if it's a "not found" error
		if strings.Contains(err.Error(), "not found") {
			log.Printf("Assignment %d not found in class %d", assignmentID, classID)
			ctx.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Assignment %d not found in class %d", assignmentID, classID)})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Assignment found: ID=%d, Title=%s, Description=%s",
		assignment.AssignmentID,
		assignment.Title,
		assignment.Description[:min(20, len(assignment.Description))]+"...")
	ctx.JSON(http.StatusOK, assignment)
}

// CreateAssignment handles POST /api/classes/:id/assignments
func (c *AssignmentController) CreateAssignment(ctx *gin.Context) {
	// Parse class ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	// Get user ID from context
	userID, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var request struct {
		Title          string `json:"title" binding:"required"`
		Description    string `json:"description"`
		DueDate        string `json:"dueDate"`
		PointsPossible int    `json:"pointsPossible"`
		IsPublished    bool   `json:"isPublished"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Create assignment
	assignment := models.Assignment{
		ClassID:        classID,
		Title:          request.Title,
		Description:    request.Description,
		PointsPossible: request.PointsPossible,
		IsPublished:    true,         // Always publish assignments
		CreatedBy:      userID.(int), // Set the creator ID
	}

	// Parse due date if provided
	if request.DueDate != "" {
		assignment.DueDate, err = models.ParseTime(request.DueDate)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format"})
			return
		}
	}

	// Create the assignment
	createdAssignment, err := c.assignmentService.CreateAssignment(classID, userID.(int), assignment)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, createdAssignment)
}

// UpdateAssignment handles PUT /api/classes/:id/assignments/:assignmentId
func (c *AssignmentController) UpdateAssignment(ctx *gin.Context) {
	// Parse class ID and assignment ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	assignmentIDStr := ctx.Param("assignmentId")
	assignmentID, err := strconv.Atoi(assignmentIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignment ID"})
		return
	}

	// Get user ID from context
	_, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var request struct {
		Title          string `json:"title"`
		Description    string `json:"description"`
		DueDate        string `json:"dueDate"`
		PointsPossible int    `json:"pointsPossible"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get the existing assignment to preserve fields like created_by
	existingAssignment, err := c.assignmentService.GetAssignment(classID, assignmentID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get existing assignment: %v", err)})
		return
	}

	// Create assignment object with updated fields
	assignment := models.Assignment{
		Title:          request.Title,
		Description:    request.Description,
		PointsPossible: request.PointsPossible,
		IsPublished:    true,                         // Always publish assignments
		CreatedBy:      existingAssignment.CreatedBy, // Preserve the creator ID
	}

	// Parse due date if provided
	if request.DueDate != "" {
		assignment.DueDate, err = models.ParseTime(request.DueDate)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format"})
			return
		}
	}

	// Update the assignment
	updatedAssignment, err := c.assignmentService.UpdateAssignment(classID, assignmentID, assignment)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedAssignment)
}

// SubmitAssignment handles POST /api/classes/:id/assignments/:assignmentId/submit
func (c *AssignmentController) SubmitAssignment(ctx *gin.Context) {
	// Parse class ID and assignment ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	assignmentIDStr := ctx.Param("assignmentId")
	assignmentID, err := strconv.Atoi(assignmentIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignment ID"})
		return
	}

	// Get student ID from context
	studentID, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var request struct {
		Content string `json:"content"`
		FileURL string `json:"fileURL"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate that at least one of content or fileURL is provided
	if request.Content == "" && request.FileURL == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Either content or fileURL must be provided"})
		return
	}

	// Submit the assignment
	submission, err := c.assignmentService.SubmitAssignment(classID, assignmentID, studentID.(int), request.Content, request.FileURL)
	if err != nil {
		log.Printf("Error submitting assignment: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log submission details
	log.Printf("Assignment submitted successfully: ID=%d, StudentID=%d", assignmentID, studentID)

	// Log assignment details if available
	if submission.Assignment != nil {
		log.Printf("Submission includes assignment: ID=%d, Title=%s",
			submission.Assignment.AssignmentID,
			submission.Assignment.Title)
	} else {
		log.Printf("Submission does NOT include assignment data")
	}

	ctx.JSON(http.StatusCreated, submission)
}

// GetSubmission handles GET /api/classes/:id/assignments/:assignmentId/submissions/:studentId
func (c *AssignmentController) GetSubmission(ctx *gin.Context) {
	// Parse class ID, assignment ID, and student ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	assignmentIDStr := ctx.Param("assignmentId")
	assignmentID, err := strconv.Atoi(assignmentIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignment ID"})
		return
	}

	studentIDStr := ctx.Param("studentId")
	studentID, err := strconv.Atoi(studentIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	// Log the request details
	userID, _ := ctx.Get("userId")
	userRole, _ := ctx.Get("userRole")
	log.Printf("GetSubmission request: classID=%d, assignmentID=%d, studentID=%d, userID=%v, userRole=%v",
		classID, assignmentID, studentID, userID, userRole)

	// Get the submission
	submission, err := c.assignmentService.GetSubmission(classID, assignmentID, studentID)
	if err != nil {
		log.Printf("Error getting submission: %v", err)

		// Check if it's a "not found" error
		if strings.Contains(err.Error(), "not found") {
			// For submission not found, we still return a default response with status 200
			// This is handled in the service layer
			log.Printf("Submission not found, but returning default response")
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Log submission details
	log.Printf("Submission response: status=%s", submission.Status)

	// Log assignment details if available
	if submission.Assignment != nil {
		log.Printf("Submission includes assignment: ID=%d, Title=%s",
			submission.Assignment.AssignmentID,
			submission.Assignment.Title)
	} else {
		log.Printf("Submission does NOT include assignment data")
	}

	ctx.JSON(http.StatusOK, submission)
}

// GetAssignmentSubmissions handles GET /api/classes/:id/assignments/:assignmentId/submissions
func (c *AssignmentController) GetAssignmentSubmissions(ctx *gin.Context) {
	// Parse class ID and assignment ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	assignmentIDStr := ctx.Param("assignmentId")
	assignmentID, err := strconv.Atoi(assignmentIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignment ID"})
		return
	}

	// Get teacher ID from context
	teacherID, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Log the request
	log.Printf("GetAssignmentSubmissions request: classID=%d, assignmentID=%d, teacherID=%v",
		classID, assignmentID, teacherID)

	// Get all submissions for the assignment
	submissions, err := c.assignmentService.GetAssignmentSubmissions(classID, assignmentID)
	if err != nil {
		log.Printf("Error getting submissions: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Found %d submissions for assignment %d", len(submissions), assignmentID)
	ctx.JSON(http.StatusOK, submissions)
}

// GradeSubmission handles PUT /api/classes/:id/assignments/:assignmentId/submissions/:studentId
func (c *AssignmentController) GradeSubmission(ctx *gin.Context) {
	// Parse class ID, assignment ID, and student ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	assignmentIDStr := ctx.Param("assignmentId")
	assignmentID, err := strconv.Atoi(assignmentIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignment ID"})
		return
	}

	studentIDStr := ctx.Param("studentId")
	studentID, err := strconv.Atoi(studentIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	// Get teacher ID from context
	teacherID, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var request struct {
		Grade    int    `json:"grade" binding:"required"`
		Feedback string `json:"feedback"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Log the request
	log.Printf("GradeSubmission request: classID=%d, assignmentID=%d, studentID=%d, teacherID=%v, grade=%d",
		classID, assignmentID, studentID, teacherID, request.Grade)

	// Get the assignment to check the maximum points
	assignment, err := c.assignmentService.GetAssignment(classID, assignmentID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get assignment: %v", err)})
		return
	}

	// Check if the grade is valid
	if request.Grade < 0 || request.Grade > assignment.PointsPossible {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Grade must be between 0 and %d", assignment.PointsPossible),
		})
		return
	}

	// Update the submission with the grade
	graded, err := c.assignmentService.GradeSubmission(
		classID, 
		assignmentID, 
		studentID, 
		teacherID.(int), 
		request.Grade, 
		request.Feedback,
	)
	if err != nil {
		log.Printf("Error grading submission: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Successfully graded submission for student %d, assignment %d", studentID, assignmentID)
	ctx.JSON(http.StatusOK, graded)
}
