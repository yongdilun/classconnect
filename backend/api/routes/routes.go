package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/api/middlewares"
)

// SetupRoutes configures all the routes for the application
func SetupRoutes(router *gin.Engine) {
	// Public routes
	// Uncomment and use when adding auth controllers
	/*
		public := router.Group("/api")
		{
			// Auth routes will be added here
			// public.POST("/auth/login", controllers.Login)
			// public.POST("/auth/register", controllers.Register)
		}
	*/

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middlewares.AuthMiddleware())
	{
		// User routes
		// protected.GET("/users/me", controllers.GetCurrentUser)

		// Teacher-specific routes
		teachers := protected.Group("/")
		teachers.Use(middlewares.RoleMiddleware("teacher", "admin"))
		{
			// Teacher routes will be added here
		}

		// Student-specific routes
		students := protected.Group("/")
		students.Use(middlewares.RoleMiddleware("student", "teacher", "admin"))
		{
			// Student routes will be added here
		}

		// Admin-specific routes
		admins := protected.Group("/")
		admins.Use(middlewares.RoleMiddleware("admin"))
		{
			// Admin routes will be added here
		}
	}
}
