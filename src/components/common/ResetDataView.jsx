import React from 'react';
import { resetStorageToDefaults } from '../../db/storage';
import { useNotifications } from '../../context/NotificationContext';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export const ResetDataView = () => {
  const { showToast } = useNotifications();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data back to original seed defaults? All custom changes will be reset.')) {
      resetStorageToDefaults();
      showToast('Database reset to seed defaults! Reloading...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', padding: '1.5rem' }}>
        <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', width: '56px', height: '56px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <AlertTriangle size={28} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reset Demo Database</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          This action will restore all LocalStorage records (Users, Attendance logs, Leave applications, Documents, Payroll) back to factory seed defaults.
        </p>

        <button onClick={handleReset} className="btn btn-danger" style={{ padding: '0.75rem 1.5rem' }}>
          <RotateCcw size={18} /> Restore Factory Seed Data
        </button>
      </div>
    </div>
  );
};
