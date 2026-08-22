import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { FloatingQuickAction } from './components/common/FloatingQuickAction';
import { ScrollProgress } from './components/common/ScrollProgress';
import { SignIn } from './components/auth/SignIn';
import { SignUp } from './components/auth/SignUp';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { AttendanceTracker } from './components/attendance/AttendanceTracker';
import { LeavePortal } from './components/leave/LeavePortal';
import { PayrollPortal } from './components/payroll/PayrollPortal';
import { HRAnalytics } from './components/analytics/HRAnalytics';
import { ResetDataView } from './components/common/ResetDataView';

const MainLayout = () => {
  const { currentUser, activeUser, loading } = useAuth();
  const [authView, setAuthView] = useState('signin');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'hsl(var(--foreground))', background: 'hsl(201, 100%, 13%)' }}>
        <span style={{ 
          fontWeight: 800, 
          fontSize: '2.5rem', 
          background: 'linear-gradient(135deg, #ffffff 30%, #3B82F6 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          letterSpacing: '-1px', 
          fontFamily: 'var(--font-body)',
          textShadow: '0 0 30px rgba(59, 130, 246, 0.2)'
        }}>
          Dayflow
        </span>
      </div>
    );
  }

  return (
    <>
      <ScrollProgress />

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

      {!currentUser ? (
        <div style={{ position: 'relative', zIndex: 10 }}>
          {authView === 'signin' ? (
            <SignIn onSwitchToSignUp={() => setAuthView('signup')} />
          ) : (
            <SignUp onSwitchToSignIn={() => setAuthView('signin')} />
          )}
        </div>
      ) : (
        <div className="app-container">
          <Sidebar isOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          {isMobile && sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 45,
                transition: 'opacity 0.3s ease'
              }}
            />
          )}
          <div className="main-wrapper" style={{ marginLeft: (!isMobile && sidebarOpen) ? '270px' : '0', transition: 'margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)', width: '100%', minWidth: 0 }}>
            <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <main className="content-body animate-fade-rise">
              <Routes>
                <Route path="/" element={activeUser?.role === 'ADMIN' ? <AdminDashboard /> : <EmployeeDashboard />} />
                <Route path="/profile" element={<ProfileView />} />
                <Route path="/attendance" element={<AttendanceTracker />} />
                <Route path="/leave" element={<LeavePortal />} />
                <Route path="/payroll" element={<PayrollPortal />} />
                {activeUser?.role === 'ADMIN' && <Route path="/analytics" element={<HRAnalytics />} />}
                <Route path="/reset" element={<ResetDataView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <FloatingQuickAction />
          </div>
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <MainLayout />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
