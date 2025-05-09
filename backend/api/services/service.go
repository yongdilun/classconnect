package services

import (
	"gorm.io/gorm"
)

// Service is the base interface for all services
type Service interface {
	// GetDB returns the database connection
	GetDB() *gorm.DB
}

// BaseService is the base implementation of Service
type BaseService struct {
	db *gorm.DB
}

// NewBaseService creates a new BaseService
func NewBaseService(db *gorm.DB) *BaseService {
	return &BaseService{
		db: db,
	}
}

// GetDB returns the database connection
func (s *BaseService) GetDB() *gorm.DB {
	return s.db
}
