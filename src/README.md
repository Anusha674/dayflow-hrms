# DAYFLOW — Human Resource Management System

A production-shaped HRMS covering onboarding, employee profiles, attendance, leave, payroll,
notifications, analytics, reports and auditability — with offline resilience and role-enforced
security throughout.

---

## 1. What is in this repository

| Path | Contents |
| --- | --- |
| `App.tsx`, `pages/`, `components/`, `context/`, `hooks/`, `utils/` | React + Vite + Tailwind frontend |
| `services/` | API client, resource clients, durable storage layer, offline queue |
| `services/api/` | The API implementation used by the running preview (see §3) |
| `backend/` | FastAPI + SQLAlchemy + MySQL application (`app/`), `schema.sql`, backup script |

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| HR Officer | `hr@dayflow.io` | `Dayflow@2026` |
| Employee | `arjun@dayflow.io` | `Dayflow@2026` |

Ten more employee accounts (`neha@`, `daniel@`, `sara@`, …) share the same password.

---

## 2. Architecture

```
USER → React frontend → Auth/JWT guard → REST API → business logic → MySQL
                     ↘ localStorage / IndexedDB → offline queue → sync manager ↗
```

* **Authentication** — JWT (HS256) issued on login, verified on every protected request.
* **Authorization** — enforced server-side per route. Hiding buttons is never the control.
* **Durability** — multi-table transactions, foreign keys, unique + check constraints,
  append-only audit log, offline outbox, automatic synchronisation, nightly backups.
* **Data quality** — the same rules exist in three places: browser (`utils/validation.ts`),
  API (Pydantic schemas / the request validators), and the database (constraints).

---

## 3. Two runtimes, one API contract

The hosted preview runs entirely in the browser, where no Python process or MySQL server can be
started. So the API layer has **two interchangeable implementations behind one contract**:

1. `backend/` — the real **FastAPI + SQLAlchemy + MySQL** service. Every route, status code,
   validation rule, authorization check and transaction boundary in §6 lives here.
2. `services/api/` — the same routes implemented against **IndexedDB**, which enforces the same
   primary keys, unique indexes (`employee_id+date`, `employee_id+month`, `email`) and
   multi-store transactions. Passwords are PBKDF2-SHA256 (150k iterations, per-user salt) and
   tokens are genuinely signed and verified HS256 JWTs.

`services/apiClient.ts` is the only file that knows which one is in use. Pointing the app at a
live FastAPI host is a one-line change there — nothing else in the app changes.

---

## 4. Running the real stack

### Database

```bash
mysql -u root -p < backend/schema.sql
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET, SMTP_*
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: `http://localhost:8000/docs`.

### Frontend

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:8000` and switch `services/apiClient.ts` to axios.

### Backups

```bash
chmod +x backend/scripts/backup.sh
0 2 * * * /srv/dayflow/backend/scripts/backup.sh   # 14-day retention, verified gzip
```

Secrets live only in `.env`, which is git-ignored.

---

## 5. Database design

`users (1:1) employees (1:N) attendance | leave_requests | payroll | documents`
`users (1:N) notifications | audit_logs`

Constraints that matter:

* `users.email`, `users.employee_id` — UNIQUE
* `attendance (employee_id, date)` — UNIQUE (no duplicate check-ins)
* `attendance` — CHECK `check_out >= check_in`, CHECK `0 <= working_hours <= 24`
* `leave_requests` — CHECK `end_date >= start_date`
* `payroll (employee_id, month)` — UNIQUE, CHECK `basic_salary > 0`,
  CHECK `deductions <= basic_salary + allowances`
* Indexes on `attendance.date`, `leave_requests.status`, `payroll.month`, `employees.department`

---

## 6. API

Auth `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/verify-email` ·
`POST /api/auth/resend-verification` · `GET /api/auth/me`

Employees `GET|PUT /api/employees/me` · `GET /api/employees` *(HR)* · `GET|PUT /api/employees/{id}`
*(PUT: HR)* · `GET|POST /api/employees/{id}/documents`

Attendance `POST /api/attendance/check-in` · `POST /api/attendance/check-out` ·
`GET /api/attendance/me` · `/me/daily` · `/me/weekly` · `GET /api/attendance/all` *(HR)* ·
`PUT /api/attendance/{id}` *(HR)*

Leave `POST /api/leaves` · `GET /api/leaves/me` · `GET /api/leaves/{id}` ·
`GET /api/leaves/all` *(HR)* · `PUT /api/leaves/{id}/approve` *(HR)* ·
`PUT /api/leaves/{id}/reject` *(HR)* · `POST /api/leaves/{id}/comment` *(HR)*

Payroll `GET /api/payroll/me` · `/me/slip` · `GET /api/payroll/all` *(HR)* ·
`GET /api/payroll/{employee_id}` · `/{employee_id}/slip` · `PUT /api/payroll/{employee_id}` *(HR)*

Notifications `GET /api/notifications` · `PUT /api/notifications/{id}/read` ·
`PUT /api/notifications/read-all`

Dashboards `GET /api/dashboard/employee` · `GET /api/dashboard/admin` *(HR)*

Reports `GET /api/reports/attendance` · `/leave` · `/payroll` · `/employees` ·
`/attendance/export` *(all HR)* · `GET /api/audit-logs` *(HR)*

Employee tokens calling an HR route receive **403 Forbidden**, regardless of the UI.

---

## 7. Offline & durability

| Store | Key | Contents |
| --- | --- | --- |
| localStorage | `dayflow_preferences` | theme, sidebar, density, last viewed employee |
| localStorage | `dayflow_token` | JWT for the active session |
| localStorage | `dayflow_cached_dashboard`, `dayflow_cached_admin_dashboard` | last rendered dashboard |
| localStorage | `dayflow_notification_cache` | last 20 notifications |
| localStorage | `dayflow_last_sync` | timestamp of the last successful drain |
| IndexedDB | `outbox` | queued mutations awaiting sync |
| IndexedDB | all HR tables | durable records (MySQL in the deployed stack) |

No password, secret or private document is ever placed in localStorage.

**Offline flow.** Check-in, check-out and leave submission are marked offline-capable. When
`navigator.onLine` is false they are written to the outbox with the true client timestamp, and the
user is told *"You are offline. Your action has been saved and will sync automatically."* The sync
manager drains the queue on the `online` event, on a 30-second safety interval, and on demand from
the status pill. Statuses shown: **ONLINE / OFFLINE / SYNCING / SYNCED / FAILED**. Replayed
requests are re-validated by the API — a duplicate check-in is rejected and surfaced as FAILED with
retry/discard controls rather than silently dropped.

**Transactions.** Leave approval writes the leave row, the covered attendance days, the employee
notification and the audit entry in one transaction. If any step fails, all of them roll back.

---

## 8. Security

Argon2/bcrypt hashing (PBKDF2-SHA256 in the browser runtime) · JWT with expiry · server-side role
checks on every route · protected client routes · Pydantic validation · SQLAlchemy parameterised
queries (no string-built SQL) · explicit CORS allow-list · generic error bodies with details logged
server-side only · identical login error for unknown email and wrong password · secrets exclusively
in `.env`.

---

## 9. Auditability

Every consequential action writes `who / what / which entity / entity id / when`:
`LOGIN`, `USER_REGISTERED`, `EMAIL_VERIFIED`, `PROFILE_UPDATED`, `EMPLOYEE_UPDATED`,
`ATTENDANCE_CHECK_IN`, `ATTENDANCE_CHECK_OUT`, `ATTENDANCE_MODIFIED`, `LEAVE_SUBMITTED`,
`LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_COMMENTED`, `PAYROLL_UPDATED`, `DOCUMENT_UPLOADED`.
HR reads them at **Audit log**, filterable and CSV-exportable.

---

## 10. Git strategy & team division

`main` is protected — no direct pushes. Branch → implement → test → PR → review → merge.

`feature/frontend` · `feature/employee` · `feature/hr` · `feature/backend` · `feature/quality`

| Member | Scope |
| --- | --- |
| 1 — Frontend lead | React setup, routing, auth UI, shells, shared components, responsive design |
| 2 — Employee module | Profile, attendance, check-in/out, leave, payroll, notifications |
| 3 — HR module | HR dashboard, employee management, approvals, payroll, analytics, reports |
| 4 — Backend + DB | FastAPI, MySQL schema, models, JWT, all APIs, role authorization, validation |
| 5 — Quality + durability | localStorage, IndexedDB, offline queue, sync, audit, errors, testing, deploy |

At 4 members merge 2+1 and 4+5; at 3 members: frontend+employee / backend+database / HR+offline+testing.

---

## 11. Test checklist

**Auth** valid login · wrong password · unknown email · unverified account · both roles.
**Authorization** employee → `GET /api/employees` = 403 · employee → `PUT /api/payroll/{id}` = 403 ·
employee → another employee's record = 403 · HR → all allowed.
**Attendance** check-in · check-out · duplicate check-in = 409 · check-out before check-in = 409/422 ·
daily · weekly.
**Leave** valid request · `end < start` rejected · overlapping request = 409 · approve · reject
(comment required) · comment · notification raised.
**Payroll** employee read-only · HR update recalculates net · salary slip renders and prints.
**Durability** refresh · close and reopen the browser · logout/login · go offline, act, come back
online, watch SYNCING → SYNCED.

---

## 12. Requirement verification

| § | Requirement | Status |
| --- | --- | --- |
| 4 | Employee & HR roles, strict separation | Implemented |
| 5 | Registration, password rules, email verification, JWT login, role redirect | Implemented (SMTP wired in `backend/app/utils/mailer.py`; the browser runtime surfaces the code on screen because it has no mail transport) |
| 6–7 | All eight tables, relationships, keys, indexes | Implemented |
| 8 | Employee dashboard — today, summary, activity, notifications, shortcuts | Implemented |
| 9 | HR dashboard — headcount, present/absent/leave, pending, payroll, employee switching | Implemented |
| 10 | Profile view; employee edits phone/address/picture only; HR edits everything | Implemented |
| 11 | Daily + weekly attendance, check-in/out, four statuses, invalid-operation guards | Implemented |
| 12 | Leave apply → pending → HR approve/reject/comment → notification + audit | Implemented |
| 13 | Employee read-only payroll, HR updates, salary slips, backend authorization | Implemented |
| 14 | Bell, unread count, list, mark read / mark all read, generated events | Implemented (in-app; email optional via SMTP) |
| 15 | Analytics — totals, rate, distributions, department split, trends, payroll | Implemented |
| 16 | Reports — attendance, leave, payroll, employees, slips; CSV + PDF | Implemented (PDF via print-to-PDF; CSV native, plus a server CSV endpoint) |
| 17 | localStorage for preferences, caches, last sync | Implemented |
| 18 | IndexedDB offline queue, sync manager, five visible states | Implemented |
| 19 | Transactions, FKs, validation, audit, recovery, backups | Implemented |
| 20 | Frontend + backend + database validation | Implemented |
| 21 | Hashing, JWT, RBAC, protected routes, injection safety, CORS, env secrets | Implemented |
| 22 | Audit log for every important action | Implemented |
| 23 | Loading, empty, error, success, confirm, offline messaging | Implemented |
| 24 | Responsive desktop → mobile; tables become cards | Implemented |
| 25 | Consistent status colours and component language | Implemented |
| 26–27 | Prescribed folder structures | Implemented |
| 28–29 | Full API surface with server-side authorization | Implemented |
| 30–32 | Branch strategy and team division | Documented above |
| 33–38 | Phase order, definition of done, rules | Followed |

**Known deviations, stated explicitly:** file *upload* is modelled as document records with secure
paths rather than binary storage (the endpoint and `UPLOAD_DIR` config exist); PDF export uses the
browser's print-to-PDF pipeline instead of a PDF engine; and outbound email is a no-op until SMTP
credentials are supplied.
