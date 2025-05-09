import {
  calculateLetterGrade
} from '../types/grades';
import type {
  ClassGradeSummary,
  StudentGradeSummary,
  ClassStudentsGradeSummary,
  AssignmentGrade
} from '../types/grades';
import classService from './classService';

const gradeService = {
  // Get grade summary for a student across all classes
  async getStudentGradeSummary(studentId: number): Promise<StudentGradeSummary> {
    try {
      console.log(`Getting grade summary for student ${studentId}`);

      // Get all classes for the student
      const classes = await classService.getStudentClasses(studentId);

      // Get student info
      const userInfo = await this.getUserInfo(studentId);

      // Initialize the student grade summary
      const gradeSummary: StudentGradeSummary = {
        studentId,
        studentName: `${userInfo.firstName} ${userInfo.lastName}`,
        email: userInfo.email,
        classes: [],
        overallPercentage: 0
      };

      // Get grade summaries for each class
      let totalPoints = 0;
      let earnedPoints = 0;

      for (const classItem of classes) {
        const classSummary = await this.getStudentClassGradeSummary(studentId, classItem.classId);
        gradeSummary.classes.push(classSummary);

        totalPoints += classSummary.totalPoints;
        earnedPoints += classSummary.earnedPoints;
      }

      // Calculate overall percentage
      gradeSummary.overallPercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

      return gradeSummary;
    } catch (error: any) {
      console.error(`Error getting grade summary for student ${studentId}:`, error);
      throw new Error(`Grade summary error: ${error.message || 'Failed to load grade summary'}`);
    }
  },

  // Get grade summary for a student in a specific class
  async getStudentClassGradeSummary(studentId: number, classId: number): Promise<ClassGradeSummary> {
    try {
      console.log(`Getting grade summary for student ${studentId} in class ${classId}`);

      // Get class info
      const classInfo = await classService.getClass(classId);

      // Get assignments for the class
      const assignments = await classService.getAssignments(classId);

      // Initialize the class grade summary
      const classSummary: ClassGradeSummary = {
        classId,
        className: classInfo.className,
        classCode: classInfo.classCode,
        subject: classInfo.subject,
        themeColor: classInfo.themeColor,
        assignments: [],
        totalPoints: 0,
        earnedPoints: 0,
        percentage: 0
      };

      // Get submissions for each assignment
      for (const assignment of assignments) {
        const submission = await classService.getSubmission(classId, assignment.id, studentId);

        const assignmentGrade: AssignmentGrade = {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          dueDate: assignment.dueDate,
          pointsPossible: assignment.pointsPossible,
          grade: submission.grade || null,
          status: submission.status,
          submissionId: submission.id,
          submissionDate: submission.submissionDate,
          feedback: submission.feedback,
          percentage: submission.grade !== undefined && submission.grade !== null ?
            (submission.grade / assignment.pointsPossible) * 100 : undefined
        };

        classSummary.assignments.push(assignmentGrade);

        // Only count graded assignments in the total
        if (submission.status === 'graded' && submission.grade !== undefined && submission.grade !== null) {
          classSummary.totalPoints += assignment.pointsPossible;
          classSummary.earnedPoints += submission.grade;
        }
      }

      // Calculate percentage
      classSummary.percentage = classSummary.totalPoints > 0 ?
        (classSummary.earnedPoints / classSummary.totalPoints) * 100 : 0;

      // Calculate letter grade
      classSummary.letterGrade = calculateLetterGrade(classSummary.percentage);

      return classSummary;
    } catch (error: any) {
      console.error(`Error getting grade summary for student ${studentId} in class ${classId}:`, error);
      throw new Error(`Class grade summary error: ${error.message || 'Failed to load class grade summary'}`);
    }
  },

  // Get grade summaries for all students in a class
  async getClassStudentsGradeSummary(classId: number): Promise<ClassStudentsGradeSummary> {
    try {
      console.log(`Getting grade summaries for all students in class ${classId}`);

      // Get class info
      const classInfo = await classService.getClass(classId);

      // Get students in the class
      const students = await classService.getClassStudents(classId);

      // Initialize the class students grade summary
      const classSummary: ClassStudentsGradeSummary = {
        classId,
        className: classInfo.className,
        classCode: classInfo.classCode,
        subject: classInfo.subject,
        themeColor: classInfo.themeColor,
        students: [],
        averagePercentage: 0
      };

      // Get grade summaries for each student
      let totalPercentage = 0;

      for (const student of students) {
        // Check if student has userId or user_id (from StudentProfile)
        const studentId = student.userId || student.user_id;
        if (!studentId) {
          console.warn('Student missing ID:', student);
          continue;
        }

        const studentClassSummary = await this.getStudentClassGradeSummary(studentId, classId);

        classSummary.students.push({
          studentId: studentId,
          studentName: `${student.firstName || student.first_name} ${student.lastName || student.last_name}`,
          email: student.email || 'unknown@example.com',
          earnedPoints: studentClassSummary.earnedPoints,
          totalPoints: studentClassSummary.totalPoints,
          percentage: studentClassSummary.percentage,
          letterGrade: studentClassSummary.letterGrade
        });

        totalPercentage += studentClassSummary.percentage;
      }

      // Calculate average percentage
      classSummary.averagePercentage = students.length > 0 ? totalPercentage / students.length : 0;

      return classSummary;
    } catch (error: any) {
      console.error(`Error getting grade summaries for class ${classId}:`, error);
      throw new Error(`Class students grade summary error: ${error.message || 'Failed to load class students grade summary'}`);
    }
  },

  // Get all classes with grade summaries for a teacher
  async getTeacherClassesGradeSummaries(teacherId: number): Promise<ClassStudentsGradeSummary[]> {
    try {
      console.log(`Getting grade summaries for all classes taught by teacher ${teacherId}`);

      // Get all classes for the teacher
      const classes = await classService.getTeacherClasses(teacherId);

      // Get grade summaries for each class
      const classSummaries: ClassStudentsGradeSummary[] = [];

      for (const classItem of classes) {
        const classSummary = await this.getClassStudentsGradeSummary(classItem.classId);
        classSummaries.push(classSummary);
      }

      return classSummaries;
    } catch (error: any) {
      console.error(`Error getting grade summaries for teacher ${teacherId}:`, error);
      throw new Error(`Teacher classes grade summaries error: ${error.message || 'Failed to load teacher classes grade summaries'}`);
    }
  },

  // Helper method to get user info
  async getUserInfo(userId: number): Promise<any> {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      return data;
    } catch (error: any) {
      console.error(`Error getting user info for user ${userId}:`, error);
      return { firstName: 'Unknown', lastName: 'User', email: 'unknown@example.com' };
    }
  }
};

export default gradeService;
