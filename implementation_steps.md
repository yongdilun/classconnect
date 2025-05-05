# ClassConnect Implementation Steps

This document provides a detailed, step-by-step guide for implementing the ClassConnect application with separate teacher and student functionality.

## Phase 1: Project Setup and Authentication

### Step 1: Backend Setup

1. **Initialize Go Project**
   ```bash
   mkdir -p backend/api/controllers backend/api/middlewares backend/api/models backend/api/routes
   mkdir -p backend/config backend/database backend/utils
   cd backend
   go mod init github.com/yourusername/classconnect-backend
   ```

2. **Install Dependencies**
   ```bash
   go get -u github.com/gin-gonic/gin
   go get -u gorm.io/gorm
   go get -u gorm.io/driver/sqlserver
   go get -u github.com/golang-jwt/jwt/v5
   go get -u golang.org/x/crypto/bcrypt
   go get -u github.com/joho/godotenv
   ```

3. **Set Up Database Connection**
   - Create database connection in `database/db.go`
   - Implement database models based on ERD in `api/models/`
   - Create migration function in `database/migrations.go`

4. **Create Environment Configuration**
   - Create `.env` file with database and JWT settings
   - Implement configuration loading in `config/config.go`

5. **Implement User Models**
   - Create base User model in `api/models/user.go`
   - Implement Teacher model in `api/models/teacher.go`
   - Create Student model in `api/models/student.go`

### Step 2: Authentication Backend

1. **Create Authentication Controllers**
   - Implement teacher registration in `api/controllers/teacher_auth.go`
   - Create student registration in `api/controllers/student_auth.go`
   - Implement login functionality in `api/controllers/auth.go`

2. **Implement JWT Authentication**
   - Create JWT generation in `utils/jwt.go`
   - Implement token validation
   - Create refresh token functionality

3. **Set Up Authentication Middleware**
   - Create middleware for protected routes in `api/middlewares/auth.go`
   - Implement role-based access control

4. **Create Authentication Routes**
   - Set up teacher auth routes in `api/routes/teacher_auth.go`
   - Create student auth routes in `api/routes/student_auth.go`
   - Implement password reset routes

5. **Test Authentication Endpoints**
   - Test teacher registration and login
   - Test student registration and login
   - Verify JWT token generation and validation

### Step 3: Frontend Setup

1. **Initialize React Project**
   ```bash
   cd ..
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   ```

2. **Install Dependencies**
   ```bash
   npm install react-router-dom axios jwt-decode react-hook-form
   npm install -D postcss postcss-preset-env autoprefixer
   ```

3. **Set Up Project Structure**
   ```bash
   mkdir -p src/components/common src/components/layout
   mkdir -p src/pages/auth/teacher src/pages/auth/student
   mkdir -p src/pages/dashboard/teacher src/pages/dashboard/student
   mkdir -p src/services src/utils src/types src/styles
   ```

4. **Configure PostCSS**
   - Create `postcss.config.js`
   - Set up CSS variables in `src/styles/global.css`
   - Import global styles in `src/index.css`

5. **Set Up Routing**
   - Configure React Router in `src/App.tsx`
   - Create protected route component
   - Set up role-based routing

### Step 4: Authentication Frontend

1. **Create Authentication Service**
   - Implement API service in `src/services/api.ts`
   - Create authentication service in `src/services/authService.ts`
   - Implement token storage and management

2. **Create Teacher Signup Page**
   - Create form component in `src/pages/auth/teacher/Signup.tsx`
   - Implement form validation
   - Add department field specific to teachers
   - Connect to backend API

3. **Create Student Signup Page**
   - Create form component in `src/pages/auth/student/Signup.tsx`
   - Implement form validation
   - Add grade level field specific to students
   - Connect to backend API

4. **Create Teacher Login Page**
   - Implement login form in `src/pages/auth/teacher/Login.tsx`
   - Add validation and error handling
   - Connect to backend API

5. **Create Student Login Page**
   - Implement login form in `src/pages/auth/student/Login.tsx`
   - Add validation and error handling
   - Connect to backend API

6. **Implement Authentication Context**
   - Create context in `src/context/AuthContext.tsx`
   - Implement user state management
   - Add login/logout functionality
   - Create role-based access control

7. **Create Landing Page**
   - Implement landing page with role selection
   - Add navigation to appropriate login/signup pages
   - Create responsive design

### Step 5: User Profile Management

1. **Backend Profile Endpoints**
   - Create profile retrieval endpoint
   - Implement profile update functionality
   - Add profile picture upload

2. **Frontend Profile Components**
   - Create profile page for teachers
   - Implement profile page for students
   - Add profile editing functionality

## Phase 2: Teacher Functionality

### Step 1: Class Management Backend

1. **Create Class Model**
   - Implement class model in `api/models/class.go`
   - Create class-teacher relationship model
   - Add class code generation functionality

2. **Implement Class Controllers**
   - Create class creation endpoint
   - Implement class update and deletion
   - Add class listing for teachers

3. **Set Up Class Routes**
   - Create routes for class management
   - Implement middleware for class ownership

### Step 2: Class Management Frontend

1. **Create Class Creation Components**
   - Implement class creation form
   - Add validation and error handling
   - Create class code display

2. **Implement Teacher Dashboard**
   - Create dashboard layout
   - Add class listing component
   - Implement class card component

3. **Create Class Detail Page**
   - Implement class overview
   - Add tabs for different sections
   - Create class settings component

### Step 3: Assignment Management Backend

1. **Create Assignment Models**
   - Implement assignment model
   - Create assignment materials model
   - Add assignment type model

2. **Implement Assignment Controllers**
   - Create assignment creation endpoint
   - Implement assignment update and deletion
   - Add assignment publishing functionality
   - Create file upload for materials

3. **Set Up Assignment Routes**
   - Create routes for assignment management
   - Implement middleware for assignment ownership

### Step 4: Assignment Management Frontend

1. **Create Assignment Creation Components**
   - Implement assignment creation form
   - Add file upload functionality
   - Create publishing options

2. **Implement Assignment Listing**
   - Create assignment list component
   - Add filtering and sorting
   - Implement assignment card component

3. **Create Assignment Detail Page**
   - Implement assignment overview
   - Add materials section
   - Create settings component

### Step 5: Grading System Backend

1. **Create Submission Models**
   - Implement submission model
   - Create submission files model

2. **Implement Grading Controllers**
   - Create submission listing endpoint
   - Implement grading functionality
   - Add feedback mechanism

3. **Set Up Grading Routes**
   - Create routes for submission management
   - Implement middleware for grading permissions

### Step 6: Grading System Frontend

1. **Create Submission Viewing Components**
   - Implement submission list component
   - Add submission detail view
   - Create file viewer

2. **Implement Grading Interface**
   - Create grading form
   - Add feedback input
   - Implement grade calculation

3. **Create Gradebook View**
   - Implement class gradebook
   - Add student performance overview
   - Create grade export functionality

## Phase 3: Student Functionality

### Step 1: Class Enrollment Backend

1. **Create Enrollment Model**
   - Implement enrollment model
   - Add enrollment status tracking

2. **Implement Enrollment Controllers**
   - Create class joining endpoint
   - Implement class listing for students
   - Add class leaving functionality

3. **Set Up Enrollment Routes**
   - Create routes for class enrollment
   - Implement middleware for enrollment verification

### Step 2: Class Enrollment Frontend

1. **Create Class Joining Components**
   - Implement class code input form
   - Add validation and error handling
   - Create success confirmation

2. **Implement Student Dashboard**
   - Create dashboard layout
   - Add enrolled classes listing
   - Implement upcoming assignments section

3. **Create Class View for Students**
   - Implement class overview
   - Add tabs for different sections
   - Create class stream component

### Step 3: Assignment Viewing Backend

1. **Implement Assignment Viewing Controllers**
   - Create assignment listing endpoint for students
   - Implement assignment detail endpoint
   - Add material download functionality

2. **Set Up Assignment Routes for Students**
   - Create routes for assignment viewing
   - Implement middleware for enrollment verification

### Step 4: Assignment Viewing Frontend

1. **Create Assignment List Components**
   - Implement assignment list for students
   - Add filtering by status
   - Create assignment card component

2. **Implement Assignment Detail View**
   - Create assignment detail page
   - Add materials download section
   - Implement due date tracking

### Step 5: Submission System Backend

1. **Implement Submission Controllers**
   - Create submission creation endpoint
   - Implement submission update functionality
   - Add file upload for submissions

2. **Set Up Submission Routes**
   - Create routes for submission management
   - Implement middleware for submission ownership

### Step 6: Submission System Frontend

1. **Create Submission Components**
   - Implement submission form
   - Add file upload functionality
   - Create submission confirmation

2. **Implement Submission History**
   - Create submission history view
   - Add status tracking
   - Implement feedback viewing

3. **Create Grade Viewing**
   - Implement grade overview
   - Add detailed feedback view
   - Create performance tracking

## Phase 4: Shared Functionality

### Step 1: Announcement System

1. **Backend Implementation**
   - Create announcement model
   - Implement announcement controllers
   - Set up announcement routes

2. **Frontend Implementation**
   - Create announcement creation for teachers
   - Implement announcement viewing for both roles
   - Add notification for new announcements

### Step 2: Comment System

1. **Backend Implementation**
   - Create comment model
   - Implement comment controllers
   - Set up comment routes

2. **Frontend Implementation**
   - Create comment components
   - Implement threaded comments
   - Add mention functionality

### Step 3: Notification System

1. **Backend Implementation**
   - Create notification model
   - Implement notification controllers
   - Set up notification routes

2. **Frontend Implementation**
   - Create notification components
   - Implement notification center
   - Add real-time updates

### Step 4: Calendar Integration

1. **Backend Implementation**
   - Create calendar event model
   - Implement calendar controllers
   - Set up calendar routes

2. **Frontend Implementation**
   - Create calendar component
   - Implement event creation
   - Add assignment integration

## Phase 5: Testing and Deployment

### Step 1: Testing

1. **Backend Testing**
   - Write unit tests for controllers
   - Implement integration tests for API
   - Create database model tests

2. **Frontend Testing**
   - Write component tests
   - Implement form validation tests
   - Create route protection tests

### Step 2: Optimization

1. **Backend Optimization**
   - Implement caching
   - Optimize database queries
   - Add performance monitoring

2. **Frontend Optimization**
   - Optimize bundle size
   - Implement code splitting
   - Add performance monitoring

### Step 3: Deployment

1. **Backend Deployment**
   - Set up production database
   - Configure environment variables
   - Deploy API server

2. **Frontend Deployment**
   - Build production bundle
   - Configure environment variables
   - Deploy static assets

## Detailed Implementation of Key Features

### Teacher Registration Process

1. **Backend Implementation**
   ```go
   // api/controllers/teacher_auth.go
   func RegisterTeacher(c *gin.Context) {
       var input TeacherRegistrationInput
       if err := c.ShouldBindJSON(&input); err != nil {
           c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
           return
       }
       
       // Create user record
       user := models.User{
           Email:        input.Email,
           PasswordHash: utils.HashPassword(input.Password),
           FirstName:    input.FirstName,
           LastName:     input.LastName,
           UserRole:     "teacher",
       }
       
       if err := db.Create(&user).Error; err != nil {
           c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
           return
       }
       
       // Create teacher record
       teacher := models.Teacher{
           TeacherID:  user.UserID,
           Department: input.Department,
           HireDate:   time.Now(),
       }
       
       if err := db.Create(&teacher).Error; err != nil {
           // Rollback user creation if teacher creation fails
           db.Delete(&user)
           c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create teacher profile"})
           return
       }
       
       // Generate JWT token
       token, err := utils.GenerateToken(user)
       if err != nil {
           c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
           return
       }
       
       c.JSON(http.StatusCreated, gin.H{
           "message": "Teacher registered successfully",
           "token": token,
           "user": user,
       })
   }
   ```

2. **Frontend Implementation**
   ```tsx
   // src/pages/auth/teacher/Signup.tsx
   import React, { useState } from 'react';
   import { useForm } from 'react-hook-form';
   import { useNavigate } from 'react-router-dom';
   import authService from '../../../services/authService';
   import Button from '../../../components/common/Button';
   
   interface TeacherSignupForm {
     email: string;
     password: string;
     confirmPassword: string;
     firstName: string;
     lastName: string;
     department: string;
   }
   
   const TeacherSignup: React.FC = () => {
     const { register, handleSubmit, formState: { errors }, watch } = useForm<TeacherSignupForm>();
     const [error, setError] = useState<string | null>(null);
     const [isLoading, setIsLoading] = useState(false);
     const navigate = useNavigate();
     
     const onSubmit = async (data: TeacherSignupForm) => {
       if (data.password !== data.confirmPassword) {
         setError("Passwords don't match");
         return;
       }
       
       setIsLoading(true);
       setError(null);
       
       try {
         await authService.registerTeacher({
           email: data.email,
           password: data.password,
           firstName: data.firstName,
           lastName: data.lastName,
           department: data.department
         });
         
         navigate('/teacher/dashboard');
       } catch (err: any) {
         setError(err.response?.data?.message || 'Registration failed');
       } finally {
         setIsLoading(false);
       }
     };
     
     return (
       <div className="signup-container">
         <div className="signup-form-container">
           <h2 className="signup-title">Teacher Sign Up</h2>
           
           {error && <div className="signup-error">{error}</div>}
           
           <form className="signup-form" onSubmit={handleSubmit(onSubmit)}>
             {/* Form fields for email, password, name, department */}
             
             <Button
               type="submit"
               variant="primary"
               className="signup-button"
               disabled={isLoading}
             >
               {isLoading ? 'Creating Account...' : 'Sign Up'}
             </Button>
           </form>
         </div>
       </div>
     );
   };
   
   export default TeacherSignup;
   ```

### Class Creation Process

1. **Backend Implementation**
   ```go
   // api/controllers/class_controller.go
   func CreateClass(c *gin.Context) {
       // Get teacher ID from JWT token
       teacherID, exists := c.Get("userID")
       if !exists {
           c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
           return
       }
       
       var input ClassCreationInput
       if err := c.ShouldBindJSON(&input); err != nil {
           c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
           return
       }
       
       // Generate unique class code
       classCode := utils.GenerateRandomString(6)
       
       // Create class record
       class := models.Class{
           ClassName:   input.Name,
           ClassCode:   classCode,
           Description: input.Description,
           Subject:     input.Subject,
           ThemeColor:  input.ThemeColor,
           CreatorID:   teacherID.(int),
       }
       
       if err := db.Create(&class).Error; err != nil {
           c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create class"})
           return
       }
       
       // Create teacher-class relationship
       teacherClass := models.ClassTeacher{
           TeacherID: teacherID.(int),
           ClassID:   class.ClassID,
           IsOwner:   true,
       }
       
       if err := db.Create(&teacherClass).Error; err != nil {
           // Rollback class creation if relationship creation fails
           db.Delete(&class)
           c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign teacher to class"})
           return
       }
       
       c.JSON(http.StatusCreated, gin.H{
           "message": "Class created successfully",
           "class": class,
       })
   }
   ```

2. **Frontend Implementation**
   ```tsx
   // src/pages/teacher/CreateClass.tsx
   import React, { useState } from 'react';
   import { useForm } from 'react-hook-form';
   import { useNavigate } from 'react-router-dom';
   import classService from '../../services/classService';
   import Button from '../../components/common/Button';
   
   interface ClassForm {
     name: string;
     subject: string;
     description: string;
     themeColor: string;
   }
   
   const CreateClass: React.FC = () => {
     const { register, handleSubmit, formState: { errors } } = useForm<ClassForm>();
     const [error, setError] = useState<string | null>(null);
     const [isLoading, setIsLoading] = useState(false);
     const navigate = useNavigate();
     
     const onSubmit = async (data: ClassForm) => {
       setIsLoading(true);
       setError(null);
       
       try {
         const response = await classService.createClass({
           name: data.name,
           subject: data.subject,
           description: data.description,
           themeColor: data.themeColor || '#4f46e5',
         });
         
         navigate(`/teacher/classes/${response.class.classId}`);
       } catch (err: any) {
         setError(err.response?.data?.message || 'Failed to create class');
       } finally {
         setIsLoading(false);
       }
     };
     
     return (
       <div className="create-class-container">
         <h2 className="page-title">Create a New Class</h2>
         
         {error && <div className="error-message">{error}</div>}
         
         <form className="create-class-form" onSubmit={handleSubmit(onSubmit)}>
           {/* Form fields for class name, subject, description, theme color */}
           
           <Button
             type="submit"
             variant="primary"
             className="create-button"
             disabled={isLoading}
           >
             {isLoading ? 'Creating...' : 'Create Class'}
           </Button>
         </form>
       </div>
     );
   };
   
   export default CreateClass;
   ```

### Student Class Enrollment Process

1. **Backend Implementation**
   ```go
   // api/controllers/enrollment_controller.go
   func JoinClass(c *gin.Context) {
       // Get student ID from JWT token
       studentID, exists := c.Get("userID")
       if !exists {
           c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
           return
       }
       
       var input ClassJoinInput
       if err := c.ShouldBindJSON(&input); err != nil {
           c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
           return
       }
       
       // Find class by code
       var class models.Class
       if err := db.Where("class_code = ?", input.ClassCode).First(&class).Error; err != nil {
           c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
           return
       }
       
       // Check if student is already enrolled
       var existingEnrollment models.ClassEnrollment
       result := db.Where("student_id = ? AND class_id = ?", studentID, class.ClassID).First(&existingEnrollment)
       if result.RowsAffected > 0 {
           c.JSON(http.StatusConflict, gin.H{"error": "Already enrolled in this class"})
           return
       }
       
       // Create enrollment record
       enrollment := models.ClassEnrollment{
           StudentID: studentID.(int),
           ClassID:   class.ClassID,
       }
       
       if err := db.Create(&enrollment).Error; err != nil {
           c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enroll in class"})
           return
       }
       
       c.JSON(http.StatusCreated, gin.H{
           "message": "Successfully enrolled in class",
           "enrollment": enrollment,
           "class": class,
       })
   }
   ```

2. **Frontend Implementation**
   ```tsx
   // src/pages/student/JoinClass.tsx
   import React, { useState } from 'react';
   import { useForm } from 'react-hook-form';
   import { useNavigate } from 'react-router-dom';
   import enrollmentService from '../../services/enrollmentService';
   import Button from '../../components/common/Button';
   
   interface JoinClassForm {
     classCode: string;
   }
   
   const JoinClass: React.FC = () => {
     const { register, handleSubmit, formState: { errors } } = useForm<JoinClassForm>();
     const [error, setError] = useState<string | null>(null);
     const [isLoading, setIsLoading] = useState(false);
     const navigate = useNavigate();
     
     const onSubmit = async (data: JoinClassForm) => {
       setIsLoading(true);
       setError(null);
       
       try {
         const response = await enrollmentService.joinClass({
           classCode: data.classCode,
         });
         
         navigate(`/student/classes/${response.class.classId}`);
       } catch (err: any) {
         setError(err.response?.data?.message || 'Failed to join class');
       } finally {
         setIsLoading(false);
       }
     };
     
     return (
       <div className="join-class-container">
         <h2 className="page-title">Join a Class</h2>
         
         {error && <div className="error-message">{error}</div>}
         
         <form className="join-class-form" onSubmit={handleSubmit(onSubmit)}>
           <div className="form-group">
             <label htmlFor="classCode">Class Code</label>
             <input
               id="classCode"
               type="text"
               className="form-input"
               placeholder="Enter class code"
               {...register('classCode', { required: 'Class code is required' })}
             />
             {errors.classCode && <p className="input-error">{errors.classCode.message}</p>}
           </div>
           
           <Button
             type="submit"
             variant="primary"
             className="join-button"
             disabled={isLoading}
           >
             {isLoading ? 'Joining...' : 'Join Class'}
           </Button>
         </form>
       </div>
     );
   };
   
   export default JoinClass;
   ```

This implementation plan provides a comprehensive roadmap for developing the ClassConnect application with separate teacher and student functionality. By following these steps, you'll create a robust learning management system that meets the requirements specified in your ERD.
