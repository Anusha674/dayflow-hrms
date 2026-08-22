import { STORES, addTo, getAllFrom, getOne, putIn, tx } from '../db';
import { createToken, hashPassword, verificationCode, verifyPassword } from '../security';
import type { Employee, Role, User } from '../../types';
import {
  ApiError,
  findUserByEmail,
  now,
  notify,
  publicUser,
  route,
  str,
  writeAudit } from
'./core';
import {
  validateEmail,
  validateEmployeeId,
  validatePassword,
  validateRequired } from
'../../utils/validation';

async function register(_ctx: unknown, _p: string[], body: Record<string, unknown>) {
  const email = str(body, 'email').toLowerCase();
  let employeeId = str(body, 'employee_id').toUpperCase();
  const password = str(body, 'password');
  const name = str(body, 'name');
  const role = (str(body, 'role').toUpperCase() || 'EMPLOYEE') as Role;

  const fields: Record<string, string> = {};
  const emailError = validateEmail(email);
  if (emailError) fields.email = emailError;
  const passwordError = validatePassword(password);
  if (passwordError) fields.password = passwordError;
  const nameError = validateRequired(name, 'Full name');
  if (nameError) fields.name = nameError;
  if (role !== 'EMPLOYEE' && role !== 'HR') fields.role = 'Choose a valid role.';
  if (Object.keys(fields).length)
    throw new ApiError(422, 'Please correct the highlighted fields.', fields);

  if (!employeeId) {
    employeeId = 'EMP' + Math.floor(100 + Math.random() * 900);
  }

  const password_hash = await hashPassword(password);
  const code = verificationCode();

  return tx(
    [STORES.users, STORES.employees, STORES.notifications, STORES.audit_logs],
    'readwrite',
    async (t) => {
      if (await findUserByEmail(t, email))
        throw new ApiError(409, 'An account with this email already exists.', {
          email: 'Email already registered. Please sign in.'
        });

      let finalEmployeeId = employeeId;
      if (await getOne<Employee>(t, STORES.employees, finalEmployeeId)) {
        finalEmployeeId = 'EMP' + Math.floor(100 + Math.random() * 900);
      }

      const timestamp = now();
      const userId = (await addTo(t, STORES.users, {
        employee_id: finalEmployeeId,
        email,
        password_hash,
        role,
        is_verified: true,
        verification_code: code,
        created_at: timestamp,
        updated_at: timestamp
      } as Omit<User, 'user_id'>)) as number;

      await addTo(t, STORES.employees, {
        employee_id: employeeId,
        user_id: userId,
        name,
        phone: str(body, 'phone'),
        address: str(body, 'address'),
        department: str(body, 'department') || 'Unassigned',
        designation: str(body, 'designation') || 'New Joiner',
        joining_date: str(body, 'joining_date') || timestamp.slice(0, 10),
        profile_picture: null,
        created_at: timestamp,
        updated_at: timestamp
      } as Employee);

      await notify(t, {
        user_id: userId,
        title: 'Welcome to Dayflow',
        message: `Your account was created. Verify your email to activate ${employeeId}.`
      });
      await writeAudit(t, {
        user_id: userId,
        actor: email,
        action: 'USER_REGISTERED',
        entity: 'USERS',
        entity_id: employeeId
      });

      return {
        message: 'Account created. Check your inbox for the 6-digit verification code.',
        email,
        // Delivered by email in production; surfaced here so the flow is demoable.
        verification_code: code
      };
    }
  );
}

async function login(_ctx: unknown, _p: string[], body: Record<string, unknown>) {
  const email = str(body, 'email').toLowerCase();
  const password = str(body, 'password');
  if (!email || !password) throw new ApiError(422, 'Email and password are required.');

  const user = await tx([STORES.users], 'readonly', (t) => findUserByEmail(t, email));
  // Identical message for unknown email and wrong password — no account enumeration.
  if (!user || !(await verifyPassword(password, user.password_hash)))
  throw new ApiError(401, 'Incorrect email or password.');
  if (!user.is_verified)
  throw new ApiError(403, 'Your email is not verified yet. Enter your verification code.', {
    unverified: user.email
  });

  const { token, expires_in } = await createToken({
    sub: user.user_id,
    email: user.email,
    role: user.role,
    employee_id: user.employee_id
  });

  const employee = await tx(
    [STORES.employees, STORES.audit_logs],
    'readwrite',
    async (t) => {
      await writeAudit(t, {
        user_id: user.user_id,
        actor: user.email,
        action: 'LOGIN',
        entity: 'USERS',
        entity_id: user.employee_id
      });
      return getOne<Employee>(t, STORES.employees, user.employee_id);
    }
  );

  return { access_token: token, token_type: 'bearer', expires_in, user: publicUser(user), employee };
}

async function verifyEmail(_ctx: unknown, _p: string[], body: Record<string, unknown>) {
  const email = str(body, 'email').toLowerCase();
  const code = str(body, 'code');
  return tx([STORES.users, STORES.notifications, STORES.audit_logs], 'readwrite', async (t) => {
    const user = await findUserByEmail(t, email);
    if (!user) throw new ApiError(404, 'No account found for that email.');
    if (user.is_verified) return { message: 'This account is already verified.' };
    if (user.verification_code !== code)
    throw new ApiError(400, 'That verification code is incorrect.', { code: 'Invalid code.' });
    await putIn(t, STORES.users, { ...user, is_verified: true, updated_at: now() });
    await notify(t, {
      user_id: user.user_id,
      title: 'Email verified',
      message: 'Your email address has been verified. Welcome aboard.'
    });
    await writeAudit(t, {
      user_id: user.user_id,
      actor: user.email,
      action: 'EMAIL_VERIFIED',
      entity: 'USERS',
      entity_id: user.employee_id
    });
    return { message: 'Email verified. You can sign in now.' };
  });
}

async function resendVerification(_ctx: unknown, _p: string[], body: Record<string, unknown>) {
  const email = str(body, 'email').toLowerCase();
  return tx([STORES.users], 'readwrite', async (t) => {
    const user = await findUserByEmail(t, email);
    if (!user) throw new ApiError(404, 'No account found for that email.');
    if (user.is_verified) return { message: 'This account is already verified.' };
    const code = verificationCode();
    await putIn(t, STORES.users, { ...user, verification_code: code, updated_at: now() });
    return { message: 'A new verification code has been sent.', verification_code: code };
  });
}

async function me(ctx: {user: User;employee: Employee | null;}) {
  return { user: publicUser(ctx.user), employee: ctx.employee };
}

async function listAudit(ctx: {user: User;role: Role;}, _p: string[], body: Record<string, unknown>) {
  if (ctx.role !== 'HR') throw new ApiError(403, 'Forbidden — audit logs are restricted to HR.');
  const logs = await tx([STORES.audit_logs], 'readonly', (t) => getAllFrom(t, STORES.audit_logs));
  const limit = Number(body.limit ?? 200);
  return (logs as {timestamp: string;}[]).
  slice().
  sort((a, b) => b.timestamp.localeCompare(a.timestamp)).
  slice(0, limit);
}

export const authRoutes = [
route('POST', '/api/auth/register', register as never, true),
route('POST', '/api/auth/login', login as never, true),
route('POST', '/api/auth/verify-email', verifyEmail as never, true),
route('POST', '/api/auth/resend-verification', resendVerification as never, true),
route('GET', '/api/auth/me', me as never),
route('GET', '/api/audit-logs', listAudit as never)];