package services

import (
	"errors"
	"time"

	"github.com/yongdilun/classconnect-backend/api/models"
	"github.com/yongdilun/classconnect-backend/utils"
	"gorm.io/gorm"
)

// ClassService handles class-related operations
type ClassService interface {
	Service
	// Class operations
	CreateClass(teacherID int, className, description, subject, themeColor string) (*models.Class, error)
	GetClassByID(classID int) (*models.Class, error)
	GetClassByCode(classCode string) (*models.Class, error)
	UpdateClass(classID int, className, description, subject, themeColor string) error
	ArchiveClass(classID int) error
	DeleteClass(classID int) error

	// Teacher-specific operations
	GetTeacherClasses(teacherID int) ([]models.Class, error)
	IsTeacherInClass(teacherID, classID int) (bool, error)
	AddTeacherToClass(teacherID, classID int, isOwner bool) error
	RemoveTeacherFromClass(teacherID, classID int) error

	// Student-specific operations
	GetStudentClasses(studentID int) ([]models.Class, error)
	IsStudentInClass(studentID, classID int) (bool, error)
	EnrollStudentInClass(studentID int, classCode string) (*models.Class, error)
	RemoveStudentFromClass(studentID, classID int) error
	GetClassStudents(classID int) ([]models.StudentProfile, error)
}

// ClassServiceImpl implements ClassService
type ClassServiceImpl struct {
	*BaseService
}

// NewClassService creates a new ClassService
func NewClassService(db *gorm.DB) ClassService {
	return &ClassServiceImpl{
		BaseService: NewBaseService(db),
	}
}

// CreateClass creates a new class
func (s *ClassServiceImpl) CreateClass(teacherID int, className, description, subject, themeColor string) (*models.Class, error) {
	// Generate unique class code
	classCode := utils.GenerateRandomString(6)

	// Check if class code already exists
	for {
		var count int64
		s.db.Model(&models.Class{}).Where("class_code = ?", classCode).Count(&count)
		if count == 0 {
			break
		}
		// Generate a new code if collision occurs
		classCode = utils.GenerateRandomString(6)
	}

	// Create class with transaction
	var class models.Class
	var teacherClass models.ClassTeacher

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Create class
		class = models.Class{
			ClassName:   className,
			ClassCode:   classCode,
			Description: description,
			Subject:     subject,
			CreatedDate: time.Now(),
			IsArchived:  false,
			ThemeColor:  themeColor,
			CreatorID:   teacherID,
		}

		if err := tx.Create(&class).Error; err != nil {
			return err
		}

		// Create teacher-class relationship
		teacherClass = models.ClassTeacher{
			UserID:    teacherID,
			ClassID:   class.ClassID,
			IsOwner:   true,
			AddedDate: time.Now(),
		}

		if err := tx.Create(&teacherClass).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &class, nil
}

// GetClassByID retrieves a class by ID
func (s *ClassServiceImpl) GetClassByID(classID int) (*models.Class, error) {
	var class models.Class
	if err := s.db.First(&class, classID).Error; err != nil {
		return nil, err
	}
	return &class, nil
}

// GetClassByCode retrieves a class by code
func (s *ClassServiceImpl) GetClassByCode(classCode string) (*models.Class, error) {
	var class models.Class
	if err := s.db.Where("class_code = ?", classCode).First(&class).Error; err != nil {
		return nil, err
	}
	return &class, nil
}

// UpdateClass updates a class
func (s *ClassServiceImpl) UpdateClass(classID int, className, description, subject, themeColor string) error {
	updates := map[string]interface{}{
		"class_name":  className,
		"description": description,
		"subject":     subject,
		"theme_color": themeColor,
	}

	return s.db.Model(&models.Class{}).Where("class_id = ?", classID).Updates(updates).Error
}

// ArchiveClass archives a class
func (s *ClassServiceImpl) ArchiveClass(classID int) error {
	return s.db.Model(&models.Class{}).Where("class_id = ?", classID).Update("is_archived", true).Error
}

// DeleteClass deletes a class
func (s *ClassServiceImpl) DeleteClass(classID int) error {
	return s.db.Delete(&models.Class{}, classID).Error
}

// GetTeacherClasses retrieves all classes for a teacher
func (s *ClassServiceImpl) GetTeacherClasses(teacherID int) ([]models.Class, error) {
	var classes []models.Class

	err := s.db.Joins("JOIN class_teachers ON classes.class_id = class_teachers.class_id").
		Where("class_teachers.user_id = ?", teacherID).
		Find(&classes).Error

	if err != nil {
		return nil, err
	}

	return classes, nil
}

// IsTeacherInClass checks if a teacher is in a class
func (s *ClassServiceImpl) IsTeacherInClass(teacherID, classID int) (bool, error) {
	var count int64
	err := s.db.Model(&models.ClassTeacher{}).
		Where("user_id = ? AND class_id = ?", teacherID, classID).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// AddTeacherToClass adds a teacher to a class
func (s *ClassServiceImpl) AddTeacherToClass(teacherID, classID int, isOwner bool) error {
	// Check if teacher is already in class
	isInClass, err := s.IsTeacherInClass(teacherID, classID)
	if err != nil {
		return err
	}

	if isInClass {
		return errors.New("teacher is already in this class")
	}

	// Add teacher to class
	teacherClass := models.ClassTeacher{
		UserID:    teacherID,
		ClassID:   classID,
		IsOwner:   isOwner,
		AddedDate: time.Now(),
	}

	return s.db.Create(&teacherClass).Error
}

// RemoveTeacherFromClass removes a teacher from a class
func (s *ClassServiceImpl) RemoveTeacherFromClass(teacherID, classID int) error {
	// Check if teacher is the owner
	var teacherClass models.ClassTeacher
	if err := s.db.Where("user_id = ? AND class_id = ?", teacherID, classID).First(&teacherClass).Error; err != nil {
		return err
	}

	if teacherClass.IsOwner {
		// Count other teachers in class
		var count int64
		s.db.Model(&models.ClassTeacher{}).Where("class_id = ? AND user_id != ?", classID, teacherID).Count(&count)

		if count == 0 {
			return errors.New("cannot remove the only teacher from a class")
		}
	}

	return s.db.Where("user_id = ? AND class_id = ?", teacherID, classID).Delete(&models.ClassTeacher{}).Error
}

// GetStudentClasses retrieves all classes for a student
func (s *ClassServiceImpl) GetStudentClasses(studentID int) ([]models.Class, error) {
	var classes []models.Class

	err := s.db.Joins("JOIN class_enrollments ON classes.class_id = class_enrollments.class_id").
		Where("class_enrollments.user_id = ? AND class_enrollments.is_active = ?", studentID, true).
		Find(&classes).Error

	if err != nil {
		return nil, err
	}

	return classes, nil
}

// IsStudentInClass checks if a student is in a class
func (s *ClassServiceImpl) IsStudentInClass(studentID, classID int) (bool, error) {
	var count int64
	err := s.db.Model(&models.ClassEnrollment{}).
		Where("user_id = ? AND class_id = ? AND is_active = ?", studentID, classID, true).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// EnrollStudentInClass enrolls a student in a class using a class code
func (s *ClassServiceImpl) EnrollStudentInClass(studentID int, classCode string) (*models.Class, error) {
	// Get class by code
	class, err := s.GetClassByCode(classCode)
	if err != nil {
		return nil, errors.New("invalid class code")
	}

	// Check if student is already enrolled
	isEnrolled, err := s.IsStudentInClass(studentID, class.ClassID)
	if err != nil {
		return nil, err
	}

	if isEnrolled {
		return nil, errors.New("student is already enrolled in this class")
	}

	// Enroll student
	enrollment := models.ClassEnrollment{
		UserID:         studentID,
		ClassID:        class.ClassID,
		EnrollmentDate: time.Now(),
		IsActive:       true,
	}

	if err := s.db.Create(&enrollment).Error; err != nil {
		return nil, err
	}

	return class, nil
}

// RemoveStudentFromClass removes a student from a class
func (s *ClassServiceImpl) RemoveStudentFromClass(studentID, classID int) error {
	// Set enrollment to inactive instead of deleting
	return s.db.Model(&models.ClassEnrollment{}).
		Where("user_id = ? AND class_id = ?", studentID, classID).
		Update("is_active", false).Error
}

// GetClassStudents retrieves all students in a class
func (s *ClassServiceImpl) GetClassStudents(classID int) ([]models.StudentProfile, error) {
	var studentProfiles []models.StudentProfile

	// Use student_profiles table instead of students table
	err := s.db.Table("student_profiles").
		Joins("JOIN class_enrollments ON student_profiles.user_id = class_enrollments.user_id").
		Joins("JOIN users ON student_profiles.user_id = users.user_id").
		Select("student_profiles.*, users.email, users.user_role").
		Where("class_enrollments.class_id = ? AND class_enrollments.is_active = ?", classID, true).
		Find(&studentProfiles).Error

	if err != nil {
		return nil, err
	}

	return studentProfiles, nil
}
