import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import type { RegistrationData } from '../../services/authService';
import Button from '../../components/common/Button';
import NavBar from '../../components/common/NavBar';
import './Login.css'; // Reuse the login styles

interface RegisterForm extends RegistrationData {
  confirmPassword: string;
}

const Register: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: {
      role: 'student'
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const password = watch('password');
  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use the password provided by the user
    let passwordToUse = data.password;

    try {
      console.log('Attempting to register with:', {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        department: data.department,
        gradeLevel: data.gradeLevel,
        // Don't log the password
      });

      await authService.register({
        email: data.email,
        password: passwordToUse,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        department: data.department,
        gradeLevel: data.gradeLevel
      });

      // Show success message and redirect to login page
      navigate('/login', {
        state: {
          message: 'Registration successful! Please log in with your new account.'
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);

      // Handle specific error messages
      if (err.response?.data?.error) {
        // Use the server's error message
        setError(err.response.data.error);

        // Special handling for email already in use
        if (err.response.status === 409 ||
            err.response.data.error.includes('already in use') ||
            err.response.data.error.includes('already registered')) {
          setError('This email is already registered. Please use a different email or try logging in.');
        }
      } else if (err instanceof Error) {
        // Handle specific error messages in the error object
        if (err.message.includes('already registered') || err.message.includes('already in use')) {
          setError('This email is already registered. Please use a different email or try logging in.');
        } else if (err.message.includes('Network Error')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Registration failed. Please try again.');
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
            <h2 className="login-title">Create your account</h2>
            <div className="login-subtitle">
              Join ClassConnect to enhance your educational experience
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
                className="form-input"
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

            <div className="input-group">
              <label htmlFor="firstName" className="sr-only">First name</label>
              <input
                id="firstName"
                type="text"
                className="form-input"
                placeholder="First name"
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && <p className="input-error">{errors.firstName.message}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="lastName" className="sr-only">Last name</label>
              <input
                id="lastName"
                type="text"
                className="form-input"
                placeholder="Last name"
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && <p className="input-error">{errors.lastName.message}</p>}
            </div>

            <div className="input-group">
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

            <div className="input-group">
              <label htmlFor="confirmPassword" className="sr-only">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Confirm password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || "Passwords don't match"
                })}
              />
              {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
            </div>

            <div className="role-selection">
              <div className="role-option">
                <input
                  id="role-student"
                  type="radio"
                  value="student"
                  className="radio"
                  {...register('role')}
                />
                <label htmlFor="role-student" className="radio-label">
                  Student
                </label>
              </div>

              <div className="role-option">
                <input
                  id="role-teacher"
                  type="radio"
                  value="teacher"
                  className="radio"
                  {...register('role')}
                />
                <label htmlFor="role-teacher" className="radio-label">
                  Teacher
                </label>
              </div>
            </div>

            {selectedRole === 'student' && (
              <div className="input-group">
                <label htmlFor="gradeLevel" className="sr-only">Grade level</label>
                <input
                  id="gradeLevel"
                  type="text"
                  className="form-input"
                  placeholder="Grade level (optional)"
                  {...register('gradeLevel')}
                />
              </div>
            )}

            {selectedRole === 'teacher' && (
              <div className="input-group">
                <label htmlFor="department" className="sr-only">Department</label>
                <input
                  id="department"
                  type="text"
                  className="form-input"
                  placeholder="Department (optional)"
                  {...register('department')}
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              className="form-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>

          <div className="form-footer">
            <p className="form-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="form-footer-link">
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

export default Register;
