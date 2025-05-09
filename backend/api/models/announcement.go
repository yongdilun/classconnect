package models

import (
	"time"
)

// Announcement represents a class announcement
type Announcement struct {
	AnnouncementID int        `json:"announcementId" gorm:"column:announcement_id;primaryKey;autoIncrement"`
	ClassID        int        `json:"classId" gorm:"column:class_id"`
	Title          string     `json:"title" gorm:"column:title"`
	Content        string     `json:"content" gorm:"column:content"`
	CreatedBy      int        `json:"createdBy" gorm:"column:created_by"` // This is the user_id in the database
	CreatedDate    time.Time  `json:"createdDate" gorm:"column:created_date"`
	ScheduledDate  *time.Time `json:"scheduledDate,omitempty" gorm:"column:scheduled_date"`
	IsPublished    bool       `json:"isPublished" gorm:"column:is_published;default:true"`

	// Virtual fields (not stored in database)
	UserName string `json:"userName" gorm:"-"`
	UserRole string `json:"userRole" gorm:"-"`

	// Fields for compatibility with existing code
	UserID    int       `json:"userId" gorm:"-"`    // Maps to CreatedBy
	CreatedAt time.Time `json:"createdAt" gorm:"-"` // Maps to CreatedDate
	UpdatedAt time.Time `json:"updatedAt" gorm:"-"` // Not in the database
	IsDeleted bool      `json:"isDeleted" gorm:"-"` // Not in the database
}

// TableName specifies the table name for the Announcement model
func (Announcement) TableName() string {
	return "announcements"
}

// AnnouncementResponse represents the response format for announcements
type AnnouncementResponse struct {
	AnnouncementID int        `json:"announcementId"`
	ClassID        int        `json:"classId"`
	Title          string     `json:"title"`
	Content        string     `json:"content"`
	UserID         int        `json:"userId"`
	UserName       string     `json:"userName"`
	UserRole       string     `json:"userRole"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	ScheduledDate  *time.Time `json:"scheduledDate,omitempty"`
	IsPublished    bool       `json:"isPublished"`
}

// ToResponse converts an Announcement to an AnnouncementResponse
func (a *Announcement) ToResponse() AnnouncementResponse {
	// Map CreatedBy to UserID for compatibility
	if a.UserID == 0 {
		a.UserID = a.CreatedBy
	}

	// Map CreatedDate to CreatedAt for compatibility
	if a.CreatedAt.IsZero() {
		a.CreatedAt = a.CreatedDate
	}

	// Set UpdatedAt to CreatedDate if it's zero
	if a.UpdatedAt.IsZero() {
		a.UpdatedAt = a.CreatedDate
	}

	return AnnouncementResponse{
		AnnouncementID: a.AnnouncementID,
		ClassID:        a.ClassID,
		Title:          a.Title,
		Content:        a.Content,
		UserID:         a.UserID,
		UserName:       a.UserName,
		UserRole:       a.UserRole,
		CreatedAt:      a.CreatedAt,
		UpdatedAt:      a.UpdatedAt,
		ScheduledDate:  a.ScheduledDate,
		IsPublished:    a.IsPublished,
	}
}
