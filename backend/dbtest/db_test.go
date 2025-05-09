package dbtest

import (
	"fmt"
	"log"
	"time"

	"github.com/joho/godotenv"
	"github.com/yongdilun/classconnect-backend/api/models"
	"github.com/yongdilun/classconnect-backend/database"
	"github.com/yongdilun/classconnect-backend/utils"
)

// TestDatabase runs a series of tests to verify database operations
func TestDatabase() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	} else {
		log.Println("Environment variables loaded from .env file")
	}

	// Connect to database
	log.Println("Connecting to database...")
	database.Connect()

	// Verify connection
	if database.DB == nil {
		log.Fatalf("Failed to connect to database")
	}

	sqlDB, err := database.DB.DB()
	if err != nil {
		log.Fatalf("Failed to get database connection: %v", err)
	}

	// Ping the database
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Database connection successful")

	// Run tests
	fmt.Println("\n=== Running Database Tests ===")

	// Test 1: Create a test user
	fmt.Println("\n--- Test 1: Create User ---")
	testCreateUser()

	// Test 2: Read user by email
	fmt.Println("\n--- Test 2: Read User by Email ---")
	testReadUserByEmail()

	// Test 3: Update user
	fmt.Println("\n--- Test 3: Update User ---")
	testUpdateUser()

	// Test 4: Create teacher profile
	fmt.Println("\n--- Test 4: Create Teacher Profile ---")
	testCreateTeacherProfile()

	// Test 5: Create student profile
	fmt.Println("\n--- Test 5: Create Student Profile ---")
	testCreateStudentProfile()

	// Test 6: Read profiles
	fmt.Println("\n--- Test 6: Read Profiles ---")
	testReadProfiles()

	// Test 7: Delete test data
	fmt.Println("\n--- Test 7: Delete Test Data ---")
	testDeleteTestData()

	fmt.Println("\n=== All Tests Completed ===")
}

// Test creating a user
func testCreateUser() {
	// Generate a unique email
	timestamp := time.Now().Unix()
	email := fmt.Sprintf("test_user_%d@example.com", timestamp)

	// Hash a password
	passwordHash, err := utils.HashPassword("password123")
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		return
	}

	// Create a user
	user := models.User{
		Email:        email,
		PasswordHash: passwordHash,
		UserRole:     "test",
		IsActive:     true,
	}

	// Save to database
	result := database.DB.Create(&user)
	if result.Error != nil {
		fmt.Printf("Failed to create user: %v\n", result.Error)
		return
	}

	fmt.Printf("User created successfully with ID: %d\n", user.UserID)
	fmt.Printf("Email: %s\n", user.Email)
	fmt.Printf("Role: %s\n", user.UserRole)
}

// Test reading a user by email
func testReadUserByEmail() {
	// Generate the same email as in testCreateUser
	timestamp := time.Now().Unix()
	email := fmt.Sprintf("test_user_%d@example.com", timestamp)

	// Find the user
	var user models.User
	result := database.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		fmt.Printf("Failed to find user: %v\n", result.Error)
		return
	}

	fmt.Printf("User found with ID: %d\n", user.UserID)
	fmt.Printf("Email: %s\n", user.Email)
	fmt.Printf("Role: %s\n", user.UserRole)
}

// Test updating a user
func testUpdateUser() {
	// Generate the same email as in testCreateUser
	timestamp := time.Now().Unix()
	email := fmt.Sprintf("test_user_%d@example.com", timestamp)

	// Find the user
	var user models.User
	result := database.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		fmt.Printf("Failed to find user: %v\n", result.Error)
		return
	}

	// Update the user
	user.UserRole = "updated_test"
	result = database.DB.Save(&user)
	if result.Error != nil {
		fmt.Printf("Failed to update user: %v\n", result.Error)
		return
	}

	// Verify the update
	var updatedUser models.User
	database.DB.Where("user_id = ?", user.UserID).First(&updatedUser)

	fmt.Printf("User updated successfully with ID: %d\n", updatedUser.UserID)
	fmt.Printf("Email: %s\n", updatedUser.Email)
	fmt.Printf("Updated Role: %s\n", updatedUser.UserRole)
}

// Test creating a teacher profile
func testCreateTeacherProfile() {
	// Generate a unique email
	timestamp := time.Now().Unix()
	email := fmt.Sprintf("test_teacher_%d@example.com", timestamp)

	// Hash a password
	passwordHash, err := utils.HashPassword("password123")
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		return
	}

	// Create a user
	user := models.User{
		Email:        email,
		PasswordHash: passwordHash,
		UserRole:     "teacher",
		IsActive:     true,
	}

	// Save user to database
	result := database.DB.Create(&user)
	if result.Error != nil {
		fmt.Printf("Failed to create teacher user: %v\n", result.Error)
		return
	}

	// Create teacher profile
	teacherProfile := models.TeacherProfile{
		UserID:     user.UserID,
		FirstName:  "Test",
		LastName:   "Teacher",
		Department: "Computer Science",
		HireDate:   time.Now(),
	}

	// Save teacher profile to database
	result = database.DB.Create(&teacherProfile)
	if result.Error != nil {
		fmt.Printf("Failed to create teacher profile: %v\n", result.Error)
		return
	}

	fmt.Printf("Teacher profile created successfully with ID: %d\n", teacherProfile.ProfileID)
	fmt.Printf("Teacher User ID: %d\n", teacherProfile.UserID)
	fmt.Printf("Teacher Name: %s %s\n", teacherProfile.FirstName, teacherProfile.LastName)
}

// Test creating a student profile
func testCreateStudentProfile() {
	// Generate a unique email
	timestamp := time.Now().Unix()
	email := fmt.Sprintf("test_student_%d@example.com", timestamp)

	// Hash a password
	passwordHash, err := utils.HashPassword("password123")
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		return
	}

	// Create a user
	user := models.User{
		Email:        email,
		PasswordHash: passwordHash,
		UserRole:     "student",
		IsActive:     true,
	}

	// Save user to database
	result := database.DB.Create(&user)
	if result.Error != nil {
		fmt.Printf("Failed to create student user: %v\n", result.Error)
		return
	}

	// Create student profile
	studentProfile := models.StudentProfile{
		UserID:         user.UserID,
		FirstName:      "Test",
		LastName:       "Student",
		GradeLevel:     "12",
		EnrollmentDate: time.Now(),
	}

	// Save student profile to database
	result = database.DB.Create(&studentProfile)
	if result.Error != nil {
		fmt.Printf("Failed to create student profile: %v\n", result.Error)
		return
	}

	fmt.Printf("Student profile created successfully with ID: %d\n", studentProfile.ProfileID)
	fmt.Printf("Student User ID: %d\n", studentProfile.UserID)
	fmt.Printf("Student Name: %s %s\n", studentProfile.FirstName, studentProfile.LastName)
}

// Test reading profiles
func testReadProfiles() {
	// Read all teacher profiles
	var teacherProfiles []models.TeacherProfile
	result := database.DB.Where("first_name = ?", "Test").Find(&teacherProfiles)
	if result.Error != nil {
		fmt.Printf("Failed to read teacher profiles: %v\n", result.Error)
	} else {
		fmt.Printf("Found %d teacher profiles\n", len(teacherProfiles))
		for i, profile := range teacherProfiles {
			fmt.Printf("  %d. %s %s (ID: %d, User ID: %d)\n",
				i+1, profile.FirstName, profile.LastName, profile.ProfileID, profile.UserID)
		}
	}

	// Read all student profiles
	var studentProfiles []models.StudentProfile
	result = database.DB.Where("first_name = ?", "Test").Find(&studentProfiles)
	if result.Error != nil {
		fmt.Printf("Failed to read student profiles: %v\n", result.Error)
	} else {
		fmt.Printf("Found %d student profiles\n", len(studentProfiles))
		for i, profile := range studentProfiles {
			fmt.Printf("  %d. %s %s (ID: %d, User ID: %d)\n",
				i+1, profile.FirstName, profile.LastName, profile.ProfileID, profile.UserID)
		}
	}
}

// Test deleting test data
func testDeleteTestData() {
	// Delete test users
	result := database.DB.Where("email LIKE ?", "test_%").Delete(&models.User{})
	if result.Error != nil {
		fmt.Printf("Failed to delete test users: %v\n", result.Error)
	} else {
		fmt.Printf("Deleted %d test users\n", result.RowsAffected)
	}
}
