import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useNotifications } from '../../context/NotificationContext';
import { Save, DollarSign } from 'lucide-react';

export const AdminPayrollEditor = ({ isOpen, onClose, user, payroll, onSave }) => {
  const { showToast } = useNotifications();

  const [formData, setFormData] = useState({
    basicSalary: payroll?.basicSalary || 5000,
    hra: payroll?.hra || 2000,
    specialAllowance: payroll?.specialAllowance || 1000,
    pfDeduction: payroll?.pfDeduction || 600,
    taxDeduction: payroll?.taxDeduction || 400,
    payPeriod: payroll?.payPeriod || 'August 2026',
    paymentStatus: payroll?.paymentStatus || 'PAID'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, {
      ...formData,
      basicSalary: basic,
      hra: hra,
      specialAllowance: allowance,
      pfDeduction: pf,
      taxDeduction: tax,
      grossSalary: gross,
      netSalary: net
    });
    showToast(`Salary structure updated for ${user.name}!`, 'success');
    onClose();
  };

  const basic = Number(formData.basicSalary) || 0;
  const hra = Number(formData.hra) || 0;
  const allowance = Number(formData.specialAllowance) || 0;
  const pf = Number(formData.pfDeduction) || 0;
  const tax = Number(formData.taxDeduction) || 0;

  const gross = basic + hra + allowance;
  const net = gross - (pf + tax);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Salary Structure: ${user?.name}`}>
      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Basic Salary (₹)</label>
            <input
              type="number"
              required
              className="form-input"
              value={formData.basicSalary}
              onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">House Rent Allowance (HRA) (₹)</label>
            <input
              type="number"
              required
              className="form-input"
              value={formData.hra}
              onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Special Allowance (₹)</label>
            <input
              type="number"
              required
              className="form-input"
              value={formData.specialAllowance}
              onChange={(e) => setFormData({ ...formData, specialAllowance: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pay Period</label>
            <input
              type="text"
              className="form-input"
              value={formData.payPeriod}
              onChange={(e) => setFormData({ ...formData, payPeriod: e.target.value })}
            />
          </div>
        </div>

        <div className="grid-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label">PF Deduction (₹)</label>
            <input
              type="number"
              required
              className="form-input"
              value={formData.pfDeduction}
              onChange={(e) => setFormData({ ...formData, pfDeduction: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Income Tax Deduction (₹)</label>
            <input
              type="number"
              required
              className="form-input"
              value={formData.taxDeduction}
              onChange={(e) => setFormData({ ...formData, taxDeduction: e.target.value })}
            />
          </div>
        </div>

        {/* Live Calculation Summary */}
        <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            <span>Gross Earnings:</span>
            <strong>₹{gross}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <span>Total Deductions:</span>
            <strong style={{ color: 'var(--danger)' }}>-₹{pf + tax}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>
            <span>Calculated Net Salary:</span>
            <span>₹{net} / month</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> Save Salary Structure
          </button>
        </div>
      </form>
    </Modal>
  );
};
