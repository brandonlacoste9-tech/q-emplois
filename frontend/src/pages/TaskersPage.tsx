import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { TaskerCard } from '../components/TaskerCard';
import { buildClientBookingHref } from '../utils/booking';
import { SERVICE_TYPE_LABELS, type ServiceType, type TaskerCardData } from '../types';
import { useAuth } from '../context/AuthContext';
import { Loader2, Search } from 'lucide-react';
import { gold } from '../styles/design-tokens';

const POPULAR: { service: ServiceType; label: string }[] = [
  { service: 'menage', label: 'Ménage' },
  { service: 'demenagement', label: 'Déménagement' },
  { service: 'montage_meubles', label: 'Montage' },
  { service: 'jardinage', label: 'Jardinage' },
];

export function TaskersPage() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [taskers, setTaskers] = useState<TaskerCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(searchParams.get('city') ?? 'Montréal');
  const [postalCode, setPostalCode] = useState(searchParams.get('postalCode') ?? '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verifiedOnly') === 'true');
  const service = (searchParams.get('service') as ServiceType) || 'menage';

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.searchTaskers({
        serviceType: service,
        city: city || undefined,
        postalCode: postalCode || undefined,
        verifiedOnly: verifiedOnly || undefined,
      });
      setTaskers(data);
    } catch {
      setTaskers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [service, city, postalCode, verifiedOnly]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('service', service);
    if (city) params.set('city', city);
    if (postalCode) params.set('postalCode', postalCode);
    setSearchParams(params);
    load();
  };

  return (
    <div className="leather" style={{ minHeight: '100vh', color: '#D9B38C' }}>
      <SiteNav lang={lang} onToggleLang={() => setLang(lang === 'fr' ? 'en' : 'fr')} />

      <section style={{ maxWidth: 960, margin: '0 auto', padding: '120px 24px 64px' }}>
        <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, marginBottom: 8 }}>
          {lang === 'fr' ? 'Travailleurs près de chez vous' : 'Taskers near you'}
        </h1>
        <p className="body-f muted" style={{ marginBottom: 24, maxWidth: 560 }}>
          {lang === 'fr'
            ? 'Consultez les profils, puis publiez une tâche — les travailleurs peuvent postuler et vous choisissez.'
            : 'Browse profiles, then post a task — workers apply and you choose.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {POPULAR.map((item) => (
            <Link
              key={item.service}
              to={`/taskers?service=${item.service}${city ? `&city=${encodeURIComponent(city)}` : ''}`}
              className="ghost-btn"
              style={{
                padding: '8px 14px',
                fontSize: 13,
                textDecoration: 'none',
                borderColor: service === item.service ? gold : undefined,
                color: service === item.service ? '#E8CDB0' : undefined,
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <form onSubmit={applyFilters} className="stitch-box" style={{ padding: 20, background: 'rgba(21,35,50,0.7)', marginBottom: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="q-label">{lang === 'fr' ? 'Service' : 'Service'}</label>
            <select
              className="q-field"
              value={service}
              onChange={(e) => setSearchParams({ service: e.target.value, ...(city ? { city } : {}), ...(postalCode ? { postalCode } : {}) })}
            >
              {POPULAR.map((p) => (
                <option key={p.service} value={p.service}>{SERVICE_TYPE_LABELS[p.service]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="q-label">{lang === 'fr' ? 'Ville' : 'City'}</label>
            <input className="q-field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Montréal" />
          </div>
          <div>
            <label className="q-label">{lang === 'fr' ? 'Code postal' : 'Postal code'}</label>
            <input className="q-field" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="H2X 1Y6" />
          </div>
          <div>
            <label className="q-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              {lang === 'fr' ? 'Vérifiés seulement' : 'Verified only'}
            </label>
          </div>
          <button type="submit" className="gold-btn" style={{ padding: '12px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Search className="w-4 h-4" /> {lang === 'fr' ? 'Rechercher' : 'Search'}
          </button>
        </form>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 className="w-8 h-8" style={{ color: gold, animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : taskers.length === 0 ? (
          <div className="stitch-box" style={{ padding: 32, textAlign: 'center', background: 'rgba(21,35,50,0.6)' }}>
            <p className="body-f muted" style={{ marginBottom: 16 }}>
              {lang === 'fr' ? 'Aucun travailleur trouvé pour ces critères.' : 'No taskers found for these filters.'}
            </p>
            <Link
              to={buildClientBookingHref({ service, need: SERVICE_TYPE_LABELS[service], authenticated: isAuthenticated })}
              className="gold-btn"
              style={{ padding: '10px 20px', textDecoration: 'none' }}
            >
              {lang === 'fr' ? 'Publier une tâche quand même' : 'Post a task anyway'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {taskers.map((tasker) => (
              <TaskerCard
                key={tasker.id}
                tasker={tasker}
                action={
                  <Link
                    to={buildClientBookingHref({
                      service,
                      need: `${SERVICE_TYPE_LABELS[service]} — ${tasker.firstName ?? 'travailleur'}`,
                      authenticated: isAuthenticated,
                    })}
                    className="gold-btn"
                    style={{ padding: '8px 14px', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    {lang === 'fr' ? 'Publier une tâche' : 'Post a task'}
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
