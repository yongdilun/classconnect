# ClassConnect

<div align="center">
  <h3>A Modern Learning Management System</h3>
</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Running the Application](#-running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Database Management](#-database-management)
  - [Schema Migrations](#schema-migrations)
  - [Data Persistence](#data-persistence)
- [Project Structure](#-project-structure)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
- [API Documentation](#-api-documentation)
- [Authentication](#-authentication)
- [User Roles](#-user-roles)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

ClassConnect is a comprehensive Google Classroom-like application designed to facilitate online learning and classroom management. It provides separate interfaces for teachers and students, allowing for efficient management of classes, assignments, submissions, and communications.

## 🚀 Features

### For Teachers
- **Class Management**: Create and manage virtual classrooms
- **Assignment Creation**: Create, edit, and publish assignments with due dates
- **Grading System**: Review and grade student submissions
- **Announcements**: Post important updates to classes
- **Class Chat**: Communicate with students in real-time
- **Grade Summaries**: View comprehensive grade reports for all students

### For Students
- **Class Enrollment**: Join classes using unique class codes
- **Assignment Tracking**: View, submit, and track assignments
- **Submission Management**: Submit work and receive feedback
- **Class Communication**: Participate in class discussions
- **Grade Viewing**: Access personal grade summaries across all classes

## 💻 Technology Stack

### Frontend
- **React**: UI library for building component-based interfaces
- **TypeScript**: Static typing for improved code quality
- **Vite**: Next-generation frontend build tool
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **React Hook Form**: Form validation and handling

### Backend
- **Go**: High-performance programming language
- **Gin**: Web framework for building APIs
- **GORM**: ORM library for database interactions
- **JWT**: Authentication mechanism
- **MSSQL**: Microsoft SQL Server for data storage

## 🏁 Getting Started

### Prerequisites
- Node.js (v16 or higher) and npm
- Go 1.20 or higher
- Microsoft SQL Server (2019 or higher)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yongdilun/classconnect.git
   cd classconnect
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   go mod download
   ```

4. Set up SQL Server:
   - Install Microsoft SQL Server (Developer or Express edition is fine for development)
   - Enable both Windows Authentication and SQL Server Authentication modes
   - Create a database named `ClassConnect` or use the name specified in your `.env` file
   - If using SQL Server Authentication:
     - Ensure the 'sa' account is enabled and has a password
     - Update the `.env` file with the correct credentials
   - If using Windows Authentication:
     - Set `DB_INTEGRATED_SECURITY=true` in your `.env` file
     - Ensure your Windows user has appropriate permissions

### Environment Configuration

1. **Backend Configuration**:

   Copy the `.env.example` file to create a new `.env` file in the backend directory:

   ```bash
   cd backend
   cp .env.example .env
   ```

   Then edit the `.env` file with your specific configuration:

   ```env
   # Database Configuration
   DB_USER=sa
   DB_PASSWORD=YourPassword  # Leave empty if using Windows Authentication
   DB_HOST=localhost
   DB_PORT=1433
   DB_NAME=ClassConnect
   DB_INTEGRATED_SECURITY=false  # Set to 'true' to use Windows Authentication

   # Server Configuration
   PORT=8080
   GIN_MODE=debug  # Use 'release' for production

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key  # Use a strong random string in production
   JWT_EXPIRATION=72h
   ```

2. **Frontend Configuration**:

   Create a `.env` file in the frontend directory:

   ```bash
   cd frontend
   touch .env
   ```

   Add the following content:

   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

## 🚀 Running the Application

### Development Mode

1. Start the backend server:
   ```bash
   cd backend
   go run main.go
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Production Mode

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Build the backend:
   ```bash
   cd backend
   go build -o classconnect
   ```

3. Run the backend server:
   ```bash
   ./classconnect
   ```

## 🗄️ Database Management

### Schema Migrations

The application automatically manages the database schema through migrations. When you start the backend server, it will:

1. Create the database if it doesn't exist
2. Create any missing tables if they don't exist

### Data Persistence

The application does not drop or modify existing tables, ensuring your data is preserved. To manage your database schema:

```bash
# To create missing tables
cd backend
go run main.go

# To modify or drop tables
Use your own SQL scripts or database management tools outside of the application
```

## 📂 Project Structure

### Frontend Architecture

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Shared components (buttons, inputs, etc.)
│   │   ├── layout/      # Layout components
│   │   └── classes/     # Class-specific components
│   ├── contexts/        # React contexts (auth, etc.)
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
└── package.json         # Project dependencies and scripts
```

### Backend Architecture

```
backend/
├── api/
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Middleware functions
│   ├── models/          # Data models
│   ├── routes/          # API route definitions
│   └── services/        # Business logic
├── database/
│   ├── migrations.go    # Database migration logic
│   └── db.go            # Database connection setup
├── utils/               # Utility functions
├── main.go              # Application entry point
└── go.mod               # Go module definition
```

## 📚 API Documentation

The ClassConnect API follows RESTful principles and uses JSON for data exchange. The main API endpoints include:

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/auth/register` | POST | Register a new user | No |
| `/api/auth/login` | POST | Authenticate a user | No |
| `/api/users/me` | GET | Get current user info | Yes |
| `/api/classes` | GET | Get all classes | Yes |
| `/api/classes/:id` | GET | Get a specific class | Yes |
| `/api/classes/:id/assignments` | GET | Get assignments for a class | Yes |
| `/api/classes/:id/announcements` | GET | Get announcements for a class | Yes |
| `/api/classes/:id/chat` | GET | Get chat messages for a class | Yes |

## 🔐 Authentication

ClassConnect uses JWT (JSON Web Tokens) for authentication. The authentication flow is as follows:

1. User logs in with email and password
2. Server validates credentials and returns a JWT token
3. Client stores the token in localStorage
4. Token is included in the Authorization header for authenticated requests
5. Server validates the token for protected routes

## 👥 User Roles

ClassConnect supports the following user roles:

- **Teacher**: Can create classes, assignments, and grade submissions
- **Student**: Can join classes, view and submit assignments
- **Admin**: Has full access to all features (for future implementation)

## 🌐 Deployment

### Frontend Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the contents of the `dist` directory to your web server or hosting service.

### Backend Deployment

1. Build the backend:
   ```bash
   cd backend
   go build -o classconnect
   ```

2. Set up environment variables on your server
3. Run the compiled binary

## ❓ Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your database credentials in the `.env` file
   - Ensure SQL Server is running and accessible
   - For SQL Server Authentication issues:
     - Check if the 'sa' account is enabled and has the correct password
     - Verify that SQL Server is configured to allow SQL Server Authentication
     - Try using Windows Authentication by setting `DB_INTEGRATED_SECURITY=true` in your `.env` file
   - For Windows Authentication issues:
     - Ensure your Windows user has access to the SQL Server instance
     - Set `DB_INTEGRATED_SECURITY=true` in your `.env` file
     - Leave `DB_PASSWORD` empty when using Windows Authentication

2. **API Connection Issues**
   - Check that the backend server is running
   - Verify the `VITE_API_URL` in the frontend `.env` file
   - Check for CORS issues if frontend and backend are on different domains/ports

3. **Authentication Problems**
   - Clear browser localStorage and try logging in again
   - Check that JWT_SECRET is properly set
   - Verify that the token expiration time is appropriate

4. **SQL Server Setup**
   - If you're new to SQL Server, make sure it's properly installed and configured
   - Enable TCP/IP in SQL Server Configuration Manager
   - Ensure the SQL Server Browser service is running
   - Configure firewall to allow SQL Server connections

## 🤝 Contributing

Contributions to ClassConnect are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
