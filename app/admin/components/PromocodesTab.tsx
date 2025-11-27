'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/admin-fetch';
import { CouponType, CouponTypeDisplayNames, ALL_COUPON_TYPES } from '@/types/enums';
import AddPromocodesModal from './AddPromocodesModal';
import AddSinglePromocodeModal from './AddSinglePromocodeModal';

interface Coupon {
  id: number;
  code: string;
  type: string;
  name: string;
  displayName: string;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

interface CouponsResponse {
  coupons: Coupon[];
}

export default function PromocodesTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedFilter, setUsedFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter coupons based on search term (client-side)
  const filteredCoupons = coupons.filter((coupon) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      coupon.code.toLowerCase().includes(search) ||
      coupon.displayName.toLowerCase().includes(search) ||
      coupon.type.toLowerCase().includes(search)
    );
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      if (usedFilter) params.used = usedFilter;
      if (typeFilter) params.type = typeFilter;
      
      const data = await adminApi.get<CouponsResponse>('/api/admin/coupons', params);
      setCoupons(data.coupons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  }, [usedFilter, typeFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('nl-NL', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const exportToCSV = () => {
    const headers = ['Code', 'Type', 'Name', 'Status', 'Used At', 'Created At'];
    const rows = coupons.map((coupon) => [
      coupon.code,
      coupon.type,
      coupon.displayName,
      coupon.used ? 'Used' : 'Available',
      coupon.usedAt ? new Date(coupon.usedAt).toISOString() : '-',
      new Date(coupon.createdAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `promocodes-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleImportSuccess = () => {
    setShowImportModal(false);
    fetchCoupons();
  };

  const handleAddSingleSuccess = () => {
    setShowAddSingleModal(false);
    fetchCoupons();
  };

  const handleDelete = async (coupon: Coupon) => {
    if (coupon.used) {
      alert('Cannot delete a used coupon');
      return;
    }

    if (!confirm(`Are you sure you want to delete the promocode "${coupon.code}"?`)) {
      return;
    }

    setDeletingId(coupon.id);
    try {
      await adminApi.delete('/api/admin/coupons', { id: String(coupon.id) });
      // Remove from local state
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete coupon');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="admin-loading-state">
        <div className="spinner"></div>
        <p>Loading promocodes...</p>
      </div>
    );
  }

  if (error && coupons.length === 0) {
    return (
      <div className="admin-error-state">
        <p>{error}</p>
        <button onClick={fetchCoupons}>Retry</button>
      </div>
    );
  }

  return (
    <div className="promocodes-tab">
      <div className="tab-header">
        <h2>Promocodes ({filteredCoupons.length}{searchTerm && ` of ${coupons.length}`})</h2>
        <div className="header-actions">
          <button onClick={() => setShowAddSingleModal(true)} className="add-button">
            ➕ Add Promocode
          </button>
          <button onClick={() => setShowImportModal(true)} className="import-button">
            📄 Import Promocodes
          </button>
          <button onClick={exportToCSV} className="export-button" disabled={coupons.length === 0}>
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by code or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm('')}>
            ✕
          </button>
        )}
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <select value={usedFilter} onChange={(e) => setUsedFilter(e.target.value)}>
            <option value="">All</option>
            <option value="false">Available</option>
            <option value="true">Used</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {ALL_COUPON_TYPES.map((type) => (
              <option key={type} value={type}>
                {CouponTypeDisplayNames[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Status</th>
              <th>Used At</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {searchTerm ? 'No promocodes match your search' : 'No promocodes found'}
                </td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <code className="coupon-code">{coupon.code}</code>
                  </td>
                  <td>{coupon.displayName}</td>
                  <td>
                    <span className={`status-badge ${coupon.used ? 'used' : 'available'}`}>
                      {coupon.used ? 'Used' : 'Available'}
                    </span>
                  </td>
                  <td>{formatDate(coupon.usedAt)}</td>
                  <td>{formatDate(coupon.createdAt)}</td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(coupon)}
                      disabled={coupon.used || deletingId === coupon.id}
                      title={coupon.used ? 'Cannot delete used coupon' : 'Delete coupon'}
                    >
                      {deletingId === coupon.id ? '...' : '🗑️'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddPromocodesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />

      <AddSinglePromocodeModal
        isOpen={showAddSingleModal}
        onClose={() => setShowAddSingleModal(false)}
        onSuccess={handleAddSingleSuccess}
      />

      <style jsx>{`
        .promocodes-tab {
          width: 100%;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .tab-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .add-button,
        .import-button,
        .export-button {
          padding: 0.625rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-button {
          background: #27ae60;
          color: #fff;
        }

        .add-button:hover {
          background: #219a52;
        }

        .import-button {
          background: #3498db;
          color: #fff;
        }

        .import-button:hover {
          background: #2980b9;
        }

        .export-button {
          background: #0f3460;
          color: #fff;
        }

        .export-button:hover:not(:disabled) {
          background: #16213e;
        }

        .export-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .search-bar {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-input {
          width: 100%;
          max-width: 400px;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          font-size: 0.95rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: #fff;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #0f3460;
        }

        .search-input::placeholder {
          color: #999;
        }

        .clear-search {
          position: absolute;
          left: 370px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #999;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.25rem;
        }

        .clear-search:hover {
          color: #333;
        }

        .filters {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #555;
        }

        .filter-group select {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          min-width: 150px;
        }

        .filter-group select:focus {
          outline: none;
          border-color: #0f3460;
        }

        .table-container {
          overflow-x: auto;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .admin-table th,
        .admin-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .admin-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #1a1a2e;
          white-space: nowrap;
        }

        .admin-table tbody tr:hover {
          background: #f8f9fa;
        }

        .admin-table tbody tr:last-child td {
          border-bottom: none;
        }

        .coupon-code {
          background: #e8f4f8;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.85rem;
          color: #0f3460;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-badge.available {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.used {
          background: #f8d7da;
          color: #721c24;
        }

        .delete-button {
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.375rem 0.5rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .delete-button:hover:not(:disabled) {
          background: #ffeaea;
        }

        .delete-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          color: #666;
          padding: 3rem 1rem !important;
        }

        .admin-loading-state,
        .admin-error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background: #fff;
          border-radius: 12px;
        }

        .admin-loading-state .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #eee;
          border-top-color: #0f3460;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .admin-error-state {
          color: #e74c3c;
        }

        .admin-error-state button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #e74c3c;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .admin-error-state button:hover {
          background: #c0392b;
        }
      `}</style>
    </div>
  );
}

