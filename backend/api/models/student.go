package models

import (
	"time"
)

// Student represents the students table
type Student struct {
	StudentID      int       `gorm:"column:student_id;primaryKey;autoIncrement:false" json:"studentId"`
	GradeLevel     string    `gorm:"column:grade_level" json:"gradeLevel,omitempty"`
	EnrollmentDate time.Time `gorm:"column:enrollment_date;not null;default:CURRENT_TIMESTAMP" json:"enrollmentDate"`
	User           User      `gorm:"foreignKey:StudentID;references:UserID" json:"user,omitempty"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"-"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"-"`
}

// TableName specifies the table name for Student model
func (Student) TableName() string {
	return "students"
}
