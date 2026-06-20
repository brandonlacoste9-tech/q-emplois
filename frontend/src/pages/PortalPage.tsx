import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    title: "Bienvenue chez Québec emplois",
    sub: "Choisissez votre espace",
    client: {
      kicker: "Client",
      h: "J'ai besoin d'aide",
      d1: "Publiez une tâche — ménage, déménagement, montage.",
      d2: "Des travailleurs postulent; vous choisissez celui qui vous convient.",
      cta: "Publier une tâche",
    },
    jobs: {
      kicker: "Travailleur",
      h: "Je veux travailler",
      d1: "Ménage, déménagement, montage, jardinage…",
      d2: "Postulez aux jobs près de chez vous — alertes Telegram disponibles.",
      cta: "Devenir travailleur",
    },
    legal: "Conforme à la Loi 96 (langue) et à la Loi 25 (vie privée).",
  },
  en: {
    title: "Welcome to Québec emplois",
    sub: "Choose your path",
    client: {
      kicker: "Client",
      h: "I need help",
      d1: "Post a task — cleaning, moving, assembly.",
      d2: "Taskers apply; you pick the one you want.",
      cta: "Post a task",
    },
    jobs: {
      kicker: "Tasker",
      h: "I want to work",
      d1: "Cleaning, moving, assembly, yard work…",
      d2: "Apply to jobs near you — Telegram alerts available.",
      cta: "Become a tasker",
    },
    legal: "Compliant with Bill 96 (language) and Law 25 (privacy).",
  },
};

export function PortalPage() {
  const [lang, setLang] = useState<Lang>('fr');
  const t = T[lang];

  const Card = ({ to, kicker, h, d1, d2, cta }: { to: string; kicker: string; h: string; d1: string; d2: string; cta: string }) => (
    <div
      className="stitch-box stitch-box-interactive"
      style={{ flex: '1 1 300px', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 270, background: 'rgba(21,35,50,0.7)' }}
    >
      <div>
        <div className="serif gold" style={{ fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>{kicker}</div>
        <h3 className="serif cream-hi" style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: 12 }}>{h}</h3>
        <p className="body-f muted" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          {d1}<br />{d2}
        </p>
      </div>
      <Link to={to} className="gold-btn" style={{ textAlign: 'center', display: 'block', padding: 12, fontSize: 15 }}>{cta}</Link>
    </div>
  );

  return (
    <div className="leather" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          style={{ padding: '4px 12px', border: '1px dashed rgba(217,179,140,0.35)', borderRadius: 6, background: 'transparent', color: '#D9B38C', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <Link to="/"><BrandLogo size="lg" /></Link>
        <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, marginTop: 16 }}>{t.title}</h1>
        <p className="body-f gold" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 13, marginTop: 10, fontWeight: 600 }}>{t.sub}</p>
      </div>

      <div style={{ width: '100%', maxWidth: 720, display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Card to="/aide" {...t.client} />
        <Card to="/recrute" {...t.jobs} />
      </div>

      <p className="body-f muted2" style={{ marginTop: 44, fontSize: 12, textAlign: 'center' }}>
        {t.legal}{' '}
        <Link to="/politique-confidentialite" className="nav-link" style={{ fontSize: 12 }}>Politique de confidentialité</Link>
      </p>
    </div>
  );
}
