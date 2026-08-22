import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { EmailVerificationModal } from './EmailVerificationModal';
import { UserPlus, Mail, Lock, User, ShieldCheck } from 'lucide-react';

export const SignUp = ({ onSwitchToSignIn }) => {
  const { register } = useAuth();
  const { showToast } = useNotifications();

  const [formData, setFormData] = useState({
    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: 'Software Engineer',
    phone: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!/\d/.test(pass)) return 'Password must contain at least one number.';
    return null;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passErr = validatePassword(formData.password);
    if (passErr) {
      setError(passErr);
      return;
    }

    setShowVerificationModal(true);
  };

  const handleCompleteRegistration = () => {
    try {
      register({
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        designation: formData.designation,
        phone: formData.phone || '+1 (555) 100-2000',
        address: formData.address || 'Standard Corporate Address'
      });
      setShowVerificationModal(false);
      showToast('Registration successful! Welcome to Dayflow HRMS.', 'success');
    } catch (err) {
      setShowVerificationModal(false);
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'transparent' }}>
      <div className="card liquid-glass animate-fade-rise" style={{ width: '100%', maxWidth: '540px', padding: '2.75rem 2.25rem', background: 'hsl(201, 100%, 13%)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 400, letterSpacing: '-1px', color: 'hsl(var(--foreground))' }}>
            Dayflow<sup style={{ fontSize: '1rem', verticalAlign: 'super' }}>®</sup>
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Register new employee or HR officer credentials
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#F43F5E', border: '1px solid rgba(244, 63, 94, 0.4)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin / HR Officer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Sarah Connor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="name@dayflow.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Product Management">Product Management</option>
                <option value="Design & UX">Design & UX</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance & Accounting">Finance & Accounting</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Software Engineer"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="At least 8 chars"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>
            <UserPlus size={18} /> Register & Verify Email
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <button onClick={onSwitchToSignIn} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            Sign In Here
          </button>
        </div>

        <EmailVerificationModal
          isOpen={showVerificationModal}
          email={formData.email}
          onVerify={handleCompleteRegistration}
          onClose={() => setShowVerificationModal(false)}
        />
      </div>
    </div>
  );
};
