package models

import (
	"time"
)

// User represents the users table (authentication only)
type User struct {
	UserID         int        `gorm:"column:user_id;primaryKey;autoIncrement" json:"userId"`
	Email          string     `gorm:"column:email;unique;not null" json:"email"`
	PasswordHash   string     `gorm:"column:password_hash;not null" json:"-"`
	FirstName      string     `gorm:"column:first_name;not null" json:"firstName"`
	LastName       string     `gorm:"column:last_name;not null" json:"lastName"`
	ProfilePicture *string    `gorm:"column:profile_picture" json:"profilePicture,omitempty"`
	DateRegistered time.Time  `gorm:"column:date_registered;not null;default:CURRENT_TIMESTAMP" json:"dateRegistered"`
	UserRole       string     `gorm:"column:user_role;not null" json:"userRole"`
	IsActive       bool       `gorm:"column:is_active;not null;default:1" json:"isActive"`
	LastLogin      *time.Time `gorm:"column:last_login" json:"lastLogin,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}
