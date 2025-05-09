@echo off
echo Running database tests...
cd cmd\dbtest
go run main.go
cd ..\..
pause
