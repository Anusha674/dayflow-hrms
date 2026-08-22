import React, { useState } from 'react';
import { getUserDocuments, uploadDocument, deleteDocument } from '../../db/storage';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../common/Modal';
import { FileText, Upload, Trash2, Download, ExternalLink, Plus } from 'lucide-react';

export const DocumentVault = ({ userId, isEditable }) => {
  const { showToast } = useNotifications();
  const [documents, setDocuments] = useState(getUserDocuments(userId));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Identity Proof');
  const [fileName, setFileName] = useState('');

  const refreshDocs = () => {
    setDocuments(getUserDocuments(userId));
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!title || !fileName) {
      showToast('Please provide document title and file name.', 'error');
      return;
    }

    uploadDocument({
      userId,
      title,
      category,
      fileName,
      fileSize: `${(1 + Math.random() * 3).toFixed(1)} MB`
    });

    showToast('Document uploaded successfully!', 'success');
    setTitle('');
    setFileName('');
    setIsModalOpen(false);
    refreshDocs();
  };

  const handleDelete = (docId) => {
    deleteDocument(docId);
    showToast('Document deleted.', 'info');
    refreshDocs();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Employee Document Vault</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Secure record of IDs, employment contracts, and degree certificates</p>
        </div>
        {isEditable && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Upload Document
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No documents uploaded yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Category</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Uploaded Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <FileText size={16} color="var(--primary)" />
                      {doc.title}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{doc.category}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>{doc.fileName}</td>
                  <td>{doc.fileSize}</td>
                  <td>{doc.uploadedAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => showToast(`Simulated download for ${doc.fileName}`, 'info')}
                        className="btn btn-outline btn-sm"
                        title="Download file"
                      >
                        <Download size={14} /> Download
                      </button>
                      {isEditable && (
                        <button onClick={() => handleDelete(doc.id)} className="btn btn-danger btn-sm" title="Delete document">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Employee Document">
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label className="form-label">Document Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Passport Copy, Degree Certificate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Identity Proof">Identity Proof</option>
              <option value="Contract">Contract</option>
              <option value="Education">Education</option>
              <option value="Tax File">Tax File</option>
              <option value="Medical">Medical Certificate</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select File / File Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. passport_copy_2026.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Upload size={16} /> Upload & Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
