import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import api from '../../services/api'; // Uncomment when needed
import type { Class, Assignment } from '../../types';

const Dashboard = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // In a real app, you would fetch this data from your API
        // For now, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data for development
        setClasses([
          {
            id: 1,
            name: 'Introduction to Computer Science',
            code: 'CS101',
            description: 'Fundamentals of computer science and programming',
            subject: 'Computer Science',
            createdDate: new Date().toISOString(),
            isArchived: false,
            themeColor: '#4f46e5',
            creatorId: 1
          },
          {
            id: 2,
            name: 'Advanced Mathematics',
            code: 'MATH201',
            description: 'Advanced topics in mathematics',
            subject: 'Mathematics',
            createdDate: new Date().toISOString(),
            isArchived: false,
            themeColor: '#0ea5e9',
            creatorId: 1
          }
        ]);

        setUpcomingAssignments([
          {
            id: 1,
            classId: 1,
            title: 'Programming Assignment 1',
            description: 'Create a simple calculator program',
            pointsPossible: 100,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdDate: new Date().toISOString(),
            isPublished: true,
            allowLateSubmissions: true,
            createdBy: 1
          },
          {
            id: 2,
            classId: 2,
            title: 'Math Problem Set',
            description: 'Solve the problems in Chapter 3',
            pointsPossible: 50,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdDate: new Date().toISOString(),
            isPublished: true,
            allowLateSubmissions: false,
            createdBy: 1
          }
        ]);

        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Classes</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Classes you're enrolled in or teaching</p>
          </div>
          <Link
            to="/classes"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            View All Classes
          </Link>
        </div>
        <div className="border-t border-gray-200">
          {classes.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500">You don't have any classes yet.</p>
              <Link
                to="/classes/join"
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
              >
                Join a Class
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {classes.map((classItem) => (
                <li key={classItem.id}>
                  <Link to={`/classes/${classItem.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: classItem.themeColor || '#4f46e5' }}
                          >
                            {classItem.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 truncate">{classItem.name}</p>
                            <p className="text-sm text-gray-500 truncate">{classItem.subject}</p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {classItem.code}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Assignments</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Assignments due soon</p>
          </div>
          <Link
            to="/assignments"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            View All Assignments
          </Link>
        </div>
        <div className="border-t border-gray-200">
          {upcomingAssignments.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500">You don't have any upcoming assignments.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {upcomingAssignments.map((assignment) => {
                const dueDate = new Date(assignment.dueDate || '');
                const isOverdue = dueDate < new Date();

                return (
                  <li key={assignment.id}>
                    <Link to={`/assignments/${assignment.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-primary-100 text-primary-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-primary-600 truncate">{assignment.title}</p>
                              <p className="text-sm text-gray-500 truncate">
                                {classes.find(c => c.id === assignment.classId)?.name}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isOverdue ? 'Overdue' : 'Due Soon'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {dueDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
