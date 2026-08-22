import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MailCheck, CheckCircle } from 'lucide-react';

export const EmailVerificationModal = ({ isOpen, email, onVerify, onClose }) => {
  const [code, setCode] = useState('749210'); // Simulated verification code prefilled for testing
  const [error, setError] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    onVerify();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Verification Required">
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', width: '56px', height: '56px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <MailCheck size={28} />
        </div>

        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Verify Your Email Address</h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          We have sent a verification code to <strong>{email}</strong>. Please enter the 6-digit code below to activate your account.
        </p>

        {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}

        <form onSubmit={handleVerify}>
          <div className="form-group" style={{ maxWidth: '240px', margin: '0 auto 1.5rem' }}>
            <input
              type="text"
              maxLength={6}
              className="form-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px', fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle size={16} /> Verify & Complete Setup
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
