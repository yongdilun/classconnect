package models

import (
	"time"
)

// ClassTeacher represents the class_teachers table
type ClassTeacher struct {
	ClassTeacherID int       `gorm:"column:class_teacher_id;primaryKey;autoIncrement" json:"classTeacherId"`
	UserID         int       `gorm:"column:user_id;not null" json:"userId"`
	ClassID        int       `gorm:"column:class_id;not null" json:"classId"`
	IsOwner        bool      `gorm:"column:is_owner;not null;default:0" json:"isOwner"`
	AddedDate      time.Time `gorm:"column:added_date;not null;default:CURRENT_TIMESTAMP" json:"addedDate"`
	User           User      `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Class          Class     `gorm:"foreignKey:ClassID;references:ClassID" json:"class,omitempty"`
}

// TableName specifies the table name for ClassTeacher model
func (ClassTeacher) TableName() string {
	return "class_teachers"
}
