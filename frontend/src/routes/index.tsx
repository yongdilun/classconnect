import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Register from '../pages/auth/Register';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import TeacherDashboard from '../pages/dashboard/teacher/Dashboard';
import StudentDashboard from '../pages/dashboard/student/Dashboard';
import LandingPage from '../pages/LandingPage';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },

  // Legacy routes (redirects to new unified pages)
  {
    path: '/teacher/signup',
    element: <Navigate to="/register" replace />,
  },
  {
    path: '/teacher/login',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/student/signup',
    element: <Navigate to="/register" replace />,
  },
  {
    path: '/student/login',
    element: <Navigate to="/login" replace />,
  },

  // Teacher protected routes
  {
    path: '/teacher',
    element: (
      <ProtectedRoute requiredRole="teacher">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/teacher/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <TeacherDashboard />,
      },
      // Add more teacher routes here
    ],
  },

  // Student protected routes
  {
    path: '/student',
    element: (
      <ProtectedRoute requiredRole="student">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/student/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <StudentDashboard />,
      },
      // Add more student routes here
    ],
  },

  // 404 route
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
