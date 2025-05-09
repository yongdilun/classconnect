import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import authService from '../../services/authService';
import type { LoginCredentials } from '../../services/authService';
import Button from '../../components/common/Button';
import NavBar from '../../components/common/NavBar';
import './Login.css';

interface LoginForm extends LoginCredentials {
  role: 'teacher' | 'student';
}

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: {
      role: 'student',
      rememberMe: false
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ status: string, error?: string } | null>(null);
  const navigate = useNavigate();

  // Function to test API connection
  const testApiConnection = async () => {
    try {
      setApiStatus('Testing connection...');
      setDbStatus(null);

      const result = await authService.testConnection();

      // Set API status
      setApiStatus(`API connected successfully! Server time: ${result.timestamp}`);

      // Set database status if available
      if (result.database) {
        setDbStatus(result.database);
      }
    } catch (err: any) {
      setApiStatus(`API connection failed: ${err.message}`);
      setDbStatus(null);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    console.log('Login form submitted with data:', {
      email: data.email,
      password: '********', // Don't log actual password
      role: data.role,
      rememberMe: data.rememberMe
    });

    try {
      // The role is not used in the login request, but we'll use it for redirection
      console.log('Calling authService.login with email:', data.email);

      // Use the password provided by the user
      let passwordToUse = data.password;

      // Pass the selected role to the login function
      const response = await authService.login(
        data.email,
        passwordToUse,
        data.rememberMe,
        data.role // Pass the selected role
      );

      console.log('Login successful, response:', {
        token: response.token ? `${response.token.substring(0, 10)}...` : 'Missing',
        user: response.user ? {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role
        } : 'Missing'
      });

      if (!response.token) {
        console.error('No token in response');
        setError('Authentication failed: No token received');
        setIsLoading(false);
        return;
      }

      if (!response.user) {
        console.error('No user data in response');
        setError('Authentication failed: No user data received');
        setIsLoading(false);
        return;
      }

      // Redirect based on user role from the response
      const userRole = response.user.role;
      console.log('Redirecting based on role:', userRole);

      // Use setTimeout to ensure the token is properly stored before redirecting
      setTimeout(() => {
        if (userRole === 'teacher') {
          console.log('Navigating to teacher dashboard');
          navigate('/teacher/dashboard');
        } else if (userRole === 'student') {
          console.log('Navigating to student dashboard');
          navigate('/student/dashboard');
        } else {
          console.log('Navigating to home page');
          navigate('/');
        }
      }, 500); // Increased timeout to ensure token is stored
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle specific error messages
      if (err.response?.data?.error) {
        // Use the server's error message
        setError(err.response.data.error);

        // Special handling for invalid credentials
        if (err.response.status === 401 ||
            err.response.data.error.includes('Invalid email or password')) {
          setError('Invalid email or password. Please try again.');
        }
      } else if (err instanceof Error) {
        // Handle specific error messages in the error object
        if (err.message.includes('Network Error')) {
          setError('Network error. Please check your internet connection and try again.');
        } else if (err.message.includes('timeout')) {
          setError('Request timed out. The server might be down or overloaded. Please try again later.');
        } else if (err.message.includes('Invalid email or password')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to login. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NavBar showLinks={false} />
      <div className="login-container">
        <div className="login-form-container">
          <div className="login-header">
            <h2 className="login-title">Sign in to your account</h2>
            <div className="login-subtitle">
              <strong>This login is for students only.</strong> Please use the teacher login if you are a teacher.
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span>{error}</span>
            </div>
          )}

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <div className="input-group">
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="form-input rounded-t"
                placeholder="Email address"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && <p className="input-error">{errors.email.message}</p>}
            </div>

            <div className="input-group stacked">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="form-input rounded-b"
                placeholder="Password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="input-error">{errors.password.message}</p>}
            </div>
          </div>

          <div className="form-options">
            <div className="remember-me">
              <input
                id="remember-me"
                type="checkbox"
                className="checkbox"
                {...register('rememberMe')}
              />
              <label htmlFor="remember-me" className="checkbox-label">
                Remember me
              </label>
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password" className="form-link">
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="role-selection">
            <div className="role-option" style={{ backgroundColor: '#e6f7ff', padding: '0.5rem', borderRadius: '0.25rem' }}>
              <input
                id="role-student"
                type="radio"
                value="student"
                className="radio"
                defaultChecked={true}
                {...register('role', {
                  onChange: (e) => {
                    // Clear any existing error when selecting student role
                    if (e.target.value === 'student') {
                      setError(null);
                    }
                  }
                })}
              />
              <label htmlFor="role-student" className="radio-label" style={{ fontWeight: 'bold' }}>
                Student
              </label>
            </div>

            <div className="role-option">
              <input
                id="role-teacher"
                type="radio"
                value="teacher"
                className="radio"
                {...register('role', {
                  onChange: (e) => {
                    // Show warning when teacher role is selected
                    if (e.target.value === 'teacher') {
                      setError('This login is for students only. Please use the teacher login page instead.');
                    }
                  }
                })}
              />
              <label htmlFor="role-teacher" className="radio-label">
                Teacher
              </label>
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              className="form-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="form-footer">
            <p className="form-footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="form-footer-link">
                Sign up
              </Link>
            </p>
          </div>

          {/* API Connection Test */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={testApiConnection}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Test API Connection
            </button>
            {apiStatus && (
              <div className={`mt-2 text-sm ${apiStatus.includes('failed') ? 'text-red-500' : 'text-green-500'}`}>
                {apiStatus}
              </div>
            )}
            {dbStatus && (
              <div className={`mt-2 text-sm ${dbStatus.status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                Database: {dbStatus.status === 'error' ? 'Error - ' + dbStatus.error : 'Connected'}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default Login;
