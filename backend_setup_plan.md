# ClassConnect Backend Setup Plan

This document outlines the initial setup process for the ClassConnect backend application using Go, Gin Framework, MSSQL, and other related technologies.

## Technology Stack

- **Go**: Programming language
- **Gin Framework**: Web framework
- **MSSQL**: Database
- **GORM**: ORM for database operations
- **JWT**: Authentication
- **bcrypt**: Password hashing
- **Gin middleware**: For CORS, logging, and authentication

## Setup Process

### 1. Project Initialization

```bash
# Create project directory
mkdir -p classconnect-backend
cd classconnect-backend

# Initialize Go module
go mod init github.com/yourusername/classconnect-backend

# Create basic directory structure
mkdir -p api/controllers api/middlewares api/models api/routes config database utils docs
```

### 2. Install Dependencies

```bash
# Install Gin framework
go get -u github.com/gin-gonic/gin

# Install GORM and MSSQL driver
go get -u gorm.io/gorm
go get -u gorm.io/driver/sqlserver

# Install JWT for authentication
go get -u github.com/golang-jwt/jwt/v5

# Install bcrypt for password hashing
go get -u golang.org/x/crypto/bcrypt

# Install other useful packages
go get -u github.com/joho/godotenv
go get -u github.com/gin-contrib/cors
go get -u github.com/gin-contrib/logger
```

### 3. Project Structure Setup

Create the following directory structure:

```
classconnect-backend/
├── api/
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Custom middleware functions
│   ├── models/          # Database models
│   └── routes/          # Route definitions
├── config/              # Configuration files
├── database/            # Database connection and migrations
├── utils/               # Utility functions
├── docs/                # API documentation
├── .env                 # Environment variables
├── .env.example         # Example environment variables
├── .gitignore           # Git ignore file
├── go.mod               # Go module file
├── go.sum               # Go module checksum
└── main.go              # Application entry point
```

### 4. Environment Configuration

Create a `.env` file in the project root:

```
# Server settings
PORT=8080
GIN_MODE=debug  # Use 'release' for production

# Database settings
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourStrongPassword
DB_NAME=ClassConnect

# JWT settings
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h  # 24 hours
```

Create a `.env.example` file as a template:

```
# Server settings
PORT=8080
GIN_MODE=debug

# Database settings
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourPassword
DB_NAME=ClassConnect

# JWT settings
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
```

Create a `.gitignore` file:

```
# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

# Environment variables
.env

# Test binary, built with `go test -c`
*.test

# Output of the go coverage tool
*.out

# Dependency directories
vendor/

# IDE specific files
.idea/
.vscode/
*.swp
*.swo

# OS specific files
.DS_Store
```

### 5. Database Configuration

Create a database connection file in `database/db.go`:

```go
package database

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect establishes a connection to the database
func Connect() {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=%s",
		user, password, host, port, dbname)

	// Configure GORM logger
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			LogLevel: logger.Info,
			Colorful: true,
		},
	)

	// Open connection to database
	var err error
	DB, err = gorm.Open(sqlserver.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Connected to database successfully")
}
```

### 6. Basic Models

Create a user model in `api/models/user.go`:

```go
package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents the users table
type User struct {
	UserID         int       `gorm:"column:user_id;primaryKey;autoIncrement" json:"userId"`
	Email          string    `gorm:"column:email;unique;not null" json:"email"`
	PasswordHash   string    `gorm:"column:password_hash;not null" json:"-"`
	FirstName      string    `gorm:"column:first_name;not null" json:"firstName"`
	LastName       string    `gorm:"column:last_name;not null" json:"lastName"`
	ProfilePicture *string   `gorm:"column:profile_picture" json:"profilePicture,omitempty"`
	DateRegistered time.Time `gorm:"column:date_registered;not null;default:CURRENT_TIMESTAMP" json:"dateRegistered"`
	LastLogin      *time.Time `gorm:"column:last_login" json:"lastLogin,omitempty"`
	UserRole       string    `gorm:"column:user_role;not null" json:"userRole"`
	IsActive       bool      `gorm:"column:is_active;not null;default:1" json:"isActive"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"-"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"-"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}
```

### 7. Authentication Utilities

Create JWT utilities in `utils/jwt.go`:

```go
package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/classconnect-backend/api/models"
)

// GenerateToken creates a new JWT token for a user
func GenerateToken(user models.User) (string, error) {
	// Get JWT expiration time from environment
	expirationStr := os.Getenv("JWT_EXPIRATION")
	if expirationStr == "" {
		expirationStr = "24h" // Default to 24 hours
	}
	
	expiration, err := time.ParseDuration(expirationStr)
	if err != nil {
		return "", err
	}

	// Create claims with user information
	claims := jwt.MapClaims{
		"userId": user.UserID,
		"email":  user.Email,
		"role":   user.UserRole,
		"exp":    time.Now().Add(expiration).Unix(),
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken validates the JWT token
func ValidateToken(tokenString string) (*jwt.Token, error) {
	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		return nil, err
	}

	return token, nil
}

// ExtractUserID extracts the user ID from the token
func ExtractUserID(token *jwt.Token) (int, error) {
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, errors.New("invalid token claims")
	}

	// Extract user ID from claims
	userID, ok := claims["userId"].(float64)
	if !ok {
		return 0, errors.New("invalid user ID in token")
	}

	return int(userID), nil
}
```

### 8. Password Utilities

Create password utilities in `utils/password.go`:

```go
package utils

import (
	"golang.org/x/crypto/bcrypt"
)

// HashPassword creates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compares a password with a hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```

### 9. Authentication Middleware

Create authentication middleware in `api/middlewares/auth.go`:

```go
package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/classconnect-backend/utils"
)

// AuthMiddleware verifies the JWT token in the request
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Check if the header has the Bearer prefix
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		// Validate the token
		token, err := utils.ValidateToken(parts[1])
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Extract user ID from token
		userID, err := utils.ExtractUserID(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Set user ID in context
		c.Set("userID", userID)
		c.Next()
	}
}

// RoleMiddleware checks if the user has the required role
func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the token from context (set by AuthMiddleware)
		tokenInterface, exists := c.Get("token")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token not found in context"})
			c.Abort()
			return
		}

		token, ok := tokenInterface.(*jwt.Token)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse token"})
			c.Abort()
			return
		}

		// Extract role from token claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse token claims"})
			c.Abort()
			return
		}

		userRole, ok := claims["role"].(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Role not found in token"})
			c.Abort()
			return
		}

		// Check if user role is in the allowed roles
		roleAllowed := false
		for _, role := range roles {
			if userRole == role {
				roleAllowed = true
				break
			}
		}

		if !roleAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}
```

### 10. Basic Routes Setup

Create route setup in `api/routes/routes.go`:

```go
package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/classconnect-backend/api/middlewares"
)

// SetupRoutes configures all the routes for the application
func SetupRoutes(router *gin.Engine) {
	// Public routes
	public := router.Group("/api")
	{
		// Auth routes will be added here
		// public.POST("/auth/login", controllers.Login)
		// public.POST("/auth/register", controllers.Register)
	}

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
```

### 11. Main Application Entry Point

Create the main application file in `main.go`:

```go
package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/yourusername/classconnect-backend/api/routes"
	"github.com/yourusername/classconnect-backend/database"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Set Gin mode
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	database.Connect()

	// Create Gin router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Setup routes
	routes.SetupRoutes(router)

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
```

### 12. Configuration Utilities

Create a configuration file in `config/config.go`:

```go
package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port    string
	GinMode string
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

// JWTConfig holds JWT-related configuration
type JWTConfig struct {
	Secret     string
	Expiration time.Duration
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	// Parse JWT expiration
	jwtExpirationStr := getEnv("JWT_EXPIRATION", "24h")
	jwtExpiration, err := time.ParseDuration(jwtExpirationStr)
	if err != nil {
		jwtExpiration = 24 * time.Hour // Default to 24 hours
	}

	return &Config{
		Server: ServerConfig{
			Port:    getEnv("PORT", "8080"),
			GinMode: getEnv("GIN_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "1433"),
			User:     getEnv("DB_USER", "sa"),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", "ClassConnect"),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "your_jwt_secret_key"),
			Expiration: jwtExpiration,
		},
	}
}

// Helper function to get environment variable with a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Helper function to get environment variable as integer
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

// Helper function to get environment variable as boolean
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}
```

### 13. Database Migrations

Create a migration utility in `database/migrations.go`:

```go
package database

import (
	"log"

	"github.com/yourusername/classconnect-backend/api/models"
)

// Migrate runs database migrations
func Migrate() {
	// Add all models to be migrated here
	err := DB.AutoMigrate(
		&models.User{},
		// Add other models as they are created
	)

	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database migration completed successfully")
}
```

Update the `main.go` file to include migrations:

```go
// After database.Connect()
database.Migrate()
```

## Development Workflow

1. **Start the Server**:
   ```bash
   go run main.go
   ```

2. **Build the Application**:
   ```bash
   go build -o classconnect-server
   ```

3. **Run the Built Application**:
   ```bash
   ./classconnect-server
   ```

## Next Steps

1. Implement authentication controllers (login, register, etc.)
2. Implement user controllers (profile management, etc.)
3. Implement class controllers (create, join, list, etc.)
4. Implement assignment controllers (create, submit, grade, etc.)
5. Add validation for request data
6. Implement error handling middleware
7. Add logging middleware
8. Write unit and integration tests
9. Set up CI/CD pipeline

## Resources

- [Go Documentation](https://golang.org/doc/)
- [Gin Framework Documentation](https://gin-gonic.com/docs/)
- [GORM Documentation](https://gorm.io/docs/)
- [JWT Go Documentation](https://github.com/golang-jwt/jwt)
- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/sql-server/)
