package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/yongdilun/classconnect-backend/api/models"
	"gorm.io/gorm"
)

// AnnouncementService provides methods for working with announcements
type AnnouncementService interface {
	Service
	GetAnnouncements(classID int) ([]models.AnnouncementResponse, error)
	GetAnnouncement(announcementID int) (models.AnnouncementResponse, error)
	CreateAnnouncement(classID, userID int, content string, title string) (models.AnnouncementResponse, error)
	UpdateAnnouncement(announcementID, userID int, content string, title string) (models.AnnouncementResponse, error)
	DeleteAnnouncement(announcementID, userID int) error
}

// AnnouncementServiceImpl implements AnnouncementService
type AnnouncementServiceImpl struct {
	*BaseService
}

// NewAnnouncementService creates a new AnnouncementService
func NewAnnouncementService(db *gorm.DB) AnnouncementService {
	return &AnnouncementServiceImpl{
		BaseService: NewBaseService(db),
	}
}

// GetAnnouncements retrieves all announcements for a class
func (s *AnnouncementServiceImpl) GetAnnouncements(classID int) ([]models.AnnouncementResponse, error) {
	// Check if class exists
	var class models.Class
	if err := s.db.Where("class_id = ?", classID).First(&class).Error; err != nil {
		return nil, fmt.Errorf("class not found: %w", err)
	}

	// Get announcements
	var announcements []models.Announcement
	if err := s.db.Table("announcements").
		Where("class_id = ?", classID).
		Order("announcements.created_date DESC").
		Find(&announcements).Error; err != nil {
		return nil, fmt.Errorf("failed to get announcements: %w", err)
	}

	// Get user information for each announcement
	responses := make([]models.AnnouncementResponse, 0, len(announcements))
	for _, announcement := range announcements {
		// Get user info
		var user models.User
		if err := s.db.Where("user_id = ?", announcement.CreatedBy).First(&user).Error; err != nil {
			// If user not found, still include the announcement but with unknown user
			announcement.UserName = "Unknown User"
			announcement.UserRole = "unknown"
		} else {
			announcement.UserName = user.FirstName + " " + user.LastName
			announcement.UserRole = user.UserRole
		}

		responses = append(responses, announcement.ToResponse())
	}

	return responses, nil
}

// GetAnnouncement retrieves a specific announcement
func (s *AnnouncementServiceImpl) GetAnnouncement(announcementID int) (models.AnnouncementResponse, error) {
	var announcement models.Announcement
	if err := s.db.Where("announcement_id = ?", announcementID).First(&announcement).Error; err != nil {
		return models.AnnouncementResponse{}, fmt.Errorf("announcement not found: %w", err)
	}

	// Get user info
	var user models.User
	if err := s.db.Where("user_id = ?", announcement.CreatedBy).First(&user).Error; err != nil {
		// If user not found, still include the announcement but with unknown user
		announcement.UserName = "Unknown User"
		announcement.UserRole = "unknown"
	} else {
		announcement.UserName = user.FirstName + " " + user.LastName
		announcement.UserRole = user.UserRole
	}

	return announcement.ToResponse(), nil
}

// CreateAnnouncement creates a new announcement
func (s *AnnouncementServiceImpl) CreateAnnouncement(classID, userID int, content string, title string) (models.AnnouncementResponse, error) {
	// Check if class exists
	var class models.Class
	if err := s.db.Where("class_id = ?", classID).First(&class).Error; err != nil {
		return models.AnnouncementResponse{}, fmt.Errorf("class not found: %w", err)
	}

	// Check if user exists
	var user models.User
	if err := s.db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		return models.AnnouncementResponse{}, fmt.Errorf("user not found: %w", err)
	}

	// Create announcement
	announcement := models.Announcement{
		ClassID:     classID,
		CreatedBy:   userID,
		Title:       title,
		Content:     content,
		CreatedDate: time.Now(),
		IsPublished: true,
	}

	// Set virtual fields for compatibility
	announcement.UserID = userID
	announcement.CreatedAt = announcement.CreatedDate
	announcement.UpdatedAt = announcement.CreatedDate

	if err := s.db.Create(&announcement).Error; err != nil {
		return models.AnnouncementResponse{}, fmt.Errorf("failed to create announcement: %w", err)
	}

	// Set user info for response
	announcement.UserName = user.FirstName + " " + user.LastName
	announcement.UserRole = user.UserRole

	return announcement.ToResponse(), nil
}

// UpdateAnnouncement updates an existing announcement
func (s *AnnouncementServiceImpl) UpdateAnnouncement(announcementID, userID int, content string, title string) (models.AnnouncementResponse, error) {
	// Get the announcement
	var announcement models.Announcement
	if err := s.db.Where("announcement_id = ?", announcementID).First(&announcement).Error; err != nil {
		return models.AnnouncementResponse{}, fmt.Errorf("announcement not found: %w", err)
	}

	// Check if user is the creator of the announcement
	if announcement.CreatedBy != userID {
		return models.AnnouncementResponse{}, errors.New("user is not authorized to update this announcement")
	}

	// Update announcement
	announcement.Title = title
	announcement.Content = content

	// Set virtual fields for compatibility
	announcement.UpdatedAt = time.Now()

	if err := s.db.Save(&announcement).Error; err != nil {
		return models.AnnouncementResponse{}, fmt.Errorf("failed to update announcement: %w", err)
	}

	// Get user info
	var user models.User
	if err := s.db.Where("user_id = ?", announcement.UserID).First(&user).Error; err != nil {
		// If user not found, still include the announcement but with unknown user
		announcement.UserName = "Unknown User"
		announcement.UserRole = "unknown"
	} else {
		announcement.UserName = user.FirstName + " " + user.LastName
		announcement.UserRole = user.UserRole
	}

	return announcement.ToResponse(), nil
}

// DeleteAnnouncement deletes an announcement
func (s *AnnouncementServiceImpl) DeleteAnnouncement(announcementID, userID int) error {
	// Get the announcement
	var announcement models.Announcement
	if err := s.db.Where("announcement_id = ?", announcementID).First(&announcement).Error; err != nil {
		return fmt.Errorf("announcement not found: %w", err)
	}

	// Check if user is the creator of the announcement
	if announcement.CreatedBy != userID {
		return errors.New("user is not authorized to delete this announcement")
	}

	// Delete the announcement
	if err := s.db.Delete(&announcement).Error; err != nil {
		return fmt.Errorf("failed to delete announcement: %w", err)
	}

	return nil
}
