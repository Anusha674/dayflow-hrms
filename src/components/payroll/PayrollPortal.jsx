import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPayrollList, getUserPayroll, updateUserPayroll, getUsers } from '../../db/storage';
import { PaySlipModal } from './PaySlipModal';
import { AdminPayrollEditor } from './AdminPayrollEditor';
import { DollarSign, FileText, Edit3, Shield, CheckCircle } from 'lucide-react';

export const PayrollPortal = () => {
  const { activeUser, currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [payrolls, setPayrolls] = useState(getPayrollList());
  const allUsersList = getUsers();

  const [selectedUserForPayslip, setSelectedUserForPayslip] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  const refreshPayroll = () => {
    setPayrolls(getPayrollList());
  };

  const userPayroll = getUserPayroll(activeUser.id);

  const handleSavePayroll = (userId, formData) => {
    updateUserPayroll(userId, formData);
    refreshPayroll();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Payroll & Compensation Portal</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>View monthly salary breakdown, generate pay slips, and adjust compensation structures</p>
          </div>

          <button onClick={() => setSelectedUserForPayslip({ user: activeUser, payroll: userPayroll })} className="btn btn-primary">
            <FileText size={16} /> View My Pay Slip
          </button>
        </div>
      </div>

      {/* Employee Personal Payroll Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="var(--primary)" />
            <span className="card-title">My Salary Structure ({userPayroll.payPeriod})</span>
          </div>
          <span className="badge badge-paid">{userPayroll.paymentStatus}</span>
        </div>

        <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="liquid-glass" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #3B82F6', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: '2.2rem', display: 'flex', alignItems: 'center' }}>
              BASIC SALARY
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.5rem', color: '#ffffff' }}>₹{userPayroll.basicSalary}</div>
          </div>

          <div className="liquid-glass" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #8B5CF6', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: '2.2rem', display: 'flex', alignItems: 'center' }}>
              ALLOWANCES (HRA + SPECIAL)
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.5rem', color: '#ffffff' }}>₹{userPayroll.hra + userPayroll.specialAllowance}</div>
          </div>

          <div className="liquid-glass" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #F43F5E', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: '2.2rem', display: 'flex', alignItems: 'center' }}>
              DEDUCTIONS (PF + TAX)
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.5rem', color: '#F43F5E' }}>-₹{userPayroll.pfDeduction + userPayroll.taxDeduction}</div>
          </div>

          <div className="liquid-glass" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #10B981', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: '2.2rem', display: 'flex', alignItems: 'center' }}>
              NET TAKE-HOME SALARY
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.5rem', color: '#10B981' }}>₹{userPayroll.netSalary}</div>
          </div>
        </div>
      </div>

      {/* Admin Master Payroll Controls */}
      {isAdmin && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Admin Payroll Control & Master Table</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage employee salary structures and ensure payroll accuracy</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Basic Pay</th>
                  <th>HRA</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Pay Period</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsersList.map((emp) => {
                  const pay = payrolls.find((p) => p.userId === emp.id) || getUserPayroll(emp.id);
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.designation}</div>
                      </td>
                      <td>₹{pay.basicSalary}</td>
                      <td>₹{pay.hra}</td>
                      <td>₹{pay.specialAllowance}</td>
                      <td style={{ color: 'var(--danger)' }}>-₹{pay.pfDeduction + pay.taxDeduction}</td>
                      <td>
                        <strong style={{ color: 'var(--success)', fontSize: '0.95rem' }}>₹{pay.netSalary}</strong>
                      </td>
                      <td>
                        <span className="badge badge-info">{pay.payPeriod}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setSelectedUserForPayslip({ user: emp, payroll: pay })}
                            className="btn btn-outline btn-sm"
                            title="View / Print Payslip"
                          >
                            <FileText size={14} /> Payslip
                          </button>

                          <button
                            onClick={() => setSelectedUserForEdit({ user: emp, payroll: pay })}
                            className="btn btn-accent btn-sm"
                            title="Edit Salary Structure"
                          >
                            <Edit3 size={14} /> Edit Structure
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Slip Viewing Modal */}
      {selectedUserForPayslip && (
        <PaySlipModal
          isOpen={Boolean(selectedUserForPayslip)}
          onClose={() => setSelectedUserForPayslip(null)}
          user={selectedUserForPayslip.user}
          payroll={selectedUserForPayslip.payroll}
        />
      )}

      {/* Admin Salary Editor Modal */}
      {selectedUserForEdit && (
        <AdminPayrollEditor
          isOpen={Boolean(selectedUserForEdit)}
          onClose={() => setSelectedUserForEdit(null)}
          user={selectedUserForEdit.user}
          payroll={selectedUserForEdit.payroll}
          onSave={handleSavePayroll}
        />
      )}
    </div>
  );
};
