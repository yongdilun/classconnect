package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/api/services"
)

// AnnouncementController handles announcement-related requests
type AnnouncementController struct {
	announcementService services.AnnouncementService
}

// NewAnnouncementController creates a new AnnouncementController
func NewAnnouncementController(announcementService services.AnnouncementService) *AnnouncementController {
	return &AnnouncementController{
		announcementService: announcementService,
	}
}

// GetAnnouncements handles GET /api/classes/:id/announcements
func (c *AnnouncementController) GetAnnouncements(ctx *gin.Context) {
	// Parse class ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	// Get announcements for the class
	announcements, err := c.announcementService.GetAnnouncements(classID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, announcements)
}

// GetAnnouncement handles GET /api/classes/:id/announcements/:announcementId
func (c *AnnouncementController) GetAnnouncement(ctx *gin.Context) {
	// Parse announcement ID from URL
	announcementIDStr := ctx.Param("announcementId")
	announcementID, err := strconv.Atoi(announcementIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid announcement ID"})
		return
	}

	// Get the announcement
	announcement, err := c.announcementService.GetAnnouncement(announcementID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, announcement)
}

// CreateAnnouncement handles POST /api/classes/:id/announcements
func (c *AnnouncementController) CreateAnnouncement(ctx *gin.Context) {
	// Parse class ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	// Get user ID from context
	userID, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var request struct {
		Content string `json:"content" binding:"required"`
		Title   string `json:"title"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Create announcement
	announcement, err := c.announcementService.CreateAnnouncement(classID, userID.(int), request.Content, request.Title)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, announcement)
}

// UpdateAnnouncement handles PUT /api/classes/:id/announcements/:announcementId
func (c *AnnouncementController) UpdateAnnouncement(ctx *gin.Context) {
	// Parse announcement ID from URL
	announcementIDStr := ctx.Param("announcementId")
	announcementID, err := strconv.Atoi(announcementIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid announcement ID"})
		return
	}

	// Get user ID from context
	userID, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var request struct {
		Content string `json:"content" binding:"required"`
		Title   string `json:"title"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Update announcement
	announcement, err := c.announcementService.UpdateAnnouncement(announcementID, userID.(int), request.Content, request.Title)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, announcement)
}

// DeleteAnnouncement handles DELETE /api/classes/:id/announcements/:announcementId
func (c *AnnouncementController) DeleteAnnouncement(ctx *gin.Context) {
	// Parse announcement ID from URL
	announcementIDStr := ctx.Param("announcementId")
	announcementID, err := strconv.Atoi(announcementIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid announcement ID"})
		return
	}

	// Get user ID from context
	userID, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Delete announcement
	err = c.announcementService.DeleteAnnouncement(announcementID, userID.(int))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Announcement deleted successfully"})
}
