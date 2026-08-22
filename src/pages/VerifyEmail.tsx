import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircleIcon, MailCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from './AuthLayout';
import { Spinner } from '../components/Loading';
import { authService } from '../services/resources';
import { friendlyError } from '../services/apiClient';

export function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await authService.verifyEmail(email, code.trim());
      toast.success(result.message);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      const result = await authService.resend(email);
      setCode(result.verification_code);
      toast.success('A fresh verification code has been issued.');
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your work inbox to activate your account.">
      
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error ?
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div> :
        null}

        {params.get('code') ?
        <div className="flex items-start gap-2 rounded-lg bg-brandSoft px-3 py-2.5 text-sm text-brand">
            <MailCheckIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              In production this code is emailed via SMTP. For the demo it has been pre-filled below.
            </span>
          </div> :
        null}

        <div>
          <label className="label" htmlFor="verify-email">
            Work email
          </label>
          <input
            id="verify-email"
            type="email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required />
          
        </div>

        <div>
          <label className="label" htmlFor="verify-code">
            Verification code
          </label>
          <input
            id="verify-code"
            inputMode="numeric"
            maxLength={6}
            className="input tnum tracking-[0.4em]"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            required />
          
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? 'Verifying…' : 'Verify email'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={resend} className="font-semibold text-brand hover:underline">
            Resend code
          </button>
          <Link to="/login" className="text-muted hover:text-ink">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>);

}