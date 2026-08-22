import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';

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

    try {
      register({
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        designation: formData.designation,
        phone: formData.phone || '',
        address: formData.address || ''
      });
      showToast('Registration successful! Welcome to Dayflow HRMS.', 'success');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'transparent' }}>
      <div className="card auth-card animate-fade-rise" style={{ width: '100%', maxWidth: '540px', padding: '2.75rem 2.25rem' }}>
        
        {/* Brand Logo & Subtext */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: '2.6rem', 
            fontWeight: 800, 
            letterSpacing: '-1.5px', 
            background: 'linear-gradient(135deg, #ffffff 30%, #3B82F6 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(59, 130, 246, 0.2)'
          }}>
            Dayflow
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', marginTop: '0.15rem' }}>
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
              name="email"
              autoComplete="username"
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
                name="password"
                autoComplete="new-password"
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
                name="confirmPassword"
                autoComplete="new-password"
                className="form-input"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-liquid" 
            style={{ 
              width: '100%', 
              marginTop: '1rem', 
              padding: '0.85rem',
              background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            Register Account
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <button onClick={onSwitchToSignIn} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};
