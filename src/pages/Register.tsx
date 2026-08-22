import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircleIcon, CheckIcon } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Spinner } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/resources';
import { fieldErrors, friendlyError } from '../services/apiClient';
import { passwordIssues, validateEmail, validateEmployeeId, validateRequired } from '../utils/validation';

const DEPARTMENTS = ['Engineering', 'Design', 'Finance', 'Sales', 'Support', 'People Operations'];

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    employee_id: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const issues = useMemo(() => passwordIssues(form.password), [form.password]);
  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const { signIn } = useAuth();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const nameError = validateRequired(form.name, 'Full name');
    if (nameError) next.name = nameError;
    if (form.employee_id) {
      const idError = validateEmployeeId(form.employee_id);
      if (idError) next.employee_id = idError;
    }
    const emailError = validateEmail(form.email);
    if (emailError) next.email = emailError;
    if (issues.length) next.password = `Password needs: ${issues.join(', ').toLowerCase()}.`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setBanner(null);
    try {
      await authService.register({
        ...form,
        employee_id: form.employee_id ? form.employee_id.toUpperCase() : ''
      });
      const user = await signIn(form.email, form.password);
      navigate(user.role === 'HR' ? '/admin/dashboard' : '/app/dashboard', { replace: true });
    } catch (error) {
      setErrors(fieldErrors(error));
      setBanner(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register an employee or HR account. Email verification is required before first sign-in.">
      
      <form onSubmit={submit} noValidate className="space-y-4">
        {banner ?
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{banner}</span>
          </div> :
        null}

        <Field label="Full name" id="name" error={errors.name}>
          <input
            id="name"
            className="input"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            autoComplete="name"
            required />
          
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee ID" id="employee_id" error={errors.employee_id} hint="e.g. EMP012">
            <input
              id="employee_id"
              className="input uppercase"
              value={form.employee_id}
              onChange={(e) => set('employee_id', e.target.value.toUpperCase())}
              required />
            
          </Field>
          <Field label="Role" id="role">
            <select
              id="role"
              className="input"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}>
              
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR Officer</option>
            </select>
          </Field>
        </div>

        <Field label="Work email" id="reg-email" error={errors.email}>
          <input
            id="reg-email"
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
            required />
          
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department" id="department">
            <select
              id="department"
              className="input"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}>
              
              {DEPARTMENTS.map((department) =>
              <option key={department}>{department}</option>
              )}
            </select>
          </Field>
          <Field label="Designation" id="designation">
            <input
              id="designation"
              className="input"
              value={form.designation}
              onChange={(e) => set('designation', e.target.value)}
              placeholder="Software Engineer" />
            
          </Field>
        </div>

        <Field label="Password" id="reg-password" error={errors.password}>
          <input
            id="reg-password"
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="new-password"
            required />
          
          {form.password ?
          <ul className="mt-2 grid grid-cols-2 gap-1">
              {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One symbol'].map(
              (rule) => {
                const met = !issues.includes(rule);
                return (
                  <li
                    key={rule}
                    className={`flex items-center gap-1.5 text-[11px] ${
                    met ? 'text-emerald-600' : 'text-muted'}`
                    }>
                    
                      <CheckIcon className={`h-3 w-3 ${met ? 'opacity-100' : 'opacity-30'}`} />
                      {rule}
                    </li>);

              }
            )}
            </ul> :
          null}
        </Field>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-muted">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>);

}

function Field({
  label,
  id,
  error,
  hint,
  children






}: {label: string;id: string;error?: string;hint?: string;children: React.ReactNode;}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ?
      <p className="mt-1 text-xs text-rose-600">{error}</p> :
      hint ?
      <p className="mt-1 text-xs text-faint">{hint}</p> :
      null}
    </div>);

}