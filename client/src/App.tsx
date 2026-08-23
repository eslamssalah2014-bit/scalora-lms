import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';

// Public Pages
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { CommunityPage } from './pages/CommunityPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PasswordSetupPage } from './pages/PasswordSetupPage';

// Student Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { CoursePlayerPage } from './pages/CoursePlayerPage';
import { QuizPage } from './pages/QuizPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminLeadsPage } from './pages/admin/AdminLeadsPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminCurriculumPage } from './pages/admin/AdminCurriculumPage';
import { AdminQuizzesPage } from './pages/admin/AdminQuizzesPage';
import { AdminEnrollmentsPage } from './pages/admin/AdminEnrollmentsPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminCommunityPage } from './pages/admin/AdminCommunityPage';
import { AdminTrainersPage } from './pages/admin/AdminTrainersPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { PwaAnalyticsPage } from './pages/admin/PwaAnalyticsPage';

// Trainer, Messaging & Notifications Pages
import { TrainerDashboardPage } from './pages/trainer/TrainerDashboardPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { OfflineBanner } from './components/OfflineBanner';
import { MobileBottomNav } from './components/MobileBottomNav';

// Layout with Header & Footer
const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#04152D]">
      <OfflineBanner />
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <PwaInstallBanner />
      <MobileBottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public / Student Standard Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-password/:token" element={<PasswordSetupPage />} />

          {/* Student Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Direct Messages & Student Inquiry Module */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          {/* Unified Notification Center */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenterPage />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Trainer Workspace */}
          <Route
            path="/trainer"
            element={
              <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
                <TrainerDashboardPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Full-Screen Distraction-Free Classroom Learning Player */}
        <Route
          path="/learn/:slug"
          element={
            <ProtectedRoute>
              <CoursePlayerPage />
            </ProtectedRoute>
          }
        />

        {/* Interactive Quiz Assessment */}
        <Route
          path="/learn/:slug/quiz/:quizId"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard Console (Role Protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="pwa-analytics" element={<PwaAnalyticsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="trainers" element={<AdminTrainersPage />} />
          <Route path="community" element={<AdminCommunityPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/:courseId/curriculum" element={<AdminCurriculumPage />} />
          <Route path="quizzes" element={<AdminQuizzesPage />} />
          <Route path="enrollments" element={<AdminEnrollmentsPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
