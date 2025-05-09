package utils

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"time"
)

// GenerateSimpleToken creates a simple token for demo purposes
func GenerateSimpleToken(userID int, email string) string {
	// Create a simple token using MD5 hash of user ID, email, and current time
	// This is NOT secure for production use, but works for demo purposes
	data := fmt.Sprintf("%d:%s:%d", userID, email, time.Now().Unix())
	hash := md5.Sum([]byte(data))
	return hex.EncodeToString(hash[:])
}
