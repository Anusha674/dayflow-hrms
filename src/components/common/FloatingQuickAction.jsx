import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getActivePunch, checkInUser, checkOutUser } from '../../db/storage';
import { Plus, Clock, CalendarDays, DollarSign, X, Play, Square } from 'lucide-react';

export const FloatingQuickAction = () => {
  const { activeUser } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeUser) return null;

  const activePunch = getActivePunch(activeUser.id);

  const handlePunchToggle = () => {
    if (activePunch) {
      const record = checkOutUser(activeUser.id, null, 'Quick Check Out');
      showToast(`Checked out! Work duration: ${record.workHours}`, 'info');
    } else {
      const newPunch = checkInUser(activeUser.id, null, 'Quick Check In');
      showToast(`Checked in at ${newPunch.displayTime}!`, 'success');
    }
    setIsOpen(false);
  };

  return (
    <div className="fab-container">
      {isOpen && (
        <div className="fab-menu">
          <div className="fab-item" onClick={handlePunchToggle}>
            {activePunch ? <Square size={16} color="#F43F5E" /> : <Play size={16} color="#10B981" />}
            {activePunch ? 'Quick Check Out' : 'Quick Check In'}
          </div>

          <div className="fab-item" onClick={() => { navigate('/leave'); setIsOpen(false); }}>
            <CalendarDays size={16} color="#F59E0B" />
            Apply For Leave
          </div>

          <div className="fab-item" onClick={() => { navigate('/payroll'); setIsOpen(false); }}>
            <DollarSign size={16} color="#3B82F6" />
            View Salary Payslip
          </div>
        </div>
      )}

      <button className="fab-button" onClick={() => setIsOpen(!isOpen)} title="Quick Actions Toolbar">
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
};
