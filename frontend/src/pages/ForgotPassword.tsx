import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { BrandLogo } from '../components/BrandLogo';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leather" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="stitch-box" style={{ maxWidth: 420, width: '100%', padding: 32, background: 'rgba(21,35,50,0.85)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <BrandLogo size="md" />
          <h1 className="serif cream-hi" style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}>Mot de passe oublié</h1>
          <p className="body-f muted2" style={{ fontSize: 14, marginTop: 8 }}>
            Entrez votre courriel pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <p className="body-f muted" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              Si ce courriel existe dans notre système, un lien de réinitialisation a été envoyé.
            </p>
            <Link to="/login" className="gold-btn" style={{ padding: '10px 20px', fontSize: 14, textDecoration: 'none' }}>
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="q-label">Courriel</label>
            <input
              className="q-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@courriel.com"
              required
              style={{ marginBottom: 16 }}
            />
            {error && <p className="body-f" style={{ color: '#C46B6B', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" disabled={loading} className="gold-btn" style={{ width: '100%', padding: 12, fontSize: 15 }}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" className="body-f muted2" style={{ fontSize: 13 }}>Retour à la connexion</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
