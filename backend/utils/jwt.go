package utils

import (
	"errors"
	"fmt"
	"log"
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
		log.Printf("JWT_EXPIRATION not set, using default: %s", expirationStr)
	} else {
		log.Printf("Using JWT_EXPIRATION from env: %s", expirationStr)
	}

	expiration, err := time.ParseDuration(expirationStr)
	if err != nil {
		log.Printf("Error parsing JWT_EXPIRATION: %v", err)
		return "", err
	}

	// Get JWT secret from environment
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Printf("WARNING: JWT_SECRET not set, using default secret")
		jwtSecret = "default_secret_key_for_development_only"
	} else {
		log.Printf("Using JWT_SECRET from env (length: %d)", len(jwtSecret))
	}

	// Create claims with user information
	claims := jwt.MapClaims{
		"userId": user.UserID,
		"email":  user.Email,
		"role":   user.UserRole,
		"exp":    time.Now().Add(expiration).Unix(),
	}

	log.Printf("Creating JWT token for user ID: %d, role: %s", user.UserID, user.UserRole)

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token
	log.Printf("Attempting to sign token with secret (length: %d)", len(jwtSecret))

	// Use a defer/recover to catch any panics during token signing
	var tokenString string
	var signErr error

	func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("PANIC during token signing: %v", r)
				signErr = fmt.Errorf("panic during token signing: %v", r)
			}
		}()

		tokenString, signErr = token.SignedString([]byte(jwtSecret))
	}()

	// Check for errors from the signing process
	if signErr != nil {
		log.Printf("Error signing token: %v", signErr)
		return "", signErr
	}

	// Validate the token string
	if tokenString == "" {
		log.Printf("ERROR: Empty token string generated")
		return "", fmt.Errorf("empty token string generated")
	}

	log.Printf("JWT token generated successfully: %s...", tokenString[:10])
	return tokenString, nil
}

// ValidateToken validates the JWT token
func ValidateToken(tokenString string) (*jwt.Token, error) {
	// Get JWT secret from environment
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Printf("WARNING: JWT_SECRET not set, using default secret")
		jwtSecret = "default_secret_key_for_development_only"
	}

	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		log.Printf("Error validating token: %v", err)
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

	// Extract user ID from claims - try both "userId" and "userID"
	var userID float64
	var userIDOk bool

	// First try "userId" (matches what's in GenerateToken)
	userID, userIDOk = claims["userId"].(float64)
	if !userIDOk {
		// Then try "userID" as fallback
		userID, userIDOk = claims["userID"].(float64)
		if !userIDOk {
			log.Printf("Invalid user ID in token. Claims: %v", claims)
			return 0, errors.New("invalid user ID in token")
		}
	}

	return int(userID), nil
}

// ExtractUserRole extracts the user role from the token
func ExtractUserRole(token *jwt.Token) (string, error) {
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid token claims")
	}

	// Extract user role from claims
	role, ok := claims["role"].(string)
	if !ok {
		return "", errors.New("invalid user role in token")
	}

	return role, nil
}
