/**
 * The API surface. Every route below has a 1:1 counterpart in the FastAPI
 * application under /backend — same path, same method, same authorization
 * rule, same validation, same status codes. Swapping the transport in
 * services/apiClient.ts from this in-browser handler to axios + a live
 * FastAPI host requires no changes anywhere else in the app.
 */
import { ApiError, authenticate } from './core';
import type { Route } from './core';
import { authRoutes } from './routes.auth';
import { employeeRoutes } from './routes.employees';
import { attendanceRoutes } from './routes.attendance';
import { leaveRoutes } from './routes.leaves';
import { payrollRoutes } from './routes.payroll';
import { insightRoutes } from './routes.insights';
import { ensureSeeded } from '../seed';

const ROUTES: Route[] = [
...authRoutes,
...employeeRoutes,
...attendanceRoutes,
...leaveRoutes,
...payrollRoutes,
...insightRoutes];


export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  token?: string | null;
}

export async function handleRequest<T>({
  method,
  path,
  body = {},
  token = null
}: ApiRequest): Promise<T> {
  await ensureSeeded();

  const clean = path.split('?')[0];
  for (const candidate of ROUTES) {
    if (candidate.method !== method) continue;
    const match = candidate.pattern.exec(clean);
    if (!match) continue;
    const params = match.slice(1).map(decodeURIComponent);
    if (candidate.public) {
      return (await candidate.handler(null as never, params, body)) as T;
    }
    const ctx = await authenticate(token);
    return (await candidate.handler(ctx, params, body)) as T;
  }
  throw new ApiError(404, `No route matches ${method} ${clean}.`);
}

export { ApiError };