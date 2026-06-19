import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

export function AppNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { logout, user, profile } = useAuth();
  const isClient = profile?.role === 'client';

  const nav = isClient
    ? [
        { label: 'Tableau de bord', path: '/dashboard' },
        { label: 'Mes tâches', path: '/jobs' },
        { label: 'Publier une job', path: '/post-job' },
        { label: 'Messages', path: '/messages' },
        { label: "L'Atelier", path: '/latelier' },
        { label: 'Profil', path: '/profile' },
      ]
    : [
        { label: 'Tableau de bord', path: '/dashboard' },
        { label: 'Jobs', path: '/jobs' },
        { label: 'Crédits', path: '/credits' },
        { label: 'Messages', path: '/messages' },
        { label: "L'Atelier", path: '/latelier' },
        { label: 'Profil', path: '/profile' },
      ];

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(18,30,42,0.96)',
        backdropFilter: 'blur(6px)',
        borderBottom: '2px dashed rgba(217,179,140,0.2)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <BrandLogo size="md" />
        </Link>

        <div className="body-f" style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 14 }}>
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link nav-hide-sm"
              style={{ color: pathname === item.path ? '#E8CDB0' : '#9A8468', fontWeight: pathname === item.path ? 700 : 400 }}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <span className="body-f nav-hide-sm" style={{ color: '#9A8468', fontSize: 13 }}>
              {user.firstName}
            </span>
          )}
          {!isClient && (
            <Link to="/jobs" className="gold-btn nav-hide-sm" style={{ padding: '6px 14px', fontSize: 13, textDecoration: 'none' }}>
              Parcourir les jobs
            </Link>
          )}
          <button onClick={logout} className="ghost-btn nav-hide-sm" style={{ padding: '6px 14px', fontSize: 13 }}>
            Déconnexion
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="nav-show-sm"
            aria-label="Menu"
            style={{ display: 'none', background: 'transparent', border: '1px dashed rgba(217,179,140,0.35)', borderRadius: 6, color: '#D9B38C', padding: '4px 10px', cursor: 'pointer' }}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-show-sm" style={{ display: 'none', borderTop: '1px dashed rgba(217,179,140,0.2)', padding: '12px 24px' }}>
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '10px 0', textDecoration: 'none', color: pathname === item.path ? '#E8CDB0' : '#9A8468', fontWeight: pathname === item.path ? 700 : 400 }}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={logout} className="ghost-btn" style={{ marginTop: 8, padding: '8px 14px', fontSize: 13, width: '100%' }}>
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
