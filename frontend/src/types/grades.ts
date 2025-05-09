// Grade summary interfaces

export interface AssignmentGrade {
  assignmentId: number;
  assignmentTitle: string;
  dueDate: string;
  pointsPossible: number;
  grade: number | null;
  status: 'not_submitted' | 'submitted' | 'graded';
  submissionId?: number;
  submissionDate?: string;
  feedback?: string;
  percentage?: number; // Calculated field
}

export interface ClassGradeSummary {
  classId: number;
  className: string;
  classCode: string;
  subject?: string;
  themeColor?: string;
  assignments: AssignmentGrade[];
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  letterGrade?: string; // Optional letter grade based on percentage
}

export interface StudentGradeSummary {
  studentId: number;
  studentName: string;
  email: string;
  classes: ClassGradeSummary[];
  overallPercentage: number;
}

// For teacher view
export interface StudentClassSummary {
  studentId: number;
  studentName: string;
  email: string;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
  letterGrade?: string;
}

export interface ClassStudentsGradeSummary {
  classId: number;
  className: string;
  classCode: string;
  subject?: string;
  themeColor?: string;
  students: StudentClassSummary[];
  averagePercentage: number;
}

// Filter and sort options
export interface GradeFilterOptions {
  classId?: number;
  minGrade?: number;
  maxGrade?: number;
  status?: 'not_submitted' | 'submitted' | 'graded' | 'all';
}

export type GradeSortOption = 
  | 'className'
  | 'percentage'
  | 'totalPoints'
  | 'dueDate';

export interface GradeSortConfig {
  field: GradeSortOption;
  direction: 'asc' | 'desc';
}

// Helper function to calculate letter grade
export const calculateLetterGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};
