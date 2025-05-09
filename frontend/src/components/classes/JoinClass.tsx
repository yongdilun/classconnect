import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { JoinClassRequest } from '../../services/classService';
import '../../styles/forms.css';

const JoinClass: React.FC = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<JoinClassRequest>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [codeInputs, setCodeInputs] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const navigate = useNavigate();

  // Handle individual code input changes
  const handleCodeInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }

    const newInputs = [...codeInputs];
    newInputs[index] = value.toUpperCase();
    setCodeInputs(newInputs);

    // Update the form value
    setValue('classCode', newInputs.join(''));

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeInputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Sync code inputs with form value
  useEffect(() => {
    const classCode = watch('classCode') || '';
    if (classCode.length > 0) {
      const newInputs = Array(6).fill('');
      for (let i = 0; i < Math.min(classCode.length, 6); i++) {
        newInputs[i] = classCode[i].toUpperCase();
      }
      setCodeInputs(newInputs);
    }
  }, [watch('classCode')]);

  const onSubmit = async (data: JoinClassRequest) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Attempting to join class with code:', data.classCode);

      // Get the token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token');

      // Use direct fetch instead of the service
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      console.log('Join class response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Joined class successfully:', responseData);

      if (!responseData.class) {
        console.error('Invalid response format - missing class data:', responseData);
        throw new Error('Invalid response format from server');
      }

      setSuccess(`Successfully joined ${responseData.class.className}!`);

      // Navigate to the class detail page after a short delay
      setTimeout(() => {
        navigate(`/student/classes/${responseData.class.classId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error joining class:', err);

      // Handle different types of errors
      if (err.response) {
        console.error('Server response error:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
          url: err.response.config?.url
        });

        // Check for specific error status codes
        if (err.response.status === 401) {
          setError('You are not authenticated. Please log in again.');
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/student/login');
          }, 2000);
        } else if (err.response.status === 403) {
          setError('You do not have permission to join this class.');
        } else if (err.response.status === 404) {
          setError('Class not found. Please check the class code and try again.');
        } else if (err.response.data?.error) {
          setError(err.response.data.error);
        } else {
          setError(`Server error (${err.response.status}). Please try again.`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('No response from server. Please check your internet connection and try again.');
      } else if (err.message) {
        // Something happened in setting up the request
        if (err.message.includes('Invalid response format')) {
          setError('The server returned an unexpected response. Please try again.');
        } else if (err.message.includes('HTTP error! status: 401')) {
          setError('You are not authenticated. Please log in again.');
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/student/login');
          }, 2000);
        } else if (err.message.includes('HTTP error! status: 404')) {
          setError('Class not found. Please check the class code and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to join class. Please check the class code and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pro-form-container">
      <div className="pro-form-header">
        <h2 className="pro-form-title">
          <img src="/src/assets/code-icon.svg" alt="Join Class" />
          Join a Class
        </h2>
        <p className="pro-form-subtitle">Enter the class code provided by your teacher</p>
      </div>

      <div className="pro-form-body">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="pro-form-group">
            <label htmlFor="classCode" className="pro-form-label pro-form-label-icon">
              <img src="/src/assets/code-icon.svg" alt="Code" />
              Class Code <span className="pro-form-required">*</span>
            </label>

            <div className="pro-code-input-container">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => {
                    if (el) {
                      inputRefs.current[index] = el;
                    }
                  }}
                  type="text"
                  maxLength={1}
                  className={`pro-code-input-box ${codeInputs[index] ? 'filled' : ''}`}
                  value={codeInputs[index]}
                  onChange={(e) => handleCodeInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  autoCapitalize="characters"
                />
              ))}
            </div>

            <input
              id="classCode"
              type="text"
              className="sr-only"
              {...register('classCode', {
                required: 'Class code is required',
                minLength: { value: 6, message: 'Class code must be 6 characters' },
                maxLength: { value: 6, message: 'Class code must be 6 characters' },
                pattern: { value: /^[A-Za-z0-9]{6}$/, message: 'Class code must be 6 alphanumeric characters' }
              })}
            />

            {errors.classCode && (
              <div className="pro-form-error">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.classCode.message}
              </div>
            )}

            <div className="bg-blue-50 p-4 mt-4 rounded-md border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Ask your teacher for the 6-digit class code, then enter it above.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Class Preview (will show when code is entered) */}
          {watch('classCode')?.length === 6 && (
            <div className="pro-preview-card">
              <div className="pro-preview-header">
                <div className="pro-preview-icon">
                  <img src="/src/assets/lock-icon.svg" alt="Lock" className="invert" />
                </div>
                <div>
                  <h3 className="pro-preview-title">Looking for class...</h3>
                  <p className="pro-preview-subtitle">Code: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{watch('classCode')}</span></p>
                </div>
              </div>
              <div className="pro-preview-body">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-1/3 animate-pulse"></div>
                </div>
              </div>
              <div className="pro-preview-footer">
                <span>Verifying class code...</span>
              </div>
            </div>
          )}

          <div className="pro-form-footer">
            <button
              type="button"
              className="pro-form-button pro-form-button-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pro-form-button pro-form-button-primary"
              disabled={isLoading || watch('classCode')?.length !== 6}
            >
              {isLoading ? (
                <>
                  <span className="pro-form-loading"></span>
                  Joining...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3" />
                  </svg>
                  Join Class
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinClass;
