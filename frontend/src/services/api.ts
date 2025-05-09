import axios from 'axios';

// Use the environment variable for API URL or default to http://localhost:8080/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

console.log('API: Using base URL:', API_URL);

// Make sure API_URL doesn't end with a slash
const normalizedApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

const api = axios.create({
  baseURL: normalizedApiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Add this for better CORS handling
  },
  withCredentials: true, // Enable credentials to send cookies with requests
  timeout: 30000, // 30 seconds timeout
});

// Helper function to ensure URL starts with /api
const ensureApiPrefix = (url: string) => {
  if (!url) return url;
  
  console.log('API URL before processing:', url);
  
  // If URL already starts with the normalized API URL, return it as is
  if (url.startsWith(normalizedApiUrl)) {
    console.log('URL starts with normalized API URL, returning as is');
    return url;
  }
  
  // Check if URL already contains '/api/api/' - this would indicate a double prefixing issue
  if (url.includes('/api/api/')) {
    console.log('WARNING: Double API prefix detected in URL:', url);
    // Fix by removing one '/api'
    const fixedUrl = url.replace('/api/api/', '/api/');
    console.log('Fixed URL:', fixedUrl);
    return fixedUrl;
  }
  
  // If URL already starts with /api, return it as is
  if (url.startsWith('/api/')) {
    console.log('URL already starts with /api/, returning as is');
    return url;
  }
  
  // If URL starts with a slash but not /api, add /api prefix
  if (url.startsWith('/') && !url.startsWith('/api/')) {
    const prefixedUrl = `/api${url}`;
    console.log('Added /api prefix to URL starting with slash:', prefixedUrl);
    return prefixedUrl;
  }
  
  // If URL doesn't start with a slash, add /api/ prefix
  const prefixedUrl = `/api/${url}`;
  console.log('Added /api/ prefix to URL without slash:', prefixedUrl);
  return prefixedUrl;
};

// Request interceptor for adding auth token and ensuring proper API URL
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      console.log('API: Adding token to request headers');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('API: No token found for request');
    }

    // Ensure the URL has the correct API prefix
    if (config.url) {
      config.url = ensureApiPrefix(config.url);
      console.log('API: Using URL:', config.url);
    }

    return config;
  },
  (error) => {
    console.error('API request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log(`API: Response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  async (error) => {
    // Enhanced error logging
    console.error('API: Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });

    // Log the request details
    console.error('API: Request details:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      headers: error.config?.headers,
      params: error.config?.params,
      data: error.config?.data
    });

    // Detect network errors (no response from server)
    if (!error.response) {
      console.error('API: Network error detected - no response from server');
      const isNetworkError = error.message.includes('Network Error') || 
                            error.message.includes('Failed to fetch') ||
                            error.message.includes('timeout') ||
                            error.message.includes('ECONNREFUSED') ||
                            error.message.includes('ECONNABORTED') ||
                            error.message.includes('ETIMEDOUT');
      
      if (isNetworkError) {
        // Create a more descriptive error
        const enhancedError = new Error(`Network Error: Unable to connect to the server. Please check your internet connection and verify the server is running.`);
        enhancedError.name = 'NetworkError';
        // Attach the original error properties
        Object.assign(enhancedError, error);
        return Promise.reject(enhancedError);
      }
    }

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('API: Unauthorized access, checking if this is a login or auth request');

      // Don't clear tokens or redirect if this is a login or auth-related request
      const isAuthRequest = error.config?.url?.includes('/auth/');
      const isClassesRequest = error.config?.url?.includes('/classes');

      if (!isAuthRequest) {
        console.log('API: Not an auth request, checking if we should handle the 401');

        // For class-related requests, let the component handle the error
        if (isClassesRequest) {
          console.log('API: This is a classes request, letting the component handle the error');
          return Promise.reject(error);
        }

        console.log('API: Clearing tokens and redirecting');
        // Clear tokens from both localStorage and sessionStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // Redirect to the appropriate login page based on the current URL
        const currentPath = window.location.pathname;

        // If already on a login page, don't redirect
        if (currentPath.includes('/login')) {
          console.log('API: Already on a login page, not redirecting');
          return Promise.reject(error);
        }

        // Determine which login page to redirect to
        if (currentPath.includes('/teacher')) {
          window.location.href = '/teacher/login';
        } else if (currentPath.includes('/student')) {
          window.location.href = '/student/login';
        } else {
          // Default to the landing page if we can't determine the role
          window.location.href = '/';
        }
      } else {
        console.log('API: This is an auth request, not clearing tokens or redirecting');
      }
    }

    // Handle 404 Not Found errors for class-related requests
    if (error.response && error.response.status === 404 && error.config?.url?.includes('/classes')) {
      console.log('API: 404 Not Found for classes request, letting the component handle the error');
      // Let the component handle the error
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
