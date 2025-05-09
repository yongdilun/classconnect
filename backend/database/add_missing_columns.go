package database

import (
	"log"
)

// AddMissingColumns adds any missing columns to existing tables
func AddMissingColumns() {
	// Check if database connection is established
	if DB == nil {
		log.Println("Database connection not established. Attempting to connect...")
		Connect()
	}

	log.Println("Checking for missing columns and adding them if needed...")

	// First, let's check what columns exist in the assignments table
	var columns []struct {
		ColumnName string `gorm:"column:COLUMN_NAME"`
	}

	if err := DB.Raw(`
		SELECT COLUMN_NAME
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_NAME = 'assignments'
	`).Scan(&columns).Error; err != nil {
		log.Printf("Warning: Failed to get columns for assignments table: %v", err)
	} else {
		log.Println("Existing columns in assignments table:")
		for _, col := range columns {
			log.Printf("- %s", col.ColumnName)
		}

		// Check for missing columns in assignments table
		var hasCreatedAt, hasAllowLateSubmit, hasCreatedBy bool
		for _, col := range columns {
			if col.ColumnName == "created_at" {
				hasCreatedAt = true
			}
			if col.ColumnName == "allow_late_submissions" {
				hasAllowLateSubmit = true
			}
			if col.ColumnName == "created_by" {
				hasCreatedBy = true
			}
		}

		// Add created_at column if it doesn't exist
		if !hasCreatedAt {
			if err := DB.Exec(`
				ALTER TABLE assignments ADD created_at DATETIMEOFFSET DEFAULT GETDATE()
				PRINT 'Added created_at column to assignments table'
			`).Error; err != nil {
				log.Printf("Warning: Failed to add created_at column to assignments table: %v", err)
			} else {
				log.Println("Added created_at column to assignments table")
			}
		}

		// Add allow_late_submissions column if it doesn't exist
		if !hasAllowLateSubmit {
			if err := DB.Exec(`
				ALTER TABLE assignments ADD allow_late_submissions BIT DEFAULT 1
				PRINT 'Added allow_late_submissions column to assignments table'
			`).Error; err != nil {
				log.Printf("Warning: Failed to add allow_late_submissions column to assignments table: %v", err)
			} else {
				log.Println("Added allow_late_submissions column to assignments table")
			}
		}

		// Add created_by column if it doesn't exist
		if !hasCreatedBy {
			if err := DB.Exec(`
				ALTER TABLE assignments ADD created_by INT DEFAULT 1
				PRINT 'Added created_by column to assignments table'
			`).Error; err != nil {
				log.Printf("Warning: Failed to add created_by column to assignments table: %v", err)
			} else {
				log.Println("Added created_by column to assignments table")
			}
		}
	}

	// First, let's check what columns exist in the submissions table
	if err := DB.Raw(`
		SELECT COLUMN_NAME
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_NAME = 'submissions'
	`).Scan(&columns).Error; err != nil {
		log.Printf("Warning: Failed to get columns for submissions table: %v", err)
	} else {
		log.Println("Existing columns in submissions table:")
		for _, col := range columns {
			log.Printf("- %s", col.ColumnName)
		}

		// Check if file_url column exists in submissions table
		var hasFileURL bool
		for _, col := range columns {
			if col.ColumnName == "file_url" {
				hasFileURL = true
				break
			}
		}

		// Add file_url column if it doesn't exist
		if !hasFileURL {
			if err := DB.Exec(`
				ALTER TABLE submissions ADD file_url NVARCHAR(MAX)
				PRINT 'Added file_url column to submissions table'
			`).Error; err != nil {
				log.Printf("Warning: Failed to add file_url column to submissions table: %v", err)
			} else {
				log.Println("Added file_url column to submissions table")
			}
		}
	}

	// Check what columns exist in the announcements table
	if err := DB.Raw(`
		SELECT COLUMN_NAME
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_NAME = 'announcements'
	`).Scan(&columns).Error; err != nil {
		log.Printf("Warning: Failed to get columns for announcements table: %v", err)
	} else {
		log.Println("Existing columns in announcements table:")
		for _, col := range columns {
			log.Printf("- %s", col.ColumnName)
		}

		// Check for missing columns in announcements table
		var hasTitle, hasScheduledDate, hasIsPublished bool
		for _, col := range columns {
			if col.ColumnName == "title" {
				hasTitle = true
			}
			if col.ColumnName == "scheduled_date" {
				hasScheduledDate = true
			}
			if col.ColumnName == "is_published" {
				hasIsPublished = true
			}
		}

		// Add title column if it doesn't exist
		if !hasTitle {
			if err := DB.Exec(`
				ALTER TABLE announcements ADD title NVARCHAR(255)
				PRINT 'Added title column to announcements table'
			`).Error; err != nil {
				log.Printf("Warning: Failed to add title column to announcements table: %v", err)
			} else {
				log.Println("Added title column to announcements table")
			}
		}

		// Add scheduled_date column if it doesn't exist
		if !hasScheduledDate {
			if err := DB.Exec(`
				ALTER TABLE announcements ADD scheduled_date DATETIMEOFFSET NULL
				PRINT 'Added scheduled_date column to announcements table'
			`).Error; err != nil {
				log.Printf("Warning: Failed to add scheduled_date column to announcements table: %v", err)
			} else {
				log.Println("Added scheduled_date column to announcements table")
			}
		}

		// Add is_published column if it doesn't exist
		if !hasIsPublished {
			if err := DB.Exec(`
				ALTER TABLE announcements ADD is_published BIT DEFAULT 1
				PRINT 'Added is_published column to announcements table'
			`).Error; err != nil {
				log.Printf("Warning: Failed to add is_published column to announcements table: %v", err)
			} else {
				log.Println("Added is_published column to announcements table")
			}
		}
	}

	log.Println("Finished checking for missing columns")
}
