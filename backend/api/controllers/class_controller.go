package controllers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/api/services"
)

// ClassController handles class-related HTTP requests
type ClassController struct {
	classService services.ClassService
}

// NewClassController creates a new ClassController
func NewClassController(classService services.ClassService) *ClassController {
	return &ClassController{
		classService: classService,
	}
}

// RegisterRoutes registers the routes for the ClassController
func (c *ClassController) RegisterRoutes(router *gin.RouterGroup) {
	classRoutes := router.Group("/classes")
	{
		// Class management routes
		classRoutes.POST("", c.CreateClass)
		classRoutes.GET("/:id", c.GetClass)
		classRoutes.PUT("/:id", c.UpdateClass)
		classRoutes.DELETE("/:id", c.DeleteClass)

		// Teacher-specific routes
		classRoutes.GET("/teacher/:teacherId", c.GetTeacherClasses)
		classRoutes.POST("/:id/teachers", c.AddTeacherToClass)
		classRoutes.DELETE("/:id/teachers/:teacherId", c.RemoveTeacherFromClass)

		// Student-specific routes
		classRoutes.GET("/student/:studentId", c.GetStudentClasses)
		classRoutes.POST("/join", c.JoinClass)
		classRoutes.DELETE("/:id/students/:studentId", c.RemoveStudentFromClass)
		classRoutes.GET("/:id/students", c.GetClassStudents)
	}
}

// CreateClass handles the request to create a new class
// @Summary Create a new class
// @Description Create a new class with the given details
// @Tags classes
// @Accept json
// @Produce json
// @Param class body CreateClassRequest true "Class details"
// @Success 201 {object} Class
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/classes [post]
func (c *ClassController) CreateClass(ctx *gin.Context) {
	var req struct {
		ClassName   string `json:"className" binding:"required"`
		Description string `json:"description"`
		Subject     string `json:"subject"`
		ThemeColor  string `json:"themeColor"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Get teacher ID from authenticated user
	var userID interface{}
	var exists bool

	// Try both parameter names (userId and userID)
	userID, exists = ctx.Get("userId")
	if !exists {
		userID, exists = ctx.Get("userID")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}
	}

	teacherID, ok := userID.(int)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify that the user is a teacher
	userRole, roleExists := ctx.Get("userRole")
	if roleExists {
		role, roleOk := userRole.(string)
		if roleOk && role != "teacher" && role != "admin" {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "Only teachers can create classes"})
			return
		}
	}

	// Create the class
	class, err := c.classService.CreateClass(teacherID, req.ClassName, req.Description, req.Subject, req.ThemeColor)
	if err != nil {
		log.Printf("Error creating class: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create class"})
		return
	}

	ctx.JSON(http.StatusCreated, class)
}

// GetClass handles the request to get a class by ID
func (c *ClassController) GetClass(ctx *gin.Context) {
	classID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	class, err := c.classService.GetClassByID(classID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}

	ctx.JSON(http.StatusOK, class)
}

// UpdateClass handles the request to update a class
func (c *ClassController) UpdateClass(ctx *gin.Context) {
	classID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	var req struct {
		ClassName   string `json:"className" binding:"required"`
		Description string `json:"description"`
		Subject     string `json:"subject"`
		ThemeColor  string `json:"themeColor"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Update the class
	err = c.classService.UpdateClass(classID, req.ClassName, req.Description, req.Subject, req.ThemeColor)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update class"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Class updated successfully"})
}

// DeleteClass handles the request to delete a class
func (c *ClassController) DeleteClass(ctx *gin.Context) {
	classID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	// Delete the class
	err = c.classService.DeleteClass(classID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete class"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Class deleted successfully"})
}

// GetTeacherClasses handles the request to get all classes for a teacher
func (c *ClassController) GetTeacherClasses(ctx *gin.Context) {
	teacherID, err := strconv.Atoi(ctx.Param("teacherId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid teacher ID"})
		return
	}

	classes, err := c.classService.GetTeacherClasses(teacherID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get teacher classes"})
		return
	}

	ctx.JSON(http.StatusOK, classes)
}

// AddTeacherToClass handles the request to add a teacher to a class
func (c *ClassController) AddTeacherToClass(ctx *gin.Context) {
	classID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	var req struct {
		TeacherID int  `json:"teacherId" binding:"required"`
		IsOwner   bool `json:"isOwner"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err = c.classService.AddTeacherToClass(req.TeacherID, classID, req.IsOwner)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add teacher to class"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Teacher added to class successfully"})
}

// RemoveTeacherFromClass handles the request to remove a teacher from a class
func (c *ClassController) RemoveTeacherFromClass(ctx *gin.Context) {
	classID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	teacherID, err := strconv.Atoi(ctx.Param("teacherId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid teacher ID"})
		return
	}

	err = c.classService.RemoveTeacherFromClass(teacherID, classID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove teacher from class"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Teacher removed from class successfully"})
}

// GetStudentClasses handles the request to get all classes for a student
func (c *ClassController) GetStudentClasses(ctx *gin.Context) {
	studentID, err := strconv.Atoi(ctx.Param("studentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	classes, err := c.classService.GetStudentClasses(studentID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get student classes"})
		return
	}

	ctx.JSON(http.StatusOK, classes)
}

// JoinClass handles the request for a student to join a class using a class code
func (c *ClassController) JoinClass(ctx *gin.Context) {
	var req struct {
		ClassCode string `json:"classCode" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Get student ID from authenticated user
	var userID interface{}
	var exists bool

	// Try both parameter names (userId and userID)
	userID, exists = ctx.Get("userId")
	if !exists {
		userID, exists = ctx.Get("userID")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}
	}

	studentID, ok := userID.(int)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify that the user is a student
	userRole, roleExists := ctx.Get("userRole")
	if roleExists {
		role, roleOk := userRole.(string)
		if roleOk && role != "student" && role != "teacher" && role != "admin" {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "Only students can join classes"})
			return
		}
	}

	// Enroll student in class
	class, err := c.classService.EnrollStudentInClass(studentID, req.ClassCode)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Successfully joined class",
		"class":   class,
	})
}

// RemoveStudentFromClass handles the request to remove a student from a class
func (c *ClassController) RemoveStudentFromClass(ctx *gin.Context) {
	classID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	studentID, err := strconv.Atoi(ctx.Param("studentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	err = c.classService.RemoveStudentFromClass(studentID, classID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove student from class"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Student removed from class successfully"})
}

// GetClassStudents handles the request to get all students in a class
func (c *ClassController) GetClassStudents(ctx *gin.Context) {
	classID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	students, err := c.classService.GetClassStudents(classID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get class students"})
		return
	}

	ctx.JSON(http.StatusOK, students)
}
