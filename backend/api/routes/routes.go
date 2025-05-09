package routes

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/api/controllers"
	"github.com/yongdilun/classconnect-backend/api/middlewares"
	"github.com/yongdilun/classconnect-backend/api/services"
)

// SetupRoutes configures all the routes for the application
func SetupRoutes(router *gin.Engine, serviceFactory services.ServiceFactory) {
	// Create controllers
	authController := controllers.NewAuthController(serviceFactory)
	classController := controllers.NewClassController(serviceFactory.ClassService())
	chatController := controllers.NewChatController(serviceFactory.ChatService())
	assignmentController := controllers.NewAssignmentController(serviceFactory.AssignmentService())
	announcementController := controllers.NewAnnouncementController(serviceFactory.AnnouncementService())
	userController := controllers.NewUserController(serviceFactory.UserService())

	// Add a simple test endpoint that always returns success
	router.GET("/api/test-simple", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "success",
			"message": "API is working correctly",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// Public routes
	public := router.Group("/api")
	{
		// Add a test endpoint
		public.GET("/test", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message":   "API is working",
				"timestamp": time.Now().String(),
			})
		})

		// Auth routes
		auth := public.Group("/auth")
		{
			// User registration and login
			auth.POST("/register", authController.Register())
			auth.POST("/login", authController.Login())

			// Token management
			auth.POST("/refresh-token", authController.RefreshToken())
			auth.POST("/verify-email", authController.VerifyEmail())

			// Password reset routes
			auth.POST("/forgot-password", authController.ForgotPassword())
			auth.POST("/reset-password", authController.ResetPassword())
		}
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middlewares.AuthMiddleware())
	{
		// User routes
		protected.GET("/users/me", authController.GetCurrentUser())
		protected.GET("/users/:id", userController.GetUser)

		// Teacher-specific routes
		teachers := protected.Group("/")
		teachers.Use(middlewares.RoleMiddleware("teacher", "admin"))
		{
			// Class management for teachers
			teachers.POST("/classes", classController.CreateClass)
			teachers.GET("/classes/teacher/:teacherId", classController.GetTeacherClasses)
			teachers.PUT("/classes/:id", classController.UpdateClass)
			teachers.DELETE("/classes/:id", classController.DeleteClass)
			teachers.POST("/classes/:id/teachers", classController.AddTeacherToClass)
			teachers.DELETE("/classes/:id/teachers/:teacherId", classController.RemoveTeacherFromClass)
			teachers.GET("/classes/:id/students", classController.GetClassStudents)
			teachers.DELETE("/classes/:id/students/:studentId", classController.RemoveStudentFromClass)
		}

		// Student-specific routes
		students := protected.Group("/")
		students.Use(middlewares.RoleMiddleware("student", "teacher", "admin"))
		{
			// Class management for students
			students.GET("/classes/student/:studentId", classController.GetStudentClasses)
			students.POST("/classes/join", classController.JoinClass)
			students.GET("/classes/:id", classController.GetClass)
		}

		// Class chat routes (accessible to both teachers and students)
		chats := protected.Group("/")
		chats.Use(middlewares.RoleMiddleware("student", "teacher", "admin"))
		{
			chats.GET("/classes/:id/chat", chatController.GetChatMessages)
			chats.POST("/classes/:id/chat", chatController.SendChatMessage)
			chats.DELETE("/classes/:id/chat/:messageId", chatController.DeleteChatMessage)
		}

		// Announcement routes (accessible to both teachers and students)
		announcements := protected.Group("/")
		announcements.Use(middlewares.RoleMiddleware("student", "teacher", "admin"))
		{
			// Get all announcements for a class
			announcements.GET("/classes/:id/announcements", announcementController.GetAnnouncements)
			// Get a specific announcement
			announcements.GET("/classes/:id/announcements/:announcementId", announcementController.GetAnnouncement)
			// Create a new announcement (teacher only)
			announcements.POST("/classes/:id/announcements", middlewares.RoleMiddleware("teacher", "admin"), announcementController.CreateAnnouncement)
			// Update an announcement (teacher only)
			announcements.PUT("/classes/:id/announcements/:announcementId", middlewares.RoleMiddleware("teacher", "admin"), announcementController.UpdateAnnouncement)
			// Delete an announcement (teacher only)
			announcements.DELETE("/classes/:id/announcements/:announcementId", middlewares.RoleMiddleware("teacher", "admin"), announcementController.DeleteAnnouncement)
		}

		// Assignment routes (accessible to both teachers and students)
		assignments := protected.Group("/")
		assignments.Use(middlewares.RoleMiddleware("student", "teacher", "admin"))
		{
			// Get all assignments for a class
			assignments.GET("/classes/:id/assignments", assignmentController.GetAssignments)
			// Get a specific assignment
			assignments.GET("/classes/:id/assignments/:assignmentId", assignmentController.GetAssignment)
			// Create a new assignment (teacher only)
			assignments.POST("/classes/:id/assignments", middlewares.RoleMiddleware("teacher", "admin"), assignmentController.CreateAssignment)
			// Update an assignment (teacher only)
			assignments.PUT("/classes/:id/assignments/:assignmentId", middlewares.RoleMiddleware("teacher", "admin"), assignmentController.UpdateAssignment)
			// Submit an assignment (student only)
			assignments.POST("/classes/:id/assignments/:assignmentId/submit", middlewares.RoleMiddleware("student"), assignmentController.SubmitAssignment)
			// Get a submission
			assignments.GET("/classes/:id/assignments/:assignmentId/submissions/:studentId", assignmentController.GetSubmission)
			// Get all submissions for an assignment (teacher only)
			assignments.GET("/classes/:id/assignments/:assignmentId/submissions", middlewares.RoleMiddleware("teacher", "admin"), assignmentController.GetAssignmentSubmissions)
			// Grade a submission (teacher only)
			assignments.PUT("/classes/:id/assignments/:assignmentId/submissions/:studentId", middlewares.RoleMiddleware("teacher", "admin"), assignmentController.GradeSubmission)
		}

		// Admin-specific routes
		admins := protected.Group("/")
		admins.Use(middlewares.RoleMiddleware("admin"))
		{
			// Admin routes will be added here
		}
	}
}
