@echo off
echo Starting ClassConnect backend with hot reload...

REM Add Go bin directory to PATH if it's not already there
set GOPATH=%USERPROFILE%\go
set GOBIN=%GOPATH%\bin
set PATH=%PATH%;%GOBIN%

REM Ensure tmp directory exists
if not exist tmp mkdir tmp

REM Check if Air is installed
if exist "%GOBIN%\air.exe" (
    echo Found Air at: %GOBIN%\air.exe
    echo Running Air...
    air
) else (
    echo Air not found at: %GOBIN%\air.exe
    echo Installing Air...
    go install github.com/air-verse/air@latest

    if %ERRORLEVEL% EQU 0 (
        echo Air installed successfully!
        echo Running Air...
        air
    ) else (
        echo Failed to install Air. Please install it manually with: go install github.com/air-verse/air@latest
        exit /b 1
    )
)
