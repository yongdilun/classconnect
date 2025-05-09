import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classService from '../../services/classService';
import type { CreateClassRequest } from '../../services/classService';
import '../../styles/forms.css';

const CreateClass: React.FC = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateClassRequest>({
    defaultValues: {
      themeColor: 'purple'
    }
  });
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('purple');
  const navigate = useNavigate();

  const colorOptions = [
    { name: 'Purple', value: 'purple', hex: '#6264A7' },
    { name: 'Blue', value: 'blue', hex: '#4F6bed' },
    { name: 'Green', value: 'green', hex: '#13A10E' },
    { name: 'Red', value: 'red', hex: '#CF3F05' },
    { name: 'Pink', value: 'pink', hex: '#C239B3' },
    { name: 'Teal', value: 'teal', hex: '#0099BC' },
  ];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue('themeColor', color);
  };

  const onSubmit = async (data: CreateClassRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating class with data:', data);
      console.log('Current user:', user);

      // Get the token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token');

      let newClass;

      // Try using the service first
      try {
        console.log('Attempting to create class using service');
        newClass = await classService.createClass(data);
        console.log('Class created successfully using service:', newClass);
      } catch (serviceError) {
        console.error('Service error:', serviceError);
        console.log('Falling back to direct fetch');

        // Fallback to direct fetch if the service fails
        const response = await fetch('/api/classes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        console.log('Create class response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        newClass = await response.json();
        console.log('Class created successfully using direct fetch:', newClass);
      }

      // Show success message
      setError(null);
      setSuccess(`Successfully created class: ${newClass.className}`);

      // Navigate to the teacher classes page after a short delay
      setTimeout(() => {
        navigate('/teacher/classes');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating class:', err);

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
            navigate('/teacher/login');
          }, 2000);
        } else if (err.response.status === 403) {
          setError('You do not have permission to create classes.');
        } else if (err.response.status === 404) {
          setError('The class creation endpoint was not found. This is likely a server configuration issue.');
          console.error('404 Not Found for URL:', err.response.config?.url);
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
        setError(err.message);
      } else {
        setError('Failed to create class. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pro-form-container">
      <div className="pro-form-header">
        <h2 className="pro-form-title">
          <img src="/src/assets/class-icon.svg" alt="Create Class" />
          Create a New Class
        </h2>
        <p className="pro-form-subtitle">Fill in the details below to create your virtual classroom</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Class Name Field */}
            <div className="pro-form-group md:col-span-2">
              <label htmlFor="className" className="pro-form-label pro-form-label-icon">
                <img src="/src/assets/class-icon.svg" alt="Class" />
                Class Name <span className="pro-form-required">*</span>
              </label>
              <input
                id="className"
                type="text"
                className="pro-form-input"
                placeholder="Enter class name (e.g., Advanced Mathematics)"
                {...register('className', { required: 'Class name is required' })}
              />
              {errors.className && (
                <div className="pro-form-error">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.className.message}
                </div>
              )}
            </div>

            {/* Subject Field */}
            <div className="pro-form-group">
              <label htmlFor="subject" className="pro-form-label pro-form-label-icon">
                <img src="/src/assets/subject-icon.svg" alt="Subject" />
                Subject
              </label>
              <input
                id="subject"
                type="text"
                className="pro-form-input"
                placeholder="Enter subject (e.g., Mathematics, Science)"
                {...register('subject')}
              />
              <div className="pro-form-hint">Helps students identify the subject area of your class</div>
            </div>

            {/* Theme Color Field */}
            <div className="pro-form-group">
              <label htmlFor="themeColor" className="pro-form-label pro-form-label-icon">
                <img src="/src/assets/color-icon.svg" alt="Color" />
                Theme Color
              </label>

              <select
                id="themeColor"
                className="pro-form-select"
                {...register('themeColor')}
              >
                {colorOptions.map(color => (
                  <option key={color.value} value={color.value}>{color.name}</option>
                ))}
              </select>

              <div className="pro-color-picker">
                {colorOptions.map(color => (
                  <div
                    key={color.value}
                    className={`pro-color-option ${selectedColor === color.value ? 'selected' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => handleColorSelect(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Description Field */}
            <div className="pro-form-group md:col-span-2">
              <label htmlFor="description" className="pro-form-label pro-form-label-icon">
                <img src="/src/assets/description-icon.svg" alt="Description" />
                Description
              </label>
              <textarea
                id="description"
                className="pro-form-textarea"
                placeholder="Enter class description..."
                rows={4}
                {...register('description')}
              />
              <div className="pro-form-hint">Provide details about your class to help students understand what they'll be learning</div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="pro-preview-card">
            <div className="pro-preview-header">
              <div className="pro-preview-icon" style={{ backgroundColor: colorOptions.find(c => c.value === watch('themeColor'))?.hex || '#6264A7' }}>
                {watch('className') ? watch('className').charAt(0).toUpperCase() : 'C'}
              </div>
              <div>
                <h3 className="pro-preview-title">{watch('className') || 'Class Name'}</h3>
                <p className="pro-preview-subtitle">{watch('subject') || 'Subject'}</p>
              </div>
            </div>
            <div className="pro-preview-body">
              <p className="pro-preview-content">{watch('description') || 'Class description will appear here...'}</p>
            </div>
            <div className="pro-preview-footer">
              <span>Preview: How students will see your class</span>
              <span>Theme: {colorOptions.find(c => c.value === watch('themeColor'))?.name || 'Purple'}</span>
            </div>
          </div>

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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="pro-form-loading"></span>
                  Creating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Class
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClass;
