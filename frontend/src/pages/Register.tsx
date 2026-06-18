import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { normalizeCanadianPhone } from '../utils/phone';
import { getApiErrorMessage } from '../utils/apiError';
import { BrandLogo } from '../components/BrandLogo';
import { SERVICE_TYPE_LABELS, type ServiceType } from '../types';

const SERVICE_TYPES: ServiceType[] = [
  'menage',
  'demenagement',
  'montage_meubles',
  'nettoyage',
  'jardinage',
  'livraison',
  'coursier',
  'bricolage',
  'manutention',
  'informatique',
  'serveur',
  'autre',
];

type Lang = 'fr' | 'en';

const T = {
  fr: {
    tag: "Trouvez des jobs près de chez vous — comme TaskRabbit",
    steps: ['Informations personnelles', 'Créer un mot de passe', 'Types de services'],
    subs: ['Parlez-nous un peu de vous', 'Choisissez un mot de passe sécurisé', 'Quels services pouvez-vous offrir ?'],
    firstName: 'Prénom', lastName: 'Nom', email: 'Courriel', phone: 'Téléphone',
    pw: 'Mot de passe', confirm: 'Confirmer le mot de passe', pwHint: 'Minimum 8 caractères',
    back: 'Retour', next: 'Suivant', create: 'Créer mon compte', creating: 'Création…',
    haveAccount: 'Déjà un compte ?', login: 'Se connecter',
    errFill: 'Veuillez remplir tous les champs.',
    errPwLen: 'Le mot de passe doit contenir au moins 8 caractères.',
    errPwMatch: 'Les mots de passe ne correspondent pas.',
    errSvc: 'Veuillez sélectionner au moins un type de service.',
    errConsent: 'Le consentement est requis (Loi 25).',
    consent: "J'accepte la collecte de mes données personnelles conformément à la Loi 25 (Québec).",
    errGeneric: "Une erreur est survenue lors de l'inscription.",
  },
  en: {
    tag: "Find jobs near you — like TaskRabbit",
    steps: ['Personal information', 'Create a password', 'Service types'],
    subs: ['Tell us a bit about you', 'Choose a secure password', 'What services can you offer?'],
    firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone',
    pw: 'Password', confirm: 'Confirm password', pwHint: 'Minimum 8 characters',
    back: 'Back', next: 'Next', create: 'Create my account', creating: 'Creating…',
    haveAccount: 'Already have an account?', login: 'Sign in',
    errFill: 'Please fill in all fields.',
    errPwLen: 'Password must be at least 8 characters.',
    errPwMatch: 'Passwords do not match.',
    errSvc: 'Please select at least one service type.',
    errConsent: 'Consent is required (Law 25).',
    consent: 'I agree to the collection of my personal data under Québec Law 25.',
    errGeneric: 'An error occurred during registration.',
  },
};

export function Register() {
  const [lang, setLang] = useState<Lang>('fr');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', serviceTypes: [] as ServiceType[],
    consentGiven: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const t = T[lang];

  const toggleServiceType = (type: ServiceType) => {
    setFormData((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(type)
        ? prev.serviceTypes.filter((s) => s !== type)
        : [...prev.serviceTypes, type],
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError(t.errFill); return false;
    }
    return true;
  };
  const validateStep2 = () => {
    if (formData.password.length < 8) { setError(t.errPwLen); return false; }
    if (formData.password !== formData.confirmPassword) { setError(t.errPwMatch); return false; }
    return true;
  };
  const validateStep3 = () => {
    if (formData.serviceTypes.length === 0) { setError(t.errSvc); return false; }
    if (!formData.consentGiven) { setError(t.errConsent); return false; }
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
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: normalizeCanadianPhone(formData.phone),
        serviceTypes: formData.serviceTypes,
      });
      try {
        const bal = await api.getCreditBalance();
        if (bal.isFoundingTasker) {
          alert(`🎉 Bienvenue! Vous avez reçu ${bal.balance} crédits founding tasker gratuits!`);
        }
      } catch { /* profile loading */ }
      navigate('/jobs');
    } catch (err) {
      setError(getApiErrorMessage(err, t.errGeneric));
      setIsLoading(false);
    }
  };

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

      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <Link to="/"><BrandLogo size="lg" /></Link>
          <p className="body-f muted2" style={{ fontSize: 13, marginTop: 8 }}>{t.tag}</p>
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
          <h1 className="serif cream-hi" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.steps[step - 1]}</h1>
          <p className="body-f muted2" style={{ fontSize: 14, marginBottom: 22 }}>{t.subs[step - 1]}</p>

          {error && (
            <div className="body-f" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(180,60,60,0.15)', border: '1px solid rgba(220,90,90,0.4)', color: '#F0B4B4', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="q-label">{t.firstName}</label>
                    <input className="q-field" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Jean" required />
                  </div>
                  <div>
                    <label className="q-label">{t.lastName}</label>
                    <input className="q-field" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Tremblay" required />
                  </div>
                </div>
                <div>
                  <label className="q-label">{t.email}</label>
                  <input className="q-field" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jean@courriel.com" required />
                </div>
                <div>
                  <label className="q-label">{t.phone}</label>
                  <input className="q-field" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(514) 123-4567" required />
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="q-label">{t.pw}</label>
                  <input className="q-field" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" required />
                </div>
                <div>
                  <label className="q-label">{t.confirm}</label>
                  <input className="q-field" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="••••••••" required />
                </div>
                <p className="body-f muted2" style={{ fontSize: 12 }}>{t.pwHint}</p>
              </div>
            )}

            {step === 3 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {SERVICE_TYPES.map((type) => {
                    const selected = formData.serviceTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleServiceType(type)}
                        className="body-f"
                        style={{
                          padding: '12px 14px', borderRadius: 8, textAlign: 'left', fontSize: 14, cursor: 'pointer',
                          border: selected ? '1.5px solid #B87B44' : '1.5px dashed rgba(217,179,140,0.3)',
                          background: selected ? 'rgba(184,123,68,0.18)' : 'transparent',
                          color: selected ? '#E8CDB0' : '#C4A882',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {SERVICE_TYPE_LABELS[type]}
                        {selected && <span style={{ color: '#B87B44' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                <label className="body-f" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#C4A882', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                    style={{ marginTop: 3 }}
                  />
                  {t.consent}
                </label>
              </>
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

          <div className="body-f" style={{ marginTop: 22, textAlign: 'center', fontSize: 14 }}>
            <span className="muted2">{t.haveAccount}</span>{' '}
            <Link to="/login" className="gold" style={{ fontWeight: 600 }}>{t.login}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
