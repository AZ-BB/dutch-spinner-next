'use client';

import { useState } from 'react';
import UsersTab from './components/UsersTab';
import PromocodesTab from './components/PromocodesTab';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabId = 'users' | 'promocodes';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('users');

  const tabs = [
    { id: 'users' as TabId, label: 'Users', icon: '👥' },
    { id: 'promocodes' as TabId, label: 'Promocodes', icon: '🎟️' },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <button onClick={onLogout} className="admin-logout-button">
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="admin-main">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'promocodes' && <PromocodesTab />}
      </main>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f7fa;
        }

        .admin-header {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          padding: 1rem 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .admin-header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-header h1 {
          color: #fff;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .admin-logout-button {
          padding: 0.625rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1a1a2e;
          background: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-logout-button:hover {
          background: #f0f0f0;
          transform: translateY(-1px);
        }

        .admin-tabs {
          background: #fff;
          border-bottom: 1px solid #eee;
          padding: 0 1.5rem;
        }

        .tabs-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          gap: 0.5rem;
        }

        .tab-button {
          padding: 1rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #666;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tab-button:hover {
          color: #1a1a2e;
        }

        .tab-button.active {
          color: #0f3460;
          border-bottom-color: #0f3460;
        }

        .tab-icon {
          font-size: 1.1rem;
        }

        .admin-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        @media (max-width: 768px) {
          .admin-header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .tabs-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .tab-button {
            padding: 0.875rem 1rem;
            white-space: nowrap;
          }

          .admin-main {
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
