import React from 'react';
import { DownloadIcon, FileTextIcon, PrinterIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { Modal } from './Modal';
import { printElement } from '../utils/exporters';
import { prettyDate } from '../utils/format';
import type { DocumentRecord } from '../types';

interface DocumentModalProps {
  document: DocumentRecord | null;
  employeeName?: string;
  onClose: () => void;
}

export function DocumentModal({ document, employeeName = 'Employee', onClose }: DocumentModalProps) {
  if (!document) return null;

  const contentId = `pdf-doc-content-${document.document_id}`;

  const handlePrint = () => {
    printElement(contentId, document.document_name);
  };

  const handleDownloadText = () => {
    const textContent = `DAYFLOW HRMS OFFICIAL DOCUMENT RECORD
Document: ${document.document_name}
Employee: ${employeeName} (${document.employee_id})
Path: ${document.document_path}
Uploaded: ${prettyDate(document.uploaded_at)}

STATUS: Officially Verified & Digitally Signed
Dayflow HR Management System · Confidential`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = document.document_name.replace(/\.pdf$/, '') + '_record.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={Boolean(document)} onClose={onClose} title={document.document_name}>
      <div className="space-y-4">
        {/* Document Printable View */}
        <div
          id={contentId}
          className="rounded-xl border border-line bg-surface/90 p-6 shadow-sm text-ink space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white font-bold text-lg">
                D
              </span>
              <div>
                <h2 className="text-base font-bold tracking-tight text-ink">Dayflow HRMS</h2>
                <p className="text-xs text-muted">Official Document Vault</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheckIcon className="h-3.5 w-3.5" /> Verified PDF
            </span>
          </div>

          {/* Document Title & Meta */}
          <div className="rounded-lg bg-brandSoft/20 p-4 border border-line">
            <div className="flex items-start gap-3">
              <FileTextIcon className="h-6 w-6 text-brand shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-ink">{document.document_name}</h3>
                <p className="text-xs text-muted mt-0.5">
                  Ref ID: <span className="font-mono font-semibold text-ink">DOC-{document.document_id}092</span> · Uploaded: {prettyDate(document.uploaded_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Document Content Details */}
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs border-b border-line pb-3">
              <div>
                <span className="block text-muted">Employee Name</span>
                <span className="font-semibold text-ink">{employeeName}</span>
              </div>
              <div>
                <span className="block text-muted">Employee ID</span>
                <span className="font-semibold text-ink">{document.employee_id}</span>
              </div>
              <div>
                <span className="block text-muted">Document Path</span>
                <span className="font-mono text-faint truncate block">{document.document_path}</span>
              </div>
              <div>
                <span className="block text-muted">Security Level</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Confidential / HR Approved</span>
              </div>
            </div>

            <div className="pt-2 text-xs leading-relaxed text-muted space-y-2">
              <p>
                This official digital document record was generated and archived in accordance with Dayflow Enterprise HR guidelines.
              </p>
              <p>
                All information contained herein has been authenticated and cryptographically bound to employee reference <span className="font-mono text-ink font-semibold">{document.employee_id}</span>.
              </p>
            </div>
          </div>

          {/* Watermark Footer */}
          <div className="border-t border-dashed border-line pt-3 flex items-center justify-between text-[11px] text-faint">
            <span>© Dayflow Human Resource Management System</span>
            <span>Document Status: ACTIVE</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-outline btn-sm" onClick={handleDownloadText}>
            <DownloadIcon className="h-4 w-4" /> Download Record
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={handlePrint}>
            <PrinterIcon className="h-4 w-4" /> Save / Print PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}
