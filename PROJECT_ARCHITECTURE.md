# Quiz System MERN — Project Architecture & Documentation

> **Version:** 1.0.0 | **Stack:** MongoDB/MySQL · Express · React · Node.js | **License:** MIT

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Database Schema](#5-database-schema)
6. [Backend Architecture](#6-backend-architecture)
   - [Entry Point & Middleware](#61-entry-point--middleware)
   - [Authentication Flow](#62-authentication-flow)
   - [API Routes Reference](#63-api-routes-reference)
   - [Controllers](#64-controllers)
   - [Database Models](#65-database-models)
   - [Utilities](#66-utilities)
7. [Frontend Architecture](#7-frontend-architecture)
   - [Routing & Pages](#71-routing--pages)
   - [Feature Modules](#72-feature-modules)
   - [Shared Components](#73-shared-components)
   - [API Service Layer](#74-api-service-layer)
8. [User Roles & Permissions](#8-user-roles--permissions)
9. [Core Workflows](#9-core-workflows)
   - [Registration with OTP](#91-registration-with-otp)
   - [Quiz Lifecycle](#92-quiz-lifecycle)
   - [Classroom Workflow](#93-classroom-workflow)
   - [Quiz Attempt & Grading](#94-quiz-attempt--grading)
10. [Security Design](#10-security-design)
11. [Environment Configuration](#11-environment-configuration)
12. [Setup & Running Locally](#12-setup--running-locally)

---

## 1. Project Overview

The **Quiz System** is a full-stack MERN-like web application (React + Node.js/Express + MySQL) that enables structured online assessment. It supports three distinct roles:

| Role | Description |
|------|-------------|
| **Admin** | Platform-wide user management, audit logs |
| **Teacher** | Create quizzes, manage classrooms, grade descriptive answers |
| **Student** | Attempt quizzes, view results, join classrooms |

### Key Features

- JWT-based Auth with Email OTP verification on registration
- Multi-type Questions: MCQ, True/False, Descriptive (with image upload)
- Classroom Management: Teachers create rooms with 6-character join codes; students enroll via code
- Timed Quizzes: Configurable per-quiz time limits with a countdown timer
- Analytics: Per-quiz stats, difficulty-level accuracy breakdown, student performance tracking
- Media Uploads: Images attached to questions and descriptive answers (via Multer)
- Admin Audit Logs: All destructive/mutating actions are logged with IP and User-Agent

---

## 2. Technology Stack

### Backend

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | >= 18 |
| Framework | Express | ^4.18.2 |
| Database | MySQL 8 | via mysql2 ^3.6.5 |
| Auth | JSON Web Tokens | jsonwebtoken ^9.0.3 |
| Password Hashing | bcryptjs | ^2.4.3 |
| Validation | express-validator | ^7.0.0 |
| File Uploads | Multer | ^1.4.5-lts.1 |
| Email (OTP) | Nodemailer | ^6.9.13 |
| Security | Helmet + express-rate-limit | ^7.1.0 / ^7.1.5 |
| Dev Server | Nodemon | ^3.0.2 |

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Library | React | ^18.2.0 |
| Routing | React Router DOM | ^6.20.0 |
| HTTP Client | Axios | ^1.6.2 |
| Icons | lucide-react | ^0.294.0 |
| Styling | SCSS (Sass) + vanilla CSS | ^1.77.0 |
| Build Tool | Create React App (react-scripts) | 5.0.1 |

---

## 3. System Architecture

```
+------------------------------------------------------------------+
|                         Client Browser                           |
|                                                                  |
|  +-------------+   +--------------+   +--------------------+    |
|  |  React SPA  |   | React Router |   | Axios HTTP Client  |    |
|  | (Port 3000) +-->|  (v6 Routes) |   | + Interceptors     |    |
|  +-------------+   +--------------+   +--------------------+    |
|          |                                         |             |
+----------+-----------------------------------------+------------+
           |                         HTTP/REST API   |
           |               +--------------------------v-----------+
           |               |      Express Server (Port 5000)      |
           |               |                                      |
           |               |  +----------+  +----------------+   |
           |               |  | Helmet   |  | Rate Limiter   |   |
           |               |  | (Headers)|  | (100/15min)    |   |
           |               |  +----------+  +----------------+   |
           |               |                                      |
           |               |  +--------------------------------+  |
           |               |  |  JWT Auth Middleware           |  |
           |               |  |  (authenticate + authorize)    |  |
           |               |  +--------------------------------+  |
           |               |                                      |
           |               |  +--------------------------------+  |
           |               |  |         Route Handlers         |  |
           |               |  |  /api/auth  /api/quizzes       |  |
           |               |  |  /api/questions /api/results   |  |
           |               |  |  /api/answers /api/classrooms  |  |
           |               |  |  /api/users                    |  |
           |               |  +----------------+---------------+  |
           |               |                   |                  |
           |               |  +----------------v---------------+  |
           |               |  |     Business Controllers       |  |
           |               |  |  authCtrl quizCtrl             |  |
           |               |  |  questionCtrl resultCtrl       |  |
           |               |  |  classroomCtrl                 |  |
           |               |  +----------------+---------------+  |
           |               |                   |                  |
           |               +-------------------+------------------+
           |                                   |
           |                     +-------------v--------------+
           |                     |    MySQL Database           |
           |                     |  (Connection Pool: 10)      |
           |                     |                             |
           |                     |  users, quizzes             |
           |                     |  questions, options         |
           |                     |  quiz_questions             |
           |                     |  quiz_attempts, answers     |
           |                     |  results, answer_keys       |
           |                     |  classrooms, otp_codes      |
           |                     |  admin_logs                 |
           |                     +-----------------------------+
           |
           |   File Uploads (Multer -> disk)
           +---> /uploads/ (served as static)
```

---

## 4. Directory Structure

```
Quiz-System-MERN/
+-- client/                          # React Frontend
|   +-- public/
|   +-- src/
|   |   +-- App.jsx                  # Root component; all routes defined here
|   |   +-- index.jsx                # ReactDOM entry point
|   |   +-- styles/
|   |   |   +-- style.css            # Global CSS design system
|   |   +-- features/                # Feature-sliced architecture
|   |   |   +-- auth/
|   |   |   |   +-- context/
|   |   |   |   |   +-- AuthContext.jsx   # Auth state via React Context
|   |   |   |   +-- hooks/
|   |   |   |   |   +-- useShakeValidation.js
|   |   |   |   +-- pages/
|   |   |   |   |   +-- Login.jsx
|   |   |   |   |   +-- Register.jsx      # Multi-step OTP registration
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
|   |   |   |   |   +-- ManageQuestions.jsx  # Add/edit/delete quiz questions
|   |   |   |   |   +-- AttemptQuiz.jsx      # Timed quiz-taking interface
|   |   |   |   |   +-- QuizResult.jsx       # Single result view
|   |   |   |   |   +-- QuizResults.jsx      # Teacher: all results for a quiz
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
|   |   |       |   +-- api.js           # Centralised Axios API service
|   |   |       +-- styles/
|   |   +-- pages/
|   |       +-- GradeDescriptiveAnswers.jsx  # Teacher grading UI
|   +-- package.json
|
+-- server/                          # Node.js / Express Backend
    +-- src/
    |   +-- index.js                 # App bootstrap; middleware & routes registered
    |   +-- config/
    |   |   +-- database.js          # MySQL connection pool (mysql2/promise)
    |   |   +-- migrations.js        # DDL migrations (auto-run on startup)
    |   +-- middlewares/
    |   |   +-- auth.js              # JWT authenticate, authorize, errorHandler
    |   |   +-- upload.js            # Multer disk storage config
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
    |   +-- db/                      # MySQL query models (Data Access Layer)
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
    |       +-- helpers.js           # bcrypt, JWT, OTP, formatting utilities
    |       +-- email.js             # Nodemailer OTP email sender
    +-- uploads/                     # Multer file uploads (images)
    +-- package.json
```

---

## 5. Database Schema

The database uses **MySQL 8** with `InnoDB` engine for full ACID compliance and foreign key support. Migrations run automatically on server startup via `runMigrations()`.

### Entity Relationship Overview

```
users
  +--< quizzes            (teacher_id -> users.id)
  +--< questions          (created_by -> users.id)
  +--< quiz_attempts      (student_id -> users.id)
  +--< admin_logs         (admin_id -> users.id)
  +--< classrooms         (teacher_id -> users.id)
  +--< classroom_students (student_id -> users.id)

quizzes
  +--< quiz_questions     (quiz_id -> quizzes.id)
  +--< quiz_attempts      (quiz_id -> quizzes.id)
  +--< classroom_quizzes  (quiz_id -> quizzes.id)

questions
  +--< options            (question_id -> questions.id)
  +--< quiz_questions     (question_id -> questions.id)
  +--< answers            (question_id -> questions.id)
  +--< answer_keys        (question_id -> questions.id)

quiz_attempts
  +--< answers            (attempt_id -> quiz_attempts.id)
  +--< results            (attempt_id -> quiz_attempts.id)

classrooms
  +--< classroom_students (classroom_id -> classrooms.id)
  +--< classroom_quizzes  (classroom_id -> classrooms.id)
```

### Table Definitions

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `name` | VARCHAR(100) | |
| `email` | VARCHAR(100) UNIQUE | |
| `username` | VARCHAR(50) UNIQUE | alphanumeric + underscore |
| `password` | VARCHAR(255) | bcrypt hash |
| `role` | ENUM('admin','teacher','student') | default: student |
| `status` | ENUM('active','inactive') | default: active |
| `created_at` | TIMESTAMP | |

#### `quizzes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `teacher_id` | INT FK -> users | CASCADE DELETE |
| `title` | VARCHAR(255) | |
| `description` | TEXT | |
| `time_limit` | INT | minutes, default: 10 |
| `status` | ENUM('draft','published') | default: draft |
| `created_at` | TIMESTAMP | |

#### `questions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `question_text` | TEXT | |
| `type` | ENUM('MCQ','DESCRIPTIVE','TRUE_FALSE') | |
| `difficulty` | ENUM('easy','medium','hard') | |
| `image_path` | VARCHAR(255) NULL | `/uploads/<filename>` |
| `created_by` | INT FK -> users | SET NULL on DELETE |
| `created_at` | TIMESTAMP | |

#### `quiz_questions` (junction table)
| Column | Type | Notes |
|--------|------|-------|
| `quiz_id` | INT FK -> quizzes | |
| `question_id` | INT FK -> questions | |
| `question_order` | INT | display ordering |
| UNIQUE | (quiz_id, question_id) | |

#### `options`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `question_id` | INT FK -> questions | CASCADE DELETE |
| `option_text` | VARCHAR(255) | |
| `is_correct` | BOOLEAN | only one should be true per MCQ |

#### `quiz_attempts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `quiz_id` | INT FK -> quizzes | |
| `student_id` | INT FK -> users | |
| `attempt_number` | INT | default: 1 |
| `status` | ENUM('in_progress','submitted') | |
| `started_at` | TIMESTAMP | |
| `submitted_at` | TIMESTAMP NULL | set on submit |

#### `answers`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `attempt_id` | INT FK -> quiz_attempts | |
| `question_id` | INT FK -> questions | |
| `selected_option_id` | INT FK -> options NULL | for MCQ |
| `answer_text` | TEXT NULL | for DESCRIPTIVE |
| `image_path` | VARCHAR(255) NULL | uploaded image |
| `is_correct` | BOOLEAN NULL | auto-graded for MCQ |
| `marks_obtained` | INT | default: 0 |
| UNIQUE | (attempt_id, question_id) | one answer per question |

#### `results`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `attempt_id` | INT FK -> quiz_attempts | |
| `total_score` | INT | |
| `max_score` | INT | |
| `mcq_score` | INT | auto-graded |
| `descriptive_score` | INT | teacher-graded |
| `percentage` | DECIMAL(5,2) | |

#### `answer_keys`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `question_id` | INT FK -> questions | |
| `answer_text` | TEXT | preset acceptable answer |
| `marks` | INT | max marks for this preset |

#### `otp_codes`
| Column | Type | Notes |
|--------|------|-------|
| `email` | VARCHAR(100) | |
| `otp_hash` | VARCHAR(255) | bcrypt-hashed OTP |
| `purpose` | ENUM('login','register','reset') | |
| `expires_at` | DATETIME | default: 10 minutes |
| `used` | BOOLEAN | invalidated after use |

#### `classrooms`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `name` | VARCHAR(255) | |
| `description` | TEXT | |
| `code` | VARCHAR(10) UNIQUE | 6-char alphanumeric join code |
| `teacher_id` | INT FK -> users | |

#### `classroom_students` / `classroom_quizzes`
Junction tables linking classrooms to enrolled students and assigned quizzes respectively. Both have UNIQUE constraints to prevent duplicates.

#### `admin_logs`
| Column | Type | Notes |
|--------|------|-------|
| `admin_id` | INT FK -> users | actor (any role) |
| `action` | VARCHAR(100) | e.g. CREATE_QUIZ, JOIN_CLASSROOM |
| `target_table` | VARCHAR(100) | affected table |
| `target_id` | INT | affected record ID |
| `description` | TEXT | human-readable detail |
| `ip_address` | VARCHAR(45) | |
| `user_agent` | TEXT | |

---

## 6. Backend Architecture

### 6.1 Entry Point & Middleware

**`server/src/index.js`** bootstraps the application in the following order:

1. **Helmet** — sets secure HTTP headers
2. **CORS** — allows only `CORS_ORIGIN` (default: `http://localhost:3000`)
3. **Rate Limiter** — 100 requests per 15-minute window per IP
4. **Body Parsers** — JSON and URL-encoded, max 10 MB
5. **Static Files** — `/uploads` served from `server/uploads/`
6. **Route Registration** — all API modules mounted under `/api/`
7. **Database Migration** — `runMigrations()` called before `app.listen()`

```javascript
// Startup sequence
const startServer = async () => {
  await runMigrations();   // DDL first
  app.listen(PORT, ...);   // then serve
};
```

### 6.2 Authentication Flow

```
                  Register (OTP path)
                  ------------------
  Client          POST /auth/otp/request
    |-----------> OtpCode saved (hashed, 10 min TTL)
    |             Email sent via Nodemailer
    |
    |             POST /auth/otp/verify (+ user fields)
    |-----------> OTP verified -> User created
    |<----------- JWT token returned
    |
                  Login
                  -----
  Client          POST /auth/login (email OR username, password)
    |-----------> User looked up, bcrypt compare
    |<----------- JWT token (7d expiry)
    |
                  Authenticated Requests
                  ----------------------
  Client -- Authorization: Bearer <token> -->
    |                        authenticate() verifies JWT
    |                        authorize('role') checks role
    |<----------- 200 or 401/403
```

**JWT Payload:**
```json
{ "userId": 42, "role": "teacher", "iat": 1234, "exp": 5678 }
```

**Token storage:** `localStorage` (key: `token`). Axios interceptors attach it automatically. On 401 response, the interceptor clears localStorage and redirects to `/login`.

### 6.3 API Routes Reference

#### Auth — `/api/auth`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/register` | No | — | Direct registration (no OTP) |
| POST | `/login` | No | — | Login with email/username + password |
| POST | `/otp/request` | No | — | Send OTP to email for registration |
| POST | `/otp/verify` | No | — | Verify OTP and create account |
| GET | `/check-username/:username` | No | — | Check username availability |
| GET | `/me` | Yes | any | Get current user profile |

#### Quizzes — `/api/quizzes`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/` | Yes | teacher | Create a new quiz |
| GET | `/teacher/my-quizzes` | Yes | teacher | List teacher's own quizzes |
| GET | `/all` | Yes | teacher, student | List all quizzes (students see published only) |
| GET | `/:id` | Yes | any | Get quiz details + questions |
| GET | `/:id/attempt` | Yes | student | Load quiz for attempt (starts attempt if not started) |
| PATCH | `/:id` | Yes | teacher | Update quiz (ownership verified) |
| DELETE | `/:id` | Yes | teacher | Delete quiz (ownership verified) |

#### Questions — `/api/questions`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/mcq` | Yes | teacher | Add MCQ/TRUE_FALSE question (multipart) |
| POST | `/descriptive` | Yes | teacher | Add descriptive question (multipart) |
| GET | `/:quizId` | Yes | teacher, student | Get questions (correct answers hidden for students) |
| PATCH | `/:id` | Yes | teacher | Update question |
| DELETE | `/:id` | Yes | teacher | Delete question |

#### Results — `/api/results`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/submit` | Yes | student | Submit quiz answers; auto-grades MCQ |
| GET | `/student/my-results` | Yes | student | Student's result history |
| GET | `/quiz/:quizId/results` | Yes | teacher | All student results for a quiz |
| GET | `/quiz/:quizId/stats` | Yes | teacher | Aggregate stats (avg score, pass rate) |
| GET | `/quiz/:quizId/topics` | Yes | teacher | Accuracy breakdown by difficulty level |
| GET | `/:id` | Yes | any | Get single result with answers |
| GET | `/check/:quizId` | Yes | student | Check if student has already attempted |

#### Descriptive Answers — `/api/answers`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/submit` | Yes | student | Submit descriptive answer (multipart, optional image) |
| GET | `/student/:quizId` | Yes | student | Get student's own descriptive answers |
| GET | `/ungraded/:quizId` | Yes | teacher | List ungraded descriptive answers for a quiz |
| GET | `/grade/:answerId` | Yes | teacher | Get single answer for grading |
| PATCH | `/grade/:answerId` | Yes | teacher | Submit grade for an answer |
| POST | `/preset` | Yes | teacher | Add preset answer for a question |
| GET | `/preset/:questionId` | Yes | teacher | Get preset answers for a question |
| PATCH | `/preset/:presetAnswerId` | Yes | teacher | Update preset answer |
| DELETE | `/preset/:presetAnswerId` | Yes | teacher | Delete preset answer |

#### Classrooms — `/api/classrooms`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/` | Yes | teacher | Create classroom (generates unique 6-char code) |
| GET | `/` | Yes | teacher, student | List classrooms for the user |
| POST | `/join` | Yes | student | Join classroom by code |
| GET | `/student/quizzes` | Yes | student | Get quizzes assigned in enrolled classrooms |
| DELETE | `/:id/leave` | Yes | student | Leave a classroom |
| GET | `/:id` | Yes | any | Get classroom details (role-aware response) |
| DELETE | `/:id` | Yes | teacher | Delete classroom |
| POST | `/:id/quizzes` | Yes | teacher | Assign quiz to classroom |
| DELETE | `/:id/quizzes/:quizId` | Yes | teacher | Unassign quiz |
| DELETE | `/:id/students/:studentId` | Yes | teacher | Remove a student |

#### Users — `/api/users`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/` | Yes | admin | List all users |
| GET | `/:id` | Yes | admin | Get user details |
| PATCH | `/:id/status` | Yes | admin | Activate/deactivate user |
| DELETE | `/:id` | Yes | admin | Delete user |
| GET | `/:id/stats` | Yes | admin | User statistics |

### 6.4 Controllers

Each controller file follows the same pattern:

```javascript
exports.action = [
  // 1. Validation rules (express-validator)
  body('field').notEmpty().withMessage('Field is required'),

  // 2. Handler
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors });

    try {
      // Business logic via Model layer
      // Log to admin_logs (mutating actions)
      // Return JSON response
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
];
```

| Controller | Responsibilities |
|------------|-----------------|
| `authController` | register, login, OTP request/verify, getCurrentUser, checkUsername |
| `quizController` | CRUD for quizzes, quiz attempt load, teacher/student quiz listing |
| `questionController` | Add MCQ/descriptive questions, get questions (role-filtered), update/delete |
| `resultController` | Submit quiz (transactional MCQ auto-grading), get results/stats |
| `descriptiveAnswerController` | Descriptive answer submit, teacher grading, preset answers CRUD |
| `classroomController` | Create/delete classroom, join/leave, assign/unassign quizzes, remove students |
| `userController` | Admin: list/manage users |

### 6.5 Database Models

Models in `server/src/db/` are lightweight **Data Access Objects** that wrap raw `mysql2` pool queries. Each model exposes static methods:

| Model | Key Methods |
|-------|------------|
| `User.js` | `create`, `findById`, `findByEmail`, `findByUsername`, `findByEmailOrUsername` |
| `Quiz.js` | `create`, `findById`, `findByIdAndTeacher`, `getByTeacher`, `getAll`, `update`, `delete` |
| `Question.js` | `create`, `addOption`, `linkToQuiz`, `getByQuiz`, `getByQuizWithoutAnswers`, `update`, `deleteOptions`, `delete` |
| `QuizAttempt.js` | `startAttempt`, `findActiveAttempt`, `hasAttempted`, `submitAttempt`, `findById` |
| `Answer.js` | `create`, `update`, `findByAttemptAndQuestion`, `getByAttempt` |
| `AnswerKey.js` | `create`, `getByQuestion`, `update`, `delete` |
| `Result.js` | `create`, `findById`, `getByStudent`, `getByQuiz`, `getQuizStats`, `getDifficultyStats` |
| `Classroom.js` | `create`, `findById`, `findByCode`, `getByTeacher`, `getByStudent`, `enrollStudent`, `removeStudent`, `isStudentEnrolled`, `assignQuiz`, `unassignQuiz`, `isQuizAssigned`, `getQuizzes`, `getClassroomStats`, `delete` |
| `OtpCode.js` | `create`, `findLatest`, `markUsed`, `invalidate` |
| `AdminLog.js` | `create` |

### 6.6 Utilities

#### `server/src/utils/helpers.js`

| Function | Purpose |
|----------|---------|
| `hashPassword(password)` | bcrypt hash with salt rounds = 10 |
| `verifyPassword(password, hash)` | bcrypt compare |
| `generateOtpCode(length)` | Numeric OTP of given length (default 6) |
| `hashOtp(code)` | bcrypt hash of OTP |
| `verifyOtp(code, hash)` | bcrypt compare for OTP |
| `getOtpExpiry(minutes)` | Returns Date object for expiry (default: OTP_EXPIRE_MINUTES env, fallback 10 min) |
| `generateToken(userId, role)` | Signs JWT with JWT_SECRET, expiry JWT_EXPIRE |
| `verifyToken(token)` | Verifies JWT; returns payload or null |
| `calculatePercentage(score, total)` | Math.round((score / total) * 100) |
| `getScoreBadge(percentage)` | 'success' >= 75%, 'warning' >= 50%, 'danger' otherwise |

#### `server/src/utils/email.js`

Sends OTP emails via Nodemailer using SMTP credentials from environment variables. Template includes the OTP code and expiry time.

#### `server/src/middlewares/upload.js`

Multer configuration with disk storage:
- **Destination:** `server/uploads/`
- **Filename:** `Date.now() + '-' + originalname`
- Used for question images and descriptive answer images

---

## 7. Frontend Architecture

### 7.1 Routing & Pages

All routes are defined in [`App.jsx`](file:///home/iteshprajapati/Itesh/Quiz-System-MERN/client/src/App.jsx). The app uses React Router v6 with `<ProtectedRoute>` wrappers for role-gated access.

| Path | Component | Access |
|------|-----------|--------|
| `/` | `Home` | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/admin` | `AdminDashboard` | admin only |
| `/teacher` | `TeacherDashboard` | teacher only |
| `/teacher/:username` | `TeacherDashboard` | teacher only |
| `/teacher/classroom/:classroomId` | `TeacherClassroomDetails` | teacher only |
| `/teacher/create-quiz` | `CreateQuiz` | teacher only |
| `/teacher/quiz/:quizId/questions` | `ManageQuestions` | teacher only |
| `/teacher/quiz/:quizId/results` | `QuizResults` | teacher only |
| `/student` | `StudentDashboard` | student only |
| `/student/classroom/:classroomId` | `StudentClassroomDetails` | student only |
| `/student/attempt/:quizId` | `AttemptQuiz` | student only |
| `/student/result/:resultId` | `QuizResult` | student only |
| `*` | Redirect to `/` | — |

### 7.2 Feature Modules

The client uses **feature-sliced architecture** under `src/features/`:

#### `features/auth/`
- **`AuthContext.jsx`** — React Context providing `user`, `token`, `login()`, `logout()` to the entire app. Reads from `localStorage` on init.
- **`Login.jsx`** — Login form supporting email or username
- **`Register.jsx`** — Multi-step registration: (1) enter email + request OTP, (2) verify OTP, (3) fill profile fields
- **`useShakeValidation.js`** — Custom hook triggering a CSS shake animation on form validation failure

#### `features/dashboard/`
- **`TeacherDashboard.jsx`** — Lists teacher's quizzes and classrooms; create/publish/delete quiz, create classroom
- **`StudentDashboard.jsx`** — Shows assigned quizzes, joined classrooms, result history
- **`AdminDashboard.jsx`** — User management: list, activate/deactivate, delete users
- **`TeacherClassroomDetails.jsx`** — Teacher view: enrolled students, assigned quizzes, per-student results, remove students
- **`StudentClassroomDetails.jsx`** — Student view: classroom info, assigned quizzes, attempt status

#### `features/quiz/`
- **`CreateQuiz.jsx`** — Form to create a quiz (title, description, time limit, status)
- **`ManageQuestions.jsx`** — Full question management: add MCQ/True-False/Descriptive, image upload, delete
- **`AttemptQuiz.jsx`** — Quiz-taking interface with countdown timer, question navigation, answer selection; auto-submits on timer expiry
- **`QuizResult.jsx`** — Displays single result: score, percentage, per-question breakdown
- **`QuizResults.jsx`** — Teacher view: all students' results for a quiz with analytics

#### `features/home/`
- **`Home.jsx`** — Public landing page

#### `features/shared/`
- Shared components and the centralised API service

### 7.3 Shared Components

| Component | Purpose |
|-----------|---------|
| `Navbar.jsx` | Responsive navigation bar; shows role-based links, logout button |
| `ProtectedRoute.jsx` | Redirects unauthenticated/unauthorized users; checks `AuthContext` |
| `QuizTimer.jsx` | Countdown display; accepts `timeLimit` (minutes) and `onExpire` callback |
| `Alert.jsx` | Reusable dismissable alert/notification |
| `Tooltip.jsx` | Hover tooltip with SCSS styling |
| `Footer.jsx` | Site footer |

### 7.4 API Service Layer

**[`src/features/shared/services/api.js`](file:///home/iteshprajapati/Itesh/Quiz-System-MERN/client/src/features/shared/services/api.js)** is the single source of truth for all HTTP calls. It exports:

- **`api`** — Axios instance for JSON requests
- **`fileApi`** — Axios instance for `multipart/form-data` (file uploads)
- Both instances auto-attach `Authorization: Bearer <token>` and handle 401 -> redirect

| Exported Module | Methods |
|-----------------|---------|
| `authAPI` | `register`, `login`, `requestOtp`, `verifyOtp`, `checkUsername`, `getCurrentUser` |
| `userAPI` | `getAllUsers`, `getUser`, `updateUserStatus`, `deleteUser`, `getUserStats` |
| `quizAPI` | `createQuiz`, `getQuiz`, `getQuizForAttempt`, `getTeacherQuizzes`, `getAllQuizzes`, `updateQuiz`, `deleteQuiz` |
| `questionAPI` | `addMCQQuestion`, `addDescriptiveQuestion`, `getQuestions`, `updateQuestion`, `deleteQuestion` |
| `answerAPI` | `submitAnswer`, `getStudentAnswers`, `getUngradedAnswers`, `getAnswerForGrading`, `gradeAnswer`, preset CRUD |
| `resultAPI` | `submitQuiz`, `getResult`, `getStudentResults`, `getQuizResults`, `getQuizStats`, `getQuizTopicStats`, `checkAttempted` |
| `classroomAPI` | `createClassroom`, `getClassrooms`, `getClassroom`, `deleteClassroom`, `joinClassroom`, `assignQuiz`, `unassignQuiz`, `getAssignedQuizzes`, `removeStudent`, `leaveClassroom` |

---

## 8. User Roles & Permissions

| Capability | admin | teacher | student |
|------------|:-----:|:-------:|:-------:|
| Manage Users | Yes | No | No |
| Create/Edit Quiz | No | Yes (own) | No |
| Add Questions | No | Yes (own quiz) | No |
| Publish Quiz | No | Yes (own) | No |
| Create Classroom | No | Yes | No |
| Assign Quiz to Classroom | No | Yes (own) | No |
| Remove Students | No | Yes (own room) | No |
| Join Classroom | No | No | Yes |
| Leave Classroom | No | No | Yes |
| Attempt Quiz | No | No | Yes (once) |
| View Own Results | No | No | Yes |
| View All Quiz Results | No | Yes (own quiz) | No |
| Grade Descriptive Answers | No | Yes | No |

> **Ownership enforcement:** Teachers can only modify quizzes and classrooms they created. This is verified at the DB query level via `findByIdAndTeacher(id, teacherId)`.

---

## 9. Core Workflows

### 9.1 Registration with OTP

```
Student/Teacher
     |
     +- Step 1: Enter email
     |     POST /api/auth/otp/request
     |     -> Server generates 6-digit OTP, hashes it (bcrypt), stores in otp_codes
     |     -> Sends email via Nodemailer SMTP
     |
     +- Step 2: Enter OTP received in email
     |     POST /api/auth/otp/verify (+ name, username, password, role)
     |     -> Retrieves latest OTP record for email
     |     -> Checks expiry (10 min default)
     |     -> bcrypt.compare(otp, otp_hash)
     |     -> Marks OTP as used
     |     -> Creates user, returns JWT
     |
     +- Authenticated as new user
```

### 9.2 Quiz Lifecycle

```
Teacher
  |
  +- Create Quiz (status: draft)
  |     POST /api/quizzes -> quizId returned
  |
  +- Add Questions (MCQ / Descriptive / True-False)
  |     POST /api/questions/mcq or /descriptive
  |     -> question created -> options inserted -> linked to quiz via quiz_questions
  |
  +- Publish Quiz
  |     PATCH /api/quizzes/:id  { status: 'published' }
  |
  +- Quiz is now visible to students
```

### 9.3 Classroom Workflow

```
Teacher
  +- POST /api/classrooms -> 6-char code generated (collision-checked)
  +- POST /api/classrooms/:id/quizzes { quizId } -> assigns quiz
  +- DELETE /api/classrooms/:id/students/:studentId -> removes student

Student
  +- POST /api/classrooms/join { code } -> enrolls in classroom
  +- GET /api/classrooms/student/quizzes -> sees assigned quizzes
  +- DELETE /api/classrooms/:id/leave -> unenrolls
```

### 9.4 Quiz Attempt & Grading

```
Student
  +- GET /api/quizzes/:id/attempt
  |     -> Checks: published? already submitted?
  |     -> Creates or resumes quiz_attempts record (in_progress)
  |     -> Returns questions WITHOUT is_correct field
  |
  +- [Taking quiz with countdown timer]
  |
  +- POST /api/results/submit { quizId, answers: { questionId: optionId } }
  |     -> DB transaction begins
  |     -> For each MCQ: checks selected option -> saves to answers table
  |     -> Calculates mcq_score, total_score, percentage
  |     -> Creates results record
  |     -> Marks quiz_attempt as submitted
  |     -> Transaction commits -> resultId returned
  |
  +- GET /api/results/:id -> view result with answer breakdown

Teacher (for Descriptive answers)
  +- GET /api/answers/ungraded/:quizId -> list ungraded answers
  +- GET /api/answers/grade/:answerId -> view answer + preset answers
  +- PATCH /api/answers/grade/:answerId { marks } -> save grade, update result total
```

---

## 10. Security Design

| Concern | Implementation |
|---------|---------------|
| Password storage | bcrypt with salt factor 10 |
| Session tokens | Stateless JWT (7-day expiry by default); no server-side session |
| OTP security | 6-digit OTP hashed with bcrypt, 10-minute expiry, single-use |
| Route guarding | `authenticate` middleware verifies JWT on every protected route; `authorize` checks role |
| Resource ownership | `findByIdAndTeacher(id, teacherId)` enforces ownership at DB level before any mutation |
| HTTP security headers | Helmet middleware (X-Frame-Options, CSP, HSTS, etc.) |
| Rate limiting | 100 requests per 15-min window per IP (express-rate-limit) |
| Input validation | express-validator on all endpoints; `.trim()` sanitization |
| SQL injection prevention | Parameterized queries via mysql2 prepared statements |
| CORS | Restricted to explicit `CORS_ORIGIN` environment variable |
| File upload safety | Multer stores files server-side; not in DB |
| Client-side auth | 401 interceptor clears token and redirects to prevent stale token usage |

---

## 11. Environment Configuration

### Server (`server/.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=quiz_system
DB_USER=root
DB_PASSWORD=

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# OTP
OTP_EXPIRE_MINUTES=10

# SMTP (Email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=no-reply@example.com
```

### Client (`client/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

> If `REACT_APP_API_URL` is not set, the API service defaults to `http://localhost:5000/api`. The `proxy` field in `client/package.json` is set to `http://localhost:5000` for development proxying.

---

## 12. Setup & Running Locally

### Prerequisites

- Node.js >= 18
- MySQL 8.x running locally
- SMTP credentials (or use Mailtrap/Ethereal for development)

### 1. Clone and Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your DB credentials, JWT secret, and SMTP settings

# Client (optional, defaults work for local dev)
echo "REACT_APP_API_URL=http://localhost:5000/api" > client/.env
```

### 3. Create Database

```sql
CREATE DATABASE quiz_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> Tables are created automatically by the migration runner on first server start.

### 4. Run the Application

```bash
# Terminal 1 — Start backend
cd server
npm run dev    # nodemon src/index.js -> http://localhost:5000

# Terminal 2 — Start frontend
cd client
npm start      # CRA dev server -> http://localhost:3000
```

### 5. Health Check

```bash
curl http://localhost:5000/api/health
# -> { "status": "Server is running" }
```

### npm Scripts Reference

| Directory | Script | Description |
|-----------|--------|-------------|
| `server/` | `npm run dev` | Nodemon dev server |
| `server/` | `npm start` | Production start |
| `server/` | `npm run migrate` | Run migrations standalone |
| `client/` | `npm start` | CRA dev server |
| `client/` | `npm run build` | Production build |

---

*Documentation generated from source code analysis — August 2026.*
