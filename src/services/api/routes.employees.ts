import { STORES, addTo, getAllFrom, getOne, putIn, tx } from '../db';
import type { DocumentRecord, Employee, EmployeeWithUser, User } from '../../types';
import {
  ApiError,
  assertSelfOrHR,
  now,
  notify,
  requireHR,
  route,
  str,
  writeAudit } from
'./core';
import { validatePhone, validateRequired } from '../../utils/validation';
import type { RequestContext } from './core';

async function joinUsers(t: IDBTransaction, employees: Employee[]): Promise<EmployeeWithUser[]> {
  const users = await getAllFrom<User>(t, STORES.users);
  const byId = new Map(users.map((u) => [u.user_id, u]));
  return employees.map((employee) => {
    const user = byId.get(employee.user_id);
    return {
      ...employee,
      email: user?.email ?? '—',
      role: user?.role ?? 'EMPLOYEE',
      is_verified: user?.is_verified ?? false
    };
  });
}

async function listEmployees(ctx: RequestContext) {
  requireHR(ctx);
  return tx([STORES.employees, STORES.users], 'readonly', async (t) => {
    const employees = await getAllFrom<Employee>(t, STORES.employees);
    const joined = await joinUsers(t, employees);
    return joined.sort((a, b) => a.name.localeCompare(b.name));
  });
}

async function getMe(ctx: RequestContext) {
  if (!ctx.employee) throw new ApiError(404, 'Employee profile not found.');
  return ctx.employee;
}

async function getEmployee(ctx: RequestContext, params: string[]) {
  assertSelfOrHR(ctx, params[0]);
  return tx([STORES.employees, STORES.users], 'readonly', async (t) => {
    const employee = await getOne<Employee>(t, STORES.employees, params[0]);
    if (!employee) throw new ApiError(404, 'Employee not found.');
    const [joined] = await joinUsers(t, [employee]);
    return joined;
  });
}

/** Employees may only change address, phone and profile picture. */
async function updateMe(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  if (!ctx.employee) throw new ApiError(404, 'Employee profile not found.');
  const phone = str(body, 'phone');
  const address = str(body, 'address');
  const fields: Record<string, string> = {};
  const phoneError = validatePhone(phone);
  if (phoneError) fields.phone = phoneError;
  const addressError = validateRequired(address, 'Address');
  if (addressError) fields.address = addressError;
  if (Object.keys(fields).length)
  throw new ApiError(422, 'Please correct the highlighted fields.', fields);

  return tx([STORES.employees, STORES.audit_logs], 'readwrite', async (t) => {
    const current = await getOne<Employee>(t, STORES.employees, ctx.user.employee_id);
    if (!current) throw new ApiError(404, 'Employee profile not found.');
    const updated: Employee = {
      ...current,
      phone,
      address,
      profile_picture:
      typeof body.profile_picture === 'string' ? body.profile_picture : current.profile_picture,
      updated_at: now()
    };
    await putIn(t, STORES.employees, updated);
    await writeAudit(t, {
      user_id: ctx.user.user_id,
      actor: ctx.user.email,
      action: 'PROFILE_UPDATED',
      entity: 'EMPLOYEES',
      entity_id: updated.employee_id
    });
    return updated;
  });
}

/** HR may change every profile field. */
async function updateEmployee(ctx: RequestContext, params: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const fields: Record<string, string> = {};
  const name = str(body, 'name');
  const nameError = validateRequired(name, 'Full name');
  if (nameError) fields.name = nameError;
  const phone = str(body, 'phone');
  const phoneError = validatePhone(phone);
  if (phoneError) fields.phone = phoneError;
  const department = str(body, 'department');
  const deptError = validateRequired(department, 'Department');
  if (deptError) fields.department = deptError;
  const designation = str(body, 'designation');
  const designationError = validateRequired(designation, 'Designation');
  if (designationError) fields.designation = designationError;
  const joining = str(body, 'joining_date');
  if (!joining || Number.isNaN(new Date(joining).getTime()))
  fields.joining_date = 'Enter a valid joining date.';
  if (Object.keys(fields).length)
  throw new ApiError(422, 'Please correct the highlighted fields.', fields);

  return tx(
    [STORES.employees, STORES.notifications, STORES.audit_logs],
    'readwrite',
    async (t) => {
      const current = await getOne<Employee>(t, STORES.employees, params[0]);
      if (!current) throw new ApiError(404, 'Employee not found.');
      const updated: Employee = {
        ...current,
        name,
        phone,
        address: str(body, 'address'),
        department,
        designation,
        joining_date: joining,
        profile_picture:
        typeof body.profile_picture === 'string' ?
        body.profile_picture :
        current.profile_picture,
        updated_at: now()
      };
      await putIn(t, STORES.employees, updated);
      await notify(t, {
        user_id: current.user_id,
        title: 'Profile updated by HR',
        message: `${ctx.user.email} updated your employment details.`
      });
      await writeAudit(t, {
        user_id: ctx.user.user_id,
        actor: ctx.user.email,
        action: 'EMPLOYEE_UPDATED',
        entity: 'EMPLOYEES',
        entity_id: updated.employee_id
      });
      return updated;
    }
  );
}

async function listDocuments(ctx: RequestContext, params: string[]) {
  assertSelfOrHR(ctx, params[0]);
  return tx([STORES.documents], 'readonly', (t) =>
  getAllFrom<DocumentRecord>(t, STORES.documents, 'employee_id', params[0])
  );
}

async function addDocument(ctx: RequestContext, params: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const name = str(body, 'document_name');
  if (!name) throw new ApiError(422, 'Document name is required.', { document_name: 'Required.' });
  return tx(
    [STORES.documents, STORES.employees, STORES.notifications, STORES.audit_logs],
    'readwrite',
    async (t) => {
      const employee = await getOne<Employee>(t, STORES.employees, params[0]);
      if (!employee) throw new ApiError(404, 'Employee not found.');
      const record: Omit<DocumentRecord, 'document_id'> = {
        employee_id: params[0],
        document_name: name,
        document_path: str(body, 'document_path') || `/secure/docs/${params[0]}/${name}`,
        uploaded_at: now()
      };
      const id = await addTo(t, STORES.documents, record);
      await notify(t, {
        user_id: employee.user_id,
        title: 'New document available',
        message: `${name} was added to your employee file.`
      });
      await writeAudit(t, {
        user_id: ctx.user.user_id,
        actor: ctx.user.email,
        action: 'DOCUMENT_UPLOADED',
        entity: 'DOCUMENTS',
        entity_id: String(id)
      });
      return { ...record, document_id: id as number };
    }
  );
}

export const employeeRoutes = [
route('GET', '/api/employees/me', getMe as never),
route('PUT', '/api/employees/me', updateMe as never),
route('GET', '/api/employees', listEmployees as never),
route('GET', '/api/employees/{id}/documents', listDocuments as never),
route('POST', '/api/employees/{id}/documents', addDocument as never),
route('GET', '/api/employees/{id}', getEmployee as never),
route('PUT', '/api/employees/{id}', updateEmployee as never)];