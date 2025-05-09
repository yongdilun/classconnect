package models

import (
	"time"
)

// ClassEnrollment represents the class_enrollments table
type ClassEnrollment struct {
	EnrollmentID   int       `gorm:"column:enrollment_id;primaryKey;autoIncrement" json:"enrollmentId"`
	UserID         int       `gorm:"column:user_id;not null" json:"userId"`
	ClassID        int       `gorm:"column:class_id;not null" json:"classId"`
	EnrollmentDate time.Time `gorm:"column:enrollment_date;not null;default:CURRENT_TIMESTAMP" json:"enrollmentDate"`
	IsActive       bool      `gorm:"column:is_active;not null;default:1" json:"isActive"`
	User           User      `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Class          Class     `gorm:"foreignKey:ClassID;references:ClassID" json:"class,omitempty"`
}

// TableName specifies the table name for ClassEnrollment model
func (ClassEnrollment) TableName() string {
	return "class_enrollments"
}
