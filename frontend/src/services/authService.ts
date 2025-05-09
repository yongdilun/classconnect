import axios from 'axios';
import api from './api';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'student';
  department?: string;
  gradeLevel?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  teacher?: {
    id: number;
    department?: string;
  };
  student?: {
    id: number;
    gradeLevel?: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// Token management
const getToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const setToken = (token: string): void => {
  console.log('Setting token in localStorage:', token ? token.substring(0, 10) + '...' : 'null');
  localStorage.setItem('token', token);
};

const removeToken = (): void => {
  console.log('Removing auth data from storage');
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Clear sessionStorage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

const authService = {
  // Register a new user - simplified version
  register: async (data: RegistrationData): Promise<AuthResponse> => {
    console.log('Auth service: Registering user with role:', data.role);

    try {
      // Basic validation
      if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
        throw new Error('All required fields must be filled');
      }

      console.log('Auth service: Sending registration request for:', data.email);



      // Try to register with the API
      try {
        console.log('Auth service: Attempting registration with axios');
        const response = await api.post<AuthResponse>('/auth/register', data);

        // Store the token and user data
        if (response.data && response.data.token) {
          setToken(response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          console.log('Auth service: Registration successful');
          return response.data;
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (axiosError: any) {
        console.error('Auth service: Axios registration failed:', axiosError);

        // Check if we have a response with error data
        if (axiosError.response) {
          console.error('Auth service: Server error response:', axiosError.response.data);

          // Create a more user-friendly error message
          let errorMessage = 'Registration failed. Please try again.';

          if (axiosError.response.data.error) {
            errorMessage = axiosError.response.data.error;
          } else if (axiosError.response.data.message) {
            errorMessage = axiosError.response.data.message;
          } else if (axiosError.response.status === 409) {
            errorMessage = 'This email is already registered. Please use a different email or login to your existing account.';
          } else if (axiosError.response.status === 400) {
            errorMessage = 'Invalid registration data. Please check your information and try again.';
          } else if (axiosError.response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }

          // Create a new error with the user-friendly message
          const error = new Error(errorMessage);
          error.name = 'RegistrationError';

          // Add the response to the error for more context
          (error as any).response = axiosError.response;

          throw error;
        }

        // Try direct fetch as a fallback only if there was a network error
        try {
          const baseUrl = api.defaults.baseURL || '';
          const registerUrl = `${baseUrl}/auth/register`;

          console.log('Auth service: Attempting registration with direct fetch to:', registerUrl);

          const directResponse = await fetch(registerUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!directResponse.ok) {
            // Get the error response as JSON if possible
            try {
              const errorData = await directResponse.json();
              console.error('Auth service: Direct fetch registration failed with error data:', errorData);

              // Use the specific error message from the server if available
              if (errorData.error) {
                throw new Error(errorData.error);
              } else if (errorData.message) {
                throw new Error(errorData.message);
              } else if (directResponse.status === 409) {
                throw new Error('This email is already registered. Please use a different email or login to your existing account.');
              } else {
                throw new Error('Registration failed. Please check your information and try again.');
              }
            } catch (jsonError) {
              // If we can't parse the error as JSON, provide a more user-friendly error
              if (directResponse.status === 409) {
                throw new Error('This email is already registered. Please use a different email or login to your existing account.');
              } else if (directResponse.status === 400) {
                throw new Error('Invalid registration data. Please check your information and try again.');
              } else if (directResponse.status === 500) {
                throw new Error('Server error. Please try again later.');
              } else {
                throw new Error('Registration failed. Please try again later.');
              }
            }
          }

          const responseData = await directResponse.json();
          console.log('Auth service: Direct fetch registration successful:', responseData);

          // Store the token and user data
          if (responseData && responseData.token) {
            setToken(responseData.token);
            localStorage.setItem('user', JSON.stringify(responseData.user));
          }

          return responseData;
        } catch (fetchError: any) {
          console.error('Auth service: Direct fetch registration failed:', fetchError);
          throw fetchError; // Rethrow the error to be handled by the signup component
        }
      }
    } catch (error: any) {
      console.error('Auth service: Registration error:', error);
      throw new Error('Registration failed: ' + (error.message || 'Unknown error'));
    }
  },

  // Login user - simplified version
  login: async (email: string, password: string, rememberMe: boolean = false, role: string = 'student'): Promise<AuthResponse> => {
    console.log('Auth service: Logging in user');

    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      console.log('Auth service: Sending login request for:', email, 'with role:', role);

      // Use the role provided by the user
      let userRole = role;

      // Try to login with the API
      try {
        console.log('Auth service: Attempting login with axios');
        const response = await api.post<AuthResponse>('/auth/login', { email, password, role: userRole });

        // Store the token and user data
        if (response.data && response.data.token) {
          if (rememberMe) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else {
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));
          }

          console.log('Auth service: Login successful with role:', response.data.user?.role);
          return response.data;
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (axiosError: any) {
        console.error('Auth service: Axios login failed:', axiosError);

        // Check if we have a response with error data
        if (axiosError.response && axiosError.response.data) {
          console.error('Auth service: Server error response:', axiosError.response.data);

          // Create a more user-friendly error message
          let errorMessage = 'Login failed. Please try again.';

          if (axiosError.response.data.error) {
            errorMessage = axiosError.response.data.error;
          } else if (axiosError.response.data.message) {
            errorMessage = axiosError.response.data.message;
          } else if (axiosError.response.status === 401) {
            errorMessage = 'The email or password you entered is incorrect. Please try again.';
          } else if (axiosError.response.status === 404) {
            errorMessage = 'No account found with this email address. Please check your email or sign up.';
          } else if (axiosError.response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }

          // Create a new error with the user-friendly message
          const error = new Error(errorMessage);
          error.name = 'AuthError';
          throw error;
        }

        // Try direct fetch as a fallback only if there was a network error
        try {
          const baseUrl = api.defaults.baseURL || '';
          const loginUrl = `${baseUrl}/auth/login`;

          console.log('Auth service: Attempting login with direct fetch to:', loginUrl);

          const directResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password, role: userRole }),
          });

          if (!directResponse.ok) {
            // Get the error response as JSON if possible
            try {
              const errorData = await directResponse.json();
              console.error('Auth service: Direct fetch login failed with error data:', errorData);

              // Use the specific error message from the server if available
              if (errorData.error) {
                throw new Error(errorData.error);
              } else if (errorData.message) {
                throw new Error(errorData.message);
              } else {
                throw new Error('Login failed. Please check your credentials and try again.');
              }
            } catch (jsonError) {
              // If we can't parse the error as JSON, provide a more user-friendly error
              if (directResponse.status === 401) {
                throw new Error('The email or password you entered is incorrect. Please try again.');
              } else if (directResponse.status === 404) {
                throw new Error('No account found with this email address. Please check your email or sign up.');
              } else if (directResponse.status === 500) {
                throw new Error('Server error. Please try again later.');
              } else {
                throw new Error('Login failed. Please try again later.');
              }
            }
          }

          const data = await directResponse.json();
          console.log('Auth service: Direct fetch login successful:', data);

          // Store the token and user data
          if (data && data.token) {
            if (rememberMe) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
            } else {
              sessionStorage.setItem('token', data.token);
              sessionStorage.setItem('user', JSON.stringify(data.user));
            }
          }

          return data;
        } catch (fetchError: any) {
          console.error('Auth service: Direct fetch login failed:', fetchError);
          throw fetchError; // Rethrow the error to be handled by the login component
        }
      }
    } catch (error: any) {
      console.error('Auth service: Login error:', error);
      throw new Error('Login failed: ' + (error.message || 'Unknown error'));
    }
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    try {
      if (!token) throw new Error('Verification token is required');

      const response = await api.post<{ message: string }>('/auth/verify-email', { token });
      return response.data;
    } catch (error: any) {
      console.error('Auth service: Email verification error:', error);

      if (error.response) {
        if (error.response.status === 400) {
          throw new Error(error.response.data?.error || 'Invalid verification token');
        } else if (error.response.status === 404) {
          throw new Error('Verification token not found or expired');
        } else if (error.response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection and try again.');
      }

      throw error;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    try {
      if (!refreshToken) throw new Error('Refresh token is required');

      const response = await api.post<{ token: string }>('/auth/refresh-token', { refreshToken });

      if (response.data && response.data.token) {
        // Update the token in storage
        const currentToken = getToken();
        if (currentToken) {
          setToken(response.data.token);
        } else {
          sessionStorage.setItem('token', response.data.token);
        }
      } else {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Auth service: Token refresh error:', error);

      if (error.response) {
        if (error.response.status === 401) {
          // Clear tokens on unauthorized (token expired or invalid)
          removeToken();
          throw new Error('Your session has expired. Please log in again.');
        } else if (error.response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection and try again.');
      }

      throw error;
    }
  },

  // Logout user
  logout: (): void => {
    removeToken();
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    try {
      console.log('Auth service: Getting current user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get<User>('/users/me');
      console.log('Auth service: Current user data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Auth service: Failed to get current user:', error);

      if (error.response && error.response.status === 401) {
        // Clear tokens on unauthorized
        removeToken();
      }

      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    // Check localStorage first (for "remember me" users)
    const localToken = localStorage.getItem('token');
    const localUserStr = localStorage.getItem('user');

    // Then check sessionStorage (for session-only users)
    const sessionToken = sessionStorage.getItem('token');
    const sessionUserStr = sessionStorage.getItem('user');

    const isAuth = (!!localToken && !!localUserStr) || (!!sessionToken && !!sessionUserStr);

    console.log('Auth service: Checking authentication status:', {
      hasLocalToken: !!localToken,
      hasLocalUserData: !!localUserStr,
      hasSessionToken: !!sessionToken,
      hasSessionUserData: !!sessionUserStr,
      isAuthenticated: isAuth
    });

    return isAuth;
  },

  // Test the API connection
  testConnection: async (): Promise<{ message: string, timestamp: string, database?: { status: string, error?: string } }> => {
    try {
      console.log('Auth service: Testing API connection...');

      // Try the /health endpoint first (checks database connection)
      try {
        const baseUrl = api.defaults.baseURL || '';
        const baseUrlWithoutApi = baseUrl.replace('/api', '');
        console.log('Auth service: Trying health check at:', baseUrlWithoutApi + '/health');

        // Try with fetch first
        try {
          console.log('Auth service: Trying fetch for health check');
          const fetchResponse = await fetch(baseUrlWithoutApi + '/health', {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            console.log('Auth service: Health check with fetch successful:', data);

            // Check database status
            if (data.database && data.database.status === 'error') {
              return {
                message: 'API server is running but database connection failed: ' +
                        (data.database.error || 'Unknown database error'),
                timestamp: data.time || new Date().toISOString(),
                database: data.database
              };
            }

            return {
              message: 'API server and database connection successful (fetch)',
              timestamp: data.time || new Date().toISOString(),
              database: data.database
            };
          }
          throw new Error(`Health check failed with status: ${fetchResponse.status}`);
        } catch (fetchError) {
          console.warn('Auth service: Health check with fetch failed, trying axios:', fetchError);

          // Try with axios as fallback
          const healthResponse = await axios.get(baseUrlWithoutApi + '/health', {
            timeout: 10000,
            headers: {
              'Accept': 'application/json'
            }
          });
          console.log('Auth service: Health check with axios successful:', healthResponse.data);

          // Check database status
          if (healthResponse.data.database && healthResponse.data.database.status === 'error') {
            return {
              message: 'API server is running but database connection failed: ' +
                      (healthResponse.data.database.error || 'Unknown database error'),
              timestamp: healthResponse.data.time || new Date().toISOString(),
              database: healthResponse.data.database
            };
          }

          return {
            message: 'API server and database connection successful (axios)',
            timestamp: healthResponse.data.time || new Date().toISOString(),
            database: healthResponse.data.database
          };
        }
      } catch (healthError) {
        console.warn('Auth service: All health check attempts failed, trying ping endpoint:', healthError);
      }

      // Try the /ping endpoint (direct endpoint)
      try {
        const baseUrl = api.defaults.baseURL || '';
        const baseUrlWithoutApi = baseUrl.replace('/api', '');
        console.log('Auth service: Trying ping at:', baseUrlWithoutApi + '/ping');

        // Try with fetch first
        try {
          console.log('Auth service: Trying fetch for ping');
          const fetchResponse = await fetch(baseUrlWithoutApi + '/ping', {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            console.log('Auth service: Ping with fetch successful:', data);
            return {
              message: 'API server is running but database status unknown (fetch)',
              timestamp: data.time || new Date().toISOString()
            };
          }
          throw new Error(`Ping failed with status: ${fetchResponse.status}`);
        } catch (fetchError) {
          console.warn('Auth service: Ping with fetch failed, trying axios:', fetchError);

          // Try with axios as fallback
          const pingResponse = await axios.get(baseUrlWithoutApi + '/ping', {
            timeout: 10000,
            headers: {
              'Accept': 'application/json'
            }
          });
          console.log('Auth service: Ping with axios successful:', pingResponse.data);
          return {
            message: 'API server is running but database status unknown (axios)',
            timestamp: pingResponse.data.time || new Date().toISOString()
          };
        }
      } catch (pingError) {
        console.warn('Auth service: All ping attempts failed, trying /api/test endpoint:', pingError);
      }

      // Try the /api/test endpoint
      try {
        console.log('Auth service: Trying /api/test endpoint with axios');
        const response = await api.get<{ message: string, timestamp: string }>('/test', {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });
        console.log('Auth service: API connection test successful:', response.data);
        return response.data;
      } catch (apiError) {
        console.warn('Auth service: API test failed, trying direct fetch:', apiError);

        // Try direct fetch as a fallback
        const baseUrl = api.defaults.baseURL || '';
        const testUrl = `${baseUrl}/test`;

        console.log('Auth service: Trying direct fetch to:', testUrl);

        const directResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!directResponse.ok) {
          throw new Error(`API test failed with status: ${directResponse.status}`);
        }

        const data = await directResponse.json();
        console.log('Auth service: Direct fetch API test successful:', data);
        return data;
      }
    } catch (error: any) {
      console.error('Auth service: API connection test failed:', error);

      // Try all possible endpoints as a last resort
      try {
        const baseUrl = api.defaults.baseURL || '';
        const baseUrlWithoutApi = baseUrl.replace('/api', '');

        // Try all possible endpoints
        const endpoints = [
          { url: baseUrlWithoutApi + '/ping', name: 'ping' },
          { url: baseUrlWithoutApi + '/health', name: 'health' },
          { url: baseUrlWithoutApi + '/api/test', name: 'api-test' },
          { url: baseUrl + '/test', name: 'test' }
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`Auth service: Last resort - trying ${endpoint.name} at: ${endpoint.url}`);

            const directResponse = await fetch(endpoint.url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              },
              // Very short timeout to quickly try all endpoints
              signal: AbortSignal.timeout(3000)
            });

            if (directResponse.ok) {
              const data = await directResponse.json();
              console.log(`Auth service: Last resort ${endpoint.name} connection successful:`, data);
              return {
                message: `Direct server connection successful at ${endpoint.name}, but API client failed`,
                timestamp: data.time || new Date().toISOString()
              };
            }
          } catch (endpointError) {
            console.warn(`Auth service: Last resort ${endpoint.name} failed:`, endpointError);
            // Continue to next endpoint
          }
        }

        throw new Error('All connection attempts failed');
      } catch (directError) {
        console.error('Auth service: All connection attempts failed');
        throw new Error('Failed to connect to the API server. Please check if the server is running and the URL is correct.');
      }
    }
  },

  // Get current token from either localStorage or sessionStorage
  getToken: (): string | null => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    try {
      // Validate email
      if (!email) throw new Error('Email is required');

      // Validate email format
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      console.error('Auth service: Password reset request error:', error);

      if (error.response) {
        if (error.response.status === 404) {
          // Don't reveal if email exists or not for security reasons
          // Instead, return a generic message
          return { message: 'If your email exists in our system, you will receive a password reset link shortly.' };
        } else if (error.response.status === 400) {
          throw new Error(error.response.data?.error || 'Invalid email');
        } else if (error.response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection and try again.');
      }

      throw error;
    }
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    try {
      // Validate inputs
      if (!token) throw new Error('Reset token is required');
      if (!newPassword) throw new Error('New password is required');

      // Validate password length
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const response = await api.post<{ message: string }>('/auth/reset-password', {
        token,
        newPassword,
      });

      return response.data;
    } catch (error: any) {
      console.error('Auth service: Password reset error:', error);

      if (error.response) {
        if (error.response.status === 400) {
          throw new Error(error.response.data?.error || 'Invalid reset token or password');
        } else if (error.response.status === 404) {
          throw new Error('Reset token not found or expired');
        } else if (error.response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection and try again.');
      }

      throw error;
    }
  },
};

export default authService;
