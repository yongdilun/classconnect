# ClassConnect

A Google Classroom-like application with teacher/student functionality.

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS (with PostCSS)

### Backend
- Go
- Gin
- MSSQL

## Getting Started

### Prerequisites
- Node.js and npm
- Go 1.20 or higher
- Microsoft SQL Server

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yongdilun/classconnect.git
   cd classconnect
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```
   cd backend
   go mod download
   ```

4. Create a `.env` file in the root directory with the following content:
   ```
   DB_USER=sa
   DB_PASSWORD=YourPassword
   DB_HOST=localhost
   DB_PORT=1433
   DB_NAME=ClassConnect
   PORT=8080
   GIN_MODE=debug
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   go run main.go
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Database Management

The application automatically manages the database schema through migrations. When you start the backend server, it will:

1. Create the database if it doesn't exist
2. Create any missing tables if they don't exist

The application does not drop or modify existing tables, ensuring your data is preserved. To manage your database schema:

```
# To create missing tables
cd backend
go run main.go

# To modify or drop tables
Use your own SQL scripts or database management tools outside of the application
```

## Project Structure

### Frontend
```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

### Backend
```
backend/
├── api/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── services/
├── database/
│   ├── migrations.go
│   └── db.go
└── main.go
```
