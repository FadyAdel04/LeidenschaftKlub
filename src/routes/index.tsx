import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import StudentLayout from '../layouts/StudentLayout';
import AdminLayout from '../layouts/AdminLayout';
import InstructorLayout from '../layouts/InstructorLayout';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import PublicOnlyRoute from '../components/shared/PublicOnlyRoute';

const LandingPage        = lazy(() => import('../pages/public/LandingPage'));
const AboutPage          = lazy(() => import('../pages/public/AboutPage'));
const LevelDetailsPage   = lazy(() => import('../pages/public/LevelDetailsPage'));
const LoginPage          = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const StudentDashboard   = lazy(() => import('../pages/student/StudentDashboard'));
const StudentCourses     = lazy(() => import('../pages/student/StudentCourses'));
const StudentAssignments = lazy(() => import('../pages/student/StudentAssignments'));
const StudentExams       = lazy(() => import('../pages/student/StudentExams'));
const StudentResults     = lazy(() => import('../pages/student/StudentResults'));
const StudentProfile     = lazy(() => import('../pages/student/StudentProfile'));
const LessonPage         = lazy(() => import('../pages/student/LessonPage'));
const ExamPage           = lazy(() => import('../pages/student/ExamPage'));
const AdminDashboard     = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminStudents      = lazy(() => import('../pages/admin/AdminStudents'));
const AdminLevels        = lazy(() => import('../pages/admin/AdminLevels'));
const AdminMaterials     = lazy(() => import('../pages/admin/AdminMaterials'));
const AdminAssignments   = lazy(() => import('../pages/admin/AdminAssignments'));
const AdminExams         = lazy(() => import('../pages/admin/AdminExams'));
const AdminExamReview    = lazy(() => import('../pages/admin/AdminExamReviewPage'));
const AdminResults       = lazy(() => import('../pages/admin/AdminResults'));
const AdminWebsite       = lazy(() => import('../pages/admin/AdminWebsite'));
const AdminNotifications = lazy(() => import('../pages/admin/AdminNotifications'));
const AdminGroups        = lazy(() => import('../pages/admin/AdminGroups'));
const AdminAttendance    = lazy(() => import('../pages/admin/AdminAttendance'));
const AdminCalendar      = lazy(() => import('../pages/admin/AdminCalendar'));
const InstructorDashboard   = lazy(() => import('../pages/instructor/InstructorDashboard'));
const InstructorGroups      = lazy(() => import('../pages/instructor/InstructorGroups'));
const InstructorStudents    = lazy(() => import('../pages/instructor/InstructorStudents'));
const InstructorAssignments = lazy(() => import('../pages/instructor/InstructorAssignments'));
const InstructorExams       = lazy(() => import('../pages/instructor/InstructorExams'));
const InstructorExamReview  = lazy(() => import('../pages/instructor/InstructorExamReviewPage'));
const InstructorProfile     = lazy(() => import('../pages/instructor/InstructorProfile'));

const SecretaryAttendance    = lazy(() => import('../pages/secretary/SecretaryAttendance'));
const SecretaryDashboard     = lazy(() => import('../pages/secretary/SecretaryDashboard'));
const SecretaryLevels        = lazy(() => import('../pages/secretary/SecretaryLevels'));
const SecretaryGroups        = lazy(() => import('../pages/secretary/SecretaryGroups'));
const SecretaryEnrollment    = lazy(() => import('../pages/secretary/SecretaryEnrollment'));

const Spinner = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[#F5F5F0]">
    <div className="w-8 h-8 rounded-full border-4 border-[#1A1A1A]/10 border-t-[#C62828] animate-spin" />
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* ── Public ───────────────────────────────────────────── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/levels/:level" element={<LevelDetailsPage />} />
        </Route>

        {/* ── Auth (unauthenticated) ────────────────────────────── */}
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        {/* ── Student (protected: role = student) ───────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index                   element={<StudentDashboard />} />
            <Route path="courses"          element={<StudentCourses />} />
            <Route path="courses/:id"      element={<LessonPage />} />
            <Route path="assignments"      element={<StudentAssignments />} />
            <Route path="exams"            element={<StudentExams />} />
            <Route path="exams/:id"        element={<ExamPage />} />
            <Route path="results"          element={<StudentResults />} />
            <Route path="profile"          element={<StudentProfile />} />
          </Route>
        </Route>

        {/* ── Admin (protected: role = admin) ───────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index                   element={<AdminDashboard />} />
            <Route path="students"         element={<AdminStudents />} />
            <Route path="levels"           element={<AdminLevels />} />
            <Route path="materials"        element={<AdminMaterials />} />
            <Route path="assignments"      element={<AdminAssignments />} />
            <Route path="exams"            element={<Suspense fallback={null}><AdminExams /></Suspense>} />
            <Route path="exams/:examId/review/:studentId" element={<AdminExamReview />} />
            <Route path="results"          element={<AdminResults />} />
            <Route path="website"          element={<AdminWebsite />} />
            <Route path="Notifications"   element={<AdminNotifications />} />
            <Route path="groups"          element={<AdminGroups />} />
            <Route path="attendance"      element={<AdminAttendance />} />
            <Route path="calendar"        element={<AdminCalendar />} />
          </Route>
        </Route>

        {/* ── Instructor (protected: role = instructor) ──────────── */}
        <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
          <Route path="/instructor" element={<InstructorLayout />}>
            <Route index                   element={<InstructorDashboard />} />
            <Route path="levels"           element={<InstructorGroups />} />
            <Route path="students"         element={<InstructorStudents />} />
            <Route path="assignments"      element={<InstructorAssignments />} />
            <Route path="exams"            element={<InstructorExams />} />
            <Route path="exams/:examId/review/:studentId" element={<InstructorExamReview />} />
            <Route path="profile"          element={<InstructorProfile />} />
          </Route>
        </Route>

        {/* ── Secretary (protected: role = secretary) ──────────── */}
        <Route element={<ProtectedRoute allowedRoles={['secretary']} />}>
          <Route path="/secretary">
            <Route index                   element={<SecretaryDashboard />} />
            <Route path="attendance"       element={<SecretaryAttendance />} />
            <Route path="levels"           element={<SecretaryLevels />} />
            <Route path="enrollment"       element={<SecretaryEnrollment />} />
            <Route path="groups"           element={<SecretaryGroups />} />
          </Route>
        </Route>

      </Routes>
    </Suspense>
  );
}
