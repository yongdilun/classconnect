import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../../services/authService';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/common/Button';
import NavBar from '../../../components/common/NavBar';
import '../Login.css';

interface LoginForm {
  email: string;
  password: string;
}

const TeacherLogin: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    console.log('Attempting to login with email:', data.email);

    try {
      // First, use the AuthContext login method which will update the global auth state
      console.log('Calling AuthContext login...');
      await login(data.email, data.password, 'teacher');

      console.log('Login successful via AuthContext');

      // Navigate to the dashboard
      console.log('Login successful, navigating to dashboard...');
      navigate('/teacher/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);

      // Display a user-friendly error message
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });

        // Use the error message from the server if available
        if (err.response.data?.error) {
          setError(err.response.data.error);
        } else if (err.response.data?.message) {
          setError(err.response.data.message);
        } else if (err.response.status === 401) {
          setError('The email or password you entered is incorrect. Please try again.');
        } else if (err.response.status === 404) {
          setError('No account found with this email address. Please check your email or sign up.');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Login failed. Please try again.');
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        console.error('Error message:', err.message);
        // Use the error message directly if it's available
        setError(err.message || 'Login failed. Please try again.');
      }

      // Stay on the current page - don't redirect on error
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
            <h2 className="login-title">Teacher Login</h2>
            <div className="login-subtitle">
              Access your classroom and teaching resources
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
                className="form-input rounded-b"
                placeholder="Password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="input-error">{errors.password.message}</p>}
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
              <Link to="/teacher/signup" className="form-footer-link">
                Sign up
              </Link>
            </p>
          </div>

          <div className="form-footer mt-4">
            <p className="form-footer-text">
              Are you a student?{' '}
              <Link to="/student/login" className="form-footer-link">
                Student Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default TeacherLogin;
