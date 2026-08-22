import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserAttendance, getAttendance, getUsers } from '../../db/storage';
import { PunchCard } from '../dashboard/PunchCard';
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, Filter } from 'lucide-react';

export const AttendanceTracker = () => {
  const { activeUser, currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [viewMode, setViewMode] = useState('MY'); // 'MY' or 'ALL'
  const [statusFilter, setStatusFilter] = useState('ALL');

  const myAttendance = getUserAttendance(activeUser.id);
  const allAttendance = getAttendance();
  const allUsersList = getUsers();

  const displayList = viewMode === 'MY' ? myAttendance : allAttendance;

  const filteredList = displayList.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Punch Card */}
      <PunchCard />

      {/* Attendance Log Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="card-title">Attendance Log & History</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily punch records, check-in/out timestamps, and working hours</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isAdmin && (
              <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  onClick={() => setViewMode('MY')}
                  className={`btn btn-sm ${viewMode === 'MY' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: 'none' }}
                >
                  My Logs
                </button>
                <button
                  onClick={() => setViewMode('ALL')}
                  className={`btn btn-sm ${viewMode === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: 'none' }}
                >
                  All Employees
                </button>
              </div>
            )}

            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half-day</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">On Leave</option>
            </select>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No attendance records found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {viewMode === 'ALL' && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Total Working Hours</th>
                  <th>Status</th>
                  <th>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((log) => {
                  const emp = allUsersList.find((u) => u.id === log.userId);
                  return (
                    <tr key={log.id}>
                      {viewMode === 'ALL' && (
                        <td>
                          <div style={{ fontWeight: 700 }}>{emp?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp?.department}</div>
                        </td>
                      )}
                      <td>
                        <strong style={{ fontSize: '0.9rem' }}>{log.date}</strong>
                      </td>
                      <td>{log.checkIn || '--:--'}</td>
                      <td>{log.checkOut || '--:--'}</td>
                      <td>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{log.workHours || 'N/A'}</strong>
                      </td>
                      <td>
                        <span className={`badge badge-${log.status.toLowerCase()}`}>{log.status.replace('_', ' ')}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.notes || '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
