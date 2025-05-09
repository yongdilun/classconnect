import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';

// Define the User type
export interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  userRole: string;
  profileId?: number;
}

// Define the context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Check if there's a token in localStorage or sessionStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          console.log('No token found, user is not authenticated');
          setUser(null);
          setIsLoading(false);
          return;
        }

        console.log('Token found, attempting to get user data');

        // First try to get user data from localStorage or sessionStorage for immediate display
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        let localUserData = null;

        if (userStr) {
          try {
            localUserData = JSON.parse(userStr);
            console.log('User data found in storage:', localUserData);
            // Set user data from storage temporarily while we verify with the server
            setUser(localUserData);
          } catch (e) {
            console.error('Error parsing user data from storage:', e);
          }
        }

        // Then verify the token with the server and get fresh user data
        try {
          console.log('Verifying token with server...');
          const userData = await authService.getCurrentUser();
          console.log('Server returned user data:', userData);

          // Convert the authService User to our User format
          const formattedUserData: User = {
            userId: userData.id,
            email: userData.email,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            userRole: userData.role,
            profileId: userData.teacher?.id || userData.student?.id
          };

          // Ensure we have a valid profileId for students
          if (!formattedUserData.profileId && formattedUserData.userRole === 'student') {
            console.warn('No student profile ID found in server response, checking student object');
            if (userData.student && userData.student.id) {
              formattedUserData.profileId = userData.student.id;
              console.log('Found profile ID in student object:', formattedUserData.profileId);
            } else {
              console.warn('No student profile ID found, user profile may be incomplete');
            }
          }

          // Update the user data in state and storage
          setUser(formattedUserData);

          // Update the stored user data
          const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
          storage.setItem('user', JSON.stringify(formattedUserData));

          console.log('User authentication verified with server');
        } catch (serverError) {
          console.error('Error verifying token with server:', serverError);

          // If we have local user data, keep using it
          if (localUserData) {
            console.log('Using cached user data despite server error');

            // Check if the cached data has a profileId for students
            if (localUserData.userRole === 'student' && !localUserData.profileId) {
              console.warn('Cached student data is missing profileId, user may need to log in again');
            }
          } else {
            // If we don't have local data and server verification failed, log the user out
            console.log('No cached data and server verification failed, logging out');
            authService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string, role: string) => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Logging in user with role:', role);

      // Call authService.login with the correct parameters
      // The third parameter is rememberMe (boolean), and the fourth is role (string)
      const response = await authService.login(email, password, true, role);
      console.log('AuthContext: Login response:', response);

      // Store user data in state
      if (response && response.user) {
        // Validate that the user's role matches the requested role
        if (response.user.role !== role) {
          console.error(`Role mismatch: User is a ${response.user.role} but tried to log in as a ${role}`);
          throw new Error(`This account is registered as a ${response.user.role}. Please use the ${response.user.role} login page.`);
        }

        // Convert the authService User to our User format
        const userData: User = {
          userId: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
          userRole: response.user.role,
          profileId: response.user.teacher?.id || response.user.student?.id
        };

        console.log('AuthContext: Setting user data:', userData);

        // Ensure we have a valid profileId
        if (!userData.profileId && userData.userRole === 'student') {
          console.warn('AuthContext: No student profile ID found, attempting to fetch it');
          try {
            // Try to get the current user to get the profile ID
            const currentUser = await authService.getCurrentUser();
            if (currentUser && currentUser.student && currentUser.student.id) {
              userData.profileId = currentUser.student.id;
              console.log('AuthContext: Updated profile ID from getCurrentUser:', userData.profileId);
            }
          } catch (profileErr) {
            console.error('AuthContext: Failed to get profile ID:', profileErr);
          }
        }

        setUser(userData);

        // Also update the stored user data
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(userData));
      } else {
        console.error('AuthContext: Invalid response format - missing user data');
        throw new Error('Invalid response format - missing user data');
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Provide the auth context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
