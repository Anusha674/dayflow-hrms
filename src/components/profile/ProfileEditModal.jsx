import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useNotifications } from '../../context/NotificationContext';
import { Save, User, Shield } from 'lucide-react';

export const ProfileEditModal = ({ isOpen, onClose, user, isAdminView, onSave }) => {
  const { showToast } = useNotifications();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    emergencyContact: user?.emergencyContact || '',
    dob: user?.dob || '',
    avatar: user?.avatar || '',
    department: user?.department || '',
    designation: user?.designation || '',
    employeeId: user?.employeeId || '',
    role: user?.role || 'EMPLOYEE'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    showToast('Profile updated successfully!', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Profile: ${user?.name}`}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem', background: 'var(--primary-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
          <strong>Editing Mode:</strong> {isAdminView ? 'Admin Mode (Full Field Access)' : 'Employee Mode (Limited Fields: Phone, Address, Avatar)'}
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="text"
            className="form-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Residential Address</label>
          <textarea
            className="form-textarea"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Profile Avatar Image URL</label>
          <input
            type="text"
            className="form-input"
            value={formData.avatar}
            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
          />
        </div>

        {/* Admin Restricted Fields */}
        {isAdminView && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.85rem' }}>
              Admin Privilege Control
            </h4>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
