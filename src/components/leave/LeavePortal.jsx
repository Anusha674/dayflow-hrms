import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getLeaveRequests, getUserLeaveRequests, applyLeaveRequest, updateLeaveStatus, getUsers } from '../../db/storage';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import { CalendarDays, Plus, CheckCircle, XCircle, Clock, MessageSquare, Filter } from 'lucide-react';
import { Modal } from '../common/Modal';

export const LeavePortal = () => {
  const { activeUser, currentUser } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewScope, setViewScope] = useState(isAdmin ? 'ALL' : 'MY');

  // Admin action modal state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [adminComment, setAdminComment] = useState('');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const [leavesList, setLeavesList] = useState(getLeaveRequests());
  const allUsersList = getUsers();

  const refreshLeaves = () => {
    setLeavesList(getLeaveRequests());
  };

  const userLeaves = leavesList.filter((l) => l.userId === activeUser.id);
  const displayedLeaves = viewScope === 'MY' ? userLeaves : leavesList;

  const filteredLeaves = displayedLeaves.filter((l) => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  const handleApplySubmit = (leaveData) => {
    applyLeaveRequest({
      userId: activeUser.id,
      ...leaveData
    });
    refreshLeaves();
    refreshNotifications();
  };

  const openActionModal = (leaveRecord) => {
    setSelectedLeave(leaveRecord);
    setAdminComment(leaveRecord.adminComment || '');
    setIsActionModalOpen(true);
  };

  const handleProcessLeave = (newStatus) => {
    if (!selectedLeave) return;
    updateLeaveStatus(selectedLeave.id, newStatus, adminComment);
    showToast(`Leave request ${newStatus.toLowerCase()} successfully!`, 'success');
    setIsActionModalOpen(false);
    refreshLeaves();
    refreshNotifications();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner & Action */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Leave & Time-Off Portal</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Apply for time-off, track request status, or approve employee applications</p>
          </div>

          <button onClick={() => setIsApplyModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Apply For Leave
          </button>
        </div>
      </div>

      {/* Main Leave Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={20} color="var(--primary)" />
            <span className="card-title">Leave Applications ({filteredLeaves.length})</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isAdmin && (
              <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  onClick={() => setViewScope('MY')}
                  className={`btn btn-sm ${viewScope === 'MY' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: 'none' }}
                >
                  My Leaves
                </button>
                <button
                  onClick={() => setViewScope('ALL')}
                  className={`btn btn-sm ${viewScope === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: 'none' }}
                >
                  All Employees
                </button>
              </div>
            )}

            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No leave applications found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {viewScope === 'ALL' && <th>Employee</th>}
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Total Days</th>
                  <th>Reason / Remarks</th>
                  <th>Status</th>
                  <th>HR Comment</th>
                  {isAdmin && <th>HR Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => {
                  const emp = allUsersList.find((u) => u.id === leave.userId);
                  return (
                    <tr key={leave.id}>
                      {viewScope === 'ALL' && (
                        <td>
                          <div style={{ fontWeight: 700 }}>{emp?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp?.department}</div>
                        </td>
                      )}
                      <td>
                        <span className="badge badge-info">{leave.leaveType}</span>
                      </td>
                      <td>
                        {leave.startDate} to {leave.endDate}
                      </td>
                      <td>
                        <strong>{leave.daysCount} Days</strong>
                      </td>
                      <td style={{ maxWidth: '220px', fontSize: '0.85rem' }}>{leave.reason}</td>
                      <td>
                        <span className={`badge badge-${leave.status.toLowerCase()}`}>{leave.status}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{leave.adminComment || '--'}</td>
                      {isAdmin && (
                        <td>
                          <button onClick={() => openActionModal(leave)} className="btn btn-outline btn-sm">
                            Process Request
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplySubmit}
        userName={activeUser.name}
      />

      {/* Admin Action Review Modal */}
      {selectedLeave && (
        <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title="HR Leave Request Review Desk">
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Reviewing application for <strong>{allUsersList.find((u) => u.id === selectedLeave.userId)?.name}</strong>
            </p>
            <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <div><strong>Type:</strong> {selectedLeave.leaveType} ({selectedLeave.daysCount} Days)</div>
              <div><strong>Dates:</strong> {selectedLeave.startDate} to {selectedLeave.endDate}</div>
              <div style={{ marginTop: '0.35rem' }}><strong>Reason:</strong> {selectedLeave.reason}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">HR / Admin Comments</label>
            <textarea
              rows={3}
              className="form-textarea"
              placeholder="Add optional notes for the employee..."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => handleProcessLeave('REJECTED')} className="btn btn-danger">
              <XCircle size={16} /> Reject Application
            </button>
            <button onClick={() => handleProcessLeave('APPROVED')} className="btn btn-accent">
              <CheckCircle size={16} /> Approve Application
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
