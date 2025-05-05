package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yongdilun/classconnect-backend/api/models"
)

// GenerateToken creates a new JWT token for a user
func GenerateToken(user models.User) (string, error) {
	// Get JWT expiration time from environment
	expirationStr := os.Getenv("JWT_EXPIRATION")
	if expirationStr == "" {
		expirationStr = "24h" // Default to 24 hours
	}
	
	expiration, err := time.ParseDuration(expirationStr)
	if err != nil {
		return "", err
	}

	// Create claims with user information
	claims := jwt.MapClaims{
		"userId": user.UserID,
		"email":  user.Email,
		"role":   user.UserRole,
		"exp":    time.Now().Add(expiration).Unix(),
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken validates the JWT token
func ValidateToken(tokenString string) (*jwt.Token, error) {
	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		return nil, err
	}

	return token, nil
}

// ExtractUserID extracts the user ID from the token
func ExtractUserID(token *jwt.Token) (int, error) {
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, errors.New("invalid token claims")
	}

	// Extract user ID from claims
	userID, ok := claims["userId"].(float64)
	if !ok {
		return 0, errors.New("invalid user ID in token")
	}

	return int(userID), nil
}
