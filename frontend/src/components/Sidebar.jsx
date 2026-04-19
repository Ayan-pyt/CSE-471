import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ links }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const icons = {
    profile: '👤', post: '📋', applications: '📨', search: '🔍', cv: '📄', dashboard: '🏠',
  };

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '24px' }}>
        <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{user?.role?.replace('_', ' ')}</p>
      </div>
      <hr className="divider" />
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span>{icons[link.icon] || '•'}</span> {link.label}
          </NavLink>
        ))}
      </nav>
      <hr className="divider" />
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</div>
        <div>{user?.email}</div>
      </div>
      <button className="btn-danger" onClick={handleLogout} style={{ width: '100%' }}>Sign Out</button>
    </aside>
  );
}
