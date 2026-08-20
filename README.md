
# Scalora LMS Platform

Enterprise Learning Management System (LMS) engineered from scratch for Scalora.

---

## 🎨 Brand & Design System
- **Dark Navy Blue**: `#082B5B`
- **Bright Blue**: `#2D8CFF`
- **White**: `#FFFFFF`
- **Light Gray**: `#F5F7FA`
- **Cyan Accent**: `#00D2FF`
- **UI Style**: Modern, corporate, clean glassmorphism, glowing accents, smooth transitions, and high-contrast typography.

---

## 🚀 Tech Stack

### Frontend (`client/`)
- **React 18** with **TypeScript**
- **Vite** bundler
- **Tailwind CSS** with custom Scalora design system tokens
- **React Router v6** (with role-based protected routes)
- **Lucide React Icons**
- **Canvas Confetti** for quiz completion & certificate celebration

### Backend (`server/`)
- **Node.js** & **Express** with **TypeScript**
- **Prisma ORM** (PostgreSQL-ready schema, pre-configured with SQLite for zero-setup local runs)
- **JWT (JSON Web Tokens)** & **Bcrypt.js** password hashing
- **Zod** request validation schemas
- **Payment Abstraction Layer** supporting Sandbox Mock, Stripe, and Paymob

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Quick Login |
| :--- | :--- | :--- | :--- |
| **Admin / Instructor** | `admin@scalora.com` | `ScaloraAdmin123!` | 1-Click Button on Login Screen |
| **Student Learner** | `student@scalora.com` | `Student123!` | 1-Click Button on Login Screen |

---

## 📁 Repository Structure

```
scalora-lms/
├── client/                      # React TypeScript Frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/          # Navbar, Footer, CourseCard, Modal, Checkout, Certificate, AdminLayout
│   │   ├── context/             # AuthContext (JWT state & demo logins)
│   │   ├── lib/                 # API client wrapper with Authorization headers
│   │   ├── pages/               # HomePage, CoursesPage, CourseDetailsPage, Auth pages
│   │   │   └── admin/           # Dashboard, Courses, Curriculum, Quizzes, Enrollments, Students, Settings
│   │   └── types/               # TypeScript interfaces
├── server/                      # Express TypeScript Backend
│   ├── prisma/                  # schema.prisma & seed.ts
│   ├── src/
│   │   ├── controllers/         # Auth, Course, Module, Lesson, Quiz, Enrollment, Progress, Payment, Admin
│   │   ├── middleware/          # JWT auth & role validation
│   │   ├── routes/              # Express API route definitions
│   │   └── services/            # Payment gateway abstraction (Mock, Stripe, Paymob)
```

---

## 🛠️ Quick Start Instructions

### 1. Start Backend Server
```bash
cd server
npm install
npm run db:push
npm run db:seed
npm run dev
# Server will run on http://localhost:5000
```

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
# Frontend will run on http://localhost:5173
```

---

## 🌟 Key Features

1. **Public Portal**:
   - High-impact Hero with live metrics and animated badges.
   - Course catalog with live search, category pills, price & sorting filters.
   - Course details with video preview, accordion curriculum, and 1-click enroll.

2. **Student Portal**:
   - Student Dashboard with real-time course progress and resume learning banner.
   - Distraction-free Classroom Course Player supporting **YouTube Video streams**, **PDF material**, **Downloadable asset files**, and **Rich Markdown articles**.
   - Interactive Quizzes with automatic scoring, pass/fail threshold, and question review explanations.
   - Official digitally verifiable **Scalora Certificate of Completion** with print/PDF capability.

3. **Admin Dashboard**:
   - Executive Analytics: Total Courses, Students, Enrollments, and Gross Revenue.
   - Course & Curriculum Management: Create/edit courses, publish toggles, and module/lesson builder.
   - Dynamic Quiz Builder: Custom multiple-choice questions, passing score, and explanations.
   - Student & Enrollment Management: Manual student enrollment and transaction ledgers.
   - Payment Abstraction Settings (Sandbox, Stripe, Paymob).
=======
# scalora-lms
