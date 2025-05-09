# ClassConnect Database Management

This directory contains scripts and utilities for managing the ClassConnect database.

## Database Schema

The ClassConnect application uses the following database schema:

### Users Table
- Contains authentication information only
- Fields: user_id, email, password_hash, user_role, is_active, last_login, created_at, updated_at

### Teacher Profiles Table
- Contains teacher profile information
- Fields: profile_id, user_id, first_name, last_name, department, hire_date, bio, profile_picture, created_at, updated_at
- Foreign key: user_id references users(user_id)

### Student Profiles Table
- Contains student profile information
- Fields: profile_id, user_id, first_name, last_name, grade_level, enrollment_date, profile_picture, created_at, updated_at
- Foreign key: user_id references users(user_id)

### Classes Table
- Contains information about classes
- Fields: class_id, class_name, class_code, description, subject, created_date, is_archived, theme_color, creator_id, created_at, updated_at
- Foreign key: creator_id references teacher_profiles(user_id)

### Class Teachers Table
- Contains information about teachers assigned to classes
- Fields: class_teacher_id, teacher_id, class_id, is_owner, added_date, created_at, updated_at
- Foreign keys: teacher_id references teacher_profiles(user_id), class_id references classes(class_id)

### Class Enrollments Table
- Contains information about students enrolled in classes
- Fields: enrollment_id, student_id, class_id, enrollment_date, is_active, created_at, updated_at
- Foreign keys: student_id references student_profiles(user_id), class_id references classes(class_id)

### Password Resets Table
- Contains information about password reset requests
- Fields: reset_id, user_id, token, expires_at, created_at
- Foreign key: user_id references users(user_id)

## Database Management

### Migrations

The application uses a simple migration system defined in `migrations.go`. This file contains the logic to create all necessary tables if they don't exist.

The migration is automatically run when the application starts.

**Important**: The migration process only creates tables if they don't exist. It does not drop or modify existing tables. This ensures that your data is preserved between application restarts.

### Database Schema Management

To manage your database schema:

1. For creating tables: The application will automatically create missing tables when it starts
   ```
   cd backend
   go run main.go
   ```

2. For modifying or dropping tables: Use your own SQL scripts or database management tools outside of the application

This approach gives you full control over your database while still providing automatic table creation for new installations.

**Warning**: These reset operations will delete data. Use with caution in production environments.
