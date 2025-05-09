package controllers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/api/services"
)

// UserController handles user-related requests
type UserController struct {
	userService services.UserService
}

// NewUserController creates a new UserController
func NewUserController(userService services.UserService) *UserController {
	return &UserController{
		userService: userService,
	}
}

// GetUser handles GET /api/users/:id
func (c *UserController) GetUser(ctx *gin.Context) {
	// Parse user ID from URL
	userIDStr := ctx.Param("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user from database
	user, err := c.userService.GetUserByID(userID)
	if err != nil {
		log.Printf("Error getting user %d: %v", userID, err)
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get additional profile information based on user role
	var profileInfo gin.H
	if user.UserRole == "teacher" {
		teacherProfile, err := c.userService.GetTeacherProfileByUserID(userID)
		if err == nil && teacherProfile != nil {
			profileInfo = gin.H{
				"department": teacherProfile.Department,
				"hireDate":   teacherProfile.HireDate,
			}
		}
	} else if user.UserRole == "student" {
		studentProfile, err := c.userService.GetStudentProfileByUserID(userID)
		if err == nil && studentProfile != nil {
			profileInfo = gin.H{
				"gradeLevel":     studentProfile.GradeLevel,
				"enrollmentDate": studentProfile.EnrollmentDate,
			}
		}
	}

	// Create response
	response := gin.H{
		"userId":    user.UserID,
		"email":     user.Email,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"userRole":  user.UserRole,
		"isActive":  user.IsActive,
	}

	// Add profile info if available
	if profileInfo != nil {
		for k, v := range profileInfo {
			response[k] = v
		}
	}

	ctx.JSON(http.StatusOK, response)
}
