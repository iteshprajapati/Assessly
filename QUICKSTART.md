# Quick Start Guide - MERN Quiz System

## System Requirements
- Node.js v14 or higher
- MySQL Server running
- npm or yarn package manager

## 5-Minute Setup

### Step 1: Backend Setup
```bash
cd Quiz-System-MERN/server
npm install
cp .env.example .env
```

Edit `.env` file and ensure database credentials are correct:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=quiz_system
DB_USER=root
DB_PASSWORD=
```

### Step 2: Database Migration
```bash
npm run migrate
```

### Step 3: Start Backend Server
```bash
npm run dev
```

You should see: `✓ Server running on http://localhost:5000`

### Step 4: Frontend Setup (New Terminal)
```bash
cd Quiz-System-MERN/client
npm install
```

### Step 5: Start Frontend
```bash
npm start
```

The application will open at `http://localhost:3000`

## First Login

### Default Admin Account
The admin account needs to be created manually. Insert into database:

```sql
USE quiz_system;
INSERT INTO users (name, email, password, role, status) VALUES 
('Admin User', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36QzlzFm', 'admin', 'active');
```

Then login with:
- Email: `admin@example.com`
- Password: `password123`

### Create a Teacher Account
1. Go to Register page
2. Enter details
3. Select "Teacher" role
4. Click Register

### Create a Student Account
1. Go to Register page
2. Enter details
3. Select "Student" role
4. Click Register

## Features to Test

### Teacher Flow
1. Login as teacher
2. Click "Create New Quiz"
3. Add quiz title, description, and time limit
4. Add questions with options and correct answers
5. Students can now attempt the quiz

### Student Flow
1. Login as student
2. View "Available Quizzes"
3. Click "Attempt Quiz"
4. Answer all questions before time runs out
5. Submit and view results

### Admin Flow
1. Login as admin
2. View all users
3. Filter by role or status
4. Change user status (active/inactive)
5. Delete users if needed

## Useful Commands

### Backend
```bash
# Development with auto-reload
npm run dev

# Production
npm start

# Run migrations manually
npm run migrate
```

### Frontend
```bash
# Development
npm start

# Build for production
npm run build

# Test build locally
npm start (from build folder)
```

## Troubleshooting

### "Cannot connect to database"
- Check MySQL is running
- Verify database credentials in .env
- Create database: `CREATE DATABASE quiz_system;`

### "Port 5000 already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### CORS errors
- Ensure backend is running on port 5000
- Check client .env has correct API URL
- Verify CORS_ORIGIN in server .env matches frontend URL

### "npm: command not found"
- Node.js not installed properly
- Add Node.js to PATH environment variable
- Restart terminal after installation

## Project Structure Overview

```
Quiz-System-MERN/
├── server/          → Backend (Express.js, MySQL)
├── client/          → Frontend (React)
├── README.md        → Full documentation
├── DEPLOYMENT.md    → Deployment guide
└── QUICKSTART.md    → This file
```

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=quiz_system
DB_USER=root
DB_PASSWORD=
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Next Steps

1. Create admin account in database
2. Test all features with different user roles
3. Customize styling in `client/src/styles/style.css`
4. Update app name and branding
5. Read full README.md for advanced features
6. Deploy when ready using DEPLOYMENT.md

## Support

- Check README.md for detailed documentation
- Review error messages in browser console
- Check server logs in terminal
- Verify database connection
- Ensure all ports are available

## Production Deployment

See DEPLOYMENT.md for:
- Server setup
- Database configuration
- Security checklist
- Deployment steps
- Monitoring setup

Happy coding! 🚀
