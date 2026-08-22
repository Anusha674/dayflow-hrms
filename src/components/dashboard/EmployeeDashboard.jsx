import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PunchCard } from './PunchCard';
import { ActivityTimeline } from '../common/ActivityTimeline';
import { getUserAttendance, getUserLeaveRequests, getUserPayroll } from '../../db/storage';
import { UserCheck, CalendarCheck2, CalendarOff, IndianRupee, ArrowRight, Activity } from 'lucide-react';

export const EmployeeDashboard = () => {
  const { activeUser } = useAuth();
  const navigate = useNavigate();

  const attendance = getUserAttendance(activeUser.id);
  const leaves = getUserLeaveRequests(activeUser.id);
  const payroll = getUserPayroll(activeUser.id);

  const pendingLeavesCount = leaves.filter((l) => l.status === 'PENDING').length;
  const totalPresentDays = attendance.filter((a) => a.status === 'PRESENT').length;

  const activityFeed = [
    { id: 1, type: 'punch', title: 'Checked in for work session', time: 'Today 09:02 AM', description: 'Recorded attendance punch in Dayflow system.' },
    { id: 2, type: 'leave', title: 'Submitted Paid Leave application', time: 'Yesterday 10:30 AM', description: '3 Days requested (Aug 28 - Aug 30).' },
    { id: 3, type: 'approval', title: 'Salary slip generated', time: 'Aug 15, 2026', description: 'August 2026 payroll payment processed.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Section */}
      <div className="card liquid-glass animate-fade-rise" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: '3.5rem', leading: '1', fontWeight: 400, letterSpacing: '-1.5px', maxWidth: '1000px', margin: '0 auto', color: '#ffffff' }}>
          Where every workday rises through perfect alignment.
        </h1>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem', maxWidth: '700px', margin: '1rem auto 0', lineHeight: 1.6 }} className="animate-fade-rise-delay">
          Welcome back, {activeUser.name}. We're designing tools for deep thinkers and bold creators. Track your attendance, manage time-off, and access payroll visibility in a space designed for sharp focus.
        </p>
        <div className="animate-fade-rise-delay-2" style={{ marginTop: '1.75rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => navigate('/leave')} className="liquid-glass btn-liquid" style={{ padding: '0.75rem 2rem', borderRadius: '9999px', fontSize: '0.95rem' }}>
            Apply For Leave
          </button>
          <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '9999px', fontSize: '0.95rem' }}>
            My Profile
          </button>
        </div>
      </div>

      {/* Main Grid: Punch Card & Overview */}
      <div className="grid-2">
        <PunchCard />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card liquid-glass">
            <div className="card-header">
              <span className="card-title">Quick HR Metrics</span>
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>ATTENDANCE RECORDED</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem', fontFamily: 'var(--font-display)', color: '#ffffff' }}>{totalPresentDays} Days</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>PENDING LEAVES</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>{pendingLeavesCount} Requests</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>MONTHLY NET SALARY</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>₹{payroll.netSalary}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>PAYMENT STATUS</span>
                <div style={{ marginTop: '0.35rem' }}>
                  <span className="badge badge-paid">{payroll.paymentStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card liquid-glass">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="hsl(var(--foreground))" />
                <span className="card-title">Recent Activity Feed</span>
              </div>
            </div>
            <ActivityTimeline items={activityFeed} />
          </div>
        </div>
      </div>

      {/* Access Portals */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, marginBottom: '1.25rem', color: '#ffffff' }}>Quick Portals</h3>
        <div className="grid-4">
          <div className="card liquid-glass" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <UserCheck size={22} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, color: '#ffffff' }}>My Profile</h4>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '0.35rem 0 1rem' }}>Job details & documents vault</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontWeight: 500, fontSize: '0.85rem' }}>
              Open Profile <ArrowRight size={14} />
            </div>
          </div>

          <div className="card liquid-glass" onClick={() => navigate('/attendance')} style={{ cursor: 'pointer' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CalendarCheck2 size={22} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, color: '#ffffff' }}>Attendance Tracker</h4>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '0.35rem 0 1rem' }}>Daily & weekly punch logs</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontWeight: 500, fontSize: '0.85rem' }}>
              View Attendance <ArrowRight size={14} />
            </div>
          </div>

          <div className="card liquid-glass" onClick={() => navigate('/leave')} style={{ cursor: 'pointer' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CalendarOff size={22} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, color: '#ffffff' }}>Leave & Time-Off</h4>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '0.35rem 0 1rem' }}>Apply & track approvals</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontWeight: 500, fontSize: '0.85rem' }}>
              Apply Leave <ArrowRight size={14} />
            </div>
          </div>

          <div className="card liquid-glass" onClick={() => navigate('/payroll')} style={{ cursor: 'pointer' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <IndianRupee size={22} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, color: '#ffffff' }}>Payroll & Slips</h4>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', margin: '0.35rem 0 1rem' }}>Salary slips & breakdown</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontWeight: 500, fontSize: '0.85rem' }}>
              View Payslip <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
