package models

import (
	"time"
)

// StudentProfile represents the student_profiles table
type StudentProfile struct {
	ProfileID      int       `gorm:"column:profile_id;primaryKey;autoIncrement" json:"profileId"`
	UserID         int       `gorm:"column:user_id;uniqueIndex;not null" json:"userId"`
	FirstName      string    `gorm:"column:first_name;not null" json:"firstName"`
	LastName       string    `gorm:"column:last_name;not null" json:"lastName"`
	GradeLevel     string    `gorm:"column:grade_level" json:"gradeLevel,omitempty"`
	EnrollmentDate time.Time `gorm:"column:enrollment_date;not null;default:CURRENT_TIMESTAMP" json:"enrollmentDate"`
	ProfilePicture *string   `gorm:"column:profile_picture" json:"profilePicture,omitempty"`
	User           User      `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
}

// TableName specifies the table name for StudentProfile model
func (StudentProfile) TableName() string {
	return "student_profiles"
}
