import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { SERVICE_TYPE_LABELS, type ServiceType, type PriceGuideRange } from '../types';
import { geocodeQuebecAddress } from '../utils/geocode';
import { parseServiceParam } from '../utils/booking';
import { BrandLogo } from './BrandLogo';
import { AddressAutocomplete } from './AddressAutocomplete';

const SERVICE_TYPES: { type: ServiceType; emoji: string }[] = [
  { type: 'menage', emoji: '🧹' },
  { type: 'demenagement', emoji: '📦' },
  { type: 'montage_meubles', emoji: '🔧' },
  { type: 'nettoyage', emoji: '✨' },
  { type: 'jardinage', emoji: '🌿' },
  { type: 'livraison', emoji: '🚚' },
  { type: 'coursier', emoji: '⚡' },
  { type: 'plomberie', emoji: '🔩' },
  { type: 'electricite', emoji: '💡' },
  { type: 'peinture', emoji: '🎨' },
  { type: 'renovation', emoji: '🏗️' },
  { type: 'informatique', emoji: '💻' },
  { type: 'tutorat', emoji: '📚' },
  { type: 'garderie', emoji: '👶' },
  { type: 'promenade_animaux', emoji: '🐕' },
  { type: 'autre', emoji: '⚙️' },
];

export type BookingFormData = {
  title: string;
  description: string;
  serviceType: ServiceType | '';
  scheduledDate: string;
  estimatedPrice: string;
  street: string;
  city: string;
  postalCode: string;
};

type Lang = 'fr' | 'en';

const T = {
  fr: {
    title: 'Publier une tâche',
    guestTitle: 'Décrivez votre besoin',
    steps: ['Type de service', 'Détails & lieu', 'Budget'],
    subs: ['De quel type de service avez-vous besoin ?', 'Où et quand ? (ville et code postal suffisent pour commencer)', 'Quel est votre budget ?'],
    jobTitle: 'Titre (optionnel)',
    desc: 'Détails (optionnel)',
    date: 'Date souhaitée (optionnel)',
    street: 'Rue (optionnel — à compléter après sélection)',
    city: 'Ville',
    postal: 'Code postal',
    price: 'Budget ($)',
    back: 'Retour',
    next: 'Suivant',
    create: 'Publier la tâche',
    guestCreate: 'Continuer — créer mon compte',
    creating: 'Publication…',
    errFill: 'Ville et code postal sont requis.',
    errSvc: 'Veuillez sélectionner un type de service.',
    errPrice: 'Veuillez entrer un budget valide.',
    errGeneric: 'Une erreur est survenue.',
    successTitle: 'Tâche publiée !',
    successBody: 'Les travailleurs près de chez vous sont notifiés. Vous recevrez une alerte dès qu\'il y a des candidats.',
    successHint: 'Les candidatures arrivent généralement en quelques heures.',
    viewTask: 'Voir ma tâche',
    dashboard: 'Tableau de bord',
    postAnother: 'Publier une autre',
    privacyNote: 'Seuls la ville et le secteur sont visibles sur le tableau. L\'adresse exacte sera partagée au démarrage du travail.',
    priceGuide: 'Fourchette typique',
    login: 'Déjà un compte ?',
  },
  en: {
    title: 'Post a task',
    guestTitle: 'Describe what you need',
    steps: ['Service type', 'Details & location', 'Budget'],
    subs: ['What kind of service do you need?', 'Where and when? (city and postal code are enough to start)', 'What is your budget?'],
    jobTitle: 'Title (optional)',
    desc: 'Details (optional)',
    date: 'Preferred date (optional)',
    street: 'Street (optional — add after you select a tasker)',
    city: 'City',
    postal: 'Postal code',
    price: 'Budget ($)',
    back: 'Back',
    next: 'Next',
    create: 'Post task',
    guestCreate: 'Continue — create my account',
    creating: 'Posting…',
    errFill: 'City and postal code are required.',
    errSvc: 'Please select a service type.',
    errPrice: 'Please enter a valid budget.',
    errGeneric: 'Something went wrong.',
    successTitle: 'Task posted!',
    successBody: 'Workers near you are being notified. You\'ll get an alert when applicants arrive.',
    successHint: 'Applications usually arrive within a few hours.',
    viewTask: 'View my task',
    dashboard: 'Dashboard',
    postAnother: 'Post another',
    privacyNote: 'Only city and area are shown on the board. Exact address is shared when work starts.',
    priceGuide: 'Typical range',
    login: 'Already have an account?',
  },
};

const emptyForm = (): BookingFormData => ({
  title: '',
  description: '',
  serviceType: '',
  scheduledDate: '',
  estimatedPrice: '',
  street: '',
  city: '',
  postalCode: '',
});

function defaultTitle(data: BookingFormData): string {
  if (data.title.trim()) return data.title.trim();
  const label = data.serviceType ? (SERVICE_TYPE_LABELS[data.serviceType] ?? data.serviceType) : 'Tâche';
  return data.city ? `${label} — ${data.city}` : label;
}

function buildJobPayload(data: BookingFormData) {
  const title = defaultTitle(data);
  const description = data.description.trim() || title;
  const street = data.street.trim() || `Secteur ${data.postalCode.trim()}`;
  const coords = geocodeQuebecAddress(data.city, data.postalCode);
  return {
    title,
    description,
    serviceType: data.serviceType as ServiceType,
    estimatedPrice: Number(data.estimatedPrice),
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : new Date().toISOString(),
    address: {
      street,
      city: data.city,
      postalCode: data.postalCode,
      coordinates: coords ?? undefined,
    },
  };
}

interface JobBookingWizardProps {
  mode: 'authenticated' | 'guest';
  searchParams: URLSearchParams;
  onPublished?: (jobId: string) => void;
  onGuestComplete?: (data: BookingFormData) => void;
}

export function JobBookingWizard({ mode, searchParams, onPublished, onGuestComplete }: JobBookingWizardProps) {
  const [lang, setLang] = useState<Lang>('fr');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(emptyForm);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [priceGuide, setPriceGuide] = useState<PriceGuideRange | null>(null);
  const [postedJobId, setPostedJobId] = useState<string | null>(null);
  const t = T[lang];
  const isGuest = mode === 'guest';

  useEffect(() => {
    const need = searchParams.get('need')?.trim();
    const service = parseServiceParam(searchParams.get('service'));
    setFormData((prev) => ({
      ...prev,
      ...(need ? { title: prev.title || need, description: prev.description || need } : {}),
      ...(service ? { serviceType: service } : {}),
    }));
    if (service) setStep(2);
  }, [searchParams]);

  useEffect(() => {
    if (step === 3 && formData.serviceType) {
      api.getPriceGuides(formData.city || undefined)
        .then((guides) => {
          const guide = guides[formData.serviceType] ?? guides.autre ?? null;
          setPriceGuide(guide);
          if (guide && !formData.estimatedPrice) {
            const suggested = Math.round((guide.min + guide.max) / 2);
            setFormData((prev) => ({ ...prev, estimatedPrice: String(suggested) }));
          }
        })
        .catch(() => setPriceGuide(null));
    }
  }, [step, formData.serviceType, formData.city]);

  const validateStep1 = () => {
    if (!formData.serviceType) {
      setError(t.errSvc);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.city.trim() || !formData.postalCode.trim()) {
      setError(t.errFill);
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.estimatedPrice || isNaN(Number(formData.estimatedPrice))) {
      setError(t.errPrice);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateStep3()) return;

    if (isGuest) {
      onGuestComplete?.(formData);
      return;
    }

    setIsLoading(true);
    try {
      const job = await api.createJob(buildJobPayload(formData));
      setPostedJobId(job.id);
      setPosted(true);
      onPublished?.(job.id);
    } catch {
      setError(t.errGeneric);
      setIsLoading(false);
    }
  };

  if (posted) {
    return (
      <div style={{ minHeight: isGuest ? '100vh' : '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚜️</div>
          <h1 className="serif cream-hi" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{t.successTitle}</h1>
          <p className="body-f muted" style={{ fontSize: 15, marginBottom: 12, lineHeight: 1.6 }}>{t.successBody}</p>
          <p className="body-f muted2" style={{ fontSize: 13, marginBottom: 28 }}>{t.successHint}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {postedJobId && (
              <Link to={`/jobs/${postedJobId}`} className="gold-btn" style={{ padding: '12px 24px', fontSize: 15, textDecoration: 'none' }}>
                {t.viewTask}
              </Link>
            )}
            <Link to="/dashboard" className="ghost-btn" style={{ padding: '12px 24px', fontSize: 15, textDecoration: 'none' }}>
              {t.dashboard}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: isGuest ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {isGuest && (
        <div style={{ width: '100%', maxWidth: 500, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}><BrandLogo size="sm" /></Link>
          <Link to="/login" className="nav-link" style={{ fontSize: 13 }}>{t.login}</Link>
        </div>
      )}

      <div style={{ position: isGuest ? 'static' : 'absolute', top: 20, right: 24, alignSelf: isGuest ? 'flex-end' : undefined, width: isGuest ? '100%' : undefined, maxWidth: isGuest ? 500 : undefined, display: 'flex', justifyContent: 'flex-end', marginBottom: isGuest ? 8 : 0 }}>
        <button
          type="button"
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          style={{ padding: '4px 12px', border: '1px dashed rgba(217,179,140,0.35)', borderRadius: 6, background: 'transparent', color: '#D9B38C', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h1 className="serif cream-hi" style={{ fontSize: 28, fontWeight: 700 }}>{isGuest ? t.guestTitle : t.title}</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="serif"
              style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                background: s <= step ? 'linear-gradient(145deg, #B87B44, #8B5E30)' : 'rgba(217,179,140,0.12)',
                color: s <= step ? '#1F2F3F' : '#9A8468',
                border: '2px solid rgba(217,179,140,0.3)',
              }}
            >
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>

        <div className="stitch-box" style={{ padding: '30px 28px', background: 'rgba(21,35,50,0.7)' }}>
          <h2 className="serif cream-hi" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.steps[step - 1]}</h2>
          <p className="body-f muted2" style={{ fontSize: 14, marginBottom: 22 }}>{t.subs[step - 1]}</p>

          {error && (
            <div className="body-f" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(180,60,60,0.15)', border: '1px solid rgba(220,90,90,0.4)', color: '#F0B4B4', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {SERVICE_TYPES.map(({ type, emoji }) => {
                  const selected = formData.serviceType === type;
                  const label = SERVICE_TYPE_LABELS[type] || type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceType: type })}
                      className="body-f"
                      style={{
                        padding: '12px 14px', borderRadius: 8, textAlign: 'left', fontSize: 14, cursor: 'pointer',
                        border: selected ? '1.5px solid #B87B44' : '1.5px dashed rgba(217,179,140,0.3)',
                        background: selected ? 'rgba(184,123,68,0.18)' : 'rgba(15,25,36,0.4)',
                        color: selected ? '#E8CDB0' : '#C4A882',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{emoji}</span>
                      <span style={{ flex: 1 }}>{label}</span>
                      {selected && <span style={{ color: '#B87B44', fontSize: 12 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <AddressAutocomplete
                  lang={lang}
                  onSelect={(addr) =>
                    setFormData((prev) => ({
                      ...prev,
                      street: addr.street || prev.street,
                      city: addr.city || prev.city,
                      postalCode: addr.postalCode || prev.postalCode,
                    }))
                  }
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="q-label">{t.city}</label>
                    <input className="q-field" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Montréal" required />
                  </div>
                  <div>
                    <label className="q-label">{t.postal}</label>
                    <input className="q-field" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} placeholder="H2X 1Y6" required />
                  </div>
                </div>
                <div>
                  <label className="q-label">{t.date}</label>
                  <input className="q-field" type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} />
                </div>
                <div>
                  <label className="q-label">{t.jobTitle}</label>
                  <input className="q-field" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Ménage 2 chambres" />
                </div>
                <div>
                  <label className="q-label">{t.desc}</label>
                  <textarea className="q-field" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Détails du travail…" style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label className="q-label">{t.street}</label>
                  <input className="q-field" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} placeholder="123 Rue Principale" />
                </div>
                <p className="body-f muted2" style={{ fontSize: 12, lineHeight: 1.5, padding: '10px 12px', borderRadius: 8, background: 'rgba(184,123,68,0.1)', border: '1px dashed rgba(217,179,140,0.25)' }}>
                  🔒 {t.privacyNote}
                </p>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {priceGuide && (
                  <p className="body-f muted" style={{ fontSize: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(184,123,68,0.1)', border: '1px dashed rgba(217,179,140,0.25)' }}>
                    {t.priceGuide}: <strong className="cream-hi">{priceGuide.min}–{priceGuide.max} $</strong>
                    {priceGuide.unit === 'hour' ? '/h' : ''}
                  </p>
                )}
                <div>
                  <label className="q-label">{t.price}</label>
                  <input className="q-field" type="number" value={formData.estimatedPrice} onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })} placeholder="80" required min="1" />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {step > 1 && (
                <button type="button" className="ghost-btn" onClick={handleBack} style={{ flex: 1, padding: '12px', fontSize: 15 }}>
                  {t.back}
                </button>
              )}
              {step < 3 ? (
                <button type="button" className="gold-btn" onClick={handleNext} style={{ flex: 1, padding: '12px', fontSize: 15 }}>
                  {t.next}
                </button>
              ) : (
                <button type="submit" className="gold-btn" disabled={isLoading} style={{ flex: 1, padding: '12px', fontSize: 15 }}>
                  {isLoading ? t.creating : isGuest ? t.guestCreate : t.create}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { buildJobPayload, defaultTitle, emptyForm };
