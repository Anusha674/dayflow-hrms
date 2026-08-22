/** CSV + printable-PDF exporters used by the reports module. */

export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return '';
  const keys = columns ?? Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join(
    '\n'
  );
}

export function downloadCSV(
filename: string,
rows: Record<string, unknown>[],
columns?: string[])
: void {
  const csv = toCSV(rows, columns);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Opens the browser print dialog scoped to a single element — the standard
 *  "Save as PDF" path, with no heavyweight PDF dependency. */
export function printElement(elementId: string, title: string): void {
  const node = document.getElementById(elementId);
  if (!node) return;
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Inter,system-ui,sans-serif;color:#111821;margin:32px;font-size:12px}
      h1,h2,h3{margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #dfe3e8;padding:6px 8px;text-align:left}
      th{background:#f4f6f8;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
      .muted{color:#5a6471}
      .right{text-align:right}
    </style></head><body>${node.innerHTML}</body></html>`);
  doc.close();
  frame.contentWindow?.focus();
  window.setTimeout(() => {
    frame.contentWindow?.print();
    window.setTimeout(() => document.body.removeChild(frame), 1000);
  }, 250);
}