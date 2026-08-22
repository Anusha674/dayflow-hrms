/**
 * Durable storage layer.
 *
 * In the deployed stack this is MySQL (see /backend). Inside this browser-only
 * environment the exact same schema — primary keys, foreign keys, unique
 * indexes and multi-store transactions — is enforced on IndexedDB so that the
 * API layer above it is written once and behaves identically against either.
 */

export const DB_NAME = 'dayflow_hrms';
const DB_VERSION = 1;

export const STORES = {
  users: 'users',
  employees: 'employees',
  attendance: 'attendance',
  leave_requests: 'leave_requests',
  payroll: 'payroll',
  documents: 'documents',
  notifications: 'notifications',
  audit_logs: 'audit_logs',
  outbox: 'outbox',
  meta: 'meta'
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;

      const users = db.createObjectStore(STORES.users, { keyPath: 'user_id', autoIncrement: true });
      users.createIndex('email', 'email', { unique: true });
      users.createIndex('employee_id', 'employee_id', { unique: true });

      const employees = db.createObjectStore(STORES.employees, { keyPath: 'employee_id' });
      employees.createIndex('user_id', 'user_id', { unique: true });
      employees.createIndex('department', 'department');

      const attendance = db.createObjectStore(STORES.attendance, {
        keyPath: 'attendance_id',
        autoIncrement: true
      });
      attendance.createIndex('employee_date', ['employee_id', 'date'], { unique: true });
      attendance.createIndex('employee_id', 'employee_id');
      attendance.createIndex('date', 'date');

      const leaves = db.createObjectStore(STORES.leave_requests, {
        keyPath: 'leave_id',
        autoIncrement: true
      });
      leaves.createIndex('employee_id', 'employee_id');
      leaves.createIndex('status', 'status');

      const payroll = db.createObjectStore(STORES.payroll, {
        keyPath: 'payroll_id',
        autoIncrement: true
      });
      payroll.createIndex('employee_month', ['employee_id', 'month'], { unique: true });
      payroll.createIndex('employee_id', 'employee_id');
      payroll.createIndex('month', 'month');

      const documents = db.createObjectStore(STORES.documents, {
        keyPath: 'document_id',
        autoIncrement: true
      });
      documents.createIndex('employee_id', 'employee_id');

      const notifications = db.createObjectStore(STORES.notifications, {
        keyPath: 'notification_id',
        autoIncrement: true
      });
      notifications.createIndex('user_id', 'user_id');

      const audit = db.createObjectStore(STORES.audit_logs, {
        keyPath: 'log_id',
        autoIncrement: true
      });
      audit.createIndex('user_id', 'user_id');
      audit.createIndex('entity', 'entity');

      const outbox = db.createObjectStore(STORES.outbox, { keyPath: 'id', autoIncrement: true });
      outbox.createIndex('status', 'status');

      db.createObjectStore(STORES.meta, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Runs `fn` inside a single IndexedDB transaction spanning `stores`.
 * If `fn` throws, the transaction is aborted and every write inside it is
 * rolled back — this is what makes composite operations (approve leave =>
 * update leave + write attendance + notify + audit) atomic.
 */
export function tx<T>(
stores: string[],
mode: IDBTransactionMode,
fn: (t: IDBTransaction) => Promise<T>)
: Promise<T> {
  return openDB().then(
    (db) =>
    new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(stores, mode);
      let result: T;
      let failed: unknown = null;
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(failed ?? transaction.error);
      transaction.onerror = () => reject(failed ?? transaction.error);
      fn(transaction).
      then((value) => {
        result = value;
      }).
      catch((error) => {
        failed = error;
        try {
          transaction.abort();
        } catch {

          /* already finished */}
      });
    })
  );
}

export const store = (t: IDBTransaction, name: string) => t.objectStore(name);

export async function getAllFrom<T>(
t: IDBTransaction,
name: string,
index?: string,
query?: IDBValidKey | IDBKeyRange)
: Promise<T[]> {
  const s = t.objectStore(name);
  const source = index ? s.index(index) : s;
  return req(source.getAll(query) as IDBRequest<T[]>);
}

export async function getOne<T>(
t: IDBTransaction,
name: string,
key: IDBValidKey)
: Promise<T | undefined> {
  return req(t.objectStore(name).get(key) as IDBRequest<T | undefined>);
}

export async function getByIndex<T>(
t: IDBTransaction,
name: string,
index: string,
key: IDBValidKey)
: Promise<T | undefined> {
  return req(t.objectStore(name).index(index).get(key) as IDBRequest<T | undefined>);
}

export async function addTo<T>(t: IDBTransaction, name: string, value: T): Promise<IDBValidKey> {
  return req(t.objectStore(name).add(value as unknown as never));
}

export async function putIn<T>(t: IDBTransaction, name: string, value: T): Promise<IDBValidKey> {
  return req(t.objectStore(name).put(value as unknown as never));
}

export async function deleteFrom(t: IDBTransaction, name: string, key: IDBValidKey): Promise<void> {
  await req(t.objectStore(name).delete(key));
}

/** Convenience wrappers for single-store reads outside an existing transaction. */
export async function readAll<T>(
name: string,
index?: string,
query?: IDBValidKey | IDBKeyRange)
: Promise<T[]> {
  return tx([name], 'readonly', (t) => getAllFrom<T>(t, name, index, query));
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await tx([STORES.meta], 'readonly', (t) =>
  getOne<{key: string;value: T;}>(t, STORES.meta, key)
  );
  return row?.value;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  await tx([STORES.meta], 'readwrite', (t) => putIn(t, STORES.meta, { key, value }));
}

export async function resetDatabase(): Promise<void> {
  const db = await openDB();
  db.close();
  dbPromise = null;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}