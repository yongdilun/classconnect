package models

import (
	"time"
)

// ChatMessage represents a message in a class chat
type ChatMessage struct {
	MessageID  int       `json:"messageId" gorm:"column:message_id;primaryKey;autoIncrement"`
	ClassID    int       `json:"classId" gorm:"column:class_id"`
	UserID     int       `json:"userId" gorm:"column:user_id"`
	Content    string    `json:"content" gorm:"column:content"`
	Timestamp  time.Time `json:"timestamp" gorm:"column:timestamp"`
	IsDeleted  bool      `json:"isDeleted" gorm:"column:is_deleted"`
	CreatedAt  time.Time `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt  time.Time `json:"updatedAt" gorm:"column:updated_at"`
	
	// Virtual fields (not stored in database)
	UserName   string    `json:"userName" gorm:"-"`
	UserRole   string    `json:"userRole" gorm:"-"`
}

// TableName specifies the table name for the ChatMessage model
func (ChatMessage) TableName() string {
	return "chat_messages"
}

// ChatMessageResponse represents the response format for chat messages
type ChatMessageResponse struct {
	MessageID  int       `json:"messageId"`
	ClassID    int       `json:"classId"`
	UserID     int       `json:"userId"`
	UserName   string    `json:"userName"`
	UserRole   string    `json:"userRole"`
	Content    string    `json:"content"`
	Timestamp  time.Time `json:"timestamp"`
}

// ToResponse converts a ChatMessage to a ChatMessageResponse
func (m *ChatMessage) ToResponse() ChatMessageResponse {
	return ChatMessageResponse{
		MessageID: m.MessageID,
		ClassID:   m.ClassID,
		UserID:    m.UserID,
		UserName:  m.UserName,
		UserRole:  m.UserRole,
		Content:   m.Content,
		Timestamp: m.Timestamp,
	}
}
