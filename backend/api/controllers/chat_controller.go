package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/api/services"
)

// ChatController handles chat-related requests
type ChatController struct {
	chatService services.ChatService
}

// NewChatController creates a new ChatController
func NewChatController(chatService services.ChatService) *ChatController {
	return &ChatController{
		chatService: chatService,
	}
}

// GetChatMessages handles GET /api/classes/:id/chat
func (c *ChatController) GetChatMessages(ctx *gin.Context) {
	// Parse class ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	// Get chat messages
	messages, err := c.chatService.GetChatMessages(classID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, messages)
}

// SendChatMessage handles POST /api/classes/:id/chat
func (c *ChatController) SendChatMessage(ctx *gin.Context) {
	// Parse class ID from URL
	classIDStr := ctx.Param("id")
	classID, err := strconv.Atoi(classIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	// Get user ID from context
	userIDValue, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Convert userID to int
	userID, ok := userIDValue.(int)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	// Parse request body
	var request struct {
		Content string `json:"content" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Send chat message
	message, err := c.chatService.SendChatMessage(classID, userID, request.Content)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, message)
}

// DeleteChatMessage handles DELETE /api/classes/:id/chat/:messageId
func (c *ChatController) DeleteChatMessage(ctx *gin.Context) {
	// Parse message ID from URL
	messageIDStr := ctx.Param("messageId")
	messageID, err := strconv.Atoi(messageIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	// Get user ID from context
	userIDValue, exists := ctx.Get("userId")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Convert userID to int
	userID, ok := userIDValue.(int)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	// Delete chat message
	if err := c.chatService.DeleteChatMessage(messageID, userID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Message deleted successfully"})
}
