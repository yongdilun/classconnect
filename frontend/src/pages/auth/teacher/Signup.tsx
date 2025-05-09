import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../../services/authService';
import Button from '../../../components/common/Button';
import NavBar from '../../../components/common/NavBar';
import '../Login.css';

interface TeacherSignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  department: string;
}

const TeacherSignup: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<TeacherSignupForm>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: TeacherSignupForm) => {
    if (data.password !== data.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Submitting registration data:', {
        email: data.email,
        password: '********', // Don't log actual password
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department
      });

      console.log('Sending registration request...');

      // Use authService for registration
      const authResponse = await authService.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        role: 'teacher'
      });

      console.log('Registration successful with authService:', authResponse);

      // Only show success message and redirect if registration was successful
      alert('Registration successful! Please login with your new account.');

      // Navigate to login page
      navigate('/teacher/login');
    } catch (error: any) {
      console.error('Registration failed:', error);

      // Handle different types of errors
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });

        // Check for specific error status codes
        if (error.response.status === 409) {
          setError('This email is already registered. Please use a different email or login to your existing account.');
        } else {
          setError(error.response.data?.error || error.response.data?.message || 'Registration failed. Please try again.');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        console.error('Error message:', error.message);
        setError(error.message || 'Registration failed. Please try again.');
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
            <h2 className="login-title">Teacher Sign Up</h2>
            <div className="login-subtitle">
              Create your teacher account to manage your classes and resources
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
                className="form-input"
                placeholder="Password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              {errors.password && <p className="input-error">{errors.password.message}</p>}
            </div>

            <div className="input-group stacked">
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Confirm Password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === watch('password') || "Passwords don't match"
                })}
              />
              {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
            </div>

            <div className="input-group stacked">
              <label htmlFor="firstName" className="sr-only">First Name</label>
              <input
                id="firstName"
                type="text"
                className="form-input"
                placeholder="First Name"
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && <p className="input-error">{errors.firstName.message}</p>}
            </div>

            <div className="input-group stacked">
              <label htmlFor="lastName" className="sr-only">Last Name</label>
              <input
                id="lastName"
                type="text"
                className="form-input"
                placeholder="Last Name"
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && <p className="input-error">{errors.lastName.message}</p>}
            </div>

            <div className="input-group stacked">
              <label htmlFor="department" className="sr-only">Department</label>
              <input
                id="department"
                type="text"
                className="form-input rounded-b"
                placeholder="Department (optional)"
                {...register('department')}
              />
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              className="form-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>

          <div className="form-footer">
            <p className="form-footer-text">
              Already have an account?{' '}
              <Link to="/teacher/login" className="form-footer-link">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default TeacherSignup;
