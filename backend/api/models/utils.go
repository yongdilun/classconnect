package models

import (
	"time"
)

// ParseTime parses a time string in various formats
func ParseTime(timeStr string) (time.Time, error) {
	// Try different time formats
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, timeStr); err == nil {
			return t, nil
		}
	}

	// If all formats fail, try to parse as a Unix timestamp
	if timestamp, err := time.Parse(time.RFC3339, timeStr); err == nil {
		return timestamp, nil
	}

	// Default to current time if parsing fails
	return time.Now(), nil
}
