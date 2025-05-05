// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student';
  profilePicture?: string;
}

// Class types
export interface Class {
  id: number;
  name: string;
  code: string;
  description?: string;
  subject?: string;
  createdDate: string;
  isArchived: boolean;
  themeColor?: string;
  creatorId: number;
}

// Assignment types
export interface Assignment {
  id: number;
  classId: number;
  title: string;
  description?: string;
  typeId?: number;
  pointsPossible: number;
  dueDate?: string;
  createdDate: string;
  publishedDate?: string;
  isPublished: boolean;
  allowLateSubmissions: boolean;
  createdBy: number;
}

// Submission types
export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  submissionDate: string;
  isLate: boolean;
  status: 'draft' | 'submitted' | 'returned' | 'graded';
  grade?: number;
  feedback?: string;
  gradedBy?: number;
  gradedDate?: string;
}
