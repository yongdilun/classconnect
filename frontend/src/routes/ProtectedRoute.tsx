import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Import styles for the loading spinner
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner while checking authentication
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    console.log('User not authenticated, redirecting to login page');

    // Determine which login page to redirect to based on the current path
    let loginPath = '/login';

    if (location.pathname.includes('/teacher')) {
      loginPath = '/teacher/login';
    } else if (location.pathname.includes('/student')) {
      loginPath = '/student/login';
    }

    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If role is required and user doesn't have it, redirect to appropriate dashboard
  if (requiredRole && user.userRole !== requiredRole) {
    console.log(`User role ${user.userRole} doesn't match required role ${requiredRole}`);
    const dashboardPath = user.userRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  // If authenticated and has the required role, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
