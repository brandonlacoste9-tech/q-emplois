import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { BrandLogo } from '../components/BrandLogo';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!token) {
      setError('Lien invalide.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      navigate('/login');
    } catch {
      setError('Lien invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leather" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="stitch-box" style={{ maxWidth: 420, width: '100%', padding: 32, background: 'rgba(21,35,50,0.85)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <BrandLogo size="md" />
          <h1 className="serif cream-hi" style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}>Nouveau mot de passe</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="q-label">Nouveau mot de passe</label>
          <input
            className="q-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            style={{ marginBottom: 12 }}
          />
          <label className="q-label">Confirmer</label>
          <input
            className="q-field"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            style={{ marginBottom: 16 }}
          />
          {error && <p className="body-f" style={{ color: '#C46B6B', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} className="gold-btn" style={{ width: '100%', padding: 12, fontSize: 15 }}>
            {loading ? 'Mise à jour…' : 'Réinitialiser'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/login" className="body-f muted2" style={{ fontSize: 13 }}>Retour à la connexion</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
