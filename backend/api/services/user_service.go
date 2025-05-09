package services

import (
	"errors"
	"log"
	"time"

	"github.com/yongdilun/classconnect-backend/api/models"
	"github.com/yongdilun/classconnect-backend/utils"
	"gorm.io/gorm"
)

// UserService handles user-related operations
type UserService interface {
	Service
	// User operations
	CreateUser(user *models.User) error
	GetUserByID(id int) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	UpdateUser(user *models.User) error
	DeleteUser(id int) error

	// Teacher operations
	GetTeacherProfileByUserID(userID int) (*models.TeacherProfile, error)

	// Student operations
	GetStudentProfileByUserID(userID int) (*models.StudentProfile, error)

	// Authentication operations
	RegisterTeacher(email, password, firstName, lastName, department string) (*models.User, *models.TeacherProfile, error)
	RegisterStudent(email, password, firstName, lastName, gradeLevel string) (*models.User, *models.StudentProfile, error)
	AuthenticateUser(email, password string) (*models.User, error)
	UpdateLastLogin(userID int) error

	// Email verification
	MarkEmailAsVerified(userID int) error
}

// UserServiceImpl implements UserService
type UserServiceImpl struct {
	*BaseService
}

// NewUserService creates a new UserService
func NewUserService(db *gorm.DB) UserService {
	return &UserServiceImpl{
		BaseService: NewBaseService(db),
	}
}

// CreateUser creates a new user
func (s *UserServiceImpl) CreateUser(user *models.User) error {
	return s.db.Create(user).Error
}

// GetUserByID retrieves a user by ID
func (s *UserServiceImpl) GetUserByID(id int) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail retrieves a user by email
func (s *UserServiceImpl) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUser updates a user
func (s *UserServiceImpl) UpdateUser(user *models.User) error {
	return s.db.Save(user).Error
}

// DeleteUser deletes a user
func (s *UserServiceImpl) DeleteUser(id int) error {
	return s.db.Delete(&models.User{}, id).Error
}

// RegisterTeacher registers a new teacher
func (s *UserServiceImpl) RegisterTeacher(email, password, firstName, lastName, department string) (*models.User, *models.TeacherProfile, error) {
	log.Printf("Registering teacher with email: %s, firstName: %s, lastName: %s", email, firstName, lastName)

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return nil, nil, errors.New("error creating secure password")
	}

	log.Printf("Password hashed successfully for: %s", email)

	// Create user with transaction
	var user models.User
	var teacherProfile models.TeacherProfile

	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Create user for authentication
		user = models.User{
			Email:          email,
			PasswordHash:   hashedPassword,
			FirstName:      firstName,
			LastName:       lastName,
			UserRole:       "teacher",
			IsActive:       true,
			DateRegistered: time.Now(),
		}

		log.Printf("Creating user record for: %s", email)
		if err := tx.Create(&user).Error; err != nil {
			log.Printf("Error creating user: %v", err)
			return err
		}

		log.Printf("User created successfully with ID: %d", user.UserID)

		// Create teacher profile
		teacherProfile = models.TeacherProfile{
			UserID:     user.UserID,
			FirstName:  firstName,
			LastName:   lastName,
			Department: department,
			HireDate:   time.Now(),
		}

		log.Printf("Creating teacher profile for user ID: %d", user.UserID)
		if err := tx.Create(&teacherProfile).Error; err != nil {
			log.Printf("Error creating teacher profile: %v", err)
			return err
		}

		log.Printf("Teacher profile created successfully with ID: %d", teacherProfile.ProfileID)

		return nil
	})

	if err != nil {
		log.Printf("Transaction failed for teacher registration: %v", err)
		return nil, nil, err
	}

	log.Printf("Teacher registration successful for: %s (User ID: %d, Profile ID: %d)",
		email, user.UserID, teacherProfile.ProfileID)

	return &user, &teacherProfile, nil
}

// RegisterStudent registers a new student
func (s *UserServiceImpl) RegisterStudent(email, password, firstName, lastName, gradeLevel string) (*models.User, *models.StudentProfile, error) {
	log.Printf("Registering student with email: %s, firstName: %s, lastName: %s", email, firstName, lastName)

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return nil, nil, errors.New("error creating secure password")
	}

	log.Printf("Password hashed successfully for: %s", email)

	// Create user with transaction
	var user models.User
	var studentProfile models.StudentProfile

	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Create user for authentication
		user = models.User{
			Email:          email,
			PasswordHash:   hashedPassword,
			FirstName:      firstName,
			LastName:       lastName,
			UserRole:       "student",
			IsActive:       true,
			DateRegistered: time.Now(),
		}

		log.Printf("Creating user record for: %s", email)
		if err := tx.Create(&user).Error; err != nil {
			log.Printf("Error creating user: %v", err)
			return err
		}

		log.Printf("User created successfully with ID: %d", user.UserID)

		// Create student profile
		studentProfile = models.StudentProfile{
			UserID:         user.UserID,
			FirstName:      firstName,
			LastName:       lastName,
			GradeLevel:     gradeLevel,
			EnrollmentDate: time.Now(),
		}

		log.Printf("Creating student profile for user ID: %d", user.UserID)
		if err := tx.Create(&studentProfile).Error; err != nil {
			log.Printf("Error creating student profile: %v", err)
			return err
		}

		log.Printf("Student profile created successfully with ID: %d", studentProfile.ProfileID)

		return nil
	})

	if err != nil {
		log.Printf("Transaction failed for student registration: %v", err)
		return nil, nil, err
	}

	log.Printf("Student registration successful for: %s (User ID: %d, Profile ID: %d)",
		email, user.UserID, studentProfile.ProfileID)

	return &user, &studentProfile, nil
}

// AuthenticateUser authenticates a user with email and password
func (s *UserServiceImpl) AuthenticateUser(email, password string) (user *models.User, err error) {
	// Use defer/recover to catch any panics
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC in UserService.AuthenticateUser: %v", r)
			user = nil
			err = errors.New("internal server error")
		}
	}()

	log.Printf("Authenticating user with email: %s", email)

	// Get user by email
	var userRecord models.User
	log.Printf("Querying database for user with email: %s", email)
	result := s.db.Where("email = ?", email).First(&userRecord)
	if result.Error != nil {
		log.Printf("User not found with email: %s, error: %v", email, result.Error)

		// Try to get the SQL query if available
		if result.Statement != nil {
			log.Printf("SQL query: %v", result.Statement.SQL.String())
		}

		// For debugging: Check if the user exists in the database at all
		var count int64
		countResult := s.db.Model(&models.User{}).Count(&count)
		if countResult.Error != nil {
			log.Printf("Error counting users: %v", countResult.Error)
		} else {
			log.Printf("Total users in database: %d", count)
		}

		// List all users for debugging
		var users []models.User
		findResult := s.db.Limit(10).Find(&users)
		if findResult.Error != nil {
			log.Printf("Error listing users: %v", findResult.Error)
		} else {
			log.Printf("Found %d users in database", len(users))
			for _, u := range users {
				log.Printf("Found user: ID=%d, Email=%s, Role=%s", u.UserID, u.Email, u.UserRole)
			}
		}

		// Do not auto-create users during login
		log.Printf("User not found with email: %s", email)
		return nil, errors.New("invalid email or password")
	}

	log.Printf("User found with ID: %d, role: %s", userRecord.UserID, userRecord.UserRole)

	// Check if password hash exists
	if userRecord.PasswordHash == "" {
		log.Printf("WARNING: Empty password hash for user: %s", email)
		return nil, errors.New("invalid user account configuration")
	}

	// Log password hash for debugging
	log.Printf("Password hash for user %s: %s", email, userRecord.PasswordHash)

	// Check password
	passwordMatch := utils.CheckPasswordHash(password, userRecord.PasswordHash)
	log.Printf("Password check result: %v", passwordMatch)

	// If the password doesn't match, return an error
	if !passwordMatch {
		log.Printf("Password mismatch for user: %s", email)
		return nil, errors.New("invalid email or password")
	}

	log.Printf("Authentication successful for user: %s", email)
	return &userRecord, nil
}

// UpdateLastLogin updates the last login time for a user
func (s *UserServiceImpl) UpdateLastLogin(userID int) error {
	now := time.Now()
	return s.db.Model(&models.User{}).Where("user_id = ?", userID).Update("last_login", now).Error
}

// GetTeacherProfileByUserID retrieves a teacher profile by user ID
func (s *UserServiceImpl) GetTeacherProfileByUserID(userID int) (*models.TeacherProfile, error) {
	var teacherProfile models.TeacherProfile
	if err := s.db.Where("user_id = ?", userID).First(&teacherProfile).Error; err != nil {
		return nil, err
	}
	return &teacherProfile, nil
}

// GetStudentProfileByUserID retrieves a student profile by user ID
func (s *UserServiceImpl) GetStudentProfileByUserID(userID int) (*models.StudentProfile, error) {
	var studentProfile models.StudentProfile
	if err := s.db.Where("user_id = ?", userID).First(&studentProfile).Error; err != nil {
		return nil, err
	}
	return &studentProfile, nil
}

// MarkEmailAsVerified marks a user's email as verified
func (s *UserServiceImpl) MarkEmailAsVerified(userID int) error {
	// In a real application, you would have an is_email_verified field in the users table
	// For now, we'll just update the user's is_active field as a placeholder
	return s.db.Model(&models.User{}).Where("user_id = ?", userID).Update("is_active", true).Error
}
