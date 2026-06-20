import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeCanadianPhone } from '../utils/phone';
import { getApiErrorMessage } from '../utils/apiError';
import { BrandLogo } from '../components/BrandLogo';
import { buildClientBookingHref } from '../utils/booking';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    tag: 'Publiez des tâches, trouvez de l\'aide locale',
    steps: ['Vos informations', 'Mot de passe'],
    subs: ['Parlez-nous un peu de vous', 'Sécurisez votre compte'],
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Courriel',
    phone: 'Téléphone',
    pw: 'Mot de passe',
    confirm: 'Confirmer le mot de passe',
    pwHint: 'Minimum 8 caractères',
    consent:
      "J'accepte la collecte de mes données personnelles conformément à la Loi 25 (Québec).",
    back: 'Retour',
    next: 'Suivant',
    create: 'Créer mon compte',
    creating: 'Création…',
    haveAccount: 'Déjà un compte ?',
    login: 'Se connecter',
    errFill: 'Veuillez remplir tous les champs.',
    errPwLen: 'Le mot de passe doit contenir au moins 8 caractères.',
    errPwMatch: 'Les mots de passe ne correspondent pas.',
    errConsent: 'Le consentement est requis (Loi 25).',
    errGeneric: "Une erreur est survenue lors de l'inscription.",
  },
  en: {
    tag: 'Post tasks, find local help',
    steps: ['Your information', 'Password'],
    subs: ['Tell us a bit about you', 'Secure your account'],
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    pw: 'Password',
    confirm: 'Confirm password',
    pwHint: 'Minimum 8 characters',
    consent: 'I agree to the collection of my personal data under Québec Law 25.',
    back: 'Back',
    next: 'Next',
    create: 'Create my account',
    creating: 'Creating…',
    haveAccount: 'Already have an account?',
    login: 'Sign in',
    errFill: 'Please fill in all fields.',
    errPwLen: 'Password must be at least 8 characters.',
    errPwMatch: 'Passwords do not match.',
    errConsent: 'Consent is required (Law 25).',
    errGeneric: 'An error occurred during registration.',
  },
};

export function RegisterClient() {
  const [lang, setLang] = useState<Lang>('fr');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    consentGiven: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { registerClient } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const need = searchParams.get('need');
  const service = searchParams.get('service');
  const t = T[lang];

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError(t.errFill);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 8) {
      setError(t.errPwLen);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t.errPwMatch);
      return false;
    }
    if (!formData.consentGiven) {
      setError(t.errConsent);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateStep2()) return;
    setIsLoading(true);
    try {
      await registerClient({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: normalizeCanadianPhone(formData.phone),
      });
      navigate(buildClientBookingHref({ need: need ?? undefined, service: service ?? undefined, authenticated: true }));
    } catch (err) {
      setError(getApiErrorMessage(err, t.errGeneric));
      setIsLoading(false);
    }
  };

  return (
    <div
      className="leather"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <button
          type="button"
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          style={{
            padding: '4px 12px',
            border: '1px dashed rgba(217,179,140,0.35)',
            borderRadius: 6,
            background: 'transparent',
            color: '#D9B38C',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <Link to="/">
            <BrandLogo size="lg" />
          </Link>
          <p className="body-f muted2" style={{ fontSize: 13, marginTop: 8 }}>
            {t.tag}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              className="serif"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                background:
                  s <= step
                    ? 'linear-gradient(145deg, #B87B44, #8B5E30)'
                    : 'rgba(217,179,140,0.12)',
                color: s <= step ? '#1F2F3F' : '#9A8468',
                border: '2px solid rgba(217,179,140,0.3)',
              }}
            >
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>

        <div className="stitch-box" style={{ padding: '30px 28px', background: 'rgba(21,35,50,0.7)' }}>
          <h1 className="serif cream-hi" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {t.steps[step - 1]}
          </h1>
          <p className="body-f muted2" style={{ fontSize: 14, marginBottom: 22 }}>
            {t.subs[step - 1]}
          </p>

          {error && (
            <div
              className="body-f"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(180,60,60,0.15)',
                border: '1px solid rgba(220,90,90,0.4)',
                color: '#F0B4B4',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="q-label">{t.firstName}</label>
                    <input
                      className="q-field"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Marie"
                      required
                    />
                  </div>
                  <div>
                    <label className="q-label">{t.lastName}</label>
                    <input
                      className="q-field"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Gagnon"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="q-label">{t.email}</label>
                  <input
                    className="q-field"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="marie@courriel.com"
                    required
                  />
                </div>
                <div>
                  <label className="q-label">{t.phone}</label>
                  <input
                    className="q-field"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="5141234567"
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="q-label">{t.pw}</label>
                  <input
                    className="q-field"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="q-label">{t.confirm}</label>
                  <input
                    className="q-field"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                </div>
                <p className="body-f muted2" style={{ fontSize: 12 }}>
                  {t.pwHint}
                </p>
                <label
                  className="body-f"
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    fontSize: 13,
                    color: '#C4A882',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={(e) =>
                      setFormData({ ...formData, consentGiven: e.target.checked })
                    }
                    style={{ marginTop: 3 }}
                  />
                  {t.consent}
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {step > 1 ? (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  style={{ flex: 1, padding: '12px', fontSize: 15 }}
                >
                  {t.back}
                </button>
              ) : (
                <Link
                  to="/register"
                  className="ghost-btn"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: 15,
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t.back}
                </Link>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  className="gold-btn"
                  onClick={handleNext}
                  style={{ flex: 1, padding: '12px', fontSize: 15 }}
                >
                  {t.next}
                </button>
              ) : (
                <button
                  type="submit"
                  className="gold-btn"
                  disabled={isLoading}
                  style={{ flex: 1, padding: '12px', fontSize: 15 }}
                >
                  {isLoading ? t.creating : t.create}
                </button>
              )}
            </div>
          </form>

          <div className="body-f" style={{ marginTop: 22, textAlign: 'center', fontSize: 14 }}>
            <span className="muted2">{t.haveAccount} </span>
            <Link to="/login" className="gold" style={{ fontWeight: 600 }}>
              {t.login}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
