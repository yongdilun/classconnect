package models

import (
	"time"
)

// TeacherProfile represents the teacher_profiles table
type TeacherProfile struct {
	ProfileID      int       `gorm:"column:profile_id;primaryKey;autoIncrement" json:"profileId"`
	UserID         int       `gorm:"column:user_id;uniqueIndex;not null" json:"userId"`
	FirstName      string    `gorm:"column:first_name;not null" json:"firstName"`
	LastName       string    `gorm:"column:last_name;not null" json:"lastName"`
	Department     string    `gorm:"column:department" json:"department,omitempty"`
	HireDate       time.Time `gorm:"column:hire_date;not null;default:CURRENT_TIMESTAMP" json:"hireDate"`
	ProfilePicture *string   `gorm:"column:profile_picture" json:"profilePicture,omitempty"`
	User           User      `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
}

// TableName specifies the table name for TeacherProfile model
func (TeacherProfile) TableName() string {
	return "teacher_profiles"
}
