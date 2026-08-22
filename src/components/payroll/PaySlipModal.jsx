import React from 'react';
import { Modal } from '../common/Modal';
import { Printer, Download, DollarSign, Building } from 'lucide-react';

export const PaySlipModal = ({ isOpen, onClose, user, payroll }) => {
  if (!isOpen || !user || !payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Salary Pay Slip - ${payroll.payPeriod}`}>
      <div id="printable-payslip" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--primary)', pb: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.4rem' }}>Dayflow HRMS</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Every workday, perfectly aligned.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>PAY SLIP</h3>
            <span className="badge badge-paid">{payroll.payPeriod}</span>
          </div>
        </div>

        {/* Employee Info Grid */}
        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee Name</div>
            <strong style={{ fontSize: '0.95rem' }}>{user.name}</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Designation & Department</div>
            <div style={{ fontSize: '0.85rem' }}>{user.designation} ({user.department})</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee ID</div>
            <strong style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>{user.employeeId}</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Payment Status</div>
            <span className="badge badge-approved" style={{ marginTop: '2px' }}>{payroll.paymentStatus}</span>
          </div>
        </div>

        {/* Salary Component Breakdown Table */}
        <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
          <table className="table" style={{ border: '1px solid var(--border-color)' }}>
            <thead>
              <tr>
                <th style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>Earnings</th>
                <th style={{ background: 'var(--primary-light)', color: 'var(--primary)', textAlign: 'right' }}>Amount ($)</th>
                <th style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>Deductions</th>
                <th style={{ background: 'var(--danger-light)', color: 'var(--danger)', textAlign: 'right' }}>Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td style={{ textAlign: 'right' }}>${payroll.basicSalary}</td>
                <td>Provident Fund (PF)</td>
                <td style={{ textAlign: 'right' }}>${payroll.pfDeduction}</td>
              </tr>
              <tr>
                <td>House Rent Allowance (HRA)</td>
                <td style={{ textAlign: 'right' }}>${payroll.hra}</td>
                <td>Income Tax / TDS</td>
                <td style={{ textAlign: 'right' }}>${payroll.taxDeduction}</td>
              </tr>
              <tr>
                <td>Special / Performance Allowance</td>
                <td style={{ textAlign: 'right' }}>${payroll.specialAllowance}</td>
                <td>Other Deductions</td>
                <td style={{ textAlign: 'right' }}>$0</td>
              </tr>
              <tr style={{ fontWeight: 800, background: 'var(--bg-main)' }}>
                <td>Gross Earnings</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)' }}>${payroll.grossSalary}</td>
                <td>Total Deductions</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>${payroll.pfDeduction + payroll.taxDeduction}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Salary Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--success-light)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 700 }}>NET SALARY PAID</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>${payroll.netSalary}</div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Direct Bank Transfer</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
        <button onClick={handlePrint} className="btn btn-outline">
          <Printer size={16} /> Print / Save PDF
        </button>
        <button onClick={onClose} className="btn btn-primary">
          Close
        </button>
      </div>
    </Modal>
  );
};
