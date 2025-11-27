'use client';

import { useState, useRef } from 'react';
import Modal from 'react-modal';
import { adminApi } from '@/lib/admin-fetch';
import { CouponTypeDisplayNames, ALL_COUPON_TYPES } from '@/types/enums';

// Set the app element for accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

interface AddPromocodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResponse {
  success: boolean;
  imported: number;
  skipped: number;
  duplicates: string[];
  errors: string[];
}

const customStyles: Modal.Styles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'relative',
    inset: 'auto',
    padding: 0,
    border: 'none',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
};

export default function AddPromocodesModal({ isOpen, onClose, onSuccess }: AddPromocodesModalProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): string[] => {
    const lines = text.split(/\r?\n/);
    const codes: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip header row if it contains "promocode" (case insensitive)
      if (i === 0 && line.toLowerCase().includes('promocode')) {
        continue;
      }

      // Get first column (in case there are multiple columns)
      const firstColumn = line.split(',')[0].trim();
      // Remove quotes if present
      const code = firstColumn.replace(/^["']|["']$/g, '').trim();
      
      if (code) {
        codes.push(code);
      }
    }

    return codes;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) {
      setError('Please select a coupon type');
      return;
    }

    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const codes = parseCSV(text);

      if (codes.length === 0) {
        setError('No valid promocodes found in the CSV file');
        setLoading(false);
        return;
      }

      const response = await adminApi.post<ImportResponse>('/api/admin/coupons', {
        type: selectedType,
        codes,
      });

      setResult(response);
      
      if (response.imported > 0) {
        // Auto close after short delay if successful
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import promocodes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedType('');
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAfterClose = () => {
    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      onAfterClose={handleAfterClose}
      style={customStyles}
      contentLabel="Add Promocodes"
    >
      <div className="modal-header">
        <h2>Add Promocodes</h2>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>

      {result ? (
        <div className="result-container">
          <div className={`result-icon ${result.imported > 0 ? 'success' : 'warning'}`}>
            {result.imported > 0 ? '✓' : '⚠'}
          </div>
          <h3>Import Complete</h3>
          <div className="result-stats">
            <div className="stat">
              <span className="stat-value success">{result.imported}</span>
              <span className="stat-label">Imported</span>
            </div>
            <div className="stat">
              <span className="stat-value warning">{result.skipped}</span>
              <span className="stat-label">Skipped (duplicates)</span>
            </div>
          </div>
          {result.duplicates && result.duplicates.length > 0 && (
            <div className="result-duplicates">
              <p>Duplicate codes ({result.duplicates.length}):</p>
              <div className="duplicates-list">
                {result.duplicates.slice(0, 10).map((code, i) => (
                  <code key={i} className="duplicate-code">{code}</code>
                ))}
                {result.duplicates.length > 10 && (
                  <span className="more-duplicates">... and {result.duplicates.length - 10} more</span>
                )}
              </div>
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="result-errors">
              <p>Errors:</p>
              <ul>
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>... and {result.errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}
          <div className="result-actions">
            <button onClick={resetForm} className="secondary-button">
              Import More
            </button>
            <button onClick={onSuccess} className="primary-button">
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="coupon-type">Coupon Type *</label>
            <select
              id="coupon-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              required
            >
              <option value="">Select a type...</option>
              {ALL_COUPON_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CouponTypeDisplayNames[type]}
                </option>
              ))}
            </select>
          </div>

          <div className={`form-group ${!selectedType ? 'disabled' : ''}`}>
            <label htmlFor="csv-file">CSV File *</label>
            <div className={`file-input-container ${!selectedType ? 'disabled' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                id="csv-file"
                accept=".csv"
                onChange={handleFileChange}
                required
                disabled={!selectedType}
              />
              <div className="file-input-display">
                {file ? (
                  <span className="file-name">{file.name}</span>
                ) : (
                  <span className="file-placeholder">
                    {selectedType ? 'Choose a CSV file...' : 'Select a type first'}
                  </span>
                )}
                <button type="button" className="browse-button" disabled={!selectedType}>Browse</button>
              </div>
            </div>
            <p className="help-text">
              CSV should have a column named &quot;promocode&quot; or codes in the first column.
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-button" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #666;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
        }

        .close-button:hover {
          color: #333;
        }

        form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
        }

        .form-group select:focus {
          outline: none;
          border-color: #0f3460;
        }

        .file-input-container {
          position: relative;
        }

        .file-input-container input[type="file"] {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .file-input-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border: 2px dashed #e0e0e0;
          border-radius: 8px;
          background: #fafafa;
        }

        .file-input-container.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .file-input-container.disabled input[type="file"] {
          cursor: not-allowed;
        }

        .file-input-container.disabled .file-input-display {
          background: #f0f0f0;
        }

        .file-name {
          color: #333;
          font-size: 0.95rem;
        }

        .file-placeholder {
          color: #999;
          font-size: 0.95rem;
        }

        .browse-button {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #0f3460;
          background: #e8f4f8;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .browse-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .help-text {
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .error-message {
          background: #ffeaea;
          color: #e74c3c;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 0.5rem;
        }

        .primary-button,
        .secondary-button {
          padding: 0.75rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-button {
          background: #0f3460;
          color: #fff;
          border: none;
        }

        .primary-button:hover:not(:disabled) {
          background: #16213e;
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .secondary-button {
          background: #fff;
          color: #333;
          border: 2px solid #e0e0e0;
        }

        .secondary-button:hover:not(:disabled) {
          background: #f5f5f5;
        }

        .secondary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Result styles */
        .result-container {
          padding: 2rem 1.5rem;
          text-align: center;
        }

        .result-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          margin: 0 auto 1rem;
        }

        .result-icon.success {
          background: #d4edda;
          color: #155724;
        }

        .result-icon.warning {
          background: #fff3cd;
          color: #856404;
        }

        .result-container h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 1.5rem;
        }

        .result-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
        }

        .stat-value.success {
          color: #27ae60;
        }

        .stat-value.warning {
          color: #f39c12;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .result-duplicates {
          background: #fff3cd;
          padding: 1rem;
          border-radius: 8px;
          text-align: left;
          margin-bottom: 1rem;
        }

        .result-duplicates p {
          font-weight: 600;
          color: #856404;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .duplicates-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .duplicate-code {
          background: #fff;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
          color: #856404;
          border: 1px solid #ffc107;
        }

        .more-duplicates {
          font-size: 0.8rem;
          color: #856404;
          align-self: center;
        }

        .result-errors {
          background: #ffeaea;
          padding: 1rem;
          border-radius: 8px;
          text-align: left;
          margin-bottom: 1.5rem;
        }

        .result-errors p {
          font-weight: 600;
          color: #e74c3c;
          margin-bottom: 0.5rem;
        }

        .result-errors ul {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.85rem;
          color: #c0392b;
        }

        .result-errors li {
          margin-bottom: 0.25rem;
        }

        .result-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }
      `}</style>
    </Modal>
  );
}
