package database

import (
	"fmt"
	"log"
	"net/url"
	"os"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

// CreateDatabaseIfNotExists creates the database if it doesn't exist
func CreateDatabaseIfNotExists() {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	integratedSecurity := os.Getenv("DB_INTEGRATED_SECURITY")

	// Connect to master database to check if our database exists
	var dsn string
	if integratedSecurity == "true" {
		// Windows Authentication
		log.Println("Using Windows Authentication (integrated security) for database creation")
		dsn = fmt.Sprintf("sqlserver://%s:%s?database=master&integrated+security=true&connection+timeout=30",
			host, port)
	} else {
		// SQL Server Authentication
		log.Println("Using SQL Server Authentication for database creation")

		// URL encode the password to handle special characters
		encodedPassword := url.QueryEscape(password)

		dsn = fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=master&connection+timeout=30",
			user, encodedPassword, host, port)
	}

	log.Printf("Master database connection string (without credentials): sqlserver://[user]:[password]@%s:%s?database=master",
		host, port)

	// Connect to master database
	log.Println("Connecting to master database...")
	masterDB, err := gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("Warning: Failed to connect to master database: %v", err)
		log.Println("This is normal if the database doesn't exist yet or if you don't have permissions to create databases.")
		log.Println("The application will try to connect to the specified database directly.")
		return
	}

	// Test the connection
	sqlDB, err := masterDB.DB()
	if err != nil {
		log.Printf("Warning: Failed to get master database connection: %v", err)
		return
	}

	// Ping the database
	if err := sqlDB.Ping(); err != nil {
		log.Printf("Warning: Failed to ping master database: %v", err)
		return
	}

	log.Println("Connected to master database successfully")

	// Check if our database exists
	var dbExists int64
	masterDB.Raw(fmt.Sprintf("SELECT COUNT(*) FROM sys.databases WHERE name = '%s'", dbname)).Count(&dbExists)

	// Create database if it doesn't exist
	if dbExists == 0 {
		log.Printf("Creating database %s...", dbname)
		err = masterDB.Exec(fmt.Sprintf("CREATE DATABASE %s", dbname)).Error
		if err != nil {
			log.Printf("Warning: Failed to create database: %v", err)
			return
		}
		log.Printf("Database %s created successfully", dbname)
	} else {
		log.Printf("Database %s already exists", dbname)
	}
}

// Migrate runs database migrations
func Migrate() {
	// First, try to create the database if it doesn't exist
	CreateDatabaseIfNotExists()

	// Check if database connection is established
	if DB == nil {
		log.Println("Database connection not established. Attempting to connect...")
		Connect()
	}

	// Verify connection is working
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get database connection: %v", err)
	}

	// Ping the database
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("Failed to ping database before migrations: %v", err)
	}

	log.Println("Database connection verified, proceeding with migrations...")

	// Log migration start
	log.Println("Starting database migration - creating tables if they don't exist...")

	// Create tables without foreign key constraints first
	log.Println("Creating tables without foreign key constraints...")

	// Create users table for authentication only
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
		CREATE TABLE users (
			user_id INT IDENTITY(1,1) PRIMARY KEY,
			email NVARCHAR(255) NOT NULL UNIQUE,
			password_hash NVARCHAR(MAX) NOT NULL,
			user_role NVARCHAR(50) NOT NULL,
			is_active BIT NOT NULL DEFAULT 1,
			last_login DATETIMEOFFSET,
			created_at DATETIMEOFFSET DEFAULT GETDATE(),
			updated_at DATETIMEOFFSET DEFAULT GETDATE()
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}

	// Create teacher_profiles table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'teacher_profiles')
		CREATE TABLE teacher_profiles (
			profile_id INT IDENTITY(1,1) PRIMARY KEY,
			user_id INT NOT NULL UNIQUE,
			first_name NVARCHAR(255) NOT NULL,
			last_name NVARCHAR(255) NOT NULL,
			department NVARCHAR(255),
			hire_date DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
			bio NVARCHAR(MAX),
			profile_picture NVARCHAR(MAX),
			created_at DATETIMEOFFSET DEFAULT GETDATE(),
			updated_at DATETIMEOFFSET DEFAULT GETDATE(),
			CONSTRAINT fk_teacher_profiles_users FOREIGN KEY (user_id) REFERENCES users(user_id)
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create teacher_profiles table: %v", err)
	}

	// Create student_profiles table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'student_profiles')
		CREATE TABLE student_profiles (
			profile_id INT IDENTITY(1,1) PRIMARY KEY,
			user_id INT NOT NULL UNIQUE,
			first_name NVARCHAR(255) NOT NULL,
			last_name NVARCHAR(255) NOT NULL,
			grade_level NVARCHAR(50),
			enrollment_date DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
			profile_picture NVARCHAR(MAX),
			created_at DATETIMEOFFSET DEFAULT GETDATE(),
			updated_at DATETIMEOFFSET DEFAULT GETDATE(),
			CONSTRAINT fk_student_profiles_users FOREIGN KEY (user_id) REFERENCES users(user_id)
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create student_profiles table: %v", err)
	}

	// Create classes table if it doesn't exist
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'classes')
		CREATE TABLE classes (
			class_id INT IDENTITY(1,1) PRIMARY KEY,
			class_name NVARCHAR(255) NOT NULL,
			class_code NVARCHAR(50) NOT NULL UNIQUE,
			description NVARCHAR(MAX),
			subject NVARCHAR(255),
			created_date DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
			is_archived BIT NOT NULL DEFAULT 0,
			theme_color NVARCHAR(50),
			creator_id INT NOT NULL,
			CONSTRAINT fk_classes_users FOREIGN KEY (creator_id) REFERENCES users(user_id)
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create classes table: %v", err)
	}

	// Create class_teachers table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'class_teachers')
		CREATE TABLE class_teachers (
			class_teacher_id INT IDENTITY(1,1) PRIMARY KEY,
			user_id INT NOT NULL,
			class_id INT NOT NULL,
			is_owner BIT NOT NULL DEFAULT 0,
			added_date DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
			CONSTRAINT fk_class_teachers_users FOREIGN KEY (user_id) REFERENCES users(user_id),
			CONSTRAINT fk_class_teachers_classes FOREIGN KEY (class_id) REFERENCES classes(class_id)
		)
	`).Error; err != nil {
		log.Printf("Warning: Failed to create class_teachers table: %v", err)
		// Don't fatally exit, just log the warning
	}

	// Create class_enrollments table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'class_enrollments')
		CREATE TABLE class_enrollments (
			enrollment_id INT IDENTITY(1,1) PRIMARY KEY,
			user_id INT NOT NULL,
			class_id INT NOT NULL,
			enrollment_date DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
			is_active BIT NOT NULL DEFAULT 1,
			CONSTRAINT fk_class_enrollments_users FOREIGN KEY (user_id) REFERENCES users(user_id),
			CONSTRAINT fk_class_enrollments_classes FOREIGN KEY (class_id) REFERENCES classes(class_id)
		)
	`).Error; err != nil {
		log.Printf("Warning: Failed to create class_enrollments table: %v", err)
		// Don't fatally exit, just log the warning
	}

	// Create password_resets table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_resets')
		CREATE TABLE password_resets (
			reset_id INT IDENTITY(1,1) PRIMARY KEY,
			user_id INT NOT NULL,
			token NVARCHAR(255) NOT NULL UNIQUE,
			expires_at DATETIMEOFFSET NOT NULL,
			created_at DATETIMEOFFSET DEFAULT GETDATE(),
			CONSTRAINT fk_password_resets_users FOREIGN KEY (user_id) REFERENCES users(user_id)
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create password_resets table: %v", err)
	}

	// Create chat_messages table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_messages')
		CREATE TABLE chat_messages (
			message_id INT IDENTITY(1,1) PRIMARY KEY,
			class_id INT NOT NULL,
			user_id INT NOT NULL,
			content NVARCHAR(MAX) NOT NULL,
			timestamp DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
			is_deleted BIT NOT NULL DEFAULT 0,
			created_at DATETIMEOFFSET DEFAULT GETDATE(),
			updated_at DATETIMEOFFSET DEFAULT GETDATE(),
			CONSTRAINT fk_chat_messages_classes FOREIGN KEY (class_id) REFERENCES classes(class_id),
			CONSTRAINT fk_chat_messages_users FOREIGN KEY (user_id) REFERENCES users(user_id)
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create chat_messages table: %v", err)
	}

	// Create announcements table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'announcements')
		CREATE TABLE announcements (
			announcement_id INT IDENTITY(1,1) PRIMARY KEY,
			class_id INT NOT NULL,
			title NVARCHAR(255),
			content NVARCHAR(MAX) NOT NULL,
			user_id INT NOT NULL,
			created_at DATETIMEOFFSET DEFAULT GETDATE(),
			updated_at DATETIMEOFFSET DEFAULT GETDATE(),
			scheduled_date DATETIMEOFFSET NULL,
			is_published BIT NOT NULL DEFAULT 1,
			is_deleted BIT NOT NULL DEFAULT 0,
			CONSTRAINT fk_announcements_classes FOREIGN KEY (class_id) REFERENCES classes(class_id),
			CONSTRAINT fk_announcements_users FOREIGN KEY (user_id) REFERENCES users(user_id)
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create announcements table: %v", err)
	}

	// Create assignments table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'assignments')
		CREATE TABLE assignments (
			assignment_id INT IDENTITY(1,1) PRIMARY KEY,
			class_id INT NOT NULL,
			title NVARCHAR(255) NOT NULL,
			description NVARCHAR(MAX),
			due_date DATETIMEOFFSET,
			points_possible INT NOT NULL DEFAULT 100,
			is_published BIT NOT NULL DEFAULT 0,
			created_at DATETIMEOFFSET DEFAULT GETDATE(),
			updated_at DATETIMEOFFSET DEFAULT GETDATE(),
			CONSTRAINT fk_assignments_classes FOREIGN KEY (class_id) REFERENCES classes(class_id)
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create assignments table: %v", err)
	}

	// Create submissions table
	if err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'submissions')
		CREATE TABLE submissions (
			submission_id INT IDENTITY(1,1) PRIMARY KEY,
			assignment_id INT NOT NULL,
			student_id INT NOT NULL,
			content NVARCHAR(MAX),
			submitted_at DATETIMEOFFSET DEFAULT GETDATE(),
			grade INT,
			feedback NVARCHAR(MAX),
			status NVARCHAR(50) NOT NULL DEFAULT 'submitted',
			created_at DATETIMEOFFSET DEFAULT GETDATE(),
			updated_at DATETIMEOFFSET DEFAULT GETDATE(),
			CONSTRAINT fk_submissions_assignments FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id),
			CONSTRAINT fk_submissions_users FOREIGN KEY (student_id) REFERENCES users(user_id)
		)
	`).Error; err != nil {
		log.Fatalf("Failed to create submissions table: %v", err)
	}

	// All foreign key constraints are now added directly in the table creation
	log.Println("All foreign key constraints added during table creation")

	// No test users will be created automatically

	log.Println("Database migration completed successfully")
}
