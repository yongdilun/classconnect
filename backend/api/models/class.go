package models

import (
	"time"
)

// Class represents the classes table
type Class struct {
	ClassID     int       `gorm:"column:class_id;primaryKey;autoIncrement" json:"classId"`
	ClassName   string    `gorm:"column:class_name;not null" json:"className"`
	ClassCode   string    `gorm:"column:class_code;not null;unique" json:"classCode"`
	Description string    `gorm:"column:description;type:text" json:"description,omitempty"`
	Subject     string    `gorm:"column:subject" json:"subject,omitempty"`
	CreatedDate time.Time `gorm:"column:created_date;not null;default:CURRENT_TIMESTAMP" json:"createdDate"`
	IsArchived  bool      `gorm:"column:is_archived;not null;default:0" json:"isArchived"`
	ThemeColor  string    `gorm:"column:theme_color" json:"themeColor,omitempty"`
	CreatorID   int       `gorm:"column:creator_id;not null" json:"creatorId"`
	Creator     User      `gorm:"foreignKey:CreatorID;references:UserID" json:"creator,omitempty"`
}

// TableName specifies the table name for Class model
func (Class) TableName() string {
	return "classes"
}
