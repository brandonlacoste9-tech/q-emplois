import { Link } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { Shield, Mail, CheckCircle } from 'lucide-react';
import { colors, gold } from '../styles/design-tokens';

const SUPPORT_EMAIL = 'support@qemplois.ca';

export function GarantiePage() {
  return (
    <div className="leather" style={{ minHeight: '100vh', color: colors.cream }}>
      <SiteNav lang="fr" onToggleLang={() => undefined} />

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '120px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Shield className="w-8 h-8" style={{ color: gold }} />
          <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900 }}>
            Garantie satisfaction Québec Emplois
          </h1>
        </div>

        <p className="body-f muted" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
          Nous voulons que chaque tâche se déroule bien. Si quelque chose ne va pas, voici comment nous vous accompagnons.
        </p>

        <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24, marginBottom: 20 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Notre engagement</h2>
          <ul className="body-f muted" style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Travailleurs avec profil public, avis et badge vérifié lorsque applicable</li>
            <li>Contact débloqué seulement après votre choix du travailleur</li>
            <li>Adresse complète visible au travailleur seulement au démarrage du job</li>
            <li>Annulation gratuite avec remboursement de crédit si plus de 24 h avant la date prévue</li>
            <li>Paiement en ligne optionnel (Stripe) après sélection du travailleur, ou arrangement direct entre vous</li>
          </ul>
        </div>

        <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24, marginBottom: 20 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle className="w-5 h-5" style={{ color: gold }} /> En cas de problème
          </h2>
          <ol className="body-f muted" style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Contactez d&apos;abord l&apos;autre partie via la messagerie de la plateforme</li>
            <li>Si le problème persiste, écrivez-nous avec le numéro de la tâche</li>
            <li>Notre équipe examine la situation sous 2 jours ouvrables</li>
          </ol>
        </div>

        <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Mail className="w-5 h-5" style={{ color: gold }} /> Nous joindre
          </h2>
          <p className="body-f muted" style={{ fontSize: 15, marginBottom: 12 }}>
            Courriel :{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: gold }}>{SUPPORT_EMAIL}</a>
          </p>
          <Link to="/dashboard" className="ghost-btn" style={{ padding: '10px 18px', fontSize: 14, textDecoration: 'none' }}>
            Retour au tableau de bord
          </Link>
        </div>
      </section>

      <SiteFooter lang="fr" />
    </div>
  );
}
