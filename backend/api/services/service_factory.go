package services

import (
	"sync"

	"gorm.io/gorm"
)

// ServiceFactory provides access to all services
type ServiceFactory interface {
	// Get services
	UserService() UserService
	AuthService() AuthService
	ClassService() ClassService
	ChatService() ChatService
	AssignmentService() AssignmentService
	AnnouncementService() AnnouncementService
}

// serviceFactoryImpl implements ServiceFactory
type serviceFactoryImpl struct {
	db *gorm.DB

	// Services
	userService         UserService
	authService         AuthService
	classService        ClassService
	chatService         ChatService
	assignmentService   AssignmentService
	announcementService AnnouncementService

	// Mutex for lazy initialization
	mu sync.Mutex
}

// NewServiceFactory creates a new ServiceFactory
func NewServiceFactory(db *gorm.DB) ServiceFactory {
	return &serviceFactoryImpl{
		db: db,
	}
}

// UserService returns the UserService
func (f *serviceFactoryImpl) UserService() UserService {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.userService == nil {
		f.userService = NewUserService(f.db)
	}

	return f.userService
}

// AuthService returns the AuthService
func (f *serviceFactoryImpl) AuthService() AuthService {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.authService == nil {
		f.authService = NewAuthService(f.db)
	}

	return f.authService
}

// ClassService returns the ClassService
func (f *serviceFactoryImpl) ClassService() ClassService {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.classService == nil {
		f.classService = NewClassService(f.db)
	}

	return f.classService
}

// ChatService returns the ChatService
func (f *serviceFactoryImpl) ChatService() ChatService {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.chatService == nil {
		f.chatService = NewChatService(f.db)
	}

	return f.chatService
}

// AssignmentService returns the AssignmentService
func (f *serviceFactoryImpl) AssignmentService() AssignmentService {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.assignmentService == nil {
		f.assignmentService = NewAssignmentService(f.db)
	}

	return f.assignmentService
}

// AnnouncementService returns the AnnouncementService
func (f *serviceFactoryImpl) AnnouncementService() AnnouncementService {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.announcementService == nil {
		f.announcementService = NewAnnouncementService(f.db)
	}

	return f.announcementService
}
