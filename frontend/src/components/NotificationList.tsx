import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import type { Notification } from '../types';
import { api } from '../services/api';
import { formatTime } from '../utils';
import { getNotificationHref } from '../utils/notificationRoutes';
import { gold } from '../styles/design-tokens';

type Props = {
  notifications: Notification[];
  onChange: React.Dispatch<React.SetStateAction<Notification[]>>;
  compact?: boolean;
};

export function NotificationList({ notifications, onChange, compact }: Props) {
  const navigate = useNavigate();

  const handleClick = async (notif: Notification) => {
    const href = getNotificationHref(notif.type, notif.data);

    if (!notif.isRead) {
      try {
        await api.markNotificationAsRead(notif.id);
        onChange((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
      } catch {
        // Navigation still useful if mark-read fails
      }
    }

    if (href) navigate(href);
  };

  if (notifications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: compact ? '20px 0' : '32px 0' }}>
        <Bell className="w-10 h-10" style={{ margin: '0 auto 8px', color: 'rgba(217,179,140,0.3)' }} />
        <p className="body-f muted2" style={{ fontSize: 14 }}>Aucune notification</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {notifications.map((notif) => {
        const href = getNotificationHref(notif.type, notif.data);
        const interactive = !!href;

        return (
          <button
            key={notif.id}
            type="button"
            onClick={() => handleClick(notif)}
            disabled={!interactive}
            className="body-f"
            style={{
              width: '100%',
              textAlign: 'left',
              padding: 12,
              borderRadius: 8,
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              background: notif.isRead ? 'rgba(15,25,36,0.4)' : 'rgba(184,123,68,0.12)',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  marginTop: 6,
                  flexShrink: 0,
                  background: notif.isRead ? 'rgba(217,179,140,0.3)' : gold,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="cream-hi" style={{ fontSize: 14, fontWeight: 600 }}>{notif.title}</p>
                <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>{notif.message}</p>
                {!compact && (
                  <p className="muted2" style={{ fontSize: 11, marginTop: 4 }}>{formatTime(notif.createdAt)}</p>
                )}
                {interactive && (
                  <p className="muted2" style={{ fontSize: 11, marginTop: 4, color: gold }}>
                    Appuyer pour ouvrir →
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}