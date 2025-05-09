package utils

import (
	"log"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword creates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	log.Printf("Hashing password (length: %d)", len(password))
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return "", err
	}
	hash := string(bytes)
	log.Printf("Password hashed successfully (hash length: %d)", len(hash))
	return hash, nil
}

// CheckPasswordHash compares a password with a hash
func CheckPasswordHash(password, hash string) bool {
	log.Printf("Checking password (length: %d) against hash (length: %d)", len(password), len(hash))
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		log.Printf("Password check failed: %v", err)
		return false
	}
	log.Printf("Password check successful")
	return true
}
