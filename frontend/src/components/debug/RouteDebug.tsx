import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AssignmentDebug.css';

const RouteDebug: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract class ID and assignment ID from the URL
  const pathParts = location.pathname.split('/');
  const classIdIndex = pathParts.indexOf('classes') + 1;
  const assignmentIdIndex = pathParts.indexOf('assignments') + 1;

  const classId = classIdIndex > 0 && classIdIndex < pathParts.length ? pathParts[classIdIndex] : null;
  const assignmentId = assignmentIdIndex > 0 && assignmentIdIndex < pathParts.length ? pathParts[assignmentIdIndex] : null;

  const handleTestApi = async () => {
    if (!classId || !assignmentId) {
      setError('Missing class ID or assignment ID');
      return;
    }

    if (!user) {
      setError('You must be logged in to test the API');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      console.log('Token for API test:', token ? 'Found' : 'Not found');

      // Test the assignment API
      const response = await fetch(`/api/classes/${classId}/assignments/${assignmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setApiResponse(data);
    } catch (err: any) {
      console.error('API test error:', err);
      setError(err.message || 'Failed to test API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assignment-debug-container">
      <h1>Route Debug Tool</h1>

      <div className="debug-section">
        <h2>Current Route</h2>
        <p><strong>Path:</strong> {location.pathname}</p>
        <p><strong>Search:</strong> {location.search}</p>
      </div>

      <div className="debug-section">
        <h2>URL Parameters</h2>
        <pre>{JSON.stringify(params, null, 2)}</pre>
      </div>

      <div className="debug-section">
        <h2>Extracted IDs</h2>
        <p><strong>Class ID:</strong> {classId || 'Not found'}</p>
        <p><strong>Assignment ID:</strong> {assignmentId || 'Not found'}</p>
      </div>

      <div className="debug-section">
        <h2>User Info</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="debug-section">
        <h2>API Test</h2>
        <button
          onClick={handleTestApi}
          className="debug-button"
          disabled={loading || !classId || !assignmentId}
        >
          {loading ? 'Testing...' : 'Test Assignment API'}
        </button>

        {error && <div className="debug-error">{error}</div>}

        {apiResponse && (
          <div className="debug-api-response">
            <h3>API Response</h3>
            <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="debug-actions">
        <button onClick={() => navigate(-1)} className="debug-button">
          Go Back
        </button>
      </div>
    </div>
  );
};

export default RouteDebug;
