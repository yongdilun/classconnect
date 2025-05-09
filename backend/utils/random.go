package utils

import (
	"crypto/rand"
	"math/big"
	mathrand "math/rand"
	"time"
)

// Initialize secure random number generator
var secureRandom = mathrand.New(mathrand.NewSource(time.Now().UnixNano()))

// GenerateRandomString generates a random string of the specified length
func GenerateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[secureRandom.Intn(len(charset))]
	}
	return string(result)
}

// GenerateSecureRandomString generates a cryptographically secure random string
func GenerateSecureRandomString(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[num.Int64()]
	}
	return string(result), nil
}
