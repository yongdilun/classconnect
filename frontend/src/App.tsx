import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Layout from './components/layout/Layout';
import authService from './services/authService';

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // For development, we'll just check if there's a token
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);

        // In production, you would verify the token with the server
        // await authService.getCurrentUser();
        // setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          {/* Add more routes as they are created */}
          {/* <Route path="classes" element={<ClassList />} /> */}
          {/* <Route path="classes/:id" element={<ClassDetail />} /> */}
          {/* <Route path="assignments" element={<AssignmentList />} /> */}
          {/* <Route path="assignments/:id" element={<AssignmentDetail />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
