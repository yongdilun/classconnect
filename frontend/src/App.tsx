import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import LandingPage from './pages/LandingPage';
import TeacherLogin from './pages/auth/teacher/Login';
import StudentLogin from './pages/auth/student/Login';
import TeacherSignup from './pages/auth/teacher/Signup';
import StudentSignup from './pages/auth/student/Signup';
import TeacherDashboard from './pages/dashboard/teacher/Dashboard';
import StudentDashboard from './pages/dashboard/student/Dashboard';
import TeacherClassesPage from './pages/classes/teacher/ClassesPage';
import CreateClassPage from './pages/classes/teacher/CreateClassPage';
import TeacherClassDetailPage from './pages/classes/teacher/ClassDetailPage';
import StudentClassesPage from './pages/classes/student/ClassesPage';
import JoinClassPage from './pages/classes/student/JoinClassPage';
import StudentClassDetailPage from './pages/classes/student/ClassDetailPage';
import ClassChat from './components/classes/ClassChat';
import ClassAssignments from './components/classes/ClassAssignments';
import AssignmentDetail from './components/classes/AssignmentDetail';
import AssignmentSubmissions from './components/classes/AssignmentSubmissions';
import AllAssignments from './components/assignments/AllAssignments';
import AssignmentDebug from './components/debug/AssignmentDebug';
import AssignmentViewPage from './pages/assignments/AssignmentViewPage';
import RouteDebug from './components/debug/RouteDebug';
import AuthDebug from './components/debug/AuthDebug';
import Layout from './components/layout/Layout';
import NotFound from './pages/NotFound';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import StudentGradeSummaryPage from './pages/grades/student/GradeSummaryPage';
import TeacherGradeSummaryPage from './pages/grades/teacher/GradeSummaryPage';
import StudentGradesPage from './pages/grades/teacher/StudentGradesPage';

// Wrapper component for AssignmentDetail with submission view
const AssignmentDetailWithSubmission = () => <AssignmentDetail showSubmission={true} />;

// Protected route component with role check
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  path?: string;
}

const ProtectedRoute = ({ children, allowedRoles, path = '' }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const userRole = user?.userRole || null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: User is not authenticated, redirecting to landing page');
    return <Navigate to="/" />;
  }

  // Check if the user is trying to access a route that doesn't match their role
  if (userRole === 'teacher' && path.startsWith('/student')) {
    console.log('ProtectedRoute: Teacher trying to access student route, redirecting to teacher dashboard');
    return <Navigate to="/teacher/dashboard" />;
  }

  if (userRole === 'student' && path.startsWith('/teacher')) {
    console.log('ProtectedRoute: Student trying to access teacher route, redirecting to student dashboard');
    return <Navigate to="/student/dashboard" />;
  }

  console.log('ProtectedRoute: User is authenticated with role:', userRole);

  // If roles are specified, check if user has the required role
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to the appropriate dashboard based on role
    if (userRole === 'teacher') {
      return <Navigate to="/teacher/dashboard" />;
    } else if (userRole === 'student') {
      return <Navigate to="/student/dashboard" />;
    } else {
      return <Navigate to="/" />;
    }
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Routes */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher/signup" element={<TeacherSignup />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/signup" element={<StudentSignup />} />

          {/* Debug Routes */}
          <Route path="/debug/assignment" element={<AssignmentDebug />} />
          <Route path="/debug/route" element={<RouteDebug />} />
          <Route path="/debug/auth" element={<AuthDebug />} />

        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={["teacher"]} path="/teacher">
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherClassesPage />} />
          <Route path="classes/create" element={<CreateClassPage />} />
          <Route path="classes/:id" element={<TeacherClassDetailPage />}>
            <Route index element={<></>} />
            <Route path="assignments" element={<ClassAssignments />} />
            <Route path="assignments/:assignmentId" element={<AssignmentDetail />} />
            <Route path="assignments/:assignmentId/submissions" element={<AssignmentSubmissions />} />
            <Route path="assignments/:assignmentId/submissions/:studentId" element={<AssignmentDetailWithSubmission />} />
            <Route path="chat" element={<ClassChat />} />
          </Route>
          <Route path="classes/:id/assignment/:assignmentId" element={<AssignmentViewPage />} />
          <Route path="classes/:id/assignment/:assignmentId/submissions" element={<AssignmentSubmissions />} />
          <Route path="classes/:id/assignment/:assignmentId/submissions/:studentId" element={<AssignmentDetailWithSubmission />} />
          <Route path="assignments" element={<AllAssignments />} />
          <Route path="grades" element={<TeacherGradeSummaryPage />} />
          <Route path="classes/:classId/students/:studentId/grades" element={<StudentGradesPage />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={["student"]} path="/student">
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="classes" element={<StudentClassesPage />} />
          <Route path="classes/join" element={<JoinClassPage />} />
          <Route path="classes/:id" element={<StudentClassDetailPage />}>
            <Route index element={<></>} />
            <Route path="assignments" element={<ClassAssignments />} />
            <Route path="assignments/:assignmentId" element={<AssignmentDetail />} />
            <Route path="chat" element={<ClassChat />} />
          </Route>
          <Route path="classes/:id/assignment/:assignmentId" element={<AssignmentViewPage />} />
          <Route path="classes/:id/assignment/:assignmentId/submissions" element={<AssignmentSubmissions />} />
          <Route path="classes/:id/assignment/:assignmentId/submissions/:studentId" element={<AssignmentDetailWithSubmission />} />
          <Route path="assignments" element={<AllAssignments />} />
          <Route path="grades" element={<StudentGradeSummaryPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
