import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircleIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Spinner } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';
import { DEMO_PASSWORD } from '../services/seed';

const DEMO_ACCOUNTS = [
{ label: 'HR Officer', email: 'hr@dayflow.io' },
{ label: 'Employee', email: 'arjun@dayflow.io' }];


export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailError = validateEmail(email);
    setFieldError(emailError);
    if (emailError) return;
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const user = await signIn(email, password);
      navigate(user.role === 'HR' ? '/admin/dashboard' : '/app/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      if (message.toLowerCase().includes('not verified')) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const useDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your work email to access your Dayflow workspace.">
      
      <form onSubmit={submit} noValidate className="space-y-4">
        {error ?
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-2.5 text-sm">
          
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div> :
        null}

        <div>
          <label className="label" htmlFor="email">
            Work Email, Name, or Employee ID
          </label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input pl-9"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? 'email-error' : undefined}
              placeholder="Email, name, or EMP-XXXX"
              required />
          </div>
          
          {fieldError ?
          <p id="email-error" className="mt-1 text-xs text-rose-400">
              {fieldError}
            </p> :
          null}
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              className="input pl-9 pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required />
            
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-muted hover:text-ink">
              
              {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-muted">
          New to Dayflow?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>);

}