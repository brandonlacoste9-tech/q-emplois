import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Home, MessageSquare, User, Coins, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { gold } from '../styles/design-tokens';

const itemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: '8px 4px',
  fontSize: 11,
  fontFamily: "'Lora', Georgia, serif",
  color: active ? gold : '#9A8468',
  textDecoration: 'none',
  fontWeight: active ? 700 : 400,
  flex: 1,
  minWidth: 0,
});

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { isClientMode } = useAuth();

  const isActive = (path: string) =>
    pathname === path || (path === '/jobs' && pathname.startsWith('/jobs/'));

  const clientItems = [
    { path: '/dashboard', label: 'Accueil', icon: Home },
    { path: '/post-job', label: 'Publier', icon: PlusCircle },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  const taskerItems = [
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/credits', label: 'Crédits', icon: Coins },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  const items = isClientMode ? clientItems : taskerItems;

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'rgba(18,30,42,0.98)',
        borderTop: '2px dashed rgba(217,179,140,0.2)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto' }}>
        {items.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} style={itemStyle(isActive(path))}>
            <Icon className="w-5 h-5" style={{ color: isActive(path) ? gold : '#9A8468' }} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
