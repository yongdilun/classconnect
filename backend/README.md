# ClassConnect Backend

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Database](#database)
  - [Schema](#schema)
  - [Migrations](#migrations)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Classes](#classes)
  - [Assignments](#assignments)
  - [Submissions](#submissions)
  - [Announcements](#announcements)
  - [Chat](#chat)
- [Development](#development)
  - [Running the Server](#running-the-server)
  - [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The ClassConnect backend is built with Go and provides a RESTful API for the ClassConnect learning management system. It handles user authentication, class management, assignments, submissions, announcements, and real-time chat functionality.

## Technology Stack

- **Go**: Programming language (v1.20+)
- **Gin**: Web framework for building APIs
- **GORM**: ORM library for database interactions
- **JWT**: Authentication mechanism
- **MSSQL**: Microsoft SQL Server for data storage

## Project Structure

```
backend/
├── api/
│   ├── controllers/     # Request handlers
│   │   ├── auth_controller.go
│   │   ├── class_controller.go
│   │   ├── assignment_controller.go
│   │   ├── submission_controller.go
│   │   ├── announcement_controller.go
│   │   ├── chat_controller.go
│   │   └── user_controller.go
│   ├── middlewares/     # Middleware functions
│   │   ├── auth_middleware.go
│   │   └── role_middleware.go
│   ├── models/          # Data models
│   │   ├── user.go
│   │   ├── class.go
│   │   ├── assignment.go
│   │   ├── submission.go
│   │   ├── announcement.go
│   │   └── chat.go
│   ├── routes/          # API route definitions
│   │   └── routes.go
│   └── services/        # Business logic
│       ├── auth_service.go
│       ├── class_service.go
│       ├── assignment_service.go
│       ├── submission_service.go
│       ├── announcement_service.go
│       ├── chat_service.go
│       └── user_service.go
├── database/
│   ├── migrations.go    # Database migration logic
│   └── db.go            # Database connection setup
├── utils/               # Utility functions
│   ├── jwt.go
│   ├── password.go
│   └── random.go
├── main.go              # Application entry point
└── go.mod               # Go module definition
```

## Getting Started

### Prerequisites

- Go 1.20 or higher
- Microsoft SQL Server (2019 or higher)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yongdilun/classconnect.git
   cd classconnect/backend
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

### Environment Configuration

Create a `.env` file in the backend directory with the following content:

```env
# Database Configuration
DB_USER=sa
DB_PASSWORD=YourPassword
DB_HOST=localhost
DB_PORT=1433
DB_NAME=ClassConnect

# Server Configuration
PORT=8080
GIN_MODE=debug  # Use 'release' for production

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=72h
```

## Database

### Schema

The database schema includes the following main tables:

- **users**: User authentication and profile information
- **teacher_profiles**: Teacher-specific profile information
- **student_profiles**: Student-specific profile information
- **classes**: Class information and metadata
- **class_teachers**: Many-to-many relationship between teachers and classes
- **class_enrollments**: Many-to-many relationship between students and classes
- **assignments**: Assignment details and requirements
- **submissions**: Student submissions for assignments
- **announcements**: Class announcements
- **chat_messages**: Messages in class chat

### Migrations

The application automatically manages the database schema through migrations. When you start the server, it will:

1. Create the database if it doesn't exist
2. Create any missing tables if they don't exist

The application does not drop or modify existing tables, ensuring your data is preserved.

## API Documentation

### Authentication

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/auth/register` | POST | Register a new user | `{email, password, firstName, lastName, role, [department/gradeLevel]}` | `{token, user}` |
| `/api/auth/login` | POST | Authenticate a user | `{email, password, role}` | `{token, user}` |
| `/api/users/me` | GET | Get current user info | - | `{userId, email, firstName, lastName, role}` |

### Classes

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/classes` | POST | Create a new class | `{className, description, subject, themeColor}` | `{classId, className, classCode, ...}` |
| `/api/classes/teacher/:teacherId` | GET | Get teacher's classes | - | `[{classId, className, ...}]` |
| `/api/classes/student/:studentId` | GET | Get student's classes | - | `[{classId, className, ...}]` |
| `/api/classes/:id` | GET | Get class details | - | `{classId, className, ...}` |
| `/api/classes/join` | POST | Join a class | `{classCode}` | `{message, class}` |

### Assignments

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/classes/:id/assignments` | GET | Get class assignments | - | `[{assignmentId, title, ...}]` |
| `/api/classes/:id/assignments` | POST | Create assignment | `{title, description, dueDate, pointsPossible}` | `{assignmentId, title, ...}` |
| `/api/classes/:id/assignments/:assignmentId` | GET | Get assignment details | - | `{assignmentId, title, ...}` |

### Submissions

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/classes/:id/assignments/:assignmentId/submit` | POST | Submit assignment | `{content, fileURL}` | `{submissionId, ...}` |
| `/api/classes/:id/assignments/:assignmentId/submissions` | GET | Get all submissions | - | `[{submissionId, ...}]` |
| `/api/classes/:id/assignments/:assignmentId/submissions/:studentId` | GET | Get student submission | - | `{submissionId, ...}` |
| `/api/classes/:id/assignments/:assignmentId/submissions/:studentId` | PUT | Grade submission | `{grade, feedback}` | `{submissionId, ...}` |

## Development

### Running the Server

To run the server in development mode:

```bash
go run main.go
```

The server will start on the port specified in your `.env` file (default: 8080).

### Testing

To run tests:

```bash
go test ./...
```

## Deployment

1. Build the application:
   ```bash
   go build -o classconnect
   ```

2. Set up environment variables on your server
3. Run the compiled binary:
   ```bash
   ./classconnect
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your database credentials in the `.env` file
   - Ensure SQL Server is running and accessible
   - Check that the database user has appropriate permissions

2. **JWT Authentication Issues**
   - Ensure JWT_SECRET is properly set and consistent
   - Check token expiration settings

3. **CORS Issues**
   - If frontend cannot connect, check CORS configuration in `main.go`
   - Verify the frontend URL is properly allowed in CORS settings
