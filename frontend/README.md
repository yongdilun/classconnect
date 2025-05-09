# ClassConnect Frontend

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Development](#development)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
  - [Linting and Type Checking](#linting-and-type-checking)
- [Features](#features)
  - [Authentication](#authentication)
  - [Dashboard](#dashboard)
  - [Classes](#classes)
  - [Assignments](#assignments)
  - [Submissions](#submissions)
  - [Announcements](#announcements)
  - [Chat](#chat)
  - [Grades](#grades)
- [Component Library](#component-library)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling](#styling)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The ClassConnect frontend is a modern React application that provides a user-friendly interface for the ClassConnect learning management system. It offers separate experiences for teachers and students, with features for class management, assignments, submissions, announcements, chat, and grade tracking.

## Technology Stack

- **React**: UI library for building component-based interfaces
- **TypeScript**: Static typing for improved code quality
- **Vite**: Next-generation frontend build tool
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **React Hook Form**: Form validation and handling

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Shared components (buttons, inputs, etc.)
│   │   ├── layout/      # Layout components
│   │   └── classes/     # Class-specific components
│   ├── contexts/        # React contexts
│   ├── pages/           # Page components
│   │   ├── auth/        # Authentication pages
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── classes/     # Class-related pages
│   │   └── grades/      # Grade-related pages
│   ├── services/        # API service functions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── package.json         # Project dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yongdilun/classconnect.git
   cd classconnect/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Environment Configuration

Create a `.env` file in the frontend directory with the following content:

```env
VITE_API_URL=http://localhost:8080/api
```

## Development

### Running the Development Server

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

### Linting and Type Checking

To run the linter:

```bash
npm run lint
# or
yarn lint
```

To run type checking:

```bash
npm run typecheck
# or
yarn typecheck
```

## Features

### Authentication

- Separate login and signup flows for teachers and students
- JWT-based authentication
- Protected routes based on user roles

### Dashboard

- Overview of classes, assignments, and recent activity
- Quick access to important actions
- Role-specific views for teachers and students

### Classes

- Class creation and management for teachers
- Class joining for students
- Class details view with tabs for assignments, announcements, and chat

### Assignments

- Assignment creation and management for teachers
- Assignment viewing and submission for students
- Due date tracking and status indicators

### Submissions

- Submission creation for students
- Submission review and grading for teachers
- Feedback system

### Announcements

- Announcement creation for teachers
- Announcement viewing for all class members

### Chat

- Real-time class chat for all class members
- Message history

### Grades

- Grade summaries for students across all classes
- Class-based grade reports for teachers
- Detailed grade views for individual assignments

## Component Library

The application uses a custom component library built with Tailwind CSS. Key components include:

- **Button**: Reusable button component with multiple variants
- **Input**: Form input components with validation
- **Card**: Card components for displaying information
- **Modal**: Modal dialog components
- **Tabs**: Tab navigation components

## State Management

The application uses React Context API for global state management:

- **AuthContext**: Manages user authentication state
- **Local component state**: Manages component-specific state

## API Integration

API integration is handled through service modules:

- **api.ts**: Base configuration for API requests
- **authService.ts**: Authentication-related API calls
- **classService.ts**: Class-related API calls
- **assignmentService.ts**: Assignment-related API calls

## Styling

The application uses Tailwind CSS for styling:

- Utility-first approach
- Custom theme configuration in `tailwind.config.js`
- Responsive design for all screen sizes

## Deployment

1. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Deploy the contents of the `dist` directory to your web server or hosting service.

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Check that the backend server is running
   - Verify the `VITE_API_URL` in the `.env` file
   - Check browser console for CORS errors

2. **Authentication Problems**
   - Clear browser localStorage and try logging in again
   - Check that the JWT token is being properly stored and sent

3. **Build Issues**
   - Check for TypeScript errors
   - Verify that all dependencies are installed
   - Clear the node_modules folder and reinstall dependencies
```
