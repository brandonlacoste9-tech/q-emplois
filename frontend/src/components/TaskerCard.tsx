import { Link } from 'react-router-dom';
import { Star, BadgeCheck, MapPin } from 'lucide-react';
import type { TaskerCardData } from '../types';
import { SERVICE_TYPE_LABELS } from '../types';
import { formatPrice } from '../utils';
import { gold } from '../styles/design-tokens';

interface TaskerCardProps {
  tasker: TaskerCardData;
  action?: React.ReactNode;
  compact?: boolean;
  linkProfile?: boolean;
}

export function TaskerCard({ tasker, action, compact, linkProfile = true }: TaskerCardProps) {
  const name = [tasker.firstName, tasker.lastName].filter(Boolean).join(' ') || 'Travailleur';
  const initials = name.charAt(0).toUpperCase();

  return (
    <div
      className="stitch-box"
      style={{
        background: 'rgba(15,25,36,0.55)',
        padding: compact ? 12 : 16,
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        gap: 12,
        alignItems: compact ? 'center' : 'stretch',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: gold,
            color: '#1F2F3F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {linkProfile && tasker.id ? (
              <Link to={`/tasker/${tasker.id}`} className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
                {name}
              </Link>
            ) : (
              <p className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700 }}>{name}</p>
            )}
            {tasker.isVerified && (
              <span
                className="body-f"
                style={{
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#7FB069',
                  background: 'rgba(127,176,105,0.15)',
                  padding: '2px 8px',
                  borderRadius: 999,
                }}
              >
                <BadgeCheck className="w-3 h-3" /> Vérifié
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Star className="w-4 h-4" style={{ color: gold, fill: gold }} />
            <span className="body-f cream-hi" style={{ fontSize: 13, fontWeight: 600 }}>
              {(tasker.rating ?? 0).toFixed(1)}
            </span>
            <span className="body-f muted2" style={{ fontSize: 12 }}>
              ({tasker.reviewCount ?? 0} avis)
            </span>
            {tasker.hourlyRate != null && (
              <span className="body-f muted2" style={{ fontSize: 12 }}>
                · {formatPrice(tasker.hourlyRate)}/h
              </span>
            )}
          </div>
          {tasker.city && (
            <p className="body-f muted2" style={{ fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin className="w-3 h-3" /> {tasker.city}
              {tasker.distanceKm != null && <> · {tasker.distanceKm} km</>}
            </p>
          )}
          {tasker.serviceTypes && tasker.serviceTypes.length > 0 && (
            <p className="body-f muted2" style={{ fontSize: 12, marginTop: 6 }}>
              {tasker.serviceTypes.slice(0, 3).map((s) => SERVICE_TYPE_LABELS[s] ?? s).join(' · ')}
            </p>
          )}
          {tasker.message && (
            <p className="body-f muted" style={{ fontSize: 13, marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
              « {tasker.message} »
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
