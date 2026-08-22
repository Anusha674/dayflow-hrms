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
          <label className="form-label">Choose Profile Avatar</label>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Tigger',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster'
            ].map((url) => {
              const isSelected = formData.avatar === url;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: url })}
                  style={{
                    background: 'none',
                    border: isSelected ? '2.5px solid #10B981' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    padding: '2px',
                    cursor: 'pointer',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                  }}
                >
                  <img
                    src={url}
                    alt="Avatar option"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </button>
              );
            })}
          </div>
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
