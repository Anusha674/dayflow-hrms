import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Lock, Mail } from 'lucide-react';

export const SignIn = ({ onSwitchToSignUp }) => {
  const { login } = useAuth();
  const { showToast } = useNotifications();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'transparent' }}>
      <div className="card auth-card animate-fade-rise" style={{ width: '100%', maxWidth: '460px', padding: '2.75rem 2.25rem' }}>
        
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
            Enter your credentials to access your workspace
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#F43F5E', border: '1px solid rgba(244, 63, 94, 0.4)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.45rem', display: 'block' }}>
              Work Email, Name, or Employee ID
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
              <input
                type="text"
                required
                name="email"
                autoComplete="off"
                className="form-input"
                placeholder="Email, name, or EMP-XXXX"
                value={email}
                style={{ paddingLeft: '2.75rem' }}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', display: 'block' }}>
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
              <input
                type="password"
                required
                name="password"
                autoComplete="new-password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                style={{ paddingLeft: '2.75rem' }}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
          >
            Sign In
          </button>
        </form>

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
