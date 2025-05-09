package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	// Get the GOPATH
	gopath := os.Getenv("GOPATH")
	if gopath == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			fmt.Println("Error getting user home directory:", err)
			os.Exit(1)
		}
		gopath = filepath.Join(home, "go")
	}

	// Construct the path to the air executable
	airPath := filepath.Join(gopath, "bin", "air")
	if _, err := os.Stat(airPath); os.IsNotExist(err) {
		airPath = filepath.Join(gopath, "bin", "air.exe") // Try with .exe extension for Windows
	}

	// Check if air exists
	if _, err := os.Stat(airPath); os.IsNotExist(err) {
		fmt.Println("Air not found at", airPath)
		fmt.Println("Installing Air...")

		// Try to install Air
		installCmd := exec.Command("go", "install", "github.com/air-verse/air@latest")
		installCmd.Stdout = os.Stdout
		installCmd.Stderr = os.Stderr

		if err := installCmd.Run(); err != nil {
			fmt.Println("Failed to install Air:", err)
			fmt.Println("Please install Air manually with: go install github.com/air-verse/air@latest")
			os.Exit(1)
		}

		fmt.Println("Air installed successfully!")

		// Check if Air was installed correctly
		if _, err := os.Stat(airPath); os.IsNotExist(err) {
			fmt.Println("Air still not found after installation. Please install manually.")
			os.Exit(1)
		}
	}

	// Change to the parent directory (backend root)
	if err := os.Chdir(".."); err != nil {
		fmt.Println("Error changing to backend directory:", err)
		os.Exit(1)
	}

	// Run air
	cmd := exec.Command(airPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	fmt.Println("Starting air for hot reloading...")
	if err := cmd.Run(); err != nil {
		fmt.Println("Error running air:", err)
		os.Exit(1)
	}
}
