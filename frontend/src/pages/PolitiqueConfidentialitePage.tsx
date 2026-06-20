import { Link } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { Shield } from 'lucide-react';
import { gold } from '../styles/design-tokens';

export function PolitiqueConfidentialitePage() {
  return (
    <div className="leather" style={{ minHeight: '100vh', color: '#D9B38C' }}>
      <SiteNav lang="fr" onToggleLang={() => undefined} fixed />

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '120px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Shield className="w-8 h-8" style={{ color: gold }} />
          <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900 }}>
            Politique de confidentialité
          </h1>
        </div>

        <p className="body-f muted2" style={{ fontSize: 13, marginBottom: 28 }}>
          Dernière mise à jour : juin 2026 · Conforme à la Loi 25 (Québec)
        </p>

        <section className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24, marginBottom: 20 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Qui sommes-nous</h2>
          <p className="body-f muted" style={{ fontSize: 15, lineHeight: 1.75 }}>
            Québec emplois est une plateforme québécoise de services locaux qui met en relation des clients et des travailleurs indépendants.
            Responsable : Québec emplois — <a href="mailto:support@qemplois.ca" className="nav-link">support@qemplois.ca</a>
          </p>
        </section>

        <section className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24, marginBottom: 20 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Données collectées</h2>
          <ul className="body-f muted" style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Identité : nom, courriel, téléphone (avec votre consentement)</li>
            <li>Profil travailleur : services, zone, pièce d&apos;identité (vérification)</li>
            <li>Tâches : description, ville, secteur — adresse exacte révélée seulement au démarrage du travail</li>
            <li>Messages in-app entre client et travailleur choisi</li>
            <li>Alertes Telegram (opt-in explicite pour les travailleurs)</li>
          </ul>
        </section>

        <section className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24, marginBottom: 20 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Finalités</h2>
          <ul className="body-f muted" style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Publication et candidature aux tâches</li>
            <li>Notifications (courriel, Telegram si activé)</li>
            <li>Vérification d&apos;identité et confiance</li>
            <li>Support client et conformité légale</li>
          </ul>
        </section>

        <section className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24, marginBottom: 20 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Vos droits (Loi 25)</h2>
          <p className="body-f muted" style={{ fontSize: 15, lineHeight: 1.75 }}>
            Vous pouvez accéder à vos données, les corriger ou demander leur suppression en écrivant à{' '}
            <a href="mailto:support@qemplois.ca" className="nav-link">support@qemplois.ca</a>.
            Les travailleurs peuvent désactiver les alertes Telegram en répondant STOP ou dans leur profil.
          </p>
        </section>

        <section className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24, marginBottom: 28 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Conservation</h2>
          <p className="body-f muted" style={{ fontSize: 15, lineHeight: 1.75 }}>
            Les données sont conservées tant que votre compte est actif, puis supprimées ou anonymisées selon notre politique de rétention,
            sauf obligation légale contraire.
          </p>
        </section>

        <Link to="/" className="ghost-btn" style={{ padding: '10px 20px', fontSize: 14, textDecoration: 'none' }}>
          ← Retour à l&apos;accueil
        </Link>
      </article>

      <SiteFooter lang="fr" />
    </div>
  );
}
