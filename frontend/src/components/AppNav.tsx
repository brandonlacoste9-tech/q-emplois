import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

const gold = '#B87B44';

export function AppNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user, isClientMode, canTask, setMode } = useAuth();

  const clientNav = [
    { label: 'Tableau de bord', path: '/dashboard' },
    { label: 'Mes tâches', path: '/jobs' },
    { label: 'Publier une job', path: '/post-job' },
    { label: 'Messages', path: '/messages' },
    { label: "L'Atelier", path: '/latelier' },
    { label: 'Profil', path: '/profile' },
  ];

  const taskerNav = [
    { label: 'Tableau de bord', path: '/dashboard' },
    { label: 'Jobs', path: '/jobs' },
    { label: 'Crédits', path: '/credits' },
    { label: 'Messages', path: '/messages' },
    { label: "L'Atelier", path: '/latelier' },
    { label: 'Profil', path: '/profile' },
  ];

  const nav = isClientMode ? clientNav : taskerNav;

  const modeChip = (active: boolean): React.CSSProperties => ({
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: "'Lora', Georgia, serif",
    border: active ? `1px solid ${gold}` : '1px dashed rgba(217,179,140,0.3)',
    background: active ? gold : 'transparent',
    color: active ? '#1F2F3F' : '#D9B38C',
    fontWeight: active ? 700 : 400,
  });

  const switchToClient = () => {
    setMode('client');
    if (pathname === '/credits') navigate('/dashboard');
  };

  const switchToTasker = () => {
    if (canTask) {
      setMode('tasker');
      if (pathname === '/post-job') navigate('/jobs');
    } else {
      navigate('/profile?setup=tasker');
    }
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
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <BrandLogo size="md" />
        </Link>

        <div className="body-f" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
          <div className="nav-hide-sm" style={{ display: 'flex', gap: 6, marginRight: 4 }}>
            <button type="button" onClick={switchToClient} style={modeChip(isClientMode)}>
              J&apos;embauche
            </button>
            <button type="button" onClick={switchToTasker} style={modeChip(!isClientMode)}>
              Je travaille
            </button>
          </div>

          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link nav-hide-sm"
              style={{ color: pathname === item.path || (item.path === '/jobs' && pathname.startsWith('/jobs/')) ? '#E8CDB0' : '#9A8468', fontWeight: pathname === item.path || (item.path === '/jobs' && pathname.startsWith('/jobs/')) ? 700 : 400 }}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <span className="body-f nav-hide-sm" style={{ color: '#9A8468', fontSize: 13 }}>
              {user.firstName}
            </span>
          )}
          {!isClientMode && canTask && (
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => { switchToClient(); setOpen(false); }} style={{ ...modeChip(isClientMode), flex: 1 }}>
              J&apos;embauche
            </button>
            <button type="button" onClick={() => { switchToTasker(); setOpen(false); }} style={{ ...modeChip(!isClientMode), flex: 1 }}>
              Je travaille
            </button>
          </div>
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
