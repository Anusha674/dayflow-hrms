import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LogIn, Lock, Mail, UserCheck, KeyRound } from 'lucide-react';

export const SignIn = ({ onSwitchToSignUp }) => {
  const { login } = useAuth();
  const { showToast } = useNotifications();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      login(email, password);
      showToast('Successfully signed in!', 'success');
    } catch (err) {
      setError(err.message);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'transparent' }}>
      <div className="card liquid-glass animate-fade-rise" style={{ width: '100%', maxWidth: '460px', padding: '2.75rem 2.25rem', background: 'hsl(201, 100%, 13%)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 400, letterSpacing: '-1px', color: '#ffffff' }}>
            Dayflow<sup style={{ fontSize: '1rem', verticalAlign: 'super' }}>®</sup>
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Where every workday rises through perfect alignment.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#F43F5E', border: '1px solid rgba(244, 63, 94, 0.4)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@dayflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>
            <LogIn size={18} /> Sign In
          </button>
        </form>

        {/* Quick Demo Login Chips */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Demo Login Chips
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => fillDemoAccount('admin@dayflow.com', 'Password@123')}
              className="btn btn-liquid btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <UserCheck size={14} /> Admin: admin@dayflow.com
            </button>

            <button
              onClick={() => fillDemoAccount('sarah@dayflow.com', 'Password@123')}
              className="btn btn-liquid btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <KeyRound size={14} /> Employee: sarah@dayflow.com
            </button>

            <button
              onClick={() => fillDemoAccount('alex@dayflow.com', 'Password@123')}
              className="btn btn-liquid btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <KeyRound size={14} /> Employee: alex@dayflow.com
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <button onClick={onSwitchToSignUp} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            Register New Account
          </button>
        </div>
      </div>
    </div>
  );
};
