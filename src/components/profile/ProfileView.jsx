import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserPayroll, updateUserProfile } from '../../db/storage';
import { DocumentVault } from './DocumentVault';
import { ProfileEditModal } from './ProfileEditModal';
import { User, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign, Edit3, Shield, FileText } from 'lucide-react';

export const ProfileView = () => {
  const { currentUser, activeUser, updateProfile, refreshUsers } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isAdminView = currentUser?.role === 'ADMIN';
  const payroll = getUserPayroll(activeUser.id);

  const handleSaveProfile = (updatedFields) => {
    if (isAdminView) {
      updateUserProfile(activeUser.id, updatedFields);
      refreshUsers();
    } else {
      updateProfile(updatedFields);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Profile Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <img src={activeUser.avatar} alt={activeUser.name} className="avatar avatar-lg" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeUser.name}</h2>
                <span className={`badge ${activeUser.role === 'ADMIN' ? 'badge-admin' : 'badge-info'}`}>{activeUser.role}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {activeUser.designation}
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.65rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} /> {activeUser.email}
                </span>
                {activeUser.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={14} /> {activeUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button onClick={() => setIsEditModalOpen(true)} className="btn btn-primary">
            <Edit3 size={16} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid-2">
        {/* Personal Details Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--primary)" />
              <span className="card-title">Personal Details</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Full Name</span>
              <strong style={{ fontSize: '0.9rem' }}>{activeUser.name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email Address</span>
              <strong style={{ fontSize: '0.9rem' }}>{activeUser.email}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Phone Number</span>
              <strong style={{ fontSize: '0.9rem' }}>{activeUser.phone || 'Not set'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Date of Birth</span>
              <strong style={{ fontSize: '0.9rem' }}>{activeUser.dob || 'Not set'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Residential Address</span>
              <strong style={{ fontSize: '0.9rem', textAlign: 'right', maxWidth: '240px' }}>{activeUser.address || 'Not set'}</strong>
            </div>
          </div>
        </div>

        {/* Job Details & Salary Overview Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} color="var(--primary)" />
              <span className="card-title">Job & Salary Details</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Employee ID</span>
              <strong style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{activeUser.employeeId}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Department</span>
              <strong style={{ fontSize: '0.9rem' }}>{activeUser.department}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Designation</span>
              <strong style={{ fontSize: '0.9rem' }}>{activeUser.designation}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Date of Joining</span>
              <strong style={{ fontSize: '0.9rem' }}>{activeUser.dateOfJoining || '2022-01-10'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Net Monthly Salary</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--success)' }}>₹{payroll.netSalary} / mo</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Document Vault Section */}
      <DocumentVault userId={activeUser.id} isEditable={currentUser.id === activeUser.id || isAdminView} />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={activeUser}
        isAdminView={isAdminView}
        onSave={handleSaveProfile}
      />
    </div>
  );
};
