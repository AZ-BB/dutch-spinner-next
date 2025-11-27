'use client';

import { useState } from 'react';
import Modal from 'react-modal';
import { adminApi } from '@/lib/admin-fetch';
import { CouponTypeDisplayNames, ALL_COUPON_TYPES } from '@/types/enums';

// Set the app element for accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

interface AddSinglePromocodeModalProps {
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
    maxWidth: '450px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
};

export default function AddSinglePromocodeModal({ isOpen, onClose, onSuccess }: AddSinglePromocodeModalProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setSelectedType('');
    setCode('');
    setError(null);
    setSuccess(false);
  };

  const handleAfterClose = () => {
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) {
      setError('Please select a coupon type');
      return;
    }

    if (!code.trim()) {
      setError('Please enter a promocode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.post<ImportResponse>('/api/admin/coupons', {
        type: selectedType,
        codes: [code.trim()],
      });

      if (response.duplicates && response.duplicates.length > 0) {
        setError(`This promocode already exists: ${code.trim()}`);
      } else if (response.imported > 0) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else if (response.errors && response.errors.length > 0) {
        setError(response.errors[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add promocode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      onAfterClose={handleAfterClose}
      style={customStyles}
      contentLabel="Add Single Promocode"
    >
      <div className="modal-header">
        <h2>Add Promocode</h2>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>

      {success ? (
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h3>Promocode Added!</h3>
          <p>The promocode has been added successfully.</p>
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

          <div className="form-group">
            <label htmlFor="promo-code">Promocode *</label>
            <input
              type="text"
              id="promo-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter promocode..."
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-button" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={loading || !selectedType || !code.trim()}>
              {loading ? 'Adding...' : 'Add Promocode'}
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

        .form-group select,
        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: #fff;
          transition: border-color 0.2s;
        }

        .form-group select {
          cursor: pointer;
        }

        .form-group input::placeholder {
          color: #999;
        }

        .form-group select:focus,
        .form-group input:focus {
          outline: none;
          border-color: #0f3460;
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

        .success-container {
          padding: 2.5rem 1.5rem;
          text-align: center;
        }

        .success-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #d4edda;
          color: #155724;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          margin: 0 auto 1rem;
        }

        .success-container h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 0.5rem 0;
        }

        .success-container p {
          color: #666;
          margin: 0;
        }
      `}</style>
    </Modal>
  );
}

