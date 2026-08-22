import React, { useMemo, useState } from 'react';
import { DownloadIcon, SearchIcon } from 'lucide-react';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { useAsync } from '../../hooks/useAsync';
import { authService } from '../../services/resources';
import { downloadCSV } from '../../utils/exporters';
import { prettyDateTime, titleCase, todayISO } from '../../utils/format';
import type { AuditLog as AuditLogRow } from '../../types';

export function AdminAuditLog() {
  const { data, loading, error, reload } = useAsync(() => authService.auditLogs(300), []);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('All');

  const actions = useMemo(
    () => Array.from(new Set((data ?? []).map((row) => row.action))).sort(),
    [data]
  );

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (data ?? []).filter(
      (row) =>
      (action === 'All' || row.action === action) && (
      !term ||
      row.actor.toLowerCase().includes(term) ||
      row.entity_id.toLowerCase().includes(term) ||
      row.entity.toLowerCase().includes(term))
    );
  }, [data, query, action]);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Who did what, to which record, and when. Written inside the same transaction as the change itself."
        actions={
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() =>
          downloadCSV(`audit-log-${todayISO()}`, rows as unknown as Record<string, unknown>[], [
          'timestamp',
          'actor',
          'action',
          'entity',
          'entity_id',
          'user_id']
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
            placeholder="Search by actor, entity or record ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search audit log" />
          
        </div>
        <select
          className="input sm:w-64"
          value={action}
          onChange={(event) => setAction(event.target.value)}
          aria-label="Filter by action">
          
          <option>All</option>
          {actions.map((item) =>
          <option key={item} value={item}>
              {titleCase(item)}
            </option>
          )}
        </select>
      </div>

      <section className="card overflow-hidden">
        <DataTable<AuditLogRow>
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey={(row) => row.log_id}
          emptyTitle="No audit entries match"
          cardTitle={(row) => titleCase(row.action)}
          cardMeta={(row) => prettyDateTime(row.timestamp)}
          columns={[
          {
            key: 'timestamp',
            header: 'When',
            render: (row) => prettyDateTime(row.timestamp)
          },
          { key: 'actor', header: 'Performed by' },
          {
            key: 'action',
            header: 'Action',
            render: (row) =>
            <span className="badge badge-neutral">{titleCase(row.action)}</span>

          },
          { key: 'entity', header: 'Entity' },
          { key: 'entity_id', header: 'Record' }]
          } />
        
      </section>
    </>);

}