import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    h1: "Le marché de services local",
    sub: "De l'aide près de chez vous : déneigement, déménagement, montage de meubles et entraide de voisin à voisin. Travailleurs vérifiés, prix clairs et vie privée renforcée.",
    findCta: "Trouver un pro",
    postCta: "Offrir mes services",
    cards: [
      { t: "Travailleurs vérifiés", d: "Identité confirmée, avis réels et badge vérifié sur les candidatures." },
      { t: "Vous choisissez", d: "Plusieurs travailleurs postulent; vous sélectionnez celui qui vous convient." },
      { t: "Prix clair d'avance", d: "Fourchettes typiques et budget affichés avant de publier." },
    ],
  },
  en: {
    h1: "The local services marketplace",
    sub: "Trusted help near you: snow removal, moving, furniture assembly and neighbor-to-neighbor help. Verified taskers, clear pricing and stronger privacy.",
    findCta: "Find a pro",
    postCta: "Offer my services",
    cards: [
      { t: "Verified workers", d: "Confirmed identity, real reviews and verified badge on applicants." },
      { t: "You choose", d: "Multiple taskers apply; you pick the one that fits." },
      { t: "Clear price upfront", d: "Typical ranges and budget shown before you post." },
    ],
  },
};

export function QJobsPage() {
  const [lang, setLang] = useState<Lang>('fr');
  const t = T[lang];

  return (
    <div className="leather" style={{ minHeight: '100vh', color: '#D9B38C' }}>
      <SiteNav lang={lang} onToggleLang={() => setLang(lang === 'fr' ? 'en' : 'fr')} />

      {/* Hero */}
      <section style={{ padding: '120px 24px 70px', maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block', padding: '6px 16px', marginBottom: 22, borderRadius: 999,
            border: '1px dashed rgba(217,179,140,0.4)', background: 'rgba(184,123,68,0.08)',
            color: '#D9B38C', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
            fontFamily: "'Lora', Georgia, serif",
          }}
        >
          ⚜ Q-jobs
        </div>
        <h1 className="serif cream-hi" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 18 }}>
          {t.h1}
        </h1>
        <p className="body-f muted" style={{ fontSize: 'clamp(1rem, 2.3vw, 1.18rem)', maxWidth: 680, margin: '0 auto 36px', lineHeight: 1.6 }}>
          {t.sub}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/register/client" className="gold-btn" style={{ padding: '14px 28px', fontSize: 15 }}>{t.findCta}</Link>
          <Link to="/register/tasker" className="ghost-btn" style={{ padding: '14px 28px', fontSize: 15 }}>{t.postCta}</Link>
        </div>
      </section>

      <div className="stitch-h" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* Trust cards */}
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
