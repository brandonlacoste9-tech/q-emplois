import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { SERVICE_TYPE_LABELS, type ServiceType, type PriceGuideRange } from '../types';
import { geocodeQuebecAddress } from '../utils/geocode';

// Curated subset for client posting UI — covers 90% of demand without overwhelming the user
const SERVICE_TYPES: { type: ServiceType; emoji: string }[] = [
  { type: 'menage',          emoji: '🧹' },
  { type: 'demenagement',    emoji: '📦' },
  { type: 'montage_meubles', emoji: '🔧' },
  { type: 'nettoyage',       emoji: '✨' },
  { type: 'jardinage',       emoji: '🌿' },
  { type: 'livraison',       emoji: '🚚' },
  { type: 'coursier',        emoji: '⚡' },
  { type: 'plomberie',       emoji: '🔩' },
  { type: 'electricite',     emoji: '💡' },
  { type: 'peinture',        emoji: '🎨' },
  { type: 'renovation',      emoji: '🏗️' },
  { type: 'informatique',    emoji: '💻' },
  { type: 'tutorat',         emoji: '📚' },
  { type: 'garderie',        emoji: '👶' },
  { type: 'promenade_animaux', emoji: '🐕' },
  { type: 'autre',           emoji: '⚙️' },
];

type Lang = 'fr' | 'en';

const T = {
  fr: {
    title: 'Publier une job',
    steps: ['Type de service', 'Détails & Adresse', 'Prix estimé'],
    subs: ['De quel type de service avez-vous besoin ?', 'Où et quand cela se passe-t-il ?', 'Quel est votre budget estimé ?'],
    jobTitle: 'Titre de la job (ex: Déménagement 3 1/2)',
    desc: 'Description détaillée',
    date: 'Date prévue',
    street: 'Rue',
    city: 'Ville',
    postal: 'Code postal',
    price: 'Budget estimé ($)',
    back: 'Retour', next: 'Suivant', create: 'Publier la job', creating: 'Publication…',
    errFill: 'Veuillez remplir tous les champs obligatoires.',
    errSvc: 'Veuillez sélectionner un type de service.',
    errPrice: 'Veuillez entrer un budget valide.',
    errGeneric: 'Une erreur est survenue lors de la publication.',
    success: 'Job publiée avec succès !',
    privacyNote: 'Sur le tableau des jobs, seuls la ville et le secteur sont visibles. Vous choisissez le travailleur parmi les candidats. Contact débloqué à la sélection; adresse exacte au démarrage.',
    priceGuide: 'Fourchette typique pour ce service',
  },
  en: {
    title: 'Post a Job',
    steps: ['Service Type', 'Details & Address', 'Estimated Price'],
    subs: ['What kind of service do you need?', 'Where and when is it happening?', 'What is your estimated budget?'],
    jobTitle: 'Job Title (e.g., Moving 1 bedroom apt)',
    desc: 'Detailed description',
    date: 'Scheduled date',
    street: 'Street',
    city: 'City',
    postal: 'Postal code',
    price: 'Estimated budget ($)',
    back: 'Back', next: 'Next', create: 'Post Job', creating: 'Posting…',
    errFill: 'Please fill in all required fields.',
    errSvc: 'Please select a service type.',
    errPrice: 'Please enter a valid budget.',
    errGeneric: 'An error occurred while posting.',
    success: 'Job posted successfully!',
    privacyNote: 'On the job board, only city and area are shown. You choose the tasker from applicants. Contact unlocks on selection; exact address when they start.',
    priceGuide: 'Typical range for this service',
  },
};

export function PostJob() {
  const [lang, setLang] = useState<Lang>('fr');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceType: '' as ServiceType | '',
    scheduledDate: '',
    estimatedPrice: '',
    street: '',
    city: '',
    postalCode: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [priceGuide, setPriceGuide] = useState<PriceGuideRange | null>(null);
  const navigate = useNavigate();
  const t = T[lang];

  useEffect(() => {
    if (step === 3 && formData.serviceType) {
      api.getPriceGuides(formData.city || undefined)
        .then((guides) => setPriceGuide(guides[formData.serviceType] ?? guides.autre ?? null))
        .catch(() => setPriceGuide(null));
    }
  }, [step, formData.serviceType, formData.city]);

  const validateStep1 = () => {
    if (!formData.serviceType) { setError(t.errSvc); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.title || !formData.description || !formData.street || !formData.city || !formData.postalCode) {
      setError(t.errFill); return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.estimatedPrice || isNaN(Number(formData.estimatedPrice))) { setError(t.errPrice); return false; }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };
  const handleBack = () => { setError(''); setStep(step - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateStep3()) return;
    setIsLoading(true);
    try {
      const coords = geocodeQuebecAddress(formData.city, formData.postalCode);
      await api.createJob({
        title: formData.title,
        description: formData.description,
        serviceType: formData.serviceType as ServiceType,
        estimatedPrice: Number(formData.estimatedPrice),
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : new Date().toISOString(),
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          coordinates: coords ?? undefined,
        },
      });
      setPosted(true);
    } catch (err) {
      setError(t.errGeneric);
      setIsLoading(false);
    }
  };

  if (posted) {
    return (
      <div className="leather" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚜️</div>
          <h1 className="serif cream-hi" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            {lang === 'fr' ? 'Job publiée !' : 'Job Posted!'}
          </h1>
          <p className="body-f muted" style={{ fontSize: 15, marginBottom: 28 }}>
            {lang === 'fr'
              ? 'Votre job est sur le tableau (ville et secteur seulement). À l\'acceptation, le travailleur verra votre contact. L\'adresse exacte sera partagée quand il démarre le job.'
              : 'Your job is on the board (city and area only). On accept, the tasker gets your contact. The exact address is shared when they start the job.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => navigate('/dashboard')} className="gold-btn" style={{ padding: '12px 24px', fontSize: 15 }}>
              {lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}
            </button>
            <button onClick={() => { setPosted(false); setStep(1); setFormData({ title: '', description: '', serviceType: '', scheduledDate: '', estimatedPrice: '', street: '', city: '', postalCode: '' }); }} className="ghost-btn" style={{ padding: '12px 24px', fontSize: 15 }}>
              {lang === 'fr' ? 'Publier une autre' : 'Post Another'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="leather" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          style={{ padding: '4px 12px', border: '1px dashed rgba(217,179,140,0.35)', borderRadius: 6, background: 'transparent', color: '#D9B38C', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h1 className="serif cream-hi" style={{ fontSize: 28, fontWeight: 700 }}>{t.title}</h1>
        </div>

        {/* Step indicator */}
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
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{emoji}</span>
                      <span style={{ flex: 1 }}>{label}</span>
                      {selected && <span style={{ color: '#B87B44', fontSize: 12 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="q-label">{t.jobTitle}</label>
                  <input className="q-field" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Nettoyage complet" required />
                </div>
                <div>
                  <label className="q-label">{t.desc}</label>
                  <textarea className="q-field" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Détails du travail..." required style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label className="q-label">{t.date}</label>
                  <input className="q-field" type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="q-label">{t.street}</label>
                    <input className="q-field" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} placeholder="123 Rue Principale" required />
                  </div>
                  <div>
                    <label className="q-label">{t.city}</label>
                    <input className="q-field" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Montréal" required />
                  </div>
                  <div>
                    <label className="q-label">{t.postal}</label>
                    <input className="q-field" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} placeholder="H2X 1Y6" required />
                  </div>
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
                  <input className="q-field" type="number" value={formData.estimatedPrice} onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })} placeholder="150" required min="1" />
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
                  {isLoading ? t.creating : t.create}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
