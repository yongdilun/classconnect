Write-Host "Starting ClassConnect backend with hot reload..." -ForegroundColor Green

# Add Go bin directory to PATH if it's not already there
$goPath = if ($env:GOPATH) { $env:GOPATH } else { Join-Path $env:USERPROFILE "go" }
$goBin = Join-Path $goPath "bin"
$airPath = Join-Path $goBin "air.exe"

# Ensure tmp directory exists
if (-not (Test-Path "tmp")) {
    Write-Host "Creating tmp directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "tmp" | Out-Null
}

# Check if Air is installed
if (Test-Path $airPath) {
    Write-Host "Found Air at: $airPath" -ForegroundColor Cyan

    # Add Go bin to PATH temporarily for this session
    $env:PATH += ";$goBin"

    # Run Air
    Write-Host "Running Air..." -ForegroundColor Green
    & air
} else {
    Write-Host "Air not found at: $airPath" -ForegroundColor Red
    Write-Host "Installing Air..." -ForegroundColor Yellow

    try {
        # Install Air
        & go install github.com/air-verse/air@latest

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Air installed successfully!" -ForegroundColor Green

            # Add Go bin to PATH temporarily for this session
            $env:PATH += ";$goBin"

            # Run Air
            Write-Host "Running Air..." -ForegroundColor Green
            & air
        } else {
            Write-Host "Failed to install Air. Please install it manually with: go install github.com/air-verse/air@latest" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "Error installing Air: $_" -ForegroundColor Red
        Write-Host "Please install Air manually with: go install github.com/air-verse/air@latest" -ForegroundColor Yellow
        exit 1
    }
}
