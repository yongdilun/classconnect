package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/yongdilun/classconnect-backend/api/models"
	"gorm.io/gorm"
)

// ChatService provides methods for working with chat messages
type ChatService interface {
	Service
	GetChatMessages(classID int) ([]models.ChatMessageResponse, error)
	SendChatMessage(classID, userID int, content string) (models.ChatMessageResponse, error)
	DeleteChatMessage(messageID, userID int) error
}

// ChatServiceImpl implements ChatService
type ChatServiceImpl struct {
	*BaseService
}

// NewChatService creates a new ChatService
func NewChatService(db *gorm.DB) ChatService {
	return &ChatServiceImpl{
		BaseService: NewBaseService(db),
	}
}

// GetChatMessages retrieves all chat messages for a class
func (s *ChatServiceImpl) GetChatMessages(classID int) ([]models.ChatMessageResponse, error) {
	// Check if class exists
	var class models.Class
	if err := s.db.Where("class_id = ?", classID).First(&class).Error; err != nil {
		return nil, fmt.Errorf("class not found: %w", err)
	}

	// Get all chat messages for the class
	var messages []models.ChatMessage
	if err := s.db.Where("class_id = ? AND is_deleted = 0", classID).
		Order("timestamp ASC").
		Find(&messages).Error; err != nil {
		return nil, fmt.Errorf("failed to get chat messages: %w", err)
	}

	// Get user information for each message
	responses := make([]models.ChatMessageResponse, 0, len(messages))
	for _, message := range messages {
		// Get user information
		var user models.User
		if err := s.db.Where("user_id = ?", message.UserID).First(&user).Error; err != nil {
			// If user not found, still include the message but with unknown user
			message.UserName = "Unknown User"
			message.UserRole = "unknown"
		} else {
			// Get user's name based on role
			if user.UserRole == "teacher" {
				var teacher models.TeacherProfile
				if err := s.db.Where("user_id = ?", user.UserID).First(&teacher).Error; err == nil {
					message.UserName = fmt.Sprintf("%s %s", teacher.FirstName, teacher.LastName)
				} else {
					message.UserName = "Teacher"
				}
			} else if user.UserRole == "student" {
				var student models.StudentProfile
				if err := s.db.Where("user_id = ?", user.UserID).First(&student).Error; err == nil {
					message.UserName = fmt.Sprintf("%s %s", student.FirstName, student.LastName)
				} else {
					message.UserName = "Student"
				}
			} else {
				message.UserName = "User"
			}
			message.UserRole = user.UserRole
		}

		// Add to response
		responses = append(responses, message.ToResponse())
	}

	return responses, nil
}

// SendChatMessage creates a new chat message
func (s *ChatServiceImpl) SendChatMessage(classID, userID int, content string) (models.ChatMessageResponse, error) {
	// Validate input
	if content == "" {
		return models.ChatMessageResponse{}, errors.New("message content cannot be empty")
	}

	// Check if class exists
	var class models.Class
	if err := s.db.Where("class_id = ?", classID).First(&class).Error; err != nil {
		return models.ChatMessageResponse{}, fmt.Errorf("class not found: %w", err)
	}

	// Check if user exists
	var user models.User
	if err := s.db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		return models.ChatMessageResponse{}, fmt.Errorf("user not found: %w", err)
	}

	// Create new message
	message := models.ChatMessage{
		ClassID:   classID,
		UserID:    userID,
		Content:   content,
		Timestamp: time.Now(),
		IsDeleted: false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save to database
	if err := s.db.Create(&message).Error; err != nil {
		return models.ChatMessageResponse{}, fmt.Errorf("failed to create chat message: %w", err)
	}

	// Get user's name based on role
	if user.UserRole == "teacher" {
		var teacher models.TeacherProfile
		if err := s.db.Where("user_id = ?", user.UserID).First(&teacher).Error; err == nil {
			message.UserName = fmt.Sprintf("%s %s", teacher.FirstName, teacher.LastName)
		} else {
			message.UserName = "Teacher"
		}
	} else if user.UserRole == "student" {
		var student models.StudentProfile
		if err := s.db.Where("user_id = ?", user.UserID).First(&student).Error; err == nil {
			message.UserName = fmt.Sprintf("%s %s", student.FirstName, student.LastName)
		} else {
			message.UserName = "Student"
		}
	} else {
		message.UserName = "User"
	}
	message.UserRole = user.UserRole

	return message.ToResponse(), nil
}

// DeleteChatMessage marks a chat message as deleted
func (s *ChatServiceImpl) DeleteChatMessage(messageID, userID int) error {
	// Get the message
	var message models.ChatMessage
	if err := s.db.Where("message_id = ?", messageID).First(&message).Error; err != nil {
		return fmt.Errorf("message not found: %w", err)
	}

	// Check if user is the message author or a teacher
	var user models.User
	if err := s.db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	if message.UserID != userID && user.UserRole != "teacher" {
		return errors.New("unauthorized to delete this message")
	}

	// Mark as deleted
	if err := s.db.Model(&message).Update("is_deleted", true).Error; err != nil {
		return fmt.Errorf("failed to delete message: %w", err)
	}

	return nil
}
