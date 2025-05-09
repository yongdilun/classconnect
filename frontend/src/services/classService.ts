// No imports needed

export interface Class {
  classId: number;
  className: string;
  classCode: string;
  description?: string;
  subject?: string;
  createdDate: string;
  isArchived: boolean;
  themeColor?: string;
  creatorId: number;
}

export interface Announcement {
  announcementId: number;
  classId: number;
  title?: string;
  content: string;
  userId: number;
  userName: string;
  userRole: string;
  createdAt: string;
  updatedAt?: string;
  scheduledDate?: string;
  isPublished: boolean;
}

export interface ChatMessage {
  id?: number; // For backward compatibility
  messageId: number; // Primary key from backend
  classId: number;
  userId: number;
  userName: string;
  userRole: string;
  content: string;
  timestamp: string;
}

export interface Assignment {
  id: number;
  classId: number;
  title: string;
  description: string;
  dueDate: string;
  pointsPossible: number;
  isPublished: boolean;
  createdBy: number;
  createdAt: string;
  allowLateSubmit: boolean;
}

export interface Submission {
  id?: number; // Optional because it might not exist for not_submitted status
  assignmentId: number;
  studentId: number;
  studentName?: string;
  content: string;
  fileURL?: string; // URL to the submitted file
  submissionDate?: string; // Optional because it might not exist for not_submitted status
  isLate: boolean;
  grade?: number;
  feedback?: string;
  status: 'not_submitted' | 'submitted' | 'graded';
  gradedBy?: number;
  gradedDate?: string;

  // Optional assignment details
  assignment?: Assignment;
}

export interface CreateClassRequest {
  className: string;
  description?: string;
  subject?: string;
  themeColor?: string;
}

export interface JoinClassRequest {
  classCode: string;
}

export interface ClassResponse {
  message: string;
  class: Class;
}

const classService = {
  // Create a new class
  async createClass(data: CreateClassRequest): Promise<Class> {
    try {
      console.log('Creating class with data:', data);

      // Get the token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // Use fetch directly to bypass any axios issues
      const fetchResponse = await fetch(`/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const responseData = await fetchResponse.json();
      console.log('Class creation response from fetch:', responseData);

      return responseData;
    } catch (error: any) {
      console.error('Error creating class:', error);
      throw new Error(`Class creation error: ${error.message || 'Failed to create class'}`);
    }
  },

  // Get a class by ID
  async getClass(classId: number): Promise<Class> {
    try {
      console.log(`Getting class with ID ${classId}`);

      // Use fetch directly with the exact URL to avoid double prefixing
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}`, {
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
      console.log('Class data:', data);

      return data;
    } catch (error: any) {
      console.error(`Error getting class ${classId}:`, error);
      throw new Error(`Class error: ${error.message || `Failed to load class ${classId}`}`);
    }
  },

  // Get all classes for a teacher
  async getTeacherClasses(teacherId: number): Promise<Class[]> {
    try {
      console.log(`Getting classes for teacher ${teacherId}`);

      // Get the token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // Use fetch directly with the exact URL to bypass any prefixing issues
      const fetchResponse = await fetch(`/api/classes/teacher/${teacherId}`, {
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
      console.log('Teacher classes response:', data);

      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object' && data !== null) {
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        } else if (data.classes && Array.isArray(data.classes)) {
          return data.classes;
        }
      }

      return [];
    } catch (error: any) {
      console.error(`Error getting teacher ${teacherId} classes:`, error);
      throw new Error(`Classes error: ${error.message || 'Failed to load classes'}`);
    }
  },

  // Get all classes for a student
  async getStudentClasses(studentId: number): Promise<Class[]> {
    try {
      console.log(`Getting classes for student ${studentId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/student/${studentId}`, {
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
      console.log('Student classes response:', data);

      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object' && data !== null) {
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        } else if (data.classes && Array.isArray(data.classes)) {
          return data.classes;
        }
      }

      return [];
    } catch (error: any) {
      console.error(`Error getting student ${studentId} classes:`, error);
      throw new Error(`Classes error: ${error.message || 'Failed to load classes'}`);
    }
  },

  // Join a class using a class code
  async joinClass(data: JoinClassRequest): Promise<ClassResponse> {
    try {
      console.log('Joining class with code:', data.classCode);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const responseData = await fetchResponse.json();
      console.log('Class join response from fetch:', responseData);

      return responseData;
    } catch (error: any) {
      console.error('Error joining class:', error);
      throw new Error(`Class join error: ${error.message || 'Failed to join class'}`);
    }
  },

  // Update a class
  async updateClass(classId: number, data: CreateClassRequest): Promise<void> {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }
    } catch (error: any) {
      console.error(`Error updating class ${classId}:`, error);
      throw error;
    }
  },

  // Delete a class
  async deleteClass(classId: number): Promise<void> {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }
    } catch (error: any) {
      console.error(`Error deleting class ${classId}:`, error);
      throw error;
    }
  },

  // Get students in a class
  async getClassStudents(classId: number): Promise<any[]> {
    try {
      console.log(`Getting students for class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/students`, {
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
      console.log('Class students data:', data);

      return data;
    } catch (error: any) {
      console.error(`Error getting students for class ${classId}:`, error);
      throw error;
    }
  },

  // Get assignments for a class
  async getAssignments(classId: number): Promise<Assignment[]> {
    try {
      console.log(`Getting assignments for class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/assignments`, {
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
      console.log('Assignments response:', data);

      return data;
    } catch (error: any) {
      console.error(`Error getting assignments for class ${classId}:`, error);
      throw new Error(`Assignments error: ${error.message || 'Failed to load assignments'}`);
    }
  },

  // Create an assignment
  async createAssignment(classId: number, assignment: Partial<Assignment>): Promise<Assignment> {
    try {
      console.log(`Creating assignment for class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(assignment),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      console.log('Assignment creation response:', data);

      return data;
    } catch (error: any) {
      console.error(`Error creating assignment for class ${classId}:`, error);
      throw new Error(`Assignment creation error: ${error.message || 'Failed to create assignment'}`);
    }
  },

  // Update an assignment
  async updateAssignment(classId: number, assignmentId: number, assignment: Partial<Assignment>): Promise<Assignment> {
    try {
      console.log(`Updating assignment ${assignmentId} for class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(assignment),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      console.log('Assignment update response:', data);

      return data;
    } catch (error: any) {
      console.error(`Error updating assignment ${assignmentId} for class ${classId}:`, error);
      throw new Error(`Assignment update error: ${error.message || 'Failed to update assignment'}`);
    }
  },

  // Get an assignment by ID
  async getAssignment(classId: number, assignmentId: number): Promise<Assignment> {
    try {
      console.log(`Getting assignment ${assignmentId} for class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/assignments/${assignmentId}`, {
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
      console.log('Assignment data:', data);

      return data;
    } catch (error: any) {
      console.error(`Error getting assignment ${assignmentId} for class ${classId}:`, error);
      throw new Error(`Assignment error: ${error.message || 'Failed to load assignment'}`);
    }
  },

  // Submit an assignment
  async submitAssignment(classId: number, assignmentId: number, content: string, fileURL?: string): Promise<Submission> {
    try {
      console.log(`Submitting assignment ${assignmentId} for class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({ content, fileURL: fileURL || '' }),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      console.log('Submission response:', data);

      return data;
    } catch (error: any) {
      console.error(`Error submitting assignment ${assignmentId} for class ${classId}:`, error);
      throw new Error(`Submission error: ${error.message || 'Failed to submit assignment'}`);
    }
  },

  // Get a submission
  async getSubmission(classId: number, assignmentId: number, studentId: number): Promise<Submission> {
    try {
      console.log(`Getting submission for assignment ${assignmentId}, student ${studentId}, class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/assignments/${assignmentId}/submissions/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!fetchResponse.ok) {
        // If 404, return a default submission with status "not_submitted"
        if (fetchResponse.status === 404) {
          return {
            assignmentId: assignmentId,
            studentId: studentId,
            content: '',
            status: 'not_submitted',
            isLate: false
          };
        }
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      console.log('Submission data:', data);

      return data;
    } catch (error: any) {
      console.error(`Error getting submission for assignment ${assignmentId}, student ${studentId}:`, error);

      // Return a default submission with status "not_submitted"
      return {
        assignmentId: assignmentId,
        studentId: studentId,
        content: '',
        status: 'not_submitted',
        isLate: false
      };
    }
  },

  // Get all submissions for an assignment
  async getAssignmentSubmissions(classId: number, assignmentId: number): Promise<Submission[]> {
    try {
      console.log(`Getting all submissions for assignment ${assignmentId} in class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/assignments/${assignmentId}/submissions`, {
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
      console.log('Submissions data:', data);

      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object' && data !== null) {
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        } else if (data.submissions && Array.isArray(data.submissions)) {
          return data.submissions;
        }
      }

      return [];
    } catch (error: any) {
      console.error(`Error getting submissions for assignment ${assignmentId}:`, error);
      throw new Error(`Submissions error: ${error.message || 'Failed to load submissions'}`);
    }
  },

  // Get announcements for a class
  async getAnnouncements(classId: number): Promise<Announcement[]> {
    try {
      console.log(`Getting announcements for class ${classId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/announcements`, {
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
      console.log('Announcements response:', data);

      return data;
    } catch (error: any) {
      console.error(`Error getting announcements for class ${classId}:`, error);
      throw new Error(`Announcements error: ${error.message || 'Failed to load announcements'}`);
    }
  },

  // Create an announcement
  async createAnnouncement(classId: number, content: string, title?: string): Promise<Announcement> {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({ content, title }),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      return data;
    } catch (error: any) {
      console.error(`Error creating announcement for class ${classId}:`, error);
      throw error;
    }
  },

  // Get chat messages for a class
  async getChatMessages(classId: number): Promise<ChatMessage[]> {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/chat`, {
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

      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object' && data !== null) {
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        } else if (data.messages && Array.isArray(data.messages)) {
          return data.messages;
        }
      }

      return [];
    } catch (error: any) {
      console.error(`Error getting chat messages for class ${classId}:`, error);
      throw new Error(`Chat error: ${error.message || 'Failed to load chat messages'}`);
    }
  },

  // Send a chat message
  async sendChatMessage(classId: number, content: string): Promise<ChatMessage> {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      return data;
    } catch (error: any) {
      console.error(`Error sending chat message for class ${classId}:`, error);
      throw error;
    }
  },

  // Grade a submission
  async gradeSubmission(classId: number, assignmentId: number, studentId: number, grade: number, feedback?: string): Promise<Submission> {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchResponse = await fetch(`/api/classes/${classId}/assignments/${assignmentId}/submissions/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({ grade, feedback: feedback || '' }),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      return data;
    } catch (error: any) {
      console.error(`Error grading submission for assignment ${assignmentId}, student ${studentId}:`, error);
      throw new Error(`Grading error: ${error.message || 'Failed to grade submission'}`);
    }
  },

  // Get all submissions for a student in an assignment
  async getStudentAssignmentSubmissions(studentId: number, assignmentId: number): Promise<Submission[]> {
    // Implementation will be added later
    return [];
  }
};

export default classService;