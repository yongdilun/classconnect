package database

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/yongdilun/classconnect-backend/api/models"
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
		dsn = fmt.Sprintf("sqlserver://%s:%s?database=master&integrated+security=true",
			host, port)
	} else {
		// SQL Server Authentication
		dsn = fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=master",
			user, password, host, port)
	}

	// Connect to master database
	masterDB, err := gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("Warning: Failed to connect to master database: %v", err)
		return
	}

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

	// Check if tables exist and drop them if needed during development
	// WARNING: This will delete all data in the tables
	// In production, you would want to use proper migrations instead
	if os.Getenv("GIN_MODE") != "release" {
		log.Println("Development mode: Checking if tables need to be dropped and recreated...")

		// Check if users table exists
		var count int64
		DB.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users' AND TABLE_CATALOG = ?",
			os.Getenv("DB_NAME")).Count(&count)

		if count > 0 {
			log.Println("Development mode: Dropping existing users table for clean migration...")

			// First, drop any constraints or indexes that might be referencing the table
			// This is a more robust approach than just trying to drop the table directly

			// Drop foreign key constraints referencing users table
			DB.Exec(`
				DECLARE @sql NVARCHAR(MAX) = N'';

				SELECT @sql += N'
				ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) +
				' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
				FROM sys.foreign_keys
				WHERE referenced_object_id = OBJECT_ID('users');

				EXEC sp_executesql @sql;
			`)

			// Drop indexes on users table
			DB.Exec(`
				DECLARE @sql NVARCHAR(MAX) = N'';

				SELECT @sql += N'
				DROP INDEX ' + QUOTENAME(name) + ' ON ' + QUOTENAME(OBJECT_SCHEMA_NAME(object_id)) + '.' + QUOTENAME(OBJECT_NAME(object_id)) + ';'
				FROM sys.indexes
				WHERE object_id = OBJECT_ID('users') AND name IS NOT NULL;

				EXEC sp_executesql @sql;
			`)

			// Now try to drop the table
			if err := DB.Exec("DROP TABLE users").Error; err != nil {
				log.Printf("Warning: Failed to drop users table: %v", err)

				// If we can't drop the table, let's try to drop and recreate the database
				log.Println("Attempting to drop and recreate the entire database...")

				// Connect to master database
				masterDB, err := gorm.Open(sqlserver.Open(fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=master",
					os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_PORT"))), &gorm.Config{})

				if err == nil {
					// Drop connections to the database
					masterDB.Exec(fmt.Sprintf(`
						USE master;
						ALTER DATABASE %s SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
					`, os.Getenv("DB_NAME")))

					// Drop the database
					masterDB.Exec(fmt.Sprintf("DROP DATABASE %s", os.Getenv("DB_NAME")))

					// Recreate the database
					masterDB.Exec(fmt.Sprintf("CREATE DATABASE %s", os.Getenv("DB_NAME")))

					// Reconnect to the new database
					DB, err = gorm.Open(sqlserver.Open(fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=%s",
						os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_NAME"))), &gorm.Config{})

					if err != nil {
						log.Fatalf("Failed to reconnect to database after recreation: %v", err)
					}

					log.Println("Database dropped and recreated successfully")
				} else {
					log.Printf("Warning: Failed to connect to master database: %v", err)
				}
			} else {
				log.Println("Users table dropped successfully")
			}
		}
	}

	// Add all models to be migrated here
	err := DB.AutoMigrate(
		&models.User{},
		// Add other models as they are created
	)

	if err != nil {
		if strings.Contains(err.Error(), "database") && strings.Contains(err.Error(), "does not exist") {
			log.Fatalf("Database does not exist. Please create it manually or check your connection settings: %v", err)
		} else {
			log.Fatalf("Failed to migrate database: %v", err)
		}
	}

	log.Println("Database migration completed successfully")
}
