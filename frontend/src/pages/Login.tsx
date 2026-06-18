import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    tag: "Le marché de services local du Québec",
    title: "Connexion",
    sub: "Connectez-vous pour accéder à votre tableau de bord.",
    email: "Courriel",
    emailPh: "vous@courriel.com",
    pw: "Mot de passe",
    forgot: "Mot de passe oublié ?",
    submit: "Se connecter",
    loading: "Connexion…",
    noAccount: "Pas encore de compte ?",
    create: "Créer un compte",
    err: "Courriel ou mot de passe incorrect.",
    copy: "© 2026 Q-emplois. Tous droits réservés.",
  },
  en: {
    tag: "Québec's local services marketplace",
    title: "Log in",
    sub: "Sign in to access your dashboard.",
    email: "Email",
    emailPh: "you@email.com",
    pw: "Password",
    forgot: "Forgot password?",
    submit: "Sign in",
    loading: "Signing in…",
    noAccount: "No account yet?",
    create: "Create an account",
    err: "Incorrect email or password.",
    copy: "© 2026 Q-emplois. All rights reserved.",
  },
};

export function Login() {
  const [lang, setLang] = useState<Lang>('fr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const t = T[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
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
          <p className="body-f muted2" style={{ fontSize: 14, marginBottom: 24 }}>{t.sub}</p>

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
              <input id="password" className="q-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            <div style={{ textAlign: 'right' }}>
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
