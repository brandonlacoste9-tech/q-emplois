import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    h1: "L'élite des métiers du Québec",
    sub: "Accès aux meilleurs entrepreneurs vérifiés RBQ : plomberie, électricité et construction de prestige. Contrats encadrés, paiement en fiducie et conformité québécoise.",
    vipCta: "Soumettre un projet",
    joinCta: "Rejoindre l'élite (RBQ)",
    atelier: "Accéder à L'Atelier",
    cards: [
      { t: "Validation RBQ", d: "Vérification des licences et assurances avant chaque mandat." },
      { t: "Contrats encadrés", d: "Paiement en fiducie avec libération par jalon, via L'Atelier." },
      { t: "Données au Québec", d: "Vos historiques de chantiers restent hébergés au Québec (Loi 25)." },
    ],
  },
  en: {
    h1: "Québec's elite trades",
    sub: "Access to the best RBQ-verified contractors: plumbing, electrical and prestige construction. Structured contracts, escrow payment and Québec compliance.",
    vipCta: "Submit a project",
    joinCta: "Join the elite (RBQ)",
    atelier: "Access L'Atelier",
    cards: [
      { t: "RBQ validation", d: "Licences and insurance verified before every mandate." },
      { t: "Structured contracts", d: "Escrow payment with milestone release, via L'Atelier." },
      { t: "Data stays in Québec", d: "Your project history is hosted in Québec (Law 25)." },
    ],
  },
};

export function QBusinessPage() {
  const [lang, setLang] = useState<Lang>('fr');
  const t = T[lang];

  return (
    <div className="leather" style={{ minHeight: '100vh', color: '#D9B38C' }}>
      <SiteNav lang={lang} onToggleLang={() => setLang(lang === 'fr' ? 'en' : 'fr')} />

      {/* Hero */}
      <section style={{ padding: '120px 24px 70px', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block', padding: '6px 16px', marginBottom: 22, borderRadius: 999,
            border: '1px dashed rgba(217,179,140,0.4)', background: 'rgba(184,123,68,0.08)',
            color: '#D9B38C', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
            fontFamily: "'Lora', Georgia, serif",
          }}
        >
          ⚜ Q-business
        </div>
        <h1 className="serif cream-hi" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 18 }}>
          {t.h1}
        </h1>
        <p className="body-f muted" style={{ fontSize: 'clamp(1rem, 2.3vw, 1.18rem)', maxWidth: 700, margin: '0 auto 36px', lineHeight: 1.6 }}>
          {t.sub}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/latelier" className="gold-btn" style={{ padding: '14px 28px', fontSize: 15 }}>{t.vipCta}</Link>
          <Link to="/register" className="ghost-btn" style={{ padding: '14px 28px', fontSize: 15 }}>{t.joinCta}</Link>
        </div>
      </section>

      <div className="stitch-h" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* Feature cards */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {t.cards.map((c, i) => (
            <div key={i} className="stitch-box" style={{ padding: '28px 24px', textAlign: 'center' }}>
              <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{c.t}</h3>
              <p className="body-f muted2" style={{ fontSize: 14, lineHeight: 1.55 }}>{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
