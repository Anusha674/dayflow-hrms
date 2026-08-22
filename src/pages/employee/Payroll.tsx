import React, { useEffect, useState } from 'react';
import { DownloadIcon, LockIcon, PrinterIcon } from 'lucide-react';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { ErrorState, SkeletonCard } from '../../components/Loading';
import { SalarySlipView } from '../shared/SalarySlipView';
import { useAsync } from '../../hooks/useAsync';
import { payrollService } from '../../services/resources';
import { downloadCSV } from '../../utils/exporters';
import { printElement } from '../../utils/exporters';
import { money, prettyMonth } from '../../utils/format';
import type { Payroll } from '../../types';

export function EmployeePayroll() {
  const { data, loading, error, reload } = useAsync(() => payrollService.mine(), []);
  const [month, setMonth] = useState<string | null>(null);

  useEffect(() => {
    if (!month && data?.length) setMonth(data[0].month);
  }, [data, month]);

  const slip = useAsync(
    () => month ? payrollService.mySlip(month) : Promise.resolve(null),
    [month]
  );

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Your published salary structure and monthly payslips. Read-only by design."
        actions={
        <>
            <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() =>
            downloadCSV('my-payroll', (data ?? []) as unknown as Record<string, unknown>[], [
            'month',
            'basic_salary',
            'allowances',
            'deductions',
            'net_salary']
            )
            }
            disabled={!data?.length}>
            
              <DownloadIcon className="h-4 w-4" /> CSV
            </button>
            <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => printElement('salary-slip', `Payslip ${month ?? ''}`)}
            disabled={!slip.data}>
            
              <PrinterIcon className="h-4 w-4" /> Save as PDF
            </button>
          </>
        } />
      

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="card overflow-hidden" id="salary-slip">
            {slip.loading && !slip.data ?
            <SkeletonCard className="h-80" /> :
            slip.data ?
            <SalarySlipView slip={slip.data} /> :

            <ErrorState message="No payslip published for this month yet." />
            }
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <LockIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Salary values are managed by HR. Employee accounts cannot modify payroll through the
            interface or the API.
          </p>
        </section>

        <section className="card overflow-hidden lg:col-span-5">
          <header className="border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold text-ink">Payslip history</h2>
          </header>
          <DataTable<Payroll>
            rows={data ?? []}
            loading={loading}
            rowKey={(row) => row.payroll_id}
            emptyTitle="No payroll published"
            onRowClick={(row) => setMonth(row.month)}
            cardTitle={(row) => prettyMonth(row.month)}
            columns={[
            { key: 'month', header: 'Month', render: (row) => prettyMonth(row.month) },
            { key: 'basic_salary', header: 'Basic', align: 'right', render: (row) => money(row.basic_salary) },
            { key: 'net_salary', header: 'Net pay', align: 'right', render: (row) => money(row.net_salary) }]
            } />
          
        </section>
      </div>
    </>);

}