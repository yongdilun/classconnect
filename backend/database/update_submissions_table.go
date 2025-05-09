package database

import (
	"log"
)

// UpdateSubmissionsTable updates the submissions table to add missing columns
func UpdateSubmissionsTable() {
	// Check if database connection is established
	if DB == nil {
		log.Println("Database connection not established. Attempting to connect...")
		Connect()
	}

	log.Println("Updating submissions table schema...")

	// Check if content column exists, if not add it
	if err := DB.Exec(`
		IF NOT EXISTS (
			SELECT * FROM sys.columns 
			WHERE object_id = OBJECT_ID('submissions') AND name = 'content'
		)
		ALTER TABLE submissions ADD content NVARCHAR(MAX)
	`).Error; err != nil {
		log.Printf("Error adding content column to submissions table: %v", err)
	} else {
		log.Println("Content column added to submissions table or already exists")
	}

	// Check if file_url column exists, if not add it
	if err := DB.Exec(`
		IF NOT EXISTS (
			SELECT * FROM sys.columns 
			WHERE object_id = OBJECT_ID('submissions') AND name = 'file_url'
		)
		ALTER TABLE submissions ADD file_url NVARCHAR(MAX)
	`).Error; err != nil {
		log.Printf("Error adding file_url column to submissions table: %v", err)
	} else {
		log.Println("file_url column added to submissions table or already exists")
	}

	// Check if submission_date column exists, if not add it
	if err := DB.Exec(`
		IF NOT EXISTS (
			SELECT * FROM sys.columns 
			WHERE object_id = OBJECT_ID('submissions') AND name = 'submission_date'
		)
		ALTER TABLE submissions ADD submission_date DATETIMEOFFSET DEFAULT GETDATE()
	`).Error; err != nil {
		log.Printf("Error adding submission_date column to submissions table: %v", err)
	} else {
		log.Println("submission_date column added to submissions table or already exists")
	}

	// Check if is_late column exists, if not add it
	if err := DB.Exec(`
		IF NOT EXISTS (
			SELECT * FROM sys.columns 
			WHERE object_id = OBJECT_ID('submissions') AND name = 'is_late'
		)
		ALTER TABLE submissions ADD is_late BIT NOT NULL DEFAULT 0
	`).Error; err != nil {
		log.Printf("Error adding is_late column to submissions table: %v", err)
	} else {
		log.Println("is_late column added to submissions table or already exists")
	}

	// Check if graded_by column exists, if not add it
	if err := DB.Exec(`
		IF NOT EXISTS (
			SELECT * FROM sys.columns 
			WHERE object_id = OBJECT_ID('submissions') AND name = 'graded_by'
		)
		ALTER TABLE submissions ADD graded_by INT NULL
	`).Error; err != nil {
		log.Printf("Error adding graded_by column to submissions table: %v", err)
	} else {
		log.Println("graded_by column added to submissions table or already exists")
	}

	// Check if graded_date column exists, if not add it
	if err := DB.Exec(`
		IF NOT EXISTS (
			SELECT * FROM sys.columns 
			WHERE object_id = OBJECT_ID('submissions') AND name = 'graded_date'
		)
		ALTER TABLE submissions ADD graded_date DATETIMEOFFSET NULL
	`).Error; err != nil {
		log.Printf("Error adding graded_date column to submissions table: %v", err)
	} else {
		log.Println("graded_date column added to submissions table or already exists")
	}

	// Rename student_id column to user_id if it exists
	if err := DB.Exec(`
		IF EXISTS (
			SELECT * FROM sys.columns 
			WHERE object_id = OBJECT_ID('submissions') AND name = 'student_id'
		) AND NOT EXISTS (
			SELECT * FROM sys.columns 
			WHERE object_id = OBJECT_ID('submissions') AND name = 'user_id'
		)
		EXEC sp_rename 'submissions.student_id', 'user_id', 'COLUMN'
	`).Error; err != nil {
		log.Printf("Error renaming student_id column to user_id: %v", err)
	} else {
		log.Println("student_id column renamed to user_id or already correct")
	}

	log.Println("Submissions table update completed")
} 