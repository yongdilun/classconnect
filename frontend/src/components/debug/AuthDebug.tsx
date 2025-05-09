import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import './AssignmentDebug.css';

const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestAuth = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      // Test the auth API
      const userData = await authService.getCurrentUser();
      setApiResponse(userData);
    } catch (err: any) {
      console.error('Auth test error:', err);
      setError(err.message || 'Failed to test auth API');
    } finally {
      setLoading(false);
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    alert('Auth storage cleared. Please refresh the page.');
  };

  const handleLogout = () => {
    logout();
    alert('Logged out. Please refresh the page.');
  };

  return (
    <div className="assignment-debug-container">
      <h1>Auth Debug Tool</h1>
      
      <div className="debug-section">
        <h2>Authentication State</h2>
        <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="debug-section">
        <h2>User Info</h2>
        {user ? (
          <pre>{JSON.stringify(user, null, 2)}</pre>
        ) : (
          <p>No user data available</p>
        )}
      </div>
      
      <div className="debug-section">
        <h2>Storage Info</h2>
        <div>
          <h3>Local Storage</h3>
          <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Not present'}</p>
          <p><strong>User:</strong> {localStorage.getItem('user') ? 'Present' : 'Not present'}</p>
          {localStorage.getItem('user') && (
            <pre>{JSON.stringify(JSON.parse(localStorage.getItem('user') || '{}'), null, 2)}</pre>
          )}
        </div>
        
        <div>
          <h3>Session Storage</h3>
          <p><strong>Token:</strong> {sessionStorage.getItem('token') ? 'Present' : 'Not present'}</p>
          <p><strong>User:</strong> {sessionStorage.getItem('user') ? 'Present' : 'Not present'}</p>
          {sessionStorage.getItem('user') && (
            <pre>{JSON.stringify(JSON.parse(sessionStorage.getItem('user') || '{}'), null, 2)}</pre>
          )}
        </div>
      </div>
      
      <div className="debug-section">
        <h2>API Test</h2>
        <button 
          onClick={handleTestAuth} 
          className="debug-button"
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Auth API'}
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
        <button onClick={handleClearStorage} className="debug-button danger-button">
          Clear Auth Storage
        </button>
        <button onClick={handleLogout} className="debug-button warning-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
