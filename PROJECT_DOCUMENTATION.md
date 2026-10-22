# 📚 Quiz System — MERN Stack · Complete Project Documentation

> **Version:** 1.0.0 &nbsp;|&nbsp; **Stack:** React · Node.js · Express · MySQL &nbsp;|&nbsp; **License:** MIT  
> **Last Updated:** October 2026 &nbsp;|&nbsp; **Node.js Requirement:** ≥ 18

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Directory Structure](#5-directory-structure)
6. [Database Schema & Design](#6-database-schema--design)
7. [Backend Architecture](#7-backend-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [User Roles & Permissions](#9-user-roles--permissions)
10. [Core Workflows](#10-core-workflows)
11. [Security Design](#11-security-design)
12. [Environment Configuration](#12-environment-configuration)
13. [Installation & Local Setup](#13-installation--local-setup)
14. [npm Scripts Reference](#14-npm-scripts-reference)
15. [Deployment Guide](#15-deployment-guide)
16. [Troubleshooting](#16-troubleshooting)
17. [Future Roadmap](#17-future-roadmap)
18. [Contributing Guidelines](#18-contributing-guidelines)

---

## 1. Project Overview

The **Quiz System** is a full-stack, production-ready online assessment platform built using the MERN-like stack (React + Node.js/Express + MySQL). It provides structured quiz management for educational environments supporting three distinct actor roles.

| Role | Core Responsibility |
|------|-------------------|
| Admin | Platform-wide user management, audit trail visibility |
| Teacher | Create quizzes, manage classrooms, grade descriptive answers |
| Student | Attempt quizzes, view results, join classrooms via code |

The system is designed with **ACID-compliant transactions** for quiz submission, **role-based access control** at both the API and frontend layers, and a clean **feature-sliced frontend architecture** for long-term maintainability.

---

## 2. Key Features

### Authentication & Authorization
- JWT-based stateless authentication (7-day token expiry)
- **Email OTP verification** on account registration (bcrypt-hashed, 10-min TTL)
- Login using **email OR username**
- Real-time username availability check
- Role-based route guards on both server and client

### Quiz Management
- Create quizzes with title, description, configurable time limit, and draft/publish status
- Three question types: **MCQ**, **True/False**, **Descriptive** (open-ended)
- Question difficulty levels: **Easy**, **Medium**, **Hard**
- Image attachment support for questions and descriptive answers (via Multer)
- Ordered questions via `quiz_questions` junction table

### Classroom System
- Teachers create classrooms with auto-generated **6-character alphanumeric join codes**
- Students enroll using the join code
- Quizzes are assigned per classroom
- Teachers can remove students; students can leave classrooms

### Quiz Attempts
- Timed quiz interface with live countdown timer
- Auto-submit when the timer expires
- **One attempt per student** per quiz (enforced server-side)
- MCQ/True-False answers are **auto-graded** instantly on submission (transactional)

### Results & Analytics
- Per-quiz aggregate stats: average score, pass rate
- Difficulty-level accuracy breakdown
- Teacher can view all student results for their quizzes
- Student sees personal result history with answer-level breakdown

### Descriptive Answer Grading
- Teacher reviews and manually grades descriptive answers
- Preset acceptable answers for reference
- Grade updates recalculate the student's total result score

### Admin Dashboard
- List, activate/deactivate, and delete user accounts
- Per-user statistics
- All mutating actions are logged to `admin_logs` with IP and User-Agent

---

## 3. Technology Stack

### Backend

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | >= 18 |
| Framework | Express | ^4.18.2 |
| Database | MySQL 8 (via mysql2) | ^3.6.5 |
| Authentication | JSON Web Tokens (jsonwebtoken) | ^9.0.3 |
| Password Hashing | bcryptjs | ^2.4.3 |
| Input Validation | express-validator | ^7.0.0 |
| File Uploads | Multer | ^1.4.5-lts.1 |
| Email / OTP | Nodemailer | ^6.9.13 |
| HTTP Security | Helmet | ^7.1.0 |
| Rate Limiting | express-rate-limit | ^7.1.5 |
| Environment | dotenv | ^16.3.1 |
| CORS | cors | ^2.8.5 |
| Dev Server | Nodemon | ^3.0.2 |

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Library | React | ^18.2.0 |
| Routing | React Router DOM | ^6.20.0 |
| HTTP Client | Axios | ^1.6.2 |
| Icons | lucide-react | ^0.294.0 |
| Styling | SCSS (Sass) + Vanilla CSS | ^1.77.0 |
| Build Tool | Create React App (react-scripts) | 5.0.1 |

### Database

| Aspect | Choice |
|--------|--------|
| Engine | MySQL 8 with InnoDB |
| Compliance | Full ACID (transactions used in quiz submission) |
| Connection | mysql2/promise connection pool (size: 10) |
| Migrations | Auto-run DDL migrations on server startup |
| Charset | utf8mb4 / utf8mb4_unicode_ci |

---

## 4. System Architecture

```
+---------------------------------------------------------------+
|                        Client Browser                         |
|                                                               |
|  +------------+   +--------------+   +--------------------+  |
|  | React SPA  |   | React Router |   | Axios HTTP Client  |  |
|  | (Port 3000)+-->| (v6 Routes)  |   | + Interceptors     |  |
|  +------------+   +--------------+   +--------------------+  |
|         |                                         |           |
+---------+-----------------------------------------+-----------+
          |               HTTP / REST API           |
          |          +------------------------------v---------+
          |          |    Express Server (Port 5000)          |
          |          |                                        |
          |          |  +----------+  +------------------+   |
          |          |  |  Helmet  |  |  Rate Limiter    |   |
          |          |  | (Headers)|  |  (100 / 15 min)  |   |
          |          |  +----------+  +------------------+   |
          |          |                                        |
          |          |  +------------------------------------+ |
          |          |  |   JWT Auth Middleware              | |
          |          |  |   authenticate + authorize         | |
          |          |  +------------------------------------+ |
          |          |                                        |
          |          |  +------------------------------------+ |
          |          |  |       Route Handlers               | |
          |          |  |  /api/auth   /api/quizzes          | |
          |          |  |  /api/questions /api/results       | |
          |          |  |  /api/answers /api/classrooms      | |
          |          |  |  /api/users                        | |
          |          |  +----------------+-------------------+ |
          |          |                   |                      |
          |          |  +----------------v-------------------+  |
          |          |  |     Business Controllers           |  |
          |          |  |  authCtrl   quizCtrl               |  |
          |          |  |  questionCtrl  resultCtrl          |  |
          |          |  |  classroomCtrl userCtrl            |  |
          |          |  +----------------+-------------------+  |
          |          |                   |                      |
          |          +-------------------+----------------------+
          |                              |
          |               +--------------v--------------+
          |               |    MySQL Database            |
          |               |  Connection Pool (size: 10)  |
          |               |                             |
          |               |  users       quizzes        |
          |               |  questions   options        |
          |               |  quiz_questions              |
          |               |  quiz_attempts  answers     |
          |               |  results  answer_keys       |
          |               |  classrooms  otp_codes      |
          |               |  admin_logs                 |
          |               +-----------------------------+
          |
          |   File Uploads (Multer -> disk)
          +--> /uploads/ (served as static)
```

---

## 5. Directory Structure

```
Quiz-System-MERN/
+-- client/                                  # React Frontend (CRA)
|   +-- public/
|   |   +-- index.html
|   +-- src/
|   |   +-- App.jsx                          # Root component; all routes defined here
|   |   +-- index.jsx                        # ReactDOM entry point
|   |   +-- styles/
|   |   |   +-- style.css                   # Global CSS design system
|   |   +-- features/                        # Feature-sliced architecture
|   |   |   +-- auth/
|   |   |   |   +-- context/
|   |   |   |   |   +-- AuthContext.jsx     # Auth state via React Context
|   |   |   |   +-- hooks/
|   |   |   |   |   +-- useShakeValidation.js
|   |   |   |   +-- pages/
|   |   |   |   |   +-- Login.jsx
|   |   |   |   |   +-- Register.jsx        # Multi-step OTP registration
|   |   |   |   |   +-- index.js
|   |   |   |   +-- styles/
|   |   |   +-- dashboard/
|   |   |   |   +-- pages/
|   |   |   |   |   +-- AdminDashboard.jsx
|   |   |   |   |   +-- TeacherDashboard.jsx
|   |   |   |   |   +-- StudentDashboard.jsx
|   |   |   |   |   +-- TeacherClassroomDetails.jsx
|   |   |   |   |   +-- StudentClassroomDetails.jsx
|   |   |   |   |   +-- index.js
|   |   |   |   +-- styles/
|   |   |   +-- quiz/
|   |   |   |   +-- pages/
|   |   |   |   |   +-- CreateQuiz.jsx
|   |   |   |   |   +-- ManageQuestions.jsx    # Add/edit/delete quiz questions
|   |   |   |   |   +-- AttemptQuiz.jsx        # Timed quiz-taking interface
|   |   |   |   |   +-- QuizResult.jsx         # Single result view
|   |   |   |   |   +-- QuizResults.jsx        # Teacher: all results for a quiz
|   |   |   |   |   +-- index.js
|   |   |   |   +-- styles/
|   |   |   +-- home/
|   |   |   |   +-- pages/
|   |   |   |   |   +-- Home.jsx
|   |   |   |   |   +-- index.js
|   |   |   |   +-- styles/
|   |   |   +-- shared/
|   |   |       +-- components/
|   |   |       |   +-- Navbar.jsx
|   |   |       |   +-- Footer.jsx
|   |   |       |   +-- ProtectedRoute.jsx
|   |   |       |   +-- QuizTimer.jsx
|   |   |       |   +-- Alert.jsx
|   |   |       |   +-- Tooltip.jsx
|   |   |       |   +-- index.js
|   |   |       +-- services/
|   |   |       |   +-- api.js               # Centralised Axios API service
|   |   |       +-- styles/
|   |   +-- hooks/
|   |   +-- pages/
|   |   |   +-- GradeDescriptiveAnswers.jsx   # Teacher grading UI
|   |   +-- services/
|   +-- .env
|   +-- .env.example
|   +-- package.json
|
+-- server/                                  # Node.js / Express Backend
    +-- src/
    |   +-- index.js                         # App bootstrap; middleware & routes registered
    |   +-- config/
    |   |   +-- database.js                  # MySQL connection pool (mysql2/promise)
    |   |   +-- migrations.js               # DDL migrations (auto-run on startup)
    |   +-- middlewares/
    |   |   +-- auth.js                     # JWT authenticate, authorize, errorHandler
    |   |   +-- upload.js                   # Multer disk storage configuration
    |   +-- routes/
    |   |   +-- authRoutes.js
    |   |   +-- userRoutes.js
    |   |   +-- quizRoutes.js
    |   |   +-- questionRoutes.js
    |   |   +-- resultRoutes.js
    |   |   +-- descriptiveAnswerRoutes.js
    |   |   +-- classroomRoutes.js
    |   +-- controllers/
    |   |   +-- authController.js
    |   |   +-- userController.js
    |   |   +-- quizController.js
    |   |   +-- questionController.js
    |   |   +-- resultController.js
    |   |   +-- descriptiveAnswerController.js
    |   |   +-- classroomController.js
    |   +-- db/                             # MySQL Query Models (Data Access Layer)
    |   |   +-- User.js
    |   |   +-- Quiz.js
    |   |   +-- Question.js
    |   |   +-- QuizAttempt.js
    |   |   +-- Answer.js
    |   |   +-- AnswerKey.js
    |   |   +-- Result.js
    |   |   +-- Classroom.js
    |   |   +-- OtpCode.js
    |   |   +-- AdminLog.js
    |   +-- utils/
    |       +-- helpers.js                  # bcrypt, JWT, OTP, formatting utilities
    |       +-- email.js                    # Nodemailer OTP email sender
    +-- uploads/                            # Multer file uploads (images)
    +-- .env
    +-- .env.example
    +-- package.json
```

---

## 6. Database Schema & Design

The database uses **MySQL 8** with the `InnoDB` engine for full ACID compliance and foreign key constraint support. All migrations run automatically via `runMigrations()` on server startup.

### 6.1 Entity Relationship Overview

```
users
  +--< quizzes              (teacher_id -> users.id)
  +--< questions             (created_by -> users.id)
  +--< quiz_attempts         (student_id -> users.id)
  +--< admin_logs            (admin_id -> users.id)
  +--< classrooms            (teacher_id -> users.id)
  +--< classroom_students    (student_id -> users.id)

quizzes
  +--< quiz_questions        (quiz_id -> quizzes.id)
  +--< quiz_attempts         (quiz_id -> quizzes.id)
  +--< classroom_quizzes     (quiz_id -> quizzes.id)

questions
  +--< options               (question_id -> questions.id)
  +--< quiz_questions        (question_id -> questions.id)
  +--< answers               (question_id -> questions.id)
  +--< answer_keys           (question_id -> questions.id)

quiz_attempts
  +--< answers               (attempt_id -> quiz_attempts.id)
  +--< results               (attempt_id -> quiz_attempts.id)

classrooms
  +--< classroom_students    (classroom_id -> classrooms.id)
  +--< classroom_quizzes     (classroom_id -> classrooms.id)
```

### 6.2 Table Definitions

#### `users`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | AUTO_INCREMENT PK | |
| name | VARCHAR(100) | NOT NULL | Full display name |
| email | VARCHAR(100) | UNIQUE NOT NULL | |
| username | VARCHAR(50) | UNIQUE NOT NULL | Alphanumeric + underscore |
| password | VARCHAR(255) | NOT NULL | bcrypt hash |
| role | ENUM | NOT NULL | 'admin', 'teacher', 'student'; default: student |
| status | ENUM | NOT NULL | 'active', 'inactive'; default: active |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `quizzes`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | AUTO_INCREMENT PK | |
| teacher_id | INT | FK -> users(id) CASCADE DELETE | |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | | |
| time_limit | INT | DEFAULT 10 | In minutes |
| status | ENUM | NOT NULL | 'draft', 'published'; default: draft |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `questions`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | AUTO_INCREMENT PK | |
| question_text | TEXT | NOT NULL | |
| type | ENUM | NOT NULL | 'MCQ', 'DESCRIPTIVE', 'TRUE_FALSE' |
| difficulty | ENUM | NOT NULL | 'easy', 'medium', 'hard' |
| image_path | VARCHAR(255) | NULL | /uploads/<filename> |
| created_by | INT | FK -> users(id) SET NULL | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `quiz_questions` (Junction Table)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| quiz_id | INT | FK -> quizzes(id) | |
| question_id | INT | FK -> questions(id) | |
| question_order | INT | | Display ordering |
| UNIQUE | | (quiz_id, question_id) | Prevents duplicates |

#### `options`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | AUTO_INCREMENT PK | |
| question_id | INT | FK -> questions(id) CASCADE DELETE | |
| option_text | VARCHAR(255) | NOT NULL | |
| is_correct | BOOLEAN | DEFAULT FALSE | Only one true per MCQ |

#### `quiz_attempts`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | AUTO_INCREMENT PK | |
| quiz_id | INT | FK -> quizzes(id) | |
| student_id | INT | FK -> users(id) | |
| attempt_number | INT | DEFAULT 1 | |
| status | ENUM | NOT NULL | 'in_progress', 'submitted' |
| started_at | TIMESTAMP | DEFAULT NOW() | |
| submitted_at | TIMESTAMP | NULL | Set on submission |

#### `answers`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | AUTO_INCREMENT PK | |
| attempt_id | INT | FK -> quiz_attempts(id) | |
| question_id | INT | FK -> questions(id) | |
| selected_option_id | INT | FK -> options(id) NULL | For MCQ / True-False |
| answer_text | TEXT | NULL | For descriptive answers |
| image_path | VARCHAR(255) | NULL | Uploaded answer image |
| is_correct | BOOLEAN | NULL | Auto-set for MCQ |
| marks_obtained | INT | DEFAULT 0 | |
| UNIQUE | | (attempt_id, question_id) | One answer per question |

#### `results`
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| attempt_id | INT FK -> quiz_attempts | |
| total_score | INT | MCQ + descriptive combined |
| max_score | INT | Maximum possible score |
| mcq_score | INT | Auto-graded component |
| descriptive_score | INT | Teacher-graded component |
| percentage | DECIMAL(5,2) | Calculated on submission |

#### `answer_keys`
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| question_id | INT FK -> questions | |
| answer_text | TEXT NOT NULL | Preset acceptable answer |
| marks | INT | Max marks for this preset |

#### `otp_codes`
| Column | Type | Notes |
|--------|------|-------|
| email | VARCHAR(100) NOT NULL | Target email |
| otp_hash | VARCHAR(255) NOT NULL | bcrypt-hashed OTP |
| purpose | ENUM | 'login', 'register', 'reset' |
| expires_at | DATETIME | Default: now + 10 minutes |
| used | BOOLEAN DEFAULT FALSE | Invalidated after first use |

#### `classrooms`
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| name | VARCHAR(255) NOT NULL | |
| description | TEXT | |
| code | VARCHAR(10) UNIQUE NOT NULL | Auto-generated 6-char alphanumeric |
| teacher_id | INT FK -> users | |

#### `classroom_students` / `classroom_quizzes`
Junction tables linking classrooms to enrolled students and assigned quizzes. Both have UNIQUE constraints to prevent duplicates.

#### `admin_logs`
| Column | Type | Notes |
|--------|------|-------|
| admin_id | INT FK -> users | Actor (any role) |
| action | VARCHAR(100) | e.g. CREATE_QUIZ, JOIN_CLASSROOM |
| target_table | VARCHAR(100) | Affected table name |
| target_id | INT | Affected record ID |
| description | TEXT | Human-readable detail |
| ip_address | VARCHAR(45) | IPv4 or IPv6 |
| user_agent | TEXT | Browser/client string |

---

## 7. Backend Architecture

### 7.1 Entry Point & Middleware Stack

`server/src/index.js` bootstraps the application in this exact order:

```
1. Helmet           ->  Secure HTTP response headers
2. CORS             ->  Allow only CORS_ORIGIN (default: http://localhost:3000)
3. Rate Limiter     ->  100 requests per 15-minute window per IP
4. Body Parsers     ->  JSON + URL-encoded, max payload: 10 MB
5. Static Files     ->  /uploads served from server/uploads/
6. Route Mounting   ->  All /api/* route modules registered
7. DB Migration     ->  runMigrations() called before app.listen()
```

```javascript
// Startup sequence
const startServer = async () => {
  await runMigrations();   // DDL first - tables created if not exist
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};
startServer();
```

### 7.2 Authentication Flow

```
Registration (OTP path)
-----------------------
Client
  |-- POST /api/auth/otp/request { email }
  |     -> Server generates 6-digit OTP -> bcrypt hash -> stores in otp_codes (10-min TTL)
  |     -> Sends email via Nodemailer SMTP
  |
  |-- POST /api/auth/otp/verify { email, otp, name, username, password, role }
  |     -> Retrieves latest OTP for email
  |     -> Validates expiry -> bcrypt.compare(otp, otp_hash)
  |     -> Marks OTP as used -> Creates user -> Returns JWT

Login
-----
Client
  |-- POST /api/auth/login { emailOrUsername, password }
  |     -> findByEmailOrUsername -> bcrypt.compare -> JWT returned (7d expiry)

Authenticated Requests
----------------------
Client -- Authorization: Bearer <token> -->
  |        authenticate() verifies JWT
  |        authorize('role') checks role
  <-- 200 or 401/403
```

**JWT Payload:**
```json
{ "userId": 42, "role": "teacher", "iat": 1234567890, "exp": 1235172690 }
```

Token storage: `localStorage` (key: `token`). Axios interceptors attach it automatically. On 401, interceptor clears localStorage and redirects to `/login`.

### 7.3 API Routes Reference

#### Auth — /api/auth

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| POST | /register | No | — | Direct registration (no OTP) |
| POST | /login | No | — | Login with email/username + password |
| POST | /otp/request | No | — | Send OTP to email |
| POST | /otp/verify | No | — | Verify OTP + create account |
| GET | /check-username/:username | No | — | Check username availability |
| GET | /me | Yes | any | Get current user profile |

#### Quizzes — /api/quizzes

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| POST | / | Yes | teacher | Create a new quiz |
| GET | /teacher/my-quizzes | Yes | teacher | List teacher's own quizzes |
| GET | /all | Yes | teacher, student | All quizzes (students see published only) |
| GET | /:id | Yes | any | Get quiz details + questions |
| GET | /:id/attempt | Yes | student | Load quiz for attempt (creates/resumes attempt) |
| PATCH | /:id | Yes | teacher | Update quiz (ownership enforced) |
| DELETE | /:id | Yes | teacher | Delete quiz (ownership enforced) |

#### Questions — /api/questions

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| POST | /mcq | Yes | teacher | Add MCQ or True/False question (multipart) |
| POST | /descriptive | Yes | teacher | Add descriptive question (multipart) |
| GET | /:quizId | Yes | teacher, student | Get questions (correct answers hidden for students) |
| PATCH | /:id | Yes | teacher | Update question |
| DELETE | /:id | Yes | teacher | Delete question |

#### Results — /api/results

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| POST | /submit | Yes | student | Submit quiz answers; auto-grades MCQ |
| GET | /student/my-results | Yes | student | Student's result history |
| GET | /quiz/:quizId/results | Yes | teacher | All student results for a quiz |
| GET | /quiz/:quizId/stats | Yes | teacher | Aggregate stats (avg score, pass rate) |
| GET | /quiz/:quizId/topics | Yes | teacher | Accuracy breakdown by difficulty level |
| GET | /:id | Yes | any | Get single result with answer breakdown |
| GET | /check/:quizId | Yes | student | Check if student already attempted |

#### Descriptive Answers — /api/answers

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| POST | /submit | Yes | student | Submit descriptive answer (optional image) |
| GET | /student/:quizId | Yes | student | Get own descriptive answers |
| GET | /ungraded/:quizId | Yes | teacher | List ungraded answers for a quiz |
| GET | /grade/:answerId | Yes | teacher | Get single answer for grading |
| PATCH | /grade/:answerId | Yes | teacher | Submit grade; recalculates total |
| POST | /preset | Yes | teacher | Add preset acceptable answer |
| GET | /preset/:questionId | Yes | teacher | Get preset answers for a question |
| PATCH | /preset/:presetAnswerId | Yes | teacher | Update preset answer |
| DELETE | /preset/:presetAnswerId | Yes | teacher | Delete preset answer |

#### Classrooms — /api/classrooms

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| POST | / | Yes | teacher | Create classroom (auto-generates join code) |
| GET | / | Yes | teacher, student | List classrooms for authenticated user |
| POST | /join | Yes | student | Join classroom by 6-char code |
| GET | /student/quizzes | Yes | student | Get quizzes in enrolled classrooms |
| DELETE | /:id/leave | Yes | student | Leave a classroom |
| GET | /:id | Yes | any | Get classroom details (role-aware) |
| DELETE | /:id | Yes | teacher | Delete classroom |
| POST | /:id/quizzes | Yes | teacher | Assign quiz to classroom |
| DELETE | /:id/quizzes/:quizId | Yes | teacher | Unassign quiz from classroom |
| DELETE | /:id/students/:studentId | Yes | teacher | Remove a student from classroom |

#### Users — /api/users

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| GET | / | Yes | admin | List all users |
| GET | /:id | Yes | admin | Get user details |
| PATCH | /:id/status | Yes | admin | Activate / deactivate user |
| DELETE | /:id | Yes | admin | Permanently delete user |
| GET | /:id/stats | Yes | admin | User statistics |

### 7.4 Controllers

All controllers follow a uniform pattern — an array where the first elements are express-validator rules and the last is the async handler:

```javascript
exports.createQuiz = [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('time_limit').isInt({ min: 1 }).withMessage('Time limit must be positive'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const quiz = await Quiz.create({ ...req.body, teacher_id: req.user.userId });
      await AdminLog.create({ action: 'CREATE_QUIZ', target_id: quiz.id, ... });
      return res.status(201).json({ message: 'Quiz created', quiz });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
];
```

| Controller | Key Responsibilities |
|------------|---------------------|
| authController | register, login, OTP request/verify, getCurrentUser, checkUsername |
| quizController | Full CRUD for quizzes, attempt load, teacher/student quiz listing |
| questionController | Add MCQ/True-False/Descriptive, image upload, get/update/delete |
| resultController | Submit quiz (transactional MCQ auto-grading), results & stats retrieval |
| descriptiveAnswerController | Answer submit, teacher grading, preset answer CRUD |
| classroomController | Create/delete, join/leave, assign/unassign quizzes, remove students |
| userController | Admin: list/manage/delete users + stats |

### 7.5 Data Access Layer (Models)

Models in `server/src/db/` are lightweight Data Access Objects wrapping raw mysql2 parameterized queries.

| Model | Key Methods |
|-------|------------|
| User.js | create, findById, findByEmail, findByUsername, findByEmailOrUsername |
| Quiz.js | create, findById, findByIdAndTeacher, getByTeacher, getAll, update, delete |
| Question.js | create, addOption, linkToQuiz, getByQuiz, getByQuizWithoutAnswers, update, deleteOptions, delete |
| QuizAttempt.js | startAttempt, findActiveAttempt, hasAttempted, submitAttempt, findById |
| Answer.js | create, update, findByAttemptAndQuestion, getByAttempt |
| AnswerKey.js | create, getByQuestion, update, delete |
| Result.js | create, findById, getByStudent, getByQuiz, getQuizStats, getDifficultyStats |
| Classroom.js | create, findById, findByCode, getByTeacher, getByStudent, enrollStudent, removeStudent, isStudentEnrolled, assignQuiz, unassignQuiz, isQuizAssigned, getQuizzes, getClassroomStats, delete |
| OtpCode.js | create, findLatest, markUsed, invalidate |
| AdminLog.js | create |

### 7.6 Utility Functions

#### `server/src/utils/helpers.js`

| Function | Description |
|----------|-------------|
| hashPassword(password) | bcrypt hash with salt rounds = 10 |
| verifyPassword(password, hash) | bcrypt compare -> Boolean |
| generateOtpCode(length) | Numeric OTP of given length (default: 6) |
| hashOtp(code) | bcrypt hash of OTP string |
| verifyOtp(code, hash) | bcrypt compare for OTP |
| getOtpExpiry(minutes) | Returns Date for OTP expiry (default: OTP_EXPIRE_MINUTES env or 10 min) |
| generateToken(userId, role) | Signs JWT with JWT_SECRET and JWT_EXPIRE |
| verifyToken(token) | Verifies JWT; returns payload or null |
| calculatePercentage(score, total) | Math.round((score / total) * 100) |
| getScoreBadge(percentage) | 'success' >= 75%, 'warning' >= 50%, 'danger' otherwise |

#### `server/src/utils/email.js`
Sends OTP emails via Nodemailer using SMTP credentials from environment variables. Template includes OTP code and expiry time.

#### `server/src/middlewares/upload.js`
Multer disk storage: destination `server/uploads/`, filename `Date.now() + '-' + originalname`. Used for question images and descriptive answer images.

---

## 8. Frontend Architecture

### 8.1 Routing & Pages

All routes are defined in `App.jsx` using React Router v6 with `<ProtectedRoute>` wrappers for role-gated access.

| Path | Component | Access Level |
|------|-----------|-------------|
| / | Home | Public |
| /login | Login | Public |
| /register | Register | Public |
| /admin | AdminDashboard | admin only |
| /teacher | TeacherDashboard | teacher only |
| /teacher/:username | TeacherDashboard | teacher only |
| /teacher/classroom/:classroomId | TeacherClassroomDetails | teacher only |
| /teacher/create-quiz | CreateQuiz | teacher only |
| /teacher/quiz/:quizId/questions | ManageQuestions | teacher only |
| /teacher/quiz/:quizId/results | QuizResults | teacher only |
| /student | StudentDashboard | student only |
| /student/classroom/:classroomId | StudentClassroomDetails | student only |
| /student/attempt/:quizId | AttemptQuiz | student only |
| /student/result/:resultId | QuizResult | student only |
| * | Redirect -> / | — |

### 8.2 Feature-Sliced Modules

#### features/auth/
- **AuthContext.jsx** — React Context providing user, token, login(), logout() to the entire app. Reads from localStorage on initialization.
- **Login.jsx** — Login form supporting email or username input
- **Register.jsx** — Multi-step registration: (1) enter email + request OTP, (2) verify OTP, (3) fill profile fields
- **useShakeValidation.js** — Custom hook triggering CSS shake animation on form validation failure

#### features/dashboard/
- **TeacherDashboard.jsx** — Lists teacher's quizzes and classrooms; create/publish/delete quiz, create classroom
- **StudentDashboard.jsx** — Shows assigned quizzes, joined classrooms, personal result history
- **AdminDashboard.jsx** — User management: list, activate/deactivate, delete users
- **TeacherClassroomDetails.jsx** — Teacher view: enrolled students, assigned quizzes, per-student results, remove students
- **StudentClassroomDetails.jsx** — Student view: classroom info, available quizzes, attempt status per quiz

#### features/quiz/
- **CreateQuiz.jsx** — Form to create a quiz (title, description, time limit, status)
- **ManageQuestions.jsx** — Full question management: add MCQ/True-False/Descriptive, image upload, delete
- **AttemptQuiz.jsx** — Quiz-taking interface with countdown timer, question navigation, auto-submits on expiry
- **QuizResult.jsx** — Displays single result: score, percentage badge, per-question answer breakdown
- **QuizResults.jsx** — Teacher view: all students' results for a quiz with aggregate analytics

#### features/home/
- **Home.jsx** — Public landing page

#### features/shared/
- Reusable UI components and the centralised API service layer

### 8.3 Shared Components

| Component | Purpose |
|-----------|---------|
| Navbar.jsx | Responsive navigation bar; shows role-based links and logout button |
| ProtectedRoute.jsx | Redirects unauthenticated or unauthorized users; validates against AuthContext |
| QuizTimer.jsx | Countdown display; accepts timeLimit (minutes) and onExpire callback |
| Alert.jsx | Reusable dismissable alert/notification with success/error/warning variants |
| Tooltip.jsx | Hover tooltip with SCSS styling |
| Footer.jsx | Site footer |

### 8.4 API Service Layer

`src/features/shared/services/api.js` is the single source of truth for all HTTP communication:

- **api** — Axios instance for standard JSON requests
- **fileApi** — Axios instance for multipart/form-data (file uploads)
- Both auto-attach `Authorization: Bearer <token>` via request interceptors
- On 401 response: clears localStorage -> redirects to /login

| Exported Module | Available Methods |
|-----------------|------------------|
| authAPI | register, login, requestOtp, verifyOtp, checkUsername, getCurrentUser |
| userAPI | getAllUsers, getUser, updateUserStatus, deleteUser, getUserStats |
| quizAPI | createQuiz, getQuiz, getQuizForAttempt, getTeacherQuizzes, getAllQuizzes, updateQuiz, deleteQuiz |
| questionAPI | addMCQQuestion, addDescriptiveQuestion, getQuestions, updateQuestion, deleteQuestion |
| answerAPI | submitAnswer, getStudentAnswers, getUngradedAnswers, getAnswerForGrading, gradeAnswer, + preset CRUD |
| resultAPI | submitQuiz, getResult, getStudentResults, getQuizResults, getQuizStats, getQuizTopicStats, checkAttempted |
| classroomAPI | createClassroom, getClassrooms, getClassroom, deleteClassroom, joinClassroom, assignQuiz, unassignQuiz, getAssignedQuizzes, removeStudent, leaveClassroom |

### 8.5 State Management

| Mechanism | Used For |
|-----------|---------|
| React Context API (AuthContext) | Global authentication state: user, token, login(), logout() |
| Local Component State (useState) | UI state: form inputs, loading flags, error messages, modal toggles |
| localStorage | Persistent JWT token storage across page refreshes |

No Redux or external state management library is used.

---

## 9. User Roles & Permissions

| Capability | Admin | Teacher | Student |
|------------|:-----:|:-------:|:-------:|
| Manage all users | Yes | No | No |
| View audit logs | Yes | No | No |
| Create / Edit quiz | No | Yes (own) | No |
| Add / Delete questions | No | Yes (own quiz) | No |
| Publish quiz | No | Yes (own) | No |
| Create classroom | No | Yes | No |
| Assign quiz to classroom | No | Yes (own) | No |
| Remove students from classroom | No | Yes (own room) | No |
| Join classroom (by code) | No | No | Yes |
| Leave classroom | No | No | Yes |
| Attempt quiz | No | No | Yes (once) |
| View own results | No | No | Yes |
| View all quiz results | No | Yes (own quiz) | No |
| Grade descriptive answers | No | Yes | No |
| Add/edit preset answers | No | Yes | No |

> **Ownership Enforcement:** Teachers can only modify quizzes and classrooms they created. Enforced at DB query level via `findByIdAndTeacher(id, teacherId)`.

---

## 10. Core Workflows

### 10.1 Registration with OTP

```
Student / Teacher
|
+-- Step 1: Enter email
|     POST /api/auth/otp/request { email }
|       -> Server generates 6-digit OTP
|       -> bcrypt hashes OTP -> stores in otp_codes (10-min TTL)
|       -> Sends email via Nodemailer SMTP
|
+-- Step 2: Enter OTP received in email
|     POST /api/auth/otp/verify { email, otp, name, username, password, role }
|       -> Retrieves latest OTP record for email
|       -> Validates expiry (10 min default)
|       -> bcrypt.compare(otp, otp_hash)
|       -> Marks OTP as used (invalidates record)
|       -> Creates user in users table
|       -> Returns JWT token
|
+-- Authenticated as new user -> JWT stored in localStorage
```

### 10.2 Quiz Lifecycle

```
Teacher
|
+-- Create Quiz (status: draft)
|     POST /api/quizzes -> quizId returned
|
+-- Add Questions (MCQ / True-False / Descriptive)
|     POST /api/questions/mcq (or /descriptive)
|       -> question created in questions table
|       -> options inserted in options table
|       -> linked to quiz via quiz_questions
|
+-- Optionally assign to a Classroom
|     POST /api/classrooms/:id/quizzes { quizId }
|
+-- Publish Quiz
|     PATCH /api/quizzes/:id { status: 'published' }
|
+-- Quiz is now visible to students in their dashboard
```

### 10.3 Classroom Workflow

```
Teacher
  +-- POST /api/classrooms              -> 6-char code generated (collision-checked)
  +-- POST /api/classrooms/:id/quizzes  { quizId } -> assigns quiz
  +-- DELETE /api/classrooms/:id/students/:studentId -> removes student

Student
  +-- POST /api/classrooms/join  { code }      -> enrolls in classroom
  +-- GET /api/classrooms/student/quizzes       -> sees all assigned quizzes
  +-- DELETE /api/classrooms/:id/leave          -> unenrolls
```

### 10.4 Quiz Attempt & Grading

```
Student
|
+-- GET /api/quizzes/:id/attempt
|     -> Checks: is quiz published? Has student already submitted?
|     -> Creates OR resumes quiz_attempts record (status: in_progress)
|     -> Returns questions WITHOUT is_correct field
|
+-- [Taking quiz with live countdown timer in browser]
|
+-- POST /api/results/submit { quizId, answers: { questionId: optionId } }
|     -> DB transaction begins
|     -> For each MCQ: checks selected option -> writes to answers table
|     -> Calculates: mcq_score, total_score, percentage
|     -> Creates results record
|     -> Marks quiz_attempt status -> submitted
|     -> Transaction commits -> resultId returned
|
+-- GET /api/results/:id  -> view detailed result with answer breakdown

Teacher (for Descriptive Answers)
|
+-- GET /api/answers/ungraded/:quizId    -> list all ungraded answers
+-- GET /api/answers/grade/:answerId     -> view answer + preset references
+-- PATCH /api/answers/grade/:answerId { marks }
      -> saves grade to answers.marks_obtained
      -> recalculates results.descriptive_score + results.total_score
```

---

## 11. Security Design

| Security Concern | Implementation |
|-----------------|----------------|
| Password storage | bcrypt with salt factor 10 |
| Session tokens | Stateless JWT (7-day expiry); no server-side sessions |
| OTP security | 6-digit OTP bcrypt-hashed, 10-minute expiry, single-use |
| Route guarding | authenticate middleware verifies JWT; authorize(role) checks role field |
| Resource ownership | findByIdAndTeacher(id, teacherId) enforces ownership at DB query level |
| HTTP security headers | Helmet.js (X-Frame-Options, CSP, HSTS, X-Content-Type-Options) |
| Rate limiting | 100 requests per 15-minute window per IP (express-rate-limit) |
| Input validation | express-validator on all endpoints with .trim() sanitization |
| SQL injection prevention | All queries use mysql2 parameterized statements |
| CORS | Restricted to explicit CORS_ORIGIN environment variable |
| File upload safety | Multer stores files to disk only; never to DB; filenames are timestamped |
| Client-side auth | 401 Axios interceptor clears token and redirects to prevent stale token usage |
| Audit trail | All mutating actions logged to admin_logs with actor, action, IP, and User-Agent |

---

## 12. Environment Configuration

### Server (server/.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=quiz_system
DB_USER=root
DB_PASSWORD=your_db_password

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# OTP
OTP_EXPIRE_MINUTES=10

# SMTP (Email / OTP delivery)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=no-reply@example.com
```

> Development tip: Use Mailtrap or Ethereal Email as a free SMTP sandbox for OTP testing without sending real emails.

### Client (client/.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

The proxy field in `client/package.json` is set to `http://localhost:5000` for development proxying.

---

## 13. Installation & Local Setup

### Prerequisites

- Node.js >= 18
- MySQL 8.x running locally
- SMTP credentials (or Mailtrap/Ethereal for development)
- npm or yarn

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/Quiz-System-MERN.git
cd Quiz-System-MERN
```

### Step 2 — Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### Step 3 — Configure Environment Variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your DB credentials, JWT secret, and SMTP settings

# Client (optional - defaults work for local dev)
echo "REACT_APP_API_URL=http://localhost:5000/api" > client/.env
```

### Step 4 — Create the MySQL Database

```sql
CREATE DATABASE quiz_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tables are created automatically by the migration runner on first server start.

### Step 5 — Create Default Admin Account

After the server starts and migrations run:

```sql
-- Generate hash first: node -e "const b=require('bcryptjs'); b.hash('Admin@123',10).then(console.log)"
INSERT INTO users (name, email, username, password, role, status)
VALUES ('Admin', 'admin@example.com', 'admin', '$2a$10$...bcryptHash...', 'admin', 'active');
```

### Step 6 — Run the Application

```bash
# Terminal 1 - Backend
cd server && npm run dev       # -> http://localhost:5000

# Terminal 2 - Frontend
cd client && npm start         # -> http://localhost:3000
```

### Step 7 — Verify Server is Running

```bash
curl http://localhost:5000/api/health
# Expected: { "status": "Server is running" }
```

---

## 14. npm Scripts Reference

### Server (server/)

| Script | Command | Description |
|--------|---------|-------------|
| dev | npm run dev | Nodemon development server (auto-reload) |
| start | npm start | Production start (no auto-reload) |
| migrate | npm run migrate | Run database migrations standalone |

### Client (client/)

| Script | Command | Description |
|--------|---------|-------------|
| start | npm start | CRA development server with hot-reload |
| build | npm run build | Optimised production build to client/build/ |
| test | npm test | Run test suite (Jest + React Testing Library) |
| eject | npm run eject | Eject from CRA (irreversible) |

---

## 15. Deployment Guide

### Backend Deployment (Heroku / Railway / DigitalOcean / AWS)

1. Set production environment variables on your hosting platform (see Section 12)
2. Start command: `npm start` (runs `node src/index.js`)
3. The server automatically runs migrations on startup

### Frontend Deployment (Vercel / Netlify)

1. Set environment variable: `REACT_APP_API_URL=https://your-backend-api.com/api`

2. Build the app:
   ```bash
   cd client && npm run build
   ```

3. Deploy the `client/build/` directory

4. For Vercel, add `vercel.json` to handle client-side routing:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

5. Ensure backend `CORS_ORIGIN` matches the frontend deployment URL exactly.

---

## 16. Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
- Confirm MySQL is running: `sudo systemctl status mysql`
- Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in server/.env
- Ensure quiz_system database exists: `SHOW DATABASES;`

### CORS Errors in Browser

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Update CORS_ORIGIN in server/.env to exactly match the frontend URL (including protocol and port)
- No trailing slash: `http://localhost:3000` not `http://localhost:3000/`

### JWT Token Errors (401 Unauthorized)

**Solution:**
- Ensure JWT_SECRET is set and not empty
- Clear localStorage in browser and log in again
- Verify token hasn't expired (default: 7 days)

### OTP Emails Not Arriving

**Solution:**
- Verify SMTP credentials in server/.env
- For development, use Mailtrap or Ethereal (check their dashboards)
- Check spam/junk folder in production

### Port Already in Use

```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Migration Errors

```
Error: Table quiz_system.users does not exist
```

**Solution:**
- Run migrations manually: `cd server && npm run migrate`
- Ensure the database exists before starting the server

---

## 17. Future Roadmap

| Feature | Priority | Description |
|---------|----------|-------------|
| Email notifications | High | Notify students when a quiz is published |
| Quiz scheduling | High | Set start/end date-times for quiz availability |
| Question bank | Medium | Reusable question repository; import into any quiz |
| Advanced analytics | Medium | Per-student performance trends, difficulty heatmaps |
| CSV/Excel export | Medium | Export quiz results and student scores to spreadsheet |
| Dark mode | Medium | System-aware and manually toggled dark theme |
| Internationalization | Low | i18n support for multi-language UI |
| Two-factor authentication | Low | TOTP-based 2FA as additional login security |
| Real-time notifications | Low | WebSocket-based live alerts (quiz published, graded) |
| Mobile app | Low | React Native companion app |
| AI-assisted grading | Future | LLM-powered semantic matching for descriptive answers |

---

## 18. Contributing Guidelines

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Follow existing conventions:
   - Backend: controllers export validation arrays + async handlers
   - Frontend: feature-sliced folder structure under `src/features/`
   - Styling: SCSS modules per feature; no inline styles for layout

3. Never commit secrets — keep `.env` in `.gitignore`

4. Test your changes against all three roles (admin, teacher, student)

5. Write descriptive commit messages using conventional commits:
   ```
   feat: add quiz scheduling with start/end datetime
   fix: correct percentage calculation on empty quiz
   docs: update API route reference table
   ```

6. Submit a Pull Request with a clear description of what changed and why

---

*Quiz System — MERN Stack*  
*Built with React · Node.js · Express · MySQL*  
*Documentation generated from source code analysis — October 2026*
