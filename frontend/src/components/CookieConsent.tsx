import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { gold } from '../styles/design-tokens';

const CONSENT_KEY = 'qemplois-cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented =
      localStorage.getItem(CONSENT_KEY) || localStorage.getItem('qworks-cookie-consent');
    if (!hasConsented) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="leather"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        borderTop: '2px dashed rgba(217,179,140,0.35)',
        padding: '20px 24px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'stretch',
        }}
        className="body-f"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Shield className="w-6 h-6" style={{ color: gold, flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              Respect de votre vie privée
            </h3>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Nous utilisons des cookies essentiels pour la session et l&apos;expérience. En continuant, vous acceptez notre{' '}
              <Link to="/politique-confidentialite" className="nav-link" style={{ fontSize: 13 }}>
                politique de confidentialité
              </Link>{' '}
              (Loi 25).
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleAccept} className="gold-btn" style={{ padding: '10px 22px', fontSize: 14 }}>
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
