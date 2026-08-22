import React from 'react';
import { getUsers, getAttendance, getLeaveRequests, getPayrollList } from '../../db/storage';
import { useNotifications } from '../../context/NotificationContext';
import { BarChart3, Download, PieChart, TrendingUp, Users, DollarSign } from 'lucide-react';

export const HRAnalytics = () => {
  const { showToast } = useNotifications();

  const users = getUsers();
  const attendance = getAttendance();
  const leaves = getLeaveRequests();
  const payrolls = getPayrollList();

  const totalUsers = users.length;
  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING').length;
  const totalPayrollCost = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);

  // Group users by department
  const depts = {};
  users.forEach((u) => {
    depts[u.department] = (depts[u.department] || 0) + 1;
  });

  const exportCSV = (type) => {
    let headers = [];
    let rows = [];

    if (type === 'attendance') {
      headers = ['Employee Name', 'Date', 'Check In', 'Check Out', 'Work Hours', 'Status'];
      rows = attendance.map((a) => {
        const u = users.find((usr) => usr.id === a.userId);
        return [u?.name || 'Unknown', a.date, a.checkIn, a.checkOut, a.workHours, a.status];
      });
    } else if (type === 'payroll') {
      headers = ['Employee Name', 'Employee ID', 'Basic Pay', 'HRA', 'Allowances', 'Deductions', 'Net Salary'];
      rows = payrolls.map((p) => {
        const u = users.find((usr) => usr.id === p.userId);
        return [u?.name || 'Unknown', u?.employeeId || 'N/A', p.basicSalary, p.hra, p.specialAllowance, p.pfDeduction + p.taxDeduction, p.netSalary];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dayflow_${type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`${type.toUpperCase()} report exported successfully as CSV!`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>HR Analytics & Exportable Reports</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Insights into department distribution, leave trends, and payroll expenses</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => exportCSV('attendance')} className="btn btn-outline">
              <Download size={16} /> Export Attendance CSV
            </button>
            <button onClick={() => exportCSV('payroll')} className="btn btn-primary">
              <Download size={16} /> Export Payroll CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Department Distribution</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(depts).map(([dept, count]) => (
              <div key={dept}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>{dept}</span>
                  <strong>{count} Employees ({Math.round((count / totalUsers) * 100)}%)</strong>
                </div>
                <div style={{ background: 'var(--bg-main)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(count / totalUsers) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Leave Request Statuses</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'var(--success-light)', borderRadius: 'var(--radius-sm)' }}>
              <span>Approved Leave Requests</span>
              <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{approvedLeaves}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'var(--warning-light)', borderRadius: 'var(--radius-sm)' }}>
              <span>Pending Approvals</span>
              <strong style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>{pendingLeaves}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
              <span>Total Leave Applications</span>
              <strong style={{ fontSize: '1.2rem' }}>{leaves.length}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Payroll Financial Summary</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>TOTAL MONTHLY DISBURSEMENT</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>${totalPayrollCost}</div>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <div>Average Net Salary per Employee: <strong>${Math.round(totalPayrollCost / (totalUsers || 1))}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
