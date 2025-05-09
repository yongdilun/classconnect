package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/yongdilun/classconnect-backend/api/routes"
	"github.com/yongdilun/classconnect-backend/api/services"
	"github.com/yongdilun/classconnect-backend/database"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	} else {
		log.Println("Environment variables loaded from .env file")
	}

	// Log environment variables (without sensitive data)
	log.Printf("DB_HOST: %s", os.Getenv("DB_HOST"))
	log.Printf("DB_PORT: %s", os.Getenv("DB_PORT"))
	log.Printf("DB_USER: %s", os.Getenv("DB_USER"))
	log.Printf("DB_NAME: %s", os.Getenv("DB_NAME"))
	log.Printf("DB_INTEGRATED_SECURITY: %s", os.Getenv("DB_INTEGRATED_SECURITY"))
	log.Printf("PORT: %s", os.Getenv("PORT"))
	log.Printf("GIN_MODE: %s", os.Getenv("GIN_MODE"))

	// Set Gin mode
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "release" {
		gin.SetMode(gin.ReleaseMode)
		log.Println("Gin running in release mode")
	} else {
		log.Println("Gin running in debug mode")
	}

	// Connect to database with retry mechanism
	log.Println("Connecting to database...")

	// Try to connect to the database
	maxRetries := 3
	connected := false

	for i := 0; i < maxRetries && !connected; i++ {
		if i > 0 {
			log.Printf("Retrying database connection (attempt %d of %d)...", i+1, maxRetries)
			time.Sleep(5 * time.Second)
		}

		// Connect to database
		database.Connect()

		// Verify connection
		if database.DB != nil {
			sqlDB, err := database.DB.DB()
			if err == nil {
				if err := sqlDB.Ping(); err == nil {
					connected = true
					log.Println("Database connection successful")
				} else {
					log.Printf("Database ping failed: %v", err)
				}
			} else {
				log.Printf("Failed to get database connection: %v", err)
			}
		}
	}

	if !connected {
		log.Fatalf("Failed to connect to database after %d attempts", maxRetries)
	}

	// Run database migrations
	log.Println("Running database migrations...")
	database.Migrate()

	// Add any missing columns
	log.Println("Checking for missing columns...")
	database.AddMissingColumns()

	// Create Gin router
	router := gin.Default()

	// Add recovery middleware to handle panics
	router.Use(gin.Recovery())

	// Add a simple logger middleware
	router.Use(func(c *gin.Context) {
		// Start timer
		t := time.Now()

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(t)

		// Log request details
		log.Printf("[GIN] %s | %d | %s | %s | %s",
			c.Request.Method,
			c.Writer.Status(),
			latency,
			c.ClientIP(),
			c.Request.URL.Path,
		)
	})

	// Configure CORS with a more permissive configuration for development
	// First, handle OPTIONS requests directly to avoid double-handling
	router.Use(func(c *gin.Context) {
		// Set CORS headers for all requests
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400") // 24 hours

		// Log all requests for debugging
		log.Printf("Request: %s %s from %s", c.Request.Method, c.Request.URL.Path, c.ClientIP())
		log.Printf("Request headers: %v", c.Request.Header)

		// Handle preflight OPTIONS requests specially
		if c.Request.Method == "OPTIONS" {
			log.Printf("Handling OPTIONS request for path: %s", c.Request.URL.Path)
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Add standard CORS middleware as a fallback
	router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 hours
	}))

	// Add a direct health check endpoint
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
			"time":    time.Now().Format(time.RFC3339),
			"status":  "ok",
		})
	})

	// Add a database health check endpoint
	router.GET("/health", func(c *gin.Context) {
		// Check database connection
		dbStatus := "ok"
		dbError := ""

		if database.DB != nil {
			sqlDB, err := database.DB.DB()
			if err != nil {
				dbStatus = "error"
				dbError = "Failed to get database connection: " + err.Error()
			} else {
				// Ping the database
				if err := sqlDB.Ping(); err != nil {
					dbStatus = "error"
					dbError = "Failed to ping database: " + err.Error()
				}
			}
		} else {
			dbStatus = "error"
			dbError = "Database connection not established"
		}

		c.JSON(200, gin.H{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
			"database": gin.H{
				"status": dbStatus,
				"error":  dbError,
			},
		})
	})

	// Initialize service factory
	serviceFactory := services.NewServiceFactory(database.DB)

	// Setup routes with service factory
	routes.SetupRoutes(router, serviceFactory)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port
	}

	// Start server
	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
