package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yongdilun/classconnect-backend/utils"
)

// AuthMiddleware verifies the JWT token in the request
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Check if the header has the Bearer prefix
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		// Validate the token
		token, err := utils.ValidateToken(parts[1])
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Extract user ID and role from token
		userID, err := utils.ExtractUserID(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		role, err := utils.ExtractUserRole(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Set user ID, role, and token in context
		c.Set("userID", userID)
		c.Set("userId", userID) // Add this line to support both naming conventions
		c.Set("userRole", role)
		c.Set("token", token)
		c.Next()
	}
}

// RoleMiddleware checks if the user has the required role
func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the user role from context (set by AuthMiddleware)
		userRole, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found in context"})
			c.Abort()
			return
		}

		// Convert to string
		userRoleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user role"})
			c.Abort()
			return
		}

		// Check if user role is in the allowed roles
		roleAllowed := false
		for _, role := range roles {
			if userRoleStr == role {
				roleAllowed = true
				break
			}
		}

		if !roleAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}
