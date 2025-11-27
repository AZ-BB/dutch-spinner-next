'use client';

import { useState } from 'react';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store credentials in localStorage
        localStorage.setItem('admin_credentials', JSON.stringify({ username, password }));
        onLogin();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-lock-icon">🔐</div>
          <h1>Admin Login</h1>
          <p>Enter your credentials to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="admin-error">{error}</div>}
          
          <div className="admin-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="admin-login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="admin-login-footer">
          <a href="/" className="admin-back-link">← Back to Home</a>
        </div>
      </div>

      <style jsx>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }

        .admin-login-container {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
        }

        .admin-login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .admin-lock-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }

        .admin-login-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }

        .admin-login-header p {
          color: #666;
          font-size: 0.95rem;
        }

        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .admin-error {
          background: #ffeaea;
          color: #e74c3c;
          padding: 0.875rem 1rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          border-left: 4px solid #e74c3c;
        }

        .admin-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .admin-form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1a1a2e;
        }

        .admin-form-group input {
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          transition: all 0.2s ease;
          font-family: inherit;
          background: #fafafa;
        }

        .admin-form-group input:focus {
          outline: none;
          border-color: #0f3460;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(15, 52, 96, 0.1);
        }

        .admin-form-group input::placeholder {
          color: #aaa;
        }

        .admin-login-button {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #0f3460, #16213e);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
        }

        .admin-login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(15, 52, 96, 0.35);
        }

        .admin-login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .admin-login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .admin-login-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .admin-back-link {
          color: #0f3460;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .admin-back-link:hover {
          color: #16213e;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
