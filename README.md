# Quiz System - MERN Stack

A modern, production-grade online quiz and exam platform built with MERN (MongoDB/MySQL, Express, React, Node.js) stack.

> [!NOTE]
> Detailed technical details, database schema table definitions, entity relationship diagrams (ERD), and flowcharts are available in the [Project Architecture & Database Design](file:///d:/WP/Quiz-System-MERN/PROJECT_ARCHITECTURE.md) document.

## Features

- **User Authentication**: Register, login with role-based access (admin, teacher, student)
- **Quiz Management**: Create, edit, delete quizzes with multiple choice questions
- **Quiz Attempts**: Students can attempt quizzes with real-time timer
- **Results & Analytics**: Track scores, view detailed result analysis
- **Admin Dashboard**: Manage users, view system statistics
- **Responsive Design**: Mobile-friendly UI with clean, minimal design
- **Production Ready**: Proper error handling, validation, security best practices

## Tech Stack

### Backend
- Node.js & Express.js
- MySQL with mysql2 promise-based driver
- JWT for authentication
- bcryptjs for password hashing
- Express Validator for input validation
- CORS, Helmet for security
- Rate limiting for API protection

### Frontend
- React 18 with React Router
- Axios for API calls
- Context API for state management
- CSS3 with custom styling (no Tailwind)
- Responsive grid system

## Project Structure

```
Quiz-System-MERN/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── migrations.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── quizController.js
│   │   │   ├── questionController.js
│   │   │   └── resultController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Quiz.js
│   │   │   ├── Question.js
│   │   │   ├── Result.js
│   │   │   └── StudentAnswer.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── quizRoutes.js
│   │   │   ├── questionRoutes.js
│   │   │   └── resultRoutes.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   └── index.js
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── Alert.jsx
    │   │   └── QuizTimer.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── TeacherDashboard.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   ├── CreateQuiz.jsx
    │   │   ├── AttemptQuiz.jsx
    │   │   └── QuizResult.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   └── style.css
    │   ├── App.jsx
    │   └── index.jsx
    ├── public/
    │   └── index.html
    ├── .env
    ├── .env.example
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and update database credentials
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# .env should have REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the React development server:
```bash
npm start
```

The client will run on `http://localhost:3000`

## Database Setup

The database schema will be automatically created when you run migrations. To manually create the database:

```sql
CREATE DATABASE IF NOT EXISTS quiz_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tables are automatically created through migrations:
- users
- quizzes
- questions
- results
- student_answers

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id/status` - Update user status
- `DELETE /api/users/:id` - Delete user

### Quizzes
- `POST /api/quizzes` - Create quiz (teacher)
- `GET /api/quizzes/all` - Get all quizzes
- `GET /api/quizzes/teacher/my-quizzes` - Get teacher's quizzes
- `GET /api/quizzes/:id` - Get quiz details
- `PATCH /api/quizzes/:id` - Update quiz (teacher)
- `DELETE /api/quizzes/:id` - Delete quiz (teacher)

### Questions
- `POST /api/questions` - Add question (teacher)
- `GET /api/questions/:quizId` - Get quiz questions
- `PATCH /api/questions/:id` - Update question (teacher)
- `DELETE /api/questions/:id` - Delete question (teacher)

### Results
- `POST /api/results/submit` - Submit quiz (student)
- `GET /api/results/:id` - Get result details
- `GET /api/results/student/my-results` - Get student results
- `GET /api/results/quiz/:quizId/results` - Get quiz results (teacher)
- `GET /api/results/quiz/:quizId/stats` - Get quiz statistics

## Default Admin Account

After running migrations, create an admin account with:
- Email: `admin@example.com`
- Password: `Admin@123` (change after first login)

Insert manually:
```sql
INSERT INTO users (name, email, password, role, status) VALUES 
('Admin', 'admin@example.com', '$2a$10/...', 'admin', 'active');
```

## User Roles

1. **Admin**: Manage users, view system statistics
2. **Teacher**: Create/manage quizzes, add questions, view results
3. **Student**: Attempt quizzes, view results

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation with express-validator
- Rate limiting on API
- CORS protection
- Helmet.js for security headers
- SQL injection prevention with parameterized queries

## Deployment

### Backend Deployment (Heroku/AWS/DigitalOcean)

1. Create `.env.production`:
```env
DB_HOST=your-db-host
DB_NAME=quiz_system
DB_USER=your-user
DB_PASSWORD=your-password
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

2. Deploy to hosting platform

### Frontend Deployment (Vercel/Netlify)

1. Update API URL in `.env.production`
2. Build: `npm run build`
3. Deploy to hosting platform

## Development Notes

- Ensure MySQL is running before starting the backend
- Frontend runs on port 3000, backend on port 5000
- Update CORS_ORIGIN in backend .env to match frontend URL
- JWT tokens expire after 7 days by default (configurable)
- All passwords must be min 6 chars with letters and numbers

## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify credentials in .env
- Ensure database exists

### CORS Errors
- Update CORS_ORIGIN in server .env
- Ensure proxy in client package.json matches backend URL

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## Future Enhancements

- Email notifications
- Question bank/repository
- Quiz scheduling
- Advanced analytics
- CSV export for results
- Dark mode
- Internationalization (i18n)
- Two-factor authentication
