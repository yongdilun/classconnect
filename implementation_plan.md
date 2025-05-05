# ClassConnect Implementation Plan

This document outlines the detailed implementation plan for the ClassConnect application, focusing on teacher and student functionality with separate signup and login pages for each role.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Structure](#database-structure)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Authentication Flow](#authentication-flow)
7. [Teacher Features](#teacher-features)
8. [Student Features](#student-features)
9. [Shared Features](#shared-features)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Plan](#deployment-plan)
12. [Timeline](#timeline)

## Project Overview

ClassConnect is a learning management system similar to Google Classroom that allows:
- Teachers to create classes, post assignments, and grade student submissions
- Students to join classes, view assignments, and submit their work
- Both roles to communicate through announcements and comments

The application will have separate authentication flows for teachers and students, with role-specific dashboards and features.

## Technology Stack

### Backend
- Go with Gin Framework
- MSSQL Database
- GORM ORM
- JWT Authentication
- bcrypt for password hashing

### Frontend
- React with TypeScript
- Vite for building
- PostCSS for styling
- React Router for navigation
- Axios for API requests

## Database Structure

The database structure is defined in `erd.txt` and includes the following key tables:

1. **Users**: Base table for all user types
2. **Students/Teachers**: Role-specific tables extending Users
3. **Classes**: Courses created by teachers
4. **Assignments**: Tasks created by teachers for students
5. **Submissions**: Student responses to assignments
6. **Announcements**: Class-wide notifications
7. **Comments**: Discussion on assignments, submissions, etc.

## Backend Implementation

### Phase 1: Setup and Authentication

1. **Database Connection**
   - Implement database connection with GORM
   - Create migration scripts for all tables

2. **Authentication Controllers**
   - Create separate signup endpoints for teachers and students
   - Implement login functionality with JWT
   - Add password reset functionality
   - Create middleware for role-based access control

3. **User Management**
   - Implement user profile endpoints
   - Create settings management endpoints

### Phase 2: Core Functionality

1. **Class Management**
   - Create endpoints for teachers to create/edit/delete classes
   - Implement class code generation
   - Add endpoints for students to join classes
   - Create endpoints to list classes for both roles

2. **Assignment Management**
   - Implement endpoints to create/edit/delete assignments
   - Add file upload functionality for assignment materials
   - Create endpoints to list assignments by class
   - Implement assignment publishing functionality

3. **Submission Management**
   - Create endpoints for students to submit assignments
   - Implement file upload for submissions
   - Add endpoints for teachers to view and grade submissions
   - Create endpoints for students to view their grades

### Phase 3: Additional Features

1. **Announcement System**
   - Implement endpoints to create/edit/delete announcements
   - Add announcement scheduling functionality

2. **Comment System**
   - Create endpoints for adding comments to assignments/submissions
   - Implement threaded comments with parent-child relationships

3. **Notification System**
   - Implement notification creation for various events
   - Create endpoints to fetch and mark notifications as read

4. **Calendar Integration**
   - Add endpoints to create/edit/delete calendar events
   - Implement endpoints to fetch events by date range

## Frontend Implementation

### Phase 1: Setup and Authentication

1. **Project Structure**
   - Set up React project with TypeScript and Vite
   - Configure PostCSS with variables and utilities
   - Set up React Router with protected routes

2. **Authentication Pages**
   - Create separate signup pages for teachers and students
   - Implement login pages for both roles
   - Add password reset functionality
   - Create authentication context for state management

3. **Layout Components**
   - Implement main layout with navigation
   - Create role-specific navigation components
   - Add responsive design for mobile devices

### Phase 2: Teacher Features

1. **Teacher Dashboard**
   - Create dashboard showing classes and recent activity
   - Implement class creation form
   - Add class management interface

2. **Class Management**
   - Create class detail page with tabs for different sections
   - Implement student roster management
   - Add class settings and customization

3. **Assignment Creation**
   - Implement assignment creation form
   - Add file upload for assignment materials
   - Create assignment list and detail views
   - Implement assignment scheduling and publishing

4. **Grading Interface**
   - Create submission review interface
   - Implement grading functionality
   - Add feedback mechanism for submissions
   - Create grade overview for classes

### Phase 3: Student Features

1. **Student Dashboard**
   - Create dashboard showing enrolled classes
   - Implement upcoming assignments view
   - Add recent grades section

2. **Class Enrollment**
   - Create class joining interface with class code
   - Implement class browsing for enrolled classes
   - Add class detail view for students

3. **Assignment View**
   - Create assignment list and detail views
   - Implement submission interface
   - Add file upload for submissions
   - Create submission status tracking

4. **Grade View**
   - Implement grade viewing interface
   - Create assignment feedback view
   - Add overall grade summary

### Phase 4: Shared Features

1. **Announcement System**
   - Create announcement creation interface for teachers
   - Implement announcement viewing for both roles
   - Add notification for new announcements

2. **Comment System**
   - Implement comment interface for assignments
   - Create threaded comment view
   - Add mention functionality

3. **Notification Center**
   - Create notification dropdown in header
   - Implement notification list view
   - Add real-time notification updates

4. **Calendar View**
   - Implement calendar interface
   - Create event creation for teachers
   - Add assignment due date integration

## Authentication Flow

### Teacher Signup Flow
1. Teacher visits `/teacher/signup`
2. Fills out registration form with:
   - Email
   - Password
   - First Name
   - Last Name
   - Department (optional)
   - Profile Picture (optional)
3. System creates user record with role="teacher"
4. System creates teacher record linked to user
5. Teacher is redirected to dashboard

### Student Signup Flow
1. Student visits `/student/signup`
2. Fills out registration form with:
   - Email
   - Password
   - First Name
   - Last Name
   - Grade Level (optional)
   - Profile Picture (optional)
3. System creates user record with role="student"
4. System creates student record linked to user
5. Student is redirected to dashboard

### Login Flow
1. User visits role-specific login page (`/teacher/login` or `/student/login`)
2. Enters email and password
3. System validates credentials and checks role
4. If valid, system generates JWT token
5. User is redirected to role-specific dashboard

## Detailed Feature Implementation

### Teacher Features

#### 1. Class Creation
- **Backend**: `POST /api/classes`
- **Frontend**: Form with fields for name, subject, description, theme color
- **Flow**:
  1. Teacher fills out class creation form
  2. System generates unique class code
  3. Class is created and teacher is assigned as owner
  4. Teacher is redirected to class detail page

#### 2. Assignment Creation
- **Backend**: `POST /api/classes/:classId/assignments`
- **Frontend**: Multi-step form for assignment details, materials, and settings
- **Flow**:
  1. Teacher selects class and creates new assignment
  2. Teacher fills out assignment details (title, description, points, due date)
  3. Teacher uploads any materials
  4. Teacher sets publishing options (immediate or scheduled)
  5. Assignment is created and optionally published

#### 3. Grading Submissions
- **Backend**: `PUT /api/submissions/:submissionId`
- **Frontend**: Grading interface with submission view and grade input
- **Flow**:
  1. Teacher views list of submissions for an assignment
  2. Teacher selects submission to grade
  3. Teacher views submission details and files
  4. Teacher assigns grade and provides feedback
  5. System updates submission status to "graded"
  6. Student receives notification

#### 4. Class Management
- **Backend**: Various endpoints for class settings and roster
- **Frontend**: Class settings page with tabs for different sections
- **Flow**:
  1. Teacher accesses class settings
  2. Teacher can update class details
  3. Teacher can view and manage student roster
  4. Teacher can archive class when complete

### Student Features

#### 1. Joining Classes
- **Backend**: `POST /api/enrollments`
- **Frontend**: Form to enter class code
- **Flow**:
  1. Student enters class code
  2. System validates code and checks if student is already enrolled
  3. System creates enrollment record
  4. Student is redirected to class page

#### 2. Viewing Assignments
- **Backend**: `GET /api/classes/:classId/assignments`
- **Frontend**: List view with filters for status
- **Flow**:
  1. Student selects class
  2. System displays list of published assignments
  3. Student can filter by status (upcoming, completed, graded)
  4. Student can select assignment to view details

#### 3. Submitting Assignments
- **Backend**: `POST /api/assignments/:assignmentId/submissions`
- **Frontend**: Submission form with file upload
- **Flow**:
  1. Student views assignment details
  2. Student creates submission with text response and/or files
  3. System records submission time and checks if late
  4. Student can view submission status

#### 4. Viewing Grades
- **Backend**: `GET /api/students/:studentId/grades`
- **Frontend**: Grade overview with breakdown by class
- **Flow**:
  1. Student accesses grades section
  2. System displays grades for all assignments
  3. Student can filter by class
  4. Student can view detailed feedback for each submission

### Shared Features

#### 1. Announcements
- **Backend**: `POST /api/classes/:classId/announcements`
- **Frontend**: Announcement creation form and feed
- **Flow**:
  1. Teacher creates announcement for class
  2. System publishes announcement immediately or on schedule
  3. Students receive notification
  4. Announcement appears in class feed

#### 2. Comments
- **Backend**: `POST /api/comments`
- **Frontend**: Comment section on assignments and submissions
- **Flow**:
  1. User adds comment to assignment or submission
  2. System records comment and notifies relevant users
  3. Other users can reply, creating threaded discussion

#### 3. Notifications
- **Backend**: Various endpoints trigger notifications
- **Frontend**: Notification center in header
- **Flow**:
  1. System creates notifications for various events
  2. User sees notification count in header
  3. User can view and mark notifications as read

## Implementation Steps

### Backend Implementation Steps

1. **Setup Project Structure**
   - Create directory structure
   - Initialize Go modules
   - Set up configuration files

2. **Database Connection**
   - Implement database connection with GORM
   - Create models based on ERD
   - Set up migrations

3. **Authentication System**
   - Implement user registration for both roles
   - Create login functionality with JWT
   - Set up middleware for protected routes

4. **Core API Endpoints**
   - Implement class management endpoints
   - Create assignment endpoints
   - Set up submission handling
   - Add announcement and comment functionality

5. **Advanced Features**
   - Implement notification system
   - Create calendar integration
   - Add file upload functionality
   - Implement search functionality

### Frontend Implementation Steps

1. **Setup Project Structure**
   - Initialize React project with TypeScript
   - Configure PostCSS
   - Set up routing with React Router

2. **Authentication Pages**
   - Create teacher signup/login pages
   - Implement student signup/login pages
   - Set up authentication context and protected routes

3. **Dashboard Implementation**
   - Create teacher dashboard
   - Implement student dashboard
   - Add shared components

4. **Class Management**
   - Implement class creation for teachers
   - Create class joining for students
   - Add class detail views for both roles

5. **Assignment System**
   - Create assignment creation interface
   - Implement submission interface
   - Add grading functionality
   - Create grade viewing for students

6. **Additional Features**
   - Implement announcement system
   - Add comment functionality
   - Create notification center
   - Implement calendar view

## Testing Strategy

1. **Unit Testing**
   - Test individual components and functions
   - Implement API endpoint tests
   - Create database model tests

2. **Integration Testing**
   - Test authentication flow
   - Verify class creation and enrollment
   - Test assignment creation and submission
   - Validate grading functionality

3. **End-to-End Testing**
   - Test complete user journeys
   - Verify role-specific functionality
   - Test responsive design

## Timeline

### Week 1-2: Setup and Authentication
- Set up project structure for both backend and frontend
- Implement database models and migrations
- Create authentication system for both roles
- Implement basic layout and navigation

### Week 3-4: Core Teacher Functionality
- Implement class creation and management
- Create assignment system
- Add grading functionality
- Implement teacher dashboard

### Week 5-6: Core Student Functionality
- Create class enrollment system
- Implement assignment viewing and submission
- Add grade viewing functionality
- Create student dashboard

### Week 7-8: Shared Features and Polish
- Implement announcements and comments
- Add notification system
- Create calendar integration
- Polish UI and fix bugs

## Conclusion

This implementation plan provides a comprehensive roadmap for developing the ClassConnect application with separate teacher and student functionality. By following this plan, you'll create a robust learning management system that meets the requirements specified in the ERD.

The plan emphasizes a phased approach, starting with core authentication and gradually building out role-specific features. This allows for incremental testing and refinement throughout the development process.
