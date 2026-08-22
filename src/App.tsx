import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { FullPageLoader } from './components/Loading';
import { startSyncManager } from './utils/offlineSync';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { EmployeeProfile } from './pages/employee/Profile';
import { EmployeeAttendance } from './pages/employee/Attendance';
import { EmployeeLeave } from './pages/employee/Leave';
import { EmployeePayroll } from './pages/employee/Payroll';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminEmployees } from './pages/admin/Employees';
import { AdminAttendance } from './pages/admin/Attendance';
import { AdminLeaveApprovals } from './pages/admin/LeaveApprovals';
import { AdminPayroll } from './pages/admin/Payroll';
import { AdminAnalytics } from './pages/admin/Analytics';
import { AdminReports } from './pages/admin/Reports';
import { AdminAuditLog } from './pages/admin/AuditLog';

export function App() {
  useEffect(() => {
    startSyncManager();
  }, []);

  return (
    <PreferencesProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Fullscreen Looping Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="video-bg-container"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          />
          <div className="video-overlay" />
          <AppRoutes />
          <ToastLayer />
        </BrowserRouter>
      </AuthProvider>
    </PreferencesProvider>);

}

function ToastLayer() {
  const { prefs } = usePreferences();
  return (
    <Toaster
      position="bottom-right"
      theme={prefs.theme}
      richColors
      closeButton
      toastOptions={{ duration: 4000 }} />);


}

function RootRedirect() {
  const { user, booting } = useAuth();
  if (booting) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'HR' ? '/admin/dashboard' : '/app/dashboard'} replace />;
}

function EmployeeArea({ children }: {children: React.ReactNode;}) {
  return (
    <ProtectedRoute allow={['EMPLOYEE', 'HR']}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>);

}

function HrArea({ children }: {children: React.ReactNode;}) {
  return (
    <ProtectedRoute allow={['HR']}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>);

}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route path="/app/dashboard" element={<EmployeeArea><EmployeeDashboard /></EmployeeArea>} />
      <Route path="/app/profile" element={<EmployeeArea><EmployeeProfile /></EmployeeArea>} />
      <Route path="/app/attendance" element={<EmployeeArea><EmployeeAttendance /></EmployeeArea>} />
      <Route path="/app/leave" element={<EmployeeArea><EmployeeLeave /></EmployeeArea>} />
      <Route path="/app/payroll" element={<EmployeeArea><EmployeePayroll /></EmployeeArea>} />

      <Route path="/admin/dashboard" element={<HrArea><AdminDashboard /></HrArea>} />
      <Route path="/admin/employees" element={<HrArea><AdminEmployees /></HrArea>} />
      <Route path="/admin/attendance" element={<HrArea><AdminAttendance /></HrArea>} />
      <Route path="/admin/leave" element={<HrArea><AdminLeaveApprovals /></HrArea>} />
      <Route path="/admin/payroll" element={<HrArea><AdminPayroll /></HrArea>} />
      <Route path="/admin/analytics" element={<HrArea><AdminAnalytics /></HrArea>} />
      <Route path="/admin/reports" element={<HrArea><AdminReports /></HrArea>} />
      <Route path="/admin/audit" element={<HrArea><AdminAuditLog /></HrArea>} />

      <Route path="*" element={<RootRedirect />} />
    </Routes>);

}