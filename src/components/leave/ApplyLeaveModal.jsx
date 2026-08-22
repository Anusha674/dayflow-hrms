import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useNotifications } from '../../context/NotificationContext';
import { CalendarDays, Send } from 'lucide-react';

export const ApplyLeaveModal = ({ isOpen, onClose, onSubmit, userName }) => {
  const { showToast } = useNotifications();

  const [leaveType, setLeaveType] = useState('Paid Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [reason, setReason] = useState('');

  // Auto-calculate days count based on start and end dates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
        setDaysCount(diffDays);
      } else {
        setDaysCount(0);
      }
    }
  }, [startDate, endDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showToast('Please select both start and end dates.', 'error');
      return;
    }
    if (daysCount <= 0) {
      showToast('End date must be on or after start date.', 'error');
      return;
    }

    onSubmit({
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
      userName
    });

    showToast('Leave request submitted successfully!', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Time-Off / Leave">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Leave Category</label>
          <select className="form-select" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            <option value="Paid Leave">Paid Leave (Annual / Vacation)</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Unpaid Leave">Unpaid Leave</option>
          </select>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              required
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              required
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ background: 'var(--primary-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
            Total Leave Duration: {daysCount} Day(s)
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Reason / Remarks</label>
          <textarea
            required
            rows={3}
            className="form-textarea"
            placeholder="Provide brief reason for time-off request..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Send size={16} /> Submit Application
          </button>
        </div>
      </form>
    </Modal>
  );
};
