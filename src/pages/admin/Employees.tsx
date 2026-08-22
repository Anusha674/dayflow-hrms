import React, { useMemo, useState } from 'react';
import { DownloadIcon, ExternalLinkIcon, FileTextIcon, PencilIcon, SearchIcon, UserPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { DocumentModal } from '../../components/DocumentModal';
import { EmptyState, Spinner } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { employeeService, attendanceService, leaveService, payrollService } from '../../services/resources';
import { fieldErrors, friendlyError } from '../../services/apiClient';
import { usePreferences } from '../../context/PreferencesContext';
import { downloadCSV } from '../../utils/exporters';
import { initials, money, prettyDate, titleCase } from '../../utils/format';
import { StatusBadge } from '../../components/StatusBadge';
import type { DocumentRecord, EmployeeWithUser } from '../../types';

const DEPARTMENTS = ['Engineering', 'Design', 'Finance', 'Sales', 'Support', 'People Operations'];

export function AdminEmployees() {
  const { data, loading, error, reload } = useAsync(() => employeeService.list(), []);
  const { prefs, update } = usePreferences();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All');
  const [selected, setSelected] = useState<EmployeeWithUser | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [editing, setEditing] = useState(false);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (data ?? []).filter(
      (employee) =>
      (department === 'All' || employee.department === department) && (
      !term ||
      employee.name.toLowerCase().includes(term) ||
      employee.employee_id.toLowerCase().includes(term) ||
      employee.email.toLowerCase().includes(term))
    );
  }, [data, query, department]);

  const open = (employee: EmployeeWithUser) => {
    setSelected(employee);
    update({ lastEmployeeId: employee.employee_id });
  };

  return (
    <>
      <PageHeader
        title="Employees"
        description={`${data?.length ?? 0} people on record. Select anyone to view their full file.`}
        actions={
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() =>
          downloadCSV('employees', rows as unknown as Record<string, unknown>[], [
          'employee_id',
          'name',
          'email',
          'department',
          'designation',
          'joining_date',
          'phone']
          )
          }
          disabled={!rows.length}>
          
            <DownloadIcon className="h-4 w-4" /> Export CSV
          </button>
        } />
      

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            aria-hidden="true" />
          
          <input
            className="input pl-9"
            placeholder="Search by name, ID or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search employees" />
          
        </div>
        <select
          className="input sm:w-56"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          aria-label="Filter by department">
          
          <option>All</option>
          {DEPARTMENTS.map((item) =>
          <option key={item}>{item}</option>
          )}
        </select>
      </div>

      {prefs.lastEmployeeId && !selected ?
      <p className="mb-3 text-xs text-muted">
          Last viewed:{' '}
          <button
          type="button"
          className="font-semibold text-brand hover:underline"
          onClick={() => {
            const match = data?.find((e) => e.employee_id === prefs.lastEmployeeId);
            if (match) open(match);
          }}>
          
            {prefs.lastEmployeeId}
          </button>
        </p> :
      null}

      <section className="card overflow-hidden">
        <DataTable<EmployeeWithUser>
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey={(row) => row.employee_id}
          onRowClick={open}
          emptyTitle="No employees match this filter"
          cardTitle={(row) => row.name}
          cardMeta={(row) => `${row.employee_id} · ${row.department}`}
          columns={[
          {
            key: 'name',
            header: 'Employee',
            render: (row) =>
            <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brandSoft text-[11px] font-bold text-brand">
                    {initials(row.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{row.name}</span>
                    <span className="block truncate text-xs text-muted">{row.email}</span>
                  </span>
                </span>

          },
          { key: 'employee_id', header: 'ID' },
          { key: 'department', header: 'Department' },
          { key: 'designation', header: 'Designation' },
          { key: 'joining_date', header: 'Joined', render: (row) => prettyDate(row.joining_date) },
          {
            key: 'is_verified',
            header: 'Account',
            render: (row) =>
            <span className={`badge ${row.is_verified ? 'badge-approved' : 'badge-pending'}`}>
                  {row.is_verified ? 'Verified' : 'Unverified'}
                </span>

          }]
          }
          actions={(row) =>
          <button type="button" className="btn-outline btn-sm" onClick={() => open(row)}>
              View
            </button>
          } />
        
      </section>

      <EmployeeDrawer
        employee={selected}
        onClose={() => setSelected(null)}
        onEdit={() => setEditing(true)}
        onViewDoc={(doc) => setSelectedDoc(doc)}
      />

      <DocumentModal
        document={selectedDoc}
        employeeName={selected?.name}
        onClose={() => setSelectedDoc(null)}
      />

      <EditEmployeeModal
        employee={editing ? selected : null}
        onClose={() => setEditing(false)}
        onSaved={async (updated) => {
          setEditing(false);
          setSelected((prev) => prev ? { ...prev, ...updated } : prev);
          await reload();
        }} />
      
    </>);

}

function EmployeeDrawer({
  employee,
  onClose,
  onEdit,
  onViewDoc
}: {
  employee: EmployeeWithUser | null;
  onClose: () => void;
  onEdit: () => void;
  onViewDoc: (doc: DocumentRecord) => void;
}) {
  const id = employee?.employee_id ?? '';
  const attendance = useAsync(() => id ? attendanceService.forEmployee(id) : Promise.resolve([]), [id]);
  const payroll = useAsync(() => id ? payrollService.forEmployee(id) : Promise.resolve([]), [id]);
  const leaves = useAsync(() => id ? leaveService.all() : Promise.resolve([]), [id]);
  const documents = useAsync(() => id ? employeeService.documents(id) : Promise.resolve([]), [id]);

  if (!employee) return null;
  const employeeLeaves = (leaves.data ?? []).filter((leave) => leave.employee_id === id);
  const recent = (attendance.data ?? []).slice(0, 6);

  return (
    <Modal
      open={Boolean(employee)}
      onClose={onClose}
      title={employee.name}
      description={`${employee.employee_id} · ${employee.designation} · ${employee.department}`}
      size="lg"
      footer={
      <>
          <button type="button" className="btn-outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn-primary" onClick={onEdit}>
            <PencilIcon className="h-4 w-4" /> Edit details
          </button>
        </>
      }>
      
      <div className="grid gap-5 sm:grid-cols-2">
        <dl className="space-y-2 text-sm">
          <Row label="Email" value={employee.email} />
          <Row label="Phone" value={employee.phone || '—'} />
          <Row label="Address" value={employee.address || '—'} />
          <Row label="Joined" value={prettyDate(employee.joining_date)} />
          <Row label="Account" value={employee.is_verified ? 'Verified' : 'Unverified'} />
        </dl>
        <dl className="space-y-2 text-sm">
          <Row
            label="Latest net pay"
            value={payroll.data?.[0] ? money(payroll.data[0].net_salary) : '—'} />
          
          <Row label="Payslips" value={String(payroll.data?.length ?? 0)} />
          <Row label="Leave requests" value={String(employeeLeaves.length)} />
          <Row
            label="Pending leave"
            value={String(employeeLeaves.filter((l) => l.status === 'PENDING').length)} />
          
          <Row label="Documents" value={String(documents.data?.length ?? 0)} />
        </dl>
      </div>

      <h3 className="mt-6 text-sm font-semibold text-ink">Recent attendance</h3>
      {recent.length ?
      <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
          {recent.map((row) =>
        <li key={row.attendance_id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-muted">{prettyDate(row.date)}</span>
              <span className="flex items-center gap-3">
                <span className="tnum text-ink">{row.working_hours} h</span>
                <StatusBadge status={row.status} dot={false} />
              </span>
            </li>
        )}
        </ul> :

      <EmptyState title="No attendance recorded" />
      }

      <h3 className="mt-6 text-sm font-semibold text-ink">Leave history</h3>
      {employeeLeaves.length ?
      <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
          {employeeLeaves.slice(0, 6).map((leave) =>
        <li key={leave.leave_id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate text-ink">{titleCase(leave.leave_type)} leave</span>
                <span className="block truncate text-xs text-muted">
                  {prettyDate(leave.start_date)} → {prettyDate(leave.end_date)}
                </span>
              </span>
              <StatusBadge status={leave.status} dot={false} />
            </li>
        )}
        </ul> :
      <EmptyState title="No leave requests" />
      }

      <h3 className="mt-6 text-sm font-semibold text-ink">Documents</h3>
      {documents.data?.length ?
      <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
          {documents.data.map((doc) =>
        <li key={doc.document_id} onClick={() => onViewDoc(doc)} className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-surface/50 transition-colors">
              <span className="flex items-center gap-2 min-w-0">
                <FileTextIcon className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate text-ink font-medium">{doc.document_name}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted">{prettyDate(doc.uploaded_at)}</span>
                <button type="button" className="btn-outline btn-sm py-0.5 px-2 text-xs">
                  <ExternalLinkIcon className="h-3 w-3" /> View
                </button>
              </span>
            </li>
        )}
        </ul> :
      <EmptyState title="No documents" />
      }
    </Modal>);

}

function EditEmployeeModal({
  employee,
  onClose,
  onSaved




}: {employee: EmployeeWithUser | null;onClose: () => void;onSaved: (updated: Partial<EmployeeWithUser>) => void | Promise<void>;}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    department: 'Engineering',
    designation: '',
    joining_date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (employee)
    setForm({
      name: employee.name,
      phone: employee.phone,
      address: employee.address,
      department: employee.department,
      designation: employee.designation,
      joining_date: employee.joining_date
    });
  }, [employee]);

  if (!employee) return null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const updated = await employeeService.update(employee.employee_id, form);
      toast.success(`${updated.name}'s record updated.`);
      await onSaved(updated);
    } catch (error) {
      setErrors(fieldErrors(error));
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${employee.employee_id}`}
      description="HR can amend every profile field. Changes are audited and the employee is notified."
      footer={
      <>
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-employee" className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : <UserPlusIcon className="h-4 w-4" />} Save changes
          </button>
        </>
      }>
      
      <form id="edit-employee" onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Full name" error={errors.name}>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Department" error={errors.department}>
          <select
            className="input"
            value={form.department}
            onChange={(e) => set('department', e.target.value)}>
            
            {DEPARTMENTS.map((item) =>
            <option key={item}>{item}</option>
            )}
          </select>
        </Field>
        <Field label="Designation" error={errors.designation}>
          <input
            className="input"
            value={form.designation}
            onChange={(e) => set('designation', e.target.value)} />
          
        </Field>
        <Field label="Joining date" error={errors.joining_date}>
          <input
            type="date"
            className="input"
            value={form.joining_date}
            onChange={(e) => set('joining_date', e.target.value)} />
          
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address" error={errors.address}>
            <textarea
              rows={2}
              className="input"
              value={form.address}
              onChange={(e) => set('address', e.target.value)} />
            
          </Field>
        </div>
      </form>
    </Modal>);

}

function Row({ label, value }: {label: string;value: string;}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="truncate text-right font-medium text-ink">{value}</dd>
    </div>);

}

function Field({
  label,
  error,
  children




}: {label: string;error?: string;children: React.ReactNode;}) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>);

}