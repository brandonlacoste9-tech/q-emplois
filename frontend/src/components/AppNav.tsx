import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { UnreadBadge } from './UnreadBadge';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { gold } from '../styles/design-tokens';

export function AppNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { logout, user, isAdmin } = useAuth();
  const { unreadTotal } = useUnreadMessages();
  const postPath = user ? '/post-job' : '/book';

  const guestNav = [
    { label: 'Jobs', path: '/jobs' },
    { label: 'Publier', path: '/book' },
  ];
  const authedNav = [
    { label: 'Jobs', path: '/jobs' },
    { label: 'Publier', path: '/post-job' },
    { label: 'Messages', path: '/messages' },
    { label: 'Profil', path: '/profile' },
  ];
  const nav = user ? authedNav : guestNav;

  const linkColor = (path: string) => {
    const on = pathname === path || (path === '/jobs' && pathname.startsWith('/jobs/'));
    return {
      color: on ? '#E8CDB0' : '#9A8468',
      fontWeight: on ? 700 : 400,
    } as const;
  };

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
        <Link to={user ? '/jobs' : '/'} style={{ textDecoration: 'none' }} aria-label="Québec emplois">
          <BrandLogo size="md" />
        </Link>

        <div className="body-f" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link nav-hide-sm"
              style={{ ...linkColor(item.path), display: 'inline-flex', alignItems: 'center' }}
            >
              {item.label}
              {item.path === '/messages' && <UnreadBadge count={unreadTotal} />}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="nav-link nav-hide-sm" style={{ color: pathname.startsWith('/admin') ? '#E8CDB0' : '#D9A441', fontWeight: 600 }}>
              Admin
            </Link>
          )}
          {user ? (
            <>
              <span className="body-f nav-hide-sm" style={{ color: '#9A8468', fontSize: 13 }}>
                {user.firstName}
              </span>
              <Link to={postPath} className="gold-btn nav-hide-sm" style={{ padding: '6px 14px', fontSize: 13, textDecoration: 'none' }}>
                Publier
              </Link>
              <button onClick={logout} className="ghost-btn nav-hide-sm" style={{ padding: '6px 14px', fontSize: 13 }}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link nav-hide-sm" style={{ color: '#D9B38C' }}>
                Connexion
              </Link>
              <Link to="/book" className="gold-btn nav-hide-sm" style={{ padding: '6px 14px', fontSize: 13, textDecoration: 'none' }}>
                Publier une job
              </Link>
            </>
          )}
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
              style={{ display: 'flex', alignItems: 'center', padding: '10px 0', textDecoration: 'none', ...linkColor(item.path) }}
            >
              {item.label}
              {item.path === '/messages' && <UnreadBadge count={unreadTotal} />}
            </Link>
          ))}
          {user ? (
            <button onClick={logout} className="ghost-btn" style={{ marginTop: 8, padding: '8px 14px', fontSize: 13, width: '100%' }}>
              Déconnexion
            </button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} style={{ display: 'block', padding: '10px 0', color: '#D9B38C' }}>
              Connexion
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
