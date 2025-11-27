'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-fetch';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  registeredAt: string;
  couponType: string | null;
  couponCode: string | null;
  couponName: string | null;
  wonAt: string | null;
}

interface UsersResponse {
  users: User[];
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.couponCode && user.couponCode.toLowerCase().includes(search)) ||
      (user.couponName && user.couponName.toLowerCase().includes(search))
    );
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.get<UsersResponse>('/api/admin/users');
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('nl-NL', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Coupon Type', 'Coupon Code', 'Won At', 'Registered At'];
    const rows = users.map((user) => [
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.couponName || '-',
      user.couponCode || '-',
      user.wonAt ? new Date(user.wonAt).toISOString() : '-',
      new Date(user.registeredAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="admin-loading-state">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error-state">
        <p>{error}</p>
        <button onClick={fetchUsers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="users-tab">
      <div className="tab-header">
        <h2>Registered Users ({filteredUsers.length}{searchTerm && ` of ${users.length}`})</h2>
        <button onClick={exportToCSV} className="export-button" disabled={users.length === 0}>
          📥 Export CSV
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, email, or coupon code..."
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

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Coupon Type</th>
              <th>Coupon Code</th>
              <th>Won At</th>
              <th>Registered At</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {searchTerm ? 'No users match your search' : 'No users registered yet'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.couponName || <span className="no-value">-</span>}</td>
                  <td>
                    {user.couponCode ? (
                      <code className="coupon-code">{user.couponCode}</code>
                    ) : (
                      <span className="no-value">-</span>
                    )}
                  </td>
                  <td>{formatDate(user.wonAt)}</td>
                  <td>{formatDate(user.registeredAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .users-tab {
          width: 100%;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .tab-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }

        .export-button {
          padding: 0.625rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          background: #0f3460;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
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
          margin-bottom: 1.5rem;
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

        .no-value {
          color: #aaa;
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

