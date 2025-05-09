import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import './Login.css'; // Reuse the login styles

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, data.password);
      // Redirect to login page after successful password reset
      navigate('/login', { state: { message: 'Password reset successful! Please log in with your new password.' } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-form-container">
          <div className="login-header">
            <h2 className="login-title">Invalid Reset Link</h2>
            <p className="login-subtitle">
              The password reset link is invalid or has expired.
            </p>
          </div>
          <div className="form-footer">
            <p className="form-footer-text">
              <Link to="/forgot-password" className="form-footer-link">
                Request a new password reset link
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-header">
          <h2 className="login-title">Reset your password</h2>
          <p className="login-subtitle">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <div className="input-group">
              <label htmlFor="password" className="sr-only">New password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="New password"
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
              <label htmlFor="confirmPassword" className="sr-only">Confirm new password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Confirm new password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || "Passwords don't match"
                })}
              />
              {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              className="form-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset password'}
            </Button>
          </div>

          <div className="form-footer">
            <p className="form-footer-text">
              <Link to="/login" className="form-footer-link">
                Back to login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
