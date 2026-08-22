import React, { useState } from 'react';
import { DownloadIcon, PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { Spinner } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { attendanceService, employeeService } from '../../services/resources';
import { friendlyError } from '../../services/apiClient';
import { downloadCSV } from '../../utils/exporters';
import { hours, prettyDate, prettyTime, todayISO } from '../../utils/format';
import type { Attendance, AttendanceStatus } from '../../types';

type Row = Attendance & {name: string;department: string;};

export function AdminAttendance() {
  const [date, setDate] = useState(todayISO());
  const [employeeId, setEmployeeId] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);

  const employees = useAsync(() => employeeService.list(), []);
  const attendance = useAsync(
    () => attendanceService.all({ date: date || undefined, employee_id: employeeId || undefined }),
    [date, employeeId]
  );

  const rows = attendance.data ?? [];
  const counts = {
    present: rows.filter((row) => row.status === 'PRESENT').length,
    half: rows.filter((row) => row.status === 'HALF_DAY').length,
    leave: rows.filter((row) => row.status === 'LEAVE').length,
    absent: rows.filter((row) => row.status === 'ABSENT').length
  };

  return (
    <>
      <PageHeader
        title="Attendance management"
        description="Every employee's presence, with the ability to amend records that were logged incorrectly."
        actions={
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() =>
          downloadCSV(`attendance-${date || 'all'}`, rows as unknown as Record<string, unknown>[], [
          'employee_id',
          'name',
          'department',
          'date',
          'check_in',
          'check_out',
          'working_hours',
          'status']
          )
          }
          disabled={!rows.length}>
          
            <DownloadIcon className="h-4 w-4" /> Export CSV
          </button>
        } />
      

      <div className="mb-4 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
        <input
          type="date"
          className="input sm:w-48"
          value={date}
          max={todayISO()}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Filter by date" />
        
        <select
          className="input"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          aria-label="Filter by employee">
          
          <option value="">All employees</option>
          {(employees.data ?? []).map((employee) =>
          <option key={employee.employee_id} value={employee.employee_id}>
              {employee.name} · {employee.employee_id}
            </option>
          )}
        </select>
        <button type="button" className="btn-outline" onClick={() => {setDate('');setEmployeeId('');}}>
          Clear filters
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tally label="Present" value={counts.present} className="text-emerald-600" />
        <Tally label="Half day" value={counts.half} className="text-amber-600" />
        <Tally label="On leave" value={counts.leave} className="text-sky-600" />
        <Tally label="Absent" value={counts.absent} className="text-rose-600" />
      </div>

      <section className="card overflow-hidden">
        <DataTable<Row>
          rows={rows}
          loading={attendance.loading}
          error={attendance.error}
          onRetry={attendance.reload}
          rowKey={(row) => row.attendance_id}
          emptyTitle="No attendance for this filter"
          emptyDescription="Try another date or clear the filters."
          cardTitle={(row) => row.name}
          cardMeta={(row) => `${row.employee_id} · ${prettyDate(row.date)}`}
          columns={[
          { key: 'name', header: 'Employee' },
          { key: 'employee_id', header: 'ID' },
          { key: 'department', header: 'Department' },
          { key: 'date', header: 'Date', render: (row) => prettyDate(row.date) },
          { key: 'check_in', header: 'In', render: (row) => prettyTime(row.check_in) },
          { key: 'check_out', header: 'Out', render: (row) => prettyTime(row.check_out) },
          { key: 'working_hours', header: 'Hours', align: 'right', render: (row) => hours(row.working_hours) },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> }]
          }
          actions={(row) =>
          <button type="button" className="btn-outline btn-sm" onClick={() => setEditing(row)}>
              <PencilIcon className="h-3.5 w-3.5" /> Amend
            </button>
          } />
        
      </section>

      <AmendModal
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await attendance.reload();
        }} />
      
    </>);

}

function Tally({ label, value, className }: {label: string;value: number;className: string;}) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`tnum mt-1 text-2xl font-semibold ${className}`}>{value}</p>
    </div>);

}

function AmendModal({
  row,
  onClose,
  onSaved




}: {row: (Attendance & {name: string;}) | null;onClose: () => void;onSaved: () => void | Promise<void>;}) {
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (row) {
      setStatus(row.status);
      setCheckIn(row.check_in ? row.check_in.slice(0, 16) : '');
      setCheckOut(row.check_out ? row.check_out.slice(0, 16) : '');
    }
  }, [row]);

  if (!row) return null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await attendanceService.update(row.attendance_id, {
        status,
        check_in: checkIn ? new Date(checkIn).toISOString() : '',
        check_out: checkOut ? new Date(checkOut).toISOString() : ''
      });
      toast.success('Attendance record amended and audited.');
      await onSaved();
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Amend ${row.name}`}
      description={`${prettyDate(row.date)} · every change is written to the audit log and notifies the employee.`}
      size="sm"
      footer={
      <>
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="amend-attendance" className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : null} Save record
          </button>
        </>
      }>
      
      <form id="amend-attendance" onSubmit={save} className="space-y-4">
        <div>
          <label className="label" htmlFor="amend-status">
            Status
          </label>
          <select
            id="amend-status"
            className="input"
            value={status}
            onChange={(event) => setStatus(event.target.value as AttendanceStatus)}>
            
            <option value="PRESENT">Present</option>
            <option value="HALF_DAY">Half day</option>
            <option value="LEAVE">Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="amend-in">
              Check-in
            </label>
            <input
              id="amend-in"
              type="datetime-local"
              className="input"
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)} />
            
          </div>
          <div>
            <label className="label" htmlFor="amend-out">
              Check-out
            </label>
            <input
              id="amend-out"
              type="datetime-local"
              className="input"
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)} />
            
          </div>
        </div>
      </form>
    </Modal>);

}