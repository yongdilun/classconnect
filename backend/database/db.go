package database

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"time"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect establishes a connection to the database
func Connect() {
	// Get database configuration from environment variables
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	// Set default values if environment variables are not set
	if host == "" {
		host = "localhost"
		log.Println("DB_HOST not set, using default: localhost")
	}
	if port == "" {
		port = "1433"
		log.Println("DB_PORT not set, using default: 1433")
	}
	if user == "" {
		user = "sa"
		log.Println("DB_USER not set, using default: sa")
	}
	if password == "" {
		log.Println("WARNING: DB_PASSWORD not set, using empty password")
	}
	if dbname == "" {
		dbname = "ClassConnect"
		log.Println("DB_NAME not set, using default: ClassConnect")
	}

	log.Printf("Connecting to database with host=%s, port=%s, user=%s, dbname=%s",
		host, port, user, dbname)

	// Build connection string
	var dsn string

	// Check if we're using Windows Authentication
	if os.Getenv("DB_INTEGRATED_SECURITY") == "true" {
		log.Println("Using Windows Authentication (integrated security)")
		dsn = fmt.Sprintf("sqlserver://%s:%s?database=%s&integrated+security=true&connection+timeout=30&TrustServerCertificate=true",
			host, port, dbname)
		log.Printf("DSN (without credentials): %s", dsn)
	} else {
		// Using SQL Server Authentication
		log.Println("Using SQL Server Authentication")

		// URL encode the password to handle special characters
		encodedPassword := url.QueryEscape(password)

		dsn = fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=%s&connection+timeout=30&TrustServerCertificate=true",
			user, encodedPassword, host, port, dbname)
		log.Printf("DSN (without password): sqlserver://%s:****@%s:%s?database=%s&connection+timeout=30&TrustServerCertificate=true",
			user, host, port, dbname)
	}

	log.Printf("Connection string (without credentials): sqlserver://[user]:[password]@%s:%s?database=%s",
		host, port, dbname)

	// Configure GORM logger
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			LogLevel: logger.Info,
			Colorful: true,
		},
	)

	// Attempt to connect with retries
	var err error
	maxRetries := 5
	retryDelay := 3 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("Attempting to open database connection (attempt %d of %d)...", i+1, maxRetries)

		// Open connection to database
		log.Printf("Opening database connection with DSN (credentials hidden)...")
		DB, err = gorm.Open(sqlserver.Open(dsn), &gorm.Config{
			Logger:                                   gormLogger,
			DisableForeignKeyConstraintWhenMigrating: false, // Ensure foreign keys are enforced
			DisableAutomaticPing:                     false, // Enable automatic ping
			SkipDefaultTransaction:                   true,  // Skip default transaction for better performance
		})

		if err == nil {
			// Test the connection
			sqlDB, err := DB.DB()
			if err == nil {
				// Ping the database
				err = sqlDB.Ping()
				if err == nil {
					log.Println("Connected to database successfully")

					// Configure connection pool
					sqlDB.SetMaxIdleConns(10)
					sqlDB.SetMaxOpenConns(100)
					sqlDB.SetConnMaxLifetime(time.Hour)

					log.Println("Database connection pool configured")

					// Disable GORM's auto-timestamp fields globally
					// This prevents GORM from trying to use created_at and updated_at columns
					// that don't exist in our database schema
					log.Println("Disabling GORM's auto-timestamp fields")
					DB.Callback().Create().Remove("gorm:update_time_stamp")
					DB.Callback().Update().Remove("gorm:update_time_stamp")

					return
				}
				log.Printf("Failed to ping database: %v", err)
			} else {
				log.Printf("Failed to get database connection: %v", err)
			}
		} else {
			log.Printf("Failed to connect to database: %v", err)
		}

		if i < maxRetries-1 {
			log.Printf("Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}

	// If we get here, all connection attempts failed
	log.Fatalf("Failed to connect to database after %d attempts", maxRetries)
}
