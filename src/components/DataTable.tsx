import React from 'react';
import { EmptyState, ErrorState, SkeletonRows } from './Loading';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  /** Hidden on the mobile card layout when false. */
  onCard?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  caption?: string;
  /** Rendered as the card headline on small screens. */
  cardTitle?: (row: T) => React.ReactNode;
  cardMeta?: (row: T) => React.ReactNode;
  actions?: (row: T) => React.ReactNode;
}

function cellValue<T>(row: T, column: Column<T>): React.ReactNode {
  if (column.render) return column.render(row);
  const value = (row as Record<string, unknown>)[column.key];
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  onRowClick,
  caption,
  cardTitle,
  cardMeta,
  actions
}: DataTableProps<T>) {
  if (loading && !rows.length) return <SkeletonRows rows={6} className="p-4" />;
  if (error && !rows.length) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <>
      {/* Desktop / tablet: real table, horizontally scrollable if needed */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) =>
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted ${
                column.align === 'right' ? 'text-right' : 'text-left'}`
                }>
                
                  {column.header}
                </th>
              )}
              {actions ? <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-line/70 last:border-0 transition-colors duration-150 ease-soft ${
              onRowClick ? 'cursor-pointer hover:bg-brand/[0.06]' : ''}`
              }>
              
                {columns.map((column) =>
              <td
                key={column.key}
                className={`px-4 py-3 align-middle text-ink ${
                column.align === 'right' ? 'text-right tnum' : ''} ${
                column.className ?? ''}`}>
                
                    {cellValue(row, column)}
                  </td>
              )}
                {actions ?
              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td> :
              null}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: each row becomes a card */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) =>
        <li key={rowKey(row)} className="p-4">
            <button
            type="button"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className="w-full text-left"
            disabled={!onRowClick}>
            
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {cardTitle ? cardTitle(row) : cellValue(row, columns[0])}
                  </p>
                  {cardMeta ? <p className="mt-0.5 text-xs text-muted">{cardMeta(row)}</p> : null}
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                {columns.
              filter((column) => column.onCard !== false).
              slice(cardTitle ? 0 : 1).
              map((column) =>
              <div key={column.key} className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                        {column.header}
                      </dt>
                      <dd className="truncate text-sm text-ink">{cellValue(row, column)}</dd>
                    </div>
              )}
              </dl>
            </button>
            {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions(row)}</div> : null}
          </li>
        )}
      </ul>
    </>);

}