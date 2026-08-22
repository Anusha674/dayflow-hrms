/**
 * Password hashing + JWT signing/verification.
 *
 * Mirrors the backend contract: passwords are never stored or transported in
 * plain text (PBKDF2-SHA256, 150k iterations, per-user random salt — the
 * browser-side stand-in for bcrypt/Argon2), and every authenticated request
 * carries an HS256 JWT that the API layer verifies with a server-held secret.
 */

const encoder = new TextEncoder();
const ITERATIONS = 150_000;

/** Server-side secret. Lives only inside the API layer, never in UI code. */
const JWT_SECRET = 'dayflow-server-secret-do-not-ship-in-client-bundles';
const TOKEN_TTL_SECONDS = 60 * 60 * 12;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64UrlEncode(input: string | Uint8Array): string {
  const raw = typeof input === 'string' ? toBase64(encoder.encode(input)) : toBase64(input);
  return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded + '='.repeat((4 - padded.length % 4) % 4));
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).
  map((b) => b.toString(16).padStart(2, '0')).
  join('');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomHex(16);
  const digest = await pbkdf2(password, salt);
  return `pbkdf2-sha256$${ITERATIONS}$${salt}$${digest}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const digest = await pbkdf2(password, parts[2]);
  // constant-time-ish comparison
  if (digest.length !== parts[3].length) return false;
  let diff = 0;
  for (let i = 0; i < digest.length; i += 1) diff |= digest.charCodeAt(i) ^ parts[3].charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
  'deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return Array.from(new Uint8Array(bits)).
  map((b) => b.toString(16).padStart(2, '0')).
  join('');
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

export interface JwtClaims {
  sub: number;
  email: string;
  role: 'EMPLOYEE' | 'HR';
  employee_id: string;
  iat: number;
  exp: number;
}

export async function createToken(
claims: Omit<JwtClaims, 'iat' | 'exp'>)
: Promise<{token: string;expires_in: number;}> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: JwtClaims = { ...claims, iat: issuedAt, exp: issuedAt + TOKEN_TTL_SECONDS };
  const head = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(`${head}.${body}`);
  return { token: `${head}.${body}.${signature}`, expires_in: TOKEN_TTL_SECONDS };
}

export async function verifyToken(token: string | null | undefined): Promise<JwtClaims | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = await sign(`${parts[0]}.${parts[1]}`);
  if (expected !== parts[2]) return null;
  try {
    const claims = JSON.parse(base64UrlDecode(parts[1])) as JwtClaims;
    if (claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

export function verificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}