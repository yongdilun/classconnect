package services

import (
	"errors"
	"log"
	"time"

	"github.com/yongdilun/classconnect-backend/api/models"
	"github.com/yongdilun/classconnect-backend/utils"
	"gorm.io/gorm"
)

// AuthService handles authentication operations
type AuthService interface {
	Service
	// Core authentication operations
	Login(email, password string) (*models.User, string, error)
	VerifyToken(token string) (int, string, error)

	// Token management
	RefreshToken(userID int) (string, error)

	// Password reset
	RequestPasswordReset(email string) (string, error)
	VerifyResetToken(token string) (int, error)
	ResetPassword(userID int, newPassword string) error

	// Email verification
	VerifyEmailToken(token string) (int, error)
}

// AuthServiceImpl implements AuthService
type AuthServiceImpl struct {
	*BaseService
}

// NewAuthService creates a new AuthService
func NewAuthService(db *gorm.DB) AuthService {
	return &AuthServiceImpl{
		BaseService: NewBaseService(db),
	}
}

// Login authenticates a user and returns a JWT token
func (s *AuthServiceImpl) Login(email, password string) (user *models.User, token string, err error) {
	// Use defer/recover to catch any panics
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC in AuthService.Login: %v", r)
			user = nil
			token = ""
			err = errors.New("internal server error")
		}
	}()

	log.Printf("Auth service: Login attempt for email: %s", email)

	// Find the user by email
	var userRecord models.User
	if err := s.db.Where("email = ?", email).First(&userRecord).Error; err != nil {
		log.Printf("User not found with email: %s, error: %v", email, err)
		return nil, "", errors.New("invalid email or password")
	}

	log.Printf("User found with ID: %d, role: %s", userRecord.UserID, userRecord.UserRole)

	// Check if password hash exists
	if userRecord.PasswordHash == "" {
		log.Printf("WARNING: Empty password hash for user: %s", email)
		return nil, "", errors.New("invalid user account configuration")
	}

	// Check password
	passwordMatch := utils.CheckPasswordHash(password, userRecord.PasswordHash)
	log.Printf("Password check result: %v", passwordMatch)

	if !passwordMatch {
		log.Printf("Password mismatch for user: %s", email)
		return nil, "", errors.New("invalid email or password")
	}

	// Update last login time
	now := time.Now()
	userRecord.LastLogin = &now
	if err := s.db.Model(&userRecord).Update("last_login", now).Error; err != nil {
		log.Printf("Warning: Failed to update last login time: %v", err)
		// Continue anyway, this is not critical
	} else {
		log.Printf("Last login time updated successfully")
	}

	// Generate JWT token
	log.Printf("Generating JWT token for user ID: %d", userRecord.UserID)
	token, err = utils.GenerateToken(userRecord)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		return nil, "", err
	}

	log.Printf("Login successful for user: %s", email)
	return &userRecord, token, nil
}

// VerifyToken verifies a JWT token and returns the user ID and role
func (s *AuthServiceImpl) VerifyToken(tokenString string) (int, string, error) {
	// Validate token
	token, err := utils.ValidateToken(tokenString)
	if err != nil {
		return 0, "", err
	}

	// Extract user ID
	userID, err := utils.ExtractUserID(token)
	if err != nil {
		return 0, "", err
	}

	// Extract user role
	role, err := utils.ExtractUserRole(token)
	if err != nil {
		return 0, "", err
	}

	return userID, role, nil
}

// RefreshToken generates a new JWT token for a user
func (s *AuthServiceImpl) RefreshToken(userID int) (string, error) {
	// Get user by ID
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return "", err
	}

	// Generate new token
	token, err := utils.GenerateToken(user)
	if err != nil {
		return "", err
	}

	return token, nil
}

// RequestPasswordReset generates a password reset token
func (s *AuthServiceImpl) RequestPasswordReset(email string) (string, error) {
	// Get user by email
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return "", errors.New("email not found")
	}

	// Generate reset token
	resetToken := utils.GenerateRandomString(32)

	// Store reset token in database with expiration
	resetRecord := models.PasswordReset{
		UserID:    user.UserID,
		Token:     resetToken,
		ExpiresAt: time.Now().Add(24 * time.Hour), // Token valid for 24 hours
	}

	if err := s.db.Create(&resetRecord).Error; err != nil {
		return "", err
	}

	return resetToken, nil
}

// VerifyResetToken verifies a password reset token
func (s *AuthServiceImpl) VerifyResetToken(token string) (int, error) {
	// Find reset record
	var resetRecord models.PasswordReset
	if err := s.db.Where("token = ? AND expires_at > ?", token, time.Now()).First(&resetRecord).Error; err != nil {
		return 0, errors.New("invalid or expired token")
	}

	return resetRecord.UserID, nil
}

// ResetPassword resets a user's password
func (s *AuthServiceImpl) ResetPassword(userID int, newPassword string) error {
	// Get user
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return err
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// Update password
	user.PasswordHash = hashedPassword
	if err := s.db.Save(&user).Error; err != nil {
		return err
	}

	// Delete all reset tokens for this user
	if err := s.db.Where("user_id = ?", userID).Delete(&models.PasswordReset{}).Error; err != nil {
		return err
	}

	return nil
}

// VerifyEmailToken verifies an email verification token
func (s *AuthServiceImpl) VerifyEmailToken(token string) (int, error) {
	// Find verification record
	var verificationRecord models.PasswordReset
	if err := s.db.Where("token = ? AND expires_at > ?", token, time.Now()).First(&verificationRecord).Error; err != nil {
		return 0, errors.New("invalid or expired verification token")
	}

	// Delete the verification token
	if err := s.db.Delete(&verificationRecord).Error; err != nil {
		return 0, err
	}

	return verificationRecord.UserID, nil
}
