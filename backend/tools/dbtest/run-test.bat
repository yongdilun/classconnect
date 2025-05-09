@echo off
echo Running database tests...
cd %~dp0
go run dbtest.go
pause
