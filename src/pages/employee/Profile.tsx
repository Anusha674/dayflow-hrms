import React, { useState } from 'react';
import { ExternalLinkIcon, FileTextIcon, LockIcon, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/AppShell';
import { EmptyState, ErrorState, Spinner } from '../../components/Loading';
import { DocumentModal } from '../../components/DocumentModal';
import { useAsync } from '../../hooks/useAsync';
import { employeeService, payrollService } from '../../services/resources';
import { fieldErrors, friendlyError } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { initials, money, prettyDate, prettyDateTime } from '../../utils/format';
import { validatePhone, validateRequired } from '../../utils/validation';
import type { DocumentRecord } from '../../types';

export function EmployeeProfile() {
  const { user, employee, refresh } = useAuth();
  const employeeId = user?.employee_id ?? '';
  const documents = useAsync(() => employeeService.documents(employeeId), [employeeId]);
  const payroll = useAsync(() => payrollService.mine(), []);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [address, setAddress] = useState(employee?.address ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    setPhone(employee?.phone ?? '');
    setAddress(employee?.address ?? '');
  }, [employee?.phone, employee?.address]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const phoneError = validatePhone(phone);
    if (phoneError) next.phone = phoneError;
    const addressError = validateRequired(address, 'Address');
    if (addressError) next.address = addressError;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await employeeService.updateMe({ phone, address });
      await refresh();
      toast.success('Profile updated.');
    } catch (error) {
      setErrors(fieldErrors(error));
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  if (!employee) return <ErrorState message="Your employee profile could not be loaded." />;

  const latest = payroll.data?.[0];

  return (
    <>
      <PageHeader
        title="My profile"
        description="Contact details are yours to maintain. Employment and salary data is managed by HR." />
      

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="card p-5 lg:col-span-4">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brandSoft text-lg font-bold text-brand">
              {initials(employee.name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-ink">{employee.name}</h2>
              <p className="truncate text-sm text-muted">{employee.designation}</p>
              <p className="mt-1 text-xs text-faint">{user?.email}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Employee ID" value={employee.employee_id} />
            <Row label="Department" value={employee.department} />
            <Row label="Joining date" value={prettyDate(employee.joining_date)} />
            <Row label="Account role" value={user?.role === 'HR' ? 'HR Officer' : 'Employee'} />
            <Row label="Email verified" value={user?.is_verified ? 'Yes' : 'No'} />
            <Row label="Last updated" value={prettyDateTime(employee.updated_at)} />
          </dl>
        </section>

        <section className="card p-5 lg:col-span-8">
          <h3 className="text-sm font-semibold text-ink">Editable details</h3>
          <p className="mt-0.5 text-sm text-muted">
            Only phone number and address can be changed from here.
          </p>

          <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
            <div>
              <label className="label" htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                className="input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-invalid={Boolean(errors.phone)} />
              
              {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone}</p> : null}
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                className="input"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                aria-invalid={Boolean(errors.address)} />
              
              {errors.address ? <p className="mt-1 text-xs text-rose-600">{errors.address}</p> : null}
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? <Spinner /> : <SaveIcon className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center gap-2">
              <LockIcon className="h-4 w-4 text-muted" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-ink">Salary structure (read-only)</h3>
            </div>
            {latest ?
            <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Metric label="Basic" value={money(latest.basic_salary)} />
                <Metric label="Allowances" value={money(latest.allowances)} />
                <Metric label="Deductions" value={money(latest.deductions)} />
                <Metric label="Net pay" value={money(latest.net_salary)} strong />
              </dl> :

            <p className="mt-2 text-sm text-muted">No salary structure published yet.</p>
            }
          </div>
        </section>

        <section className="card lg:col-span-12">
          <header className="flex items-center justify-between border-b border-line px-5 py-3">
            <h3 className="text-sm font-semibold text-ink">My documents</h3>
            <span className="text-xs text-muted">{documents.data?.length ?? 0} file(s)</span>
          </header>
          {documents.data?.length ?
          <ul className="divide-y divide-line">
              {documents.data.map((doc) =>
            <li
              key={doc.document_id}
              onClick={() => setSelectedDoc(doc)}
              className="flex items-center justify-between gap-4 px-5 py-3 cursor-pointer hover:bg-surface/50 transition-colors">
                  <span className="flex min-w-0 items-center gap-3">
                    <FileTextIcon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink hover:text-brand">
                        {doc.document_name}
                      </span>
                      <span className="block truncate text-xs text-faint">{doc.document_path}</span>
                    </span>
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted">{prettyDate(doc.uploaded_at)}</span>
                    <button type="button" className="btn-outline btn-sm gap-1 text-xs">
                      <ExternalLinkIcon className="h-3 w-3" /> View PDF
                    </button>
                  </div>
                </li>
            )}
            </ul> :

          <EmptyState
            title="No documents shared yet"
            description="HR will publish your offer letter and payslips here." />

          }
        </section>
      </div>

      <DocumentModal
        document={selectedDoc}
        employeeName={employee?.name ?? user?.email}
        onClose={() => setSelectedDoc(null)}
      />
    </>);

}

function Row({ label, value }: {label: string;value: string;}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>);

}

function Metric({ label, value, strong }: {label: string;value: string;strong?: boolean;}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`tnum mt-0.5 ${strong ? 'text-lg font-semibold text-ink' : 'text-sm font-medium text-ink'}`}>
        {value}
      </dd>
    </div>);

}