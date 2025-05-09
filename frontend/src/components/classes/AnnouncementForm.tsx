import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import classService from '../../services/classService';
import './AnnouncementForm.css';

interface AnnouncementFormProps {
  classId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface AnnouncementFormData {
  title: string;
  content: string;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ classId, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AnnouncementFormData>();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      setError(null);
      await classService.createAnnouncement(classId, data.content, data.title);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      setError(err.message || 'Failed to create announcement');
    }
  };

  return (
    <div className="announcement-form-container">
      <div className="announcement-form-header">
        <h2>Create Announcement</h2>
        <button className="close-button" onClick={onCancel}>×</button>
      </div>
      
      {error && (
        <div className="announcement-form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="title">Title (Optional)</label>
          <input
            id="title"
            type="text"
            placeholder="Enter a title for your announcement"
            {...register('title')}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content <span className="required">*</span></label>
          <textarea
            id="content"
            placeholder="Enter your announcement content"
            rows={5}
            {...register('content', { required: 'Content is required' })}
          />
          {errors.content && (
            <span className="error-message">{errors.content.message}</span>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm;
