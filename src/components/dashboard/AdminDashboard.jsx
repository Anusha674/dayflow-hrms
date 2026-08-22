import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUsers, getLeaveRequests, getAttendance, getPayrollList, updateLeaveStatus } from '../../db/storage';
import { useNotifications } from '../../context/NotificationContext';
import { ScrollPillBar } from '../common/ScrollPillBar';
import { Users2, CalendarCheck2, CalendarOff, IndianRupee, Search, CheckCircle, XCircle, UserCheck } from 'lucide-react';

export const AdminDashboard = () => {
  const { allUsers, switchViewAs } = useAuth();
  const navigate = useNavigate();
  const { showToast, refreshNotifications } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const [leaves, setLeaves] = useState(() => getLeaveRequests());
  const [punchRefreshTrigger, setPunchRefreshTrigger] = useState(0);

  const attendance = getAttendance();
  const payrolls = getPayrollList();

  useEffect(() => {
    const handlePunchUpdate = () => {
      setPunchRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener('dayflow_punch_update', handlePunchUpdate);
    return () => {
      window.removeEventListener('dayflow_punch_update', handlePunchUpdate);
    };
  }, []);

  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');
  const todayDate = new Date().toISOString().split('T')[0];
  const presentToday = attendance.filter((a) => a.date === todayDate && a.status === 'PRESENT').length;

  const totalPayrollBudget = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const deptPillItems = [
    { id: 'ALL', label: 'All Departments' },
    { id: 'Engineering', label: 'Engineering' },
    { id: 'Product Management', label: 'Product' },
    { id: 'Design & UX', label: 'Design & UX' },
    { id: 'Human Resources', label: 'HR & Operations' },
    { id: 'Finance & Accounting', label: 'Finance' }
  ];

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || u.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleApproveLeave = (leaveId) => {
    updateLeaveStatus(leaveId, 'APPROVED', 'Approved by Admin/HR Officer.');
    showToast('Leave request approved!', 'success');
    refreshNotifications();
    setLeaves(getLeaveRequests());
  };

  const handleRejectLeave = (leaveId) => {
    updateLeaveStatus(leaveId, 'REJECTED', 'Rejected by HR Officer.');
    showToast('Leave request rejected.', 'info');
    refreshNotifications();
    setLeaves(getLeaveRequests());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Card */}
      <div className="card liquid-glass animate-fade-rise" style={{ padding: '2rem' }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: '3rem', fontWeight: 400, letterSpacing: '-1px', color: '#ffffff' }}>
          HR Operations & Employee Portal Control
        </h1>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1rem', marginTop: '0.5rem' }}>
          Streamlining onboarding, attendance tracking, leave approvals, and payroll visibility for deep thinkers and bold creators.
        </p>
      </div>

      {/* Top HR Stat Cards */}
      <div className="grid-4">
        <div className="card liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '0.85rem', borderRadius: '14px' }}>
            <Users2 size={24} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>TOTAL STAFF</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-body)', color: '#ffffff', lineHeight: 1.1, marginTop: '2px', letterSpacing: '-0.5px' }}>{allUsers.length}</div>
          </div>
        </div>

        <div className="card liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.85rem', borderRadius: '14px' }}>
            <CalendarCheck2 size={24} color="#10B981" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>PRESENT TODAY</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-body)', color: '#ffffff', lineHeight: 1.1, marginTop: '2px', letterSpacing: '-0.5px' }}>{presentToday}</div>
          </div>
        </div>

        <div className="card liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.85rem', borderRadius: '14px' }}>
            <CalendarOff size={24} color="#F59E0B" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>PENDING LEAVES</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-body)', color: '#ffffff', lineHeight: 1.1, marginTop: '2px', letterSpacing: '-0.5px' }}>{pendingLeaves.length}</div>
          </div>
        </div>

        <div className="card liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.85rem', borderRadius: '14px' }}>
            <IndianRupee size={24} color="#3B82F6" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>MONTHLY PAYROLL</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-body)', color: '#ffffff', lineHeight: 1.1, marginTop: '2px', letterSpacing: '-0.5px' }}>₹{totalPayrollBudget}</div>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests Section */}
      {pendingLeaves.length > 0 && (
        <div className="card liquid-glass" style={{ borderLeft: '4px solid #FAF0E6' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarOff size={20} color="#FAF0E6" />
              <span className="card-title" style={{ color: '#ffffff' }}>Pending Leave Requests</span>
            </div>
            <button onClick={() => navigate('/leave')} className="btn btn-outline btn-sm">
              View All Leaves
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((leave) => {
                  const emp = allUsers.find((u) => u.id === leave.userId);
                  return (
                    <tr key={leave.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{emp?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{emp?.department}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{leave.leaveType}</span>
                      </td>
                      <td>
                        {leave.startDate} to {leave.endDate}
                      </td>
                      <td>
                        <strong style={{ color: '#ffffff' }}>{leave.daysCount} Days</strong>
                      </td>
                      <td style={{ maxWidth: '250px', fontSize: '0.85rem' }}>{leave.reason}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleApproveLeave(leave.id)} className="btn btn-success btn-sm">
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button onClick={() => handleRejectLeave(leave.id)} className="btn btn-danger-light btn-sm">
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Directory */}
      <div className="card liquid-glass">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="card-title" style={{ color: '#ffffff' }}>Employee Directory & HR Management</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Inspect profile, attendance, payroll, or view portal as any employee</p>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', minWidth: '260px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <ScrollPillBar
            items={deptPillItems}
            activeItem={departmentFilter}
            onItemClick={(id) => setDepartmentFilter(id)}
          />
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department & Designation</th>
                <th>Role</th>
                <th>Contact Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={emp.avatar} alt={emp.name} className="avatar" />
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.775rem', color: 'hsl(var(--muted-foreground))' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'monospace', color: '#ffffff' }}>{emp.employeeId}</strong>
                  </td>
                  <td>
                    <div style={{ color: '#ffffff' }}>{emp.designation}</div>
                    <div style={{ fontSize: '0.775rem', color: 'hsl(var(--muted-foreground))' }}>{emp.department}</div>
                  </td>
                  <td>
                    <span className={`badge ${emp.role === 'ADMIN' ? 'badge-admin' : 'badge-info'}`}>{emp.role}</span>
                  </td>
                  <td>{emp.phone || 'Not set'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          switchViewAs(emp);
                          navigate('/profile');
                        }}
                        className="btn btn-liquid btn-sm"
                        title="View portal as this employee"
                      >
                        <UserCheck size={14} /> View Portal As
                      </button>

                      <button
                        onClick={() => navigate('/payroll')}
                        className="btn btn-outline btn-sm"
                        title="Manage payroll"
                      >
                        <IndianRupee size={14} /> Payroll
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
