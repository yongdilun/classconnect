package models

import (
	"time"
)

// Teacher represents the teachers table
type Teacher struct {
	TeacherID  int       `gorm:"column:teacher_id;primaryKey;autoIncrement:false" json:"teacherId"`
	Department string    `gorm:"column:department" json:"department,omitempty"`
	HireDate   time.Time `gorm:"column:hire_date" json:"hireDate,omitempty"`
	Bio        string    `gorm:"column:bio;type:text" json:"bio,omitempty"`
	User       User      `gorm:"foreignKey:TeacherID;references:UserID" json:"user,omitempty"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"-"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"-"`
}

// TableName specifies the table name for Teacher model
func (Teacher) TableName() string {
	return "teachers"
}
