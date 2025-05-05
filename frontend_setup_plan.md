# ClassConnect Frontend Setup Plan

This document outlines the detailed setup process for the ClassConnect frontend application using React, TypeScript, Vite, Tailwind CSS, and other modern web technologies.

## Technology Stack

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **JWT**: Authentication (stored in httpOnly cookies or localStorage)
- **React Hook Form**: Form handling and validation
- **React Query**: Data fetching and caching
- **Zustand/Redux Toolkit**: State management (optional)

## Setup Process

### 1. Project Initialization

```bash
# Create a new Vite project with React and TypeScript
npm create vite@latest classconnect-frontend -- --template react-ts

# Navigate to the project directory
cd classconnect-frontend

# Install dependencies
npm install
```

### 2. Install Core Dependencies

```bash
# Install UI and routing libraries
npm install react-router-dom

# Install HTTP and authentication libraries
npm install axios jwt-decode

# Install form handling
npm install react-hook-form

# Install optional but recommended libraries
npm install react-query zustand
```

### 3. Setup Tailwind CSS

```bash
# Install Tailwind CSS and its dependencies
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
npx tailwindcss init -p
```

Configure Tailwind CSS by updating the `tailwind.config.js` file:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // Add more shades as needed
          600: '#0284c7',
          700: '#0369a1',
        },
        // Add more custom colors
      },
    },
  },
  plugins: [],
}
```

Add Tailwind directives to your CSS in `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles can go here */
```

### 4. Project Structure Setup

Create the following directory structure:

```
src/
├── assets/            # Static assets like images, fonts
├── components/        # Reusable UI components
│   ├── common/        # Shared components (buttons, inputs, etc.)
│   ├── layout/        # Layout components (header, footer, etc.)
│   └── features/      # Feature-specific components
├── config/            # Configuration files
├── hooks/             # Custom React hooks
├── pages/             # Page components
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard pages
│   ├── classes/       # Class management pages
│   └── assignments/   # Assignment pages
├── services/          # API services
├── store/             # State management
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### 5. Setup API Service

Create a base API service in `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 6. Setup Authentication

Create authentication service in `src/services/authService.ts`:

```typescript
import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'student';
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('token');
    // Optional: Call logout endpoint to invalidate token on server
    api.post('/auth/logout').catch(() => {
      // Ignore errors during logout
    });
  },

  getCurrentUser: async () => {
    const response = await api.get<AuthResponse['user']>('/auth/me');
    return response.data;
  },
};

export default authService;
```

### 7. Setup Routing

Create a router configuration in `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ClassList from './pages/classes/ClassList';
import ClassDetail from './pages/classes/ClassDetail';
import AssignmentList from './pages/assignments/AssignmentList';
import AssignmentDetail from './pages/assignments/AssignmentDetail';
import Layout from './components/layout/Layout';
import authService from './services/authService';

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authService.getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="classes" element={<ClassList />} />
          <Route path="classes/:id" element={<ClassDetail />} />
          <Route path="assignments" element={<AssignmentList />} />
          <Route path="assignments/:id" element={<AssignmentDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 8. Environment Configuration

Create `.env` and `.env.production` files in the project root:

```
# .env (development)
VITE_API_URL=http://localhost:8080/api
```

```
# .env.production
VITE_API_URL=/api
```

### 9. Setup TypeScript Types

Create common type definitions in `src/types/index.ts`:

```typescript
// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student';
  profilePicture?: string;
}

// Class types
export interface Class {
  id: number;
  name: string;
  code: string;
  description?: string;
  subject?: string;
  createdDate: string;
  isArchived: boolean;
  themeColor?: string;
  creatorId: number;
}

// Assignment types
export interface Assignment {
  id: number;
  classId: number;
  title: string;
  description?: string;
  typeId?: number;
  pointsPossible: number;
  dueDate?: string;
  createdDate: string;
  publishedDate?: string;
  isPublished: boolean;
  allowLateSubmissions: boolean;
  createdBy: number;
}

// Submission types
export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  submissionDate: string;
  isLate: boolean;
  status: 'draft' | 'submitted' | 'returned' | 'graded';
  grade?: number;
  feedback?: string;
  gradedBy?: number;
  gradedDate?: string;
}

// Add more types as needed
```

### 10. Create Basic Components

Create a basic button component in `src/components/common/Button.tsx`:

```typescript
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
}) => {
  const baseClasses = 'rounded font-medium focus:outline-none transition-colors';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };
  
  const sizeClasses = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
```

### 11. Create Login Page

Create a login page in `src/pages/auth/Login.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import authService, { LoginCredentials } from '../../services/authService';
import Button from '../../components/common/Button';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

### 12. Build and Deployment Configuration

Update `vite.config.ts` for production builds:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

Update `package.json` scripts:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview"
}
```

### 13. Testing Setup (Optional)

Install testing libraries:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

Create a test setup file in `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Update `vite.config.ts` to include test configuration:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  // ... rest of your config
});
```

Add test script to `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

## Development Workflow

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Build for Production**:
   ```bash
   npm run build
   ```

3. **Preview Production Build**:
   ```bash
   npm run preview
   ```

## Next Steps

1. Implement remaining pages and components
2. Set up state management with Zustand or Redux Toolkit
3. Implement data fetching with React Query
4. Add form validation with React Hook Form
5. Implement error handling and loading states
6. Add unit and integration tests
7. Set up CI/CD pipeline for automated testing and deployment

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/en/main)
- [React Hook Form Documentation](https://react-hook-form.com/get-started)
