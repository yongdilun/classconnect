import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import './Login.css'; // Reuse the login styles

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.requestPasswordReset(data.email);
      setSuccess(response.message || 'Password reset link sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send password reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-header">
          <h2 className="login-title">Reset your password</h2>
          <p className="login-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="login-success" role="alert">
            <span>{success}</span>
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
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              className="form-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send reset link'}
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

export default ForgotPassword;
