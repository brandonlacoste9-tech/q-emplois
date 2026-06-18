import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    title: 'Rejoindre Q-emplois',
    sub: 'Comment voulez-vous utiliser la plateforme ?',
    client: {
      emoji: '🏠',
      title: "J'ai besoin d'aide",
      desc: 'Publiez une tâche — déménagement, ménage, montage — et trouvez un pro local.',
      cta: 'Créer un compte client',
    },
    tasker: {
      emoji: '💪',
      title: 'Je veux gagner de l\'argent',
      desc: 'Inscrivez-vous comme travailleur, parcourez les jobs et acceptez celles près de chez vous.',
      cta: 'Créer un compte travailleur',
    },
    haveAccount: 'Déjà un compte ?',
    login: 'Se connecter',
  },
  en: {
    title: 'Join Q-emplois',
    sub: 'How do you want to use the platform?',
    client: {
      emoji: '🏠',
      title: 'I need help',
      desc: 'Post a task — moving, cleaning, assembly — and find a local pro.',
      cta: 'Create a client account',
    },
    tasker: {
      emoji: '💪',
      title: 'I want to earn money',
      desc: 'Sign up as a tasker, browse jobs and accept ones near you.',
      cta: 'Create a tasker account',
    },
    haveAccount: 'Already have an account?',
    login: 'Sign in',
  },
};

export function RegisterChoose() {
  const [lang, setLang] = useState<Lang>('fr');
  const t = T[lang];

  const Card = ({
    to,
    emoji,
    title,
    desc,
    cta,
  }: {
    to: string;
    emoji: string;
    title: string;
    desc: string;
    cta: string;
  }) => (
    <Link
      to={to}
      className="stitch-box stitch-box-interactive"
      style={{
        flex: '1 1 260px',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'rgba(21,35,50,0.7)',
        textDecoration: 'none',
        minHeight: 220,
      }}
    >
      <span style={{ fontSize: 36 }}>{emoji}</span>
      <h2 className="serif cream-hi" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
        {title}
      </h2>
      <p className="body-f muted" style={{ fontSize: 14, lineHeight: 1.55, flex: 1, margin: 0 }}>
        {desc}
      </p>
      <span className="gold-btn" style={{ display: 'block', textAlign: 'center', padding: '11px 16px', fontSize: 14 }}>
        {cta}
      </span>
    </Link>
  );

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

      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/">
            <BrandLogo size="lg" />
          </Link>
          <h1 className="serif cream-hi" style={{ fontSize: 26, fontWeight: 900, marginTop: 16 }}>
            {t.title}
          </h1>
          <p className="body-f muted2" style={{ fontSize: 14, marginTop: 8 }}>
            {t.sub}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Card to="/register/client" {...t.client} />
          <Card to="/register/tasker" {...t.tasker} />
        </div>

        <p className="body-f" style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
          <span className="muted2">{t.haveAccount} </span>
          <Link to="/login" className="gold" style={{ fontWeight: 600 }}>
            {t.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
