import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { api } from '../services/api';
import { SERVICE_TYPE_LABELS, type ServiceType } from '../types';
import { formatPrice } from '../utils';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { gold } from '../styles/design-tokens';
import { UserAvatar } from '../components/UserAvatar';

interface PublicTasker {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  serviceTypes: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  hourlyRate?: number;
  city?: string;
  memberSince?: string;
  avatar?: string;
  completionRate?: number | null;
  responseTimeMins?: number | null;
}

export function TaskerPublicPage() {
  const { userId } = useParams<{ userId: string }>();
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [profile, setProfile] = useState<PublicTasker | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api
      .getPublicTaskerProfile(userId)
      .then(setProfile)
      .catch(() => setError(lang === 'fr' ? 'Profil introuvable.' : 'Profile not found.'))
      .finally(() => setLoading(false));
  }, [userId, lang]);

  const name = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Travailleur'
    : '';

  return (
    <div className="leather" style={{ minHeight: '100vh', color: '#D9B38C' }}>
      <SiteNav lang={lang} onToggleLang={() => setLang(lang === 'fr' ? 'en' : 'fr')} />

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '120px 24px 64px' }}>
        {loading && <p className="body-f muted">Chargement…</p>}
        {error && (
          <>
            <p className="body-f muted" style={{ marginBottom: 16 }}>{error}</p>
            <Link to="/" className="ghost-btn" style={{ padding: '10px 18px', textDecoration: 'none' }}>← Accueil</Link>
          </>
        )}
        {profile && (
          <>
            <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.75)', padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <UserAvatar name={name} avatarUrl={profile.avatar} size={72} fontSize={28} />
                <div>
                  <h1 className="serif cream-hi" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Star className="w-4 h-4" style={{ color: gold, fill: gold }} />
                    <span className="body-f cream-hi" style={{ fontWeight: 600 }}>{profile.rating.toFixed(1)}</span>
                    <span className="body-f muted2" style={{ fontSize: 13 }}>({profile.reviewCount} avis)</span>
                    {profile.isVerified && (
                      <span className="body-f" style={{ fontSize: 12, color: '#7FB069', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <BadgeCheck className="w-4 h-4" /> Vérifié
                      </span>
                    )}
                  </div>
                  {profile.city && (
                    <p className="body-f muted2" style={{ fontSize: 13, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin className="w-4 h-4" /> {profile.city}
                    </p>
                  )}
                  {profile.hourlyRate != null && (
                    <p className="body-f muted" style={{ fontSize: 14, marginTop: 8 }}>{formatPrice(profile.hourlyRate)}/h</p>
                  )}
                  
                  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    {profile.completionRate != null && (
                      <span className="body-f" style={{ fontSize: 13, background: 'rgba(217,179,140,0.1)', padding: '4px 10px', borderRadius: 6, color: '#D9B38C' }}>
                        Taux de complétion: <strong>{profile.completionRate}%</strong>
                      </span>
                    )}
                    {profile.responseTimeMins != null && (
                      <span className="body-f" style={{ fontSize: 13, background: 'rgba(217,179,140,0.1)', padding: '4px 10px', borderRadius: 6, color: '#D9B38C' }}>
                        Temps de réponse: <strong>
                          {profile.responseTimeMins < 60 
                            ? `${profile.responseTimeMins} min` 
                            : `${Math.round(profile.responseTimeMins / 60)} h`}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {profile.serviceTypes.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h2 className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Services</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.serviceTypes.map((type) => (
                      <span
                        key={type}
                        className="body-f"
                        style={{ fontSize: 13, padding: '6px 12px', borderRadius: 999, border: '1px dashed rgba(217,179,140,0.35)', color: '#D9B38C' }}
                      >
                        {SERVICE_TYPE_LABELS[type as ServiceType] ?? type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.memberSince && (
                <p className="body-f muted2" style={{ fontSize: 12 }}>
                  Membre depuis {new Date(profile.memberSince).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            <p className="body-f muted2" style={{ fontSize: 13, marginTop: 24, textAlign: 'center' }}>
              <Link to="/register/client" className="nav-link">Publier une tâche</Link>
              {' · '}
              <Link to="/recrute" className="nav-link">Devenir travailleur</Link>
            </p>
          </>
        )}
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
