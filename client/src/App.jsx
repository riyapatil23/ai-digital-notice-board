import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/admin/Dashboard';
import CreateNotice from './pages/admin/CreateNotice';
import AdminHistory from './pages/admin/NoticeHistory';
import AdminNoticeDetail from './pages/admin/NoticeDetail';
import Students from './pages/admin/Students';
import AdminConnections from './pages/admin/Connections';

import StudentDashboard from './pages/student/Dashboard';
import StudentNotices from './pages/student/Notices';
import StudentNoticeDetail from './pages/student/NoticeDetail';
import ImportantNotices from './pages/student/ImportantNotices';
import Deadlines from './pages/student/Deadlines';
import NotificationsPage from './pages/student/NotificationsPage';
import AISummarizer from './pages/student/AISummarizer';
import Profile from './pages/student/Profile';
import StudentHistory from './pages/student/History';
import PersonalUpload from './pages/student/PersonalUpload';
import StudentConnections from './pages/student/Connections';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 font-semibold">Loading ApexCampus AI...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 font-semibold">Loading ApexCampus AI...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

      {/* Admin Protected Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="create-notice" element={<CreateNotice />} />
        <Route path="history" element={<AdminHistory />} />
        <Route path="notice/:id" element={<AdminNoticeDetail />} />
        <Route path="students" element={<Students />} />
        <Route path="connections" element={<AdminConnections />} />
      </Route>

      {/* Student Protected Routes */}
      <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="notices" element={<StudentNotices />} />
        <Route path="notice/:id" element={<StudentNoticeDetail />} />
        <Route path="important" element={<ImportantNotices />} />
        <Route path="deadlines" element={<Deadlines />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="ai-summarizer" element={<AISummarizer />} />
        <Route path="profile" element={<Profile />} />
        <Route path="history" element={<StudentHistory />} />
        <Route path="upload" element={<PersonalUpload />} />
        <Route path="connections" element={<StudentConnections />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
