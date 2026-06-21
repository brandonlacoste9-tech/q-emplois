import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BrandLogo } from '../components/BrandLogo';
import { Eye, EyeOff } from 'lucide-react';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    tag: "Le marché de services local du Québec",
    title: "Connexion",
    sub: "Connectez-vous pour accéder à votre tableau de bord.",
    welcomeBack: "Bon retour, {name} !",
    remember: "Se souvenir de moi",
    email: "Courriel",
    emailPh: "vous@courriel.com",
    pw: "Mot de passe",
    forgot: "Mot de passe oublié ?",
    submit: "Se connecter",
    loading: "Connexion…",
    noAccount: "Pas encore de compte ?",
    create: "Créer un compte",
    err: "Courriel ou mot de passe incorrect.",
    copy: "© 2026 Québec emplois. Tous droits réservés.",
  },
  en: {
    tag: "Québec's local services marketplace",
    title: "Log in",
    sub: "Sign in to access your dashboard.",
    welcomeBack: "Welcome back, {name}!",
    remember: "Remember me",
    email: "Email",
    emailPh: "you@email.com",
    pw: "Password",
    forgot: "Forgot password?",
    submit: "Sign in",
    loading: "Signing in…",
    noAccount: "No account yet?",
    create: "Create an account",
    err: "Incorrect email or password.",
    copy: "© 2026 Québec emplois. All rights reserved.",
  },
};

export function Login() {
  const [lang, setLang] = useState<Lang>('fr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('qemplois_remember_me') === 'true';
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const t = T[lang];

  useEffect(() => {
    if (rememberMe) {
      const savedEmail = localStorage.getItem('qemplois_remember_email');
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      const profileData = await api.getProfile();
      
      if (rememberMe) {
        localStorage.setItem('qemplois_remember_me', 'true');
        localStorage.setItem('qemplois_remember_email', email);
        localStorage.setItem('qemplois_remember_name', profileData.firstName || '');
      } else {
        localStorage.removeItem('qemplois_remember_me');
        localStorage.removeItem('qemplois_remember_email');
        localStorage.removeItem('qemplois_remember_name');
      }

      const savedMode = localStorage.getItem('qemplois_mode');
      const taskerReady = (profileData.serviceTypes?.length ?? 0) > 0 || profileData.isTaskerEnabled;
      navigate(savedMode === 'tasker' && taskerReady ? '/jobs' : '/dashboard');
    } catch (err) {
      setError(t.err);
    } finally {
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

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/"><BrandLogo size="lg" /></Link>
          <p className="body-f muted2" style={{ fontSize: 13, marginTop: 8 }}>{t.tag}</p>
        </div>

        <div className="stitch-box" style={{ padding: '32px 28px', background: 'rgba(21,35,50,0.7)' }}>
          <h1 className="serif cream-hi" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{t.title}</h1>
          <p className="body-f muted2" style={{ fontSize: 14, marginBottom: 24 }}>
            {rememberMe && localStorage.getItem('qemplois_remember_name')
              ? t.welcomeBack.replace('{name}', localStorage.getItem('qemplois_remember_name')!)
              : t.sub}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div className="body-f" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(180,60,60,0.15)', border: '1px solid rgba(220,90,90,0.4)', color: '#F0B4B4', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div>
              <label className="q-label" htmlFor="email">{t.email}</label>
              <input id="email" className="q-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPh} required />
            </div>

            <div>
              <label className="q-label" htmlFor="password">{t.pw}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  className="q-field"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(217,179,140,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <label className="body-f muted" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    cursor: 'pointer',
                    accentColor: '#B87B44',
                    width: 15,
                    height: 15,
                    border: '1.5px dashed rgba(217,179,140,0.35)',
                    borderRadius: 4,
                  }}
                />
                {t.remember}
              </label>
              <Link to="/forgot-password" className="nav-link body-f" style={{ fontSize: 13 }}>{t.forgot}</Link>
            </div>

            <button type="submit" className="gold-btn" disabled={isLoading} style={{ padding: '12px', fontSize: 15, width: '100%' }}>
              {isLoading ? t.loading : t.submit}
            </button>
          </form>

          <div className="body-f" style={{ marginTop: 22, textAlign: 'center', fontSize: 14 }}>
            <span className="muted2">{t.noAccount}</span>{' '}
            <Link to="/register" className="gold" style={{ fontWeight: 600 }}>{t.create}</Link>
          </div>
        </div>

        <p className="body-f muted2" style={{ textAlign: 'center', fontSize: 12, marginTop: 24 }}>{t.copy}</p>
      </div>
    </div>
  );
}
