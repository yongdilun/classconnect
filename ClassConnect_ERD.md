# ClassConnect ERD (Entity Relationship Diagram)

## Overview
This document presents the Entity Relationship Diagram for the ClassConnect application, a Google Classroom-like platform for teachers and students.

## Database Schema

### Users and Authentication

```
+----------------+       +-------------------+       +-------------------+
|     users      |       |     teachers      |       |     students      |
+----------------+       +-------------------+       +-------------------+
| PK user_id     |<----->| PK teacher_id     |       | PK student_id     |
| email          |       | department        |       | grade_level       |
| password_hash  |       | hire_date         |       | enrollment_date   |
| first_name     |       | bio               |       |                   |
| last_name      |       +-------------------+       +-------------------+
| profile_picture|               |                           |
| date_registered|               v                           v
| last_login     |       +-------------------+       +-------------------+
| user_role      |       | teacher_profiles  |       | student_profiles  |
| is_active      |       +-------------------+       +-------------------+
+----------------+       | PK profile_id     |       | PK profile_id     |
        ^                | FK user_id        |       | FK user_id        |
        |                | first_name        |       | first_name        |
        |                | last_name         |       | last_name         |
        |                | department        |       | grade_level       |
        |                | hire_date         |       | enrollment_date   |
        |                | profile_picture   |       | profile_picture   |
        |                +-------------------+       +-------------------+
        |
        |                +-------------------+
        +--------------->| password_resets   |
                         +-------------------+
                         | PK reset_id       |
                         | FK user_id        |
                         | token             |
                         | expires_at        |
                         | created_at        |
                         +-------------------+
```

### Classes and Enrollments

```
+----------------+       +-------------------+       +-------------------+
|     classes    |       | class_enrollments |       |   class_teachers  |
+----------------+       +-------------------+       +-------------------+
| PK class_id    |<----->| PK enrollment_id  |       | PK class_teacher_id|
| class_name     |       | FK student_id     |       | FK teacher_id     |
| class_code     |       | FK class_id       |       | FK class_id       |
| description    |       | enrollment_date   |       | is_owner          |
| subject        |       | is_active         |       | added_date        |
| created_date   |       +-------------------+       +-------------------+
| is_archived    |
| theme_color    |
| FK creator_id  |
+----------------+
```

### Assignments and Submissions

```
+----------------+       +-------------------+       +-------------------+
|assignment_types|       |    assignments    |       |assignment_materials|
+----------------+       +-------------------+       +-------------------+
| PK type_id     |<----->| PK assignment_id  |<----->| PK material_id    |
| type_name      |       | FK class_id       |       | FK assignment_id  |
| description    |       | title             |       | file_name         |
+----------------+       | description       |       | file_type         |
                         | FK type_id        |       | file_size         |
                         | points_possible   |       | file_path         |
                         | due_date          |       | upload_date       |
                         | created_date      |       +-------------------+
                         | published_date    |                |
                         | is_published      |                |
                         | allow_late_submit |                v
                         | FK created_by     |       +-------------------+
                         +-------------------+       |    submissions    |
                                  |                 +-------------------+
                                  |                 | PK submission_id  |
                                  +---------------->| FK assignment_id  |
                                                    | FK student_id     |
                                                    | submission_date   |
                                                    | is_late           |
                                                    | status            |
                                                    | grade             |
                                                    | feedback          |
                                                    | FK graded_by      |
                                                    | graded_date       |
                                                    +-------------------+
                                                            |
                                                            v
                                                    +-------------------+
                                                    | submission_files  |
                                                    +-------------------+
                                                    | PK file_id        |
                                                    | FK submission_id  |
                                                    | file_name         |
                                                    | file_type         |
                                                    | file_size         |
                                                    | file_path         |
                                                    | upload_date       |
                                                    +-------------------+
```

### Communication and Resources

```
+----------------+       +-------------------+       +-------------------+
| announcements  |       |     comments      |       |  class_materials  |
+----------------+       +-------------------+       +-------------------+
| PK announcement_id|    | PK comment_id     |       | PK material_id    |
| FK class_id    |       | content           |       | FK class_id       |
| title          |       | FK created_by     |       | title             |
| content        |       | created_date      |       | description       |
| FK created_by  |       | FK parent_comment_id|     | file_name         |
| created_date   |       | is_private        |       | file_type         |
| scheduled_date |       | reference_type    |       | file_size         |
| is_published   |       | reference_id      |       | file_path         |
+----------------+       +-------------------+       | external_link     |
                                                    | FK created_by     |
                                                    | created_date      |
                                                    | folder_path       |
                                                    +-------------------+
```

### Notifications and Settings

```
+----------------+       +-------------------+       +-------------------+
| notifications  |       |  user_settings    |       | calendar_events   |
+----------------+       +-------------------+       +-------------------+
| PK notification_id|    | PK setting_id     |       | PK event_id       |
| FK user_id     |       | FK user_id        |       | FK user_id        |
| title          |       | email_notifications|      | title             |
| message        |       | push_notifications|       | description       |
| created_date   |       | theme             |       | start_time        |
| is_read        |       | language          |       | end_time          |
| notification_type|     +-------------------+       | is_all_day        |
| reference_type |                                   | event_type        |
| reference_id   |                                   | reference_type    |
+----------------+                                   | reference_id      |
                                                    +-------------------+
```

## Key Relationships

1. **Users and Profiles**:
   - Each user has a role (teacher or student)
   - Teachers have teacher profiles and students have student profiles (1:1)
   - Password reset tokens are linked to users (1:N)

2. **Classes**:
   - Created by teachers (N:1)
   - Can have multiple students enrolled (N:M via class_enrollments)
   - Can have multiple teachers assigned (N:M via class_teachers)

3. **Assignments**:
   - Belong to a specific class (N:1)
   - Can have an assignment type (N:1)
   - Created by teachers (N:1)
   - Can have multiple materials attached (1:N)
   - Can receive multiple student submissions (1:N)

4. **Submissions**:
   - Made by students for specific assignments (N:1)
   - Can have multiple files attached (1:N)
   - Can be graded by teachers (N:1)

5. **Communication and Resources**:
   - Announcements are made in classes by teachers (N:1)
   - Comments can be made on assignments, announcements, or submissions
   - Class materials can be uploaded by teachers (N:1)

6. **Notifications and Settings**:
   - Notifications are sent to users about various activities (N:1)
   - Each user can have personalized settings (1:1)
   - Calendar events can be created for users (N:1)

## Notes on Implementation

- The schema supports both the original design and our current implementation
- We maintain both the original tables (students, teachers) and our current implementation tables (student_profiles, teacher_profiles)
- Foreign key relationships ensure data integrity
- Timestamps are used to track creation and modification dates
- Status fields allow for workflow management (draft, submitted, graded, etc.)
