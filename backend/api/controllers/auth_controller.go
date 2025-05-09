package controllers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/api/models"
	"github.com/yongdilun/classconnect-backend/api/services"
	"github.com/yongdilun/classconnect-backend/utils"
)

// AuthController handles authentication-related requests
type AuthController struct {
	serviceFactory services.ServiceFactory
}

// NewAuthController creates a new AuthController
func NewAuthController(serviceFactory services.ServiceFactory) *AuthController {
	return &AuthController{
		serviceFactory: serviceFactory,
	}
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role,omitempty"` // Optional role parameter
}

// RegisterRequest represents the unified registration request body
type RegisterRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=8"`
	FirstName  string `json:"firstName" binding:"required"`
	LastName   string `json:"lastName" binding:"required"`
	Role       string `json:"role" binding:"required,oneof=teacher student"`
	Department string `json:"department,omitempty"`
	GradeLevel string `json:"gradeLevel,omitempty"`
}

// ForgotPasswordRequest represents the forgot password request body
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest represents the reset password request body
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

// Register handles unified user registration (both teacher and student)
func (c *AuthController) Register() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Log registration request
		log.Println("Register request received")

		var req RegisterRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			log.Printf("Register request binding error: %v", err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			return
		}

		log.Printf("Register attempt for email: %s, role: %s", req.Email, req.Role)

		// Ensure password meets minimum requirements
		if len(req.Password) < 6 {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters long"})
			return
		}

		// Check if email already exists by trying to get user by email
		existingUser, err := c.serviceFactory.UserService().GetUserByEmail(req.Email)
		if err != nil {
			// If it's a "record not found" error, that's good - it means the email is available
			if err.Error() != "record not found" {
				log.Printf("Error checking if email exists: %v", err)
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Database error. Please try again later."})
				return
			}
		}

		if existingUser != nil {
			log.Printf("Email already exists: %s", req.Email)
			ctx.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}

		// Register the user based on role
		var user *models.User
		var registrationErr error

		if req.Role == "teacher" {
			// Register teacher
			user, _, registrationErr = c.serviceFactory.UserService().RegisterTeacher(
				req.Email,
				req.Password,
				req.FirstName,
				req.LastName,
				req.Department,
			)
		} else if req.Role == "student" {
			// Register student
			user, _, registrationErr = c.serviceFactory.UserService().RegisterStudent(
				req.Email,
				req.Password,
				req.FirstName,
				req.LastName,
				req.GradeLevel,
			)
		} else {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role specified"})
			return
		}

		if registrationErr != nil {
			log.Printf("Registration failed: %v", registrationErr)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
			return
		}

		if user == nil {
			log.Printf("Registration failed: user is nil")
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
			return
		}

		// Generate JWT token
		token, err := utils.GenerateToken(*user)
		if err != nil {
			log.Printf("Failed to generate token: %v", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// Create response
		response := gin.H{
			"message": req.Role + " registered successfully",
			"token":   token,
			"user": gin.H{
				"id":        user.UserID,
				"email":     user.Email,
				"firstName": req.FirstName,
				"lastName":  req.LastName,
				"role":      user.UserRole,
			},
		}

		log.Printf("Registration successful for: %s", req.Email)
		ctx.JSON(http.StatusCreated, response)
		return
	}
}

// Login handles user login
func (c *AuthController) Login() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Log login request
		log.Println("Login request received")

		var req LoginRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			log.Printf("Login request binding error: %v", err)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			return
		}

		log.Printf("Login attempt for email: %s", req.Email)

		// Log the request body for debugging
		log.Printf("Login request body: %+v", req)

		// Authenticate with the database
		log.Printf("Calling AuthService.Login for email: %s", req.Email)
		user, token, err := c.serviceFactory.AuthService().Login(req.Email, req.Password)
		if err != nil {
			log.Printf("Login failed for email %s: %v", req.Email, err)

			// Return a more specific error message
			errorMessage := "Invalid email or password"
			if err.Error() == "invalid email or password" {
				errorMessage = "The email or password you entered is incorrect. Please try again."
			} else if err.Error() == "user not found" {
				errorMessage = "No account found with this email address. Please check your email or sign up."
			} else if err.Error() == "invalid user account configuration" {
				errorMessage = "Your account is not properly configured. Please contact support."
			}

			ctx.JSON(http.StatusUnauthorized, gin.H{"error": errorMessage})
			return
		}

		// Validate that the user's role matches the requested role
		if user.UserRole != req.Role {
			log.Printf("Role mismatch for email %s: User is a %s but tried to log in as a %s",
				req.Email, user.UserRole, req.Role)
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": fmt.Sprintf("This account is registered as a %s. Please use the %s login page.",
					user.UserRole, user.UserRole),
			})
			return
		}

		log.Printf("Login successful, got token: %s...", token[:10])

		if user == nil {
			log.Printf("Login failed for email %s: user is nil", req.Email)
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication failed. Please try again."})
			return
		}

		// Get user details
		userID := user.UserID
		role := user.UserRole
		var firstName, lastName string

		// Get profile data based on role
		if role == "teacher" {
			teacherProfile, err := c.serviceFactory.UserService().GetTeacherProfileByUserID(userID)
			if err == nil {
				firstName = teacherProfile.FirstName
				lastName = teacherProfile.LastName
			} else {
				log.Printf("Failed to get teacher profile for user ID %d: %v", userID, err)
				firstName = "Unknown"
				lastName = "Teacher"
			}
		} else if role == "student" {
			studentProfile, err := c.serviceFactory.UserService().GetStudentProfileByUserID(userID)
			if err == nil {
				firstName = studentProfile.FirstName
				lastName = studentProfile.LastName
			} else {
				log.Printf("Failed to get student profile for user ID %d: %v", userID, err)
				firstName = "Unknown"
				lastName = "Student"
			}
		} else {
			firstName = "Unknown"
			lastName = "User"
		}

		log.Printf("User authenticated successfully: ID=%d, Email=%s, Role=%s", userID, user.Email, role)

		// Create response
		response := gin.H{
			"message": "Login successful",
			"token":   token,
			"user": gin.H{
				"id":        userID,
				"email":     user.Email,
				"firstName": firstName,
				"lastName":  lastName,
				"role":      role,
			},
		}

		log.Printf("Login successful for: %s", req.Email)
		ctx.JSON(http.StatusOK, response)
		return
	}
}

// ForgotPassword handles password reset requests
func (c *AuthController) ForgotPassword() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req ForgotPasswordRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate reset token
		token, err := c.serviceFactory.AuthService().RequestPasswordReset(req.Email)
		if err != nil {
			// Don't reveal if email exists or not for security reasons
			ctx.JSON(http.StatusOK, gin.H{"message": "If your email is registered, you will receive a password reset link"})
			return
		}

		// In a real application, you would send an email with the reset link
		// For development, we'll just return the token
		resetLink := "/reset-password?token=" + token

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Password reset link sent",
			"link":    resetLink,
			"token":   token, // Remove this in production
		})
	}
}

// ResetPassword handles password reset
func (c *AuthController) ResetPassword() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req ResetPasswordRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Verify reset token
		userID, err := c.serviceFactory.AuthService().VerifyResetToken(req.Token)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Reset password
		err = c.serviceFactory.AuthService().ResetPassword(userID, req.NewPassword)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset password"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "Password reset successful"})
	}
}

// RefreshToken handles token refresh requests
func (c *AuthController) RefreshToken() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Get the refresh token from the request
		var req struct {
			RefreshToken string `json:"refreshToken" binding:"required"`
		}

		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Verify the refresh token
		userID, role, err := c.serviceFactory.AuthService().VerifyToken(req.RefreshToken)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
			return
		}

		// Generate a new access token
		token, err := c.serviceFactory.AuthService().RefreshToken(userID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Token refreshed successfully",
			"token":   token,
			"user": gin.H{
				"id":   userID,
				"role": role,
			},
		})
	}
}

// VerifyEmail handles email verification
func (c *AuthController) VerifyEmail() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Get the verification token from the request
		var req struct {
			Token string `json:"token" binding:"required"`
		}

		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Verify the token
		userID, err := c.serviceFactory.AuthService().VerifyEmailToken(req.Token)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired verification token"})
			return
		}

		// Mark the user's email as verified
		err = c.serviceFactory.UserService().MarkEmailAsVerified(userID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify email"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
	}
}

// GetCurrentUser returns the current authenticated user
func (c *AuthController) GetCurrentUser() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userID, exists := ctx.Get("userId")
		if !exists {
			// Try with uppercase ID as fallback
			userID, exists = ctx.Get("userID")
			if !exists {
				ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
				return
			}
		}

		// Get user from database
		user, err := c.serviceFactory.UserService().GetUserByID(userID.(int))
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
			return
		}

		// Create base response
		response := gin.H{
			"id":    user.UserID,
			"email": user.Email,
			"role":  user.UserRole,
		}

		// Add role-specific data
		if user.UserRole == "teacher" {
			// Get teacher profile data
			teacherProfile, err := c.serviceFactory.UserService().GetTeacherProfileByUserID(user.UserID)
			if err == nil {
				response["firstName"] = teacherProfile.FirstName
				response["lastName"] = teacherProfile.LastName
				response["teacher"] = gin.H{
					"id":         teacherProfile.UserID,
					"profileId":  teacherProfile.ProfileID,
					"department": teacherProfile.Department,
				}
			}
		} else if user.UserRole == "student" {
			// Get student profile data
			studentProfile, err := c.serviceFactory.UserService().GetStudentProfileByUserID(user.UserID)
			if err == nil {
				response["firstName"] = studentProfile.FirstName
				response["lastName"] = studentProfile.LastName
				response["student"] = gin.H{
					"id":         studentProfile.UserID,
					"profileId":  studentProfile.ProfileID,
					"gradeLevel": studentProfile.GradeLevel,
				}
			}
		}

		ctx.JSON(http.StatusOK, response)
	}
}
