package models

import (
	"time"

	"gorm.io/gorm"
)

// PasswordReset represents a password reset request
type PasswordReset struct {
	ResetID   int       `gorm:"primaryKey;column:reset_id;autoIncrement"`
	UserID    int       `gorm:"column:user_id;not null;index"`
	Token     string    `gorm:"column:token;not null;unique"`
	ExpiresAt time.Time `gorm:"column:expires_at;not null"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`
}

// TableName specifies the table name for the PasswordReset model
func (PasswordReset) TableName() string {
	return "password_resets"
}

// AfterMigrate adds foreign key constraints after the table is created
func (PasswordReset) AfterMigrate(tx *gorm.DB) error {
	// Add foreign key constraint to UserID
	return tx.Exec("ALTER TABLE password_resets ADD CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(user_id)").Error
}
