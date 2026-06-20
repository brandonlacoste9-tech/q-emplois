import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { BarChart3, Check, ExternalLink, Shield, X } from 'lucide-react';
import { gold } from '../styles/design-tokens';

const card: React.CSSProperties = { background: 'rgba(21,35,50,0.7)', padding: 20 };

interface BetaMetrics {
  periodDays: number;
  tasksPosted: number;
  tasksOpen: number;
  applicationsTotal: number;
  pendingApplications: number;
  applyCreditsSpent: number;
  refundTransactions: number;
  avgApplicationsPerOpenJob: number;
  selectionRatePercent: number;
  completionRatePercent: number;
  pendingVerifications: number;
  recentTasks: Array<{ id: string; title: string; status: string; applications: number; createdAt: string }>;
}

interface PendingVerification {
  id: string;
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  serviceTypes: string[];
  licenseDocumentUrl?: string | null;
  licenseNumber?: string | null;
  updatedAt: string;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

const REJECTION_PRESETS = [
  'Document illisible (flou, coupé, sombre).',
  'Document expiré ou périmé.',
  'Photo d\'écran plutôt que photo du document original.',
  'Le nom ne correspond pas au profil.',
  'Document dans une langue non reconnue (permis hors Québec non couvert pour l\'instant).',
];

export function AdminPage() {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState<BetaMetrics | null>(null);
  const [pending, setPending] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingVerification | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectConfirm, setRejectConfirm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([api.getAdminMetrics(), api.getPendingVerifications()]);
      setMetrics(m);
      setPending(p);
    } catch {
      addToast('Accès admin requis', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (providerId: string) => {
    setProcessing(providerId);
    try {
      await api.approveVerification(providerId);
      addToast('Travailleur vérifié', 'success');
      await load();
    } catch {
      addToast('Erreur', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const reject = async () => {
    if (!rejecting) return;
    if (!rejectConfirm) {
      setRejectConfirm(true);
      return;
    }
    const reason = rejectReason.trim();
    if (!reason) {
      addToast('Motif requis pour rejeter', 'error');
      return;
    }
    setProcessing(rejecting.id);
    try {
      await api.rejectVerification(rejecting.id, reason);
      addToast('Document rejeté — motif envoyé par courriel', 'info');
      setRejecting(null);
      setRejectReason('');
      setRejectConfirm(false);
      await load();
    } catch {
      addToast('Erreur', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const cancelReject = () => {
    setRejecting(null);
    setRejectReason('');
    setRejectConfirm(false);
  };

  if (loading) {
    return (
      <div className="leather" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid rgba(217,179,140,0.2)`, borderBottomColor: gold, animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <BarChart3 className="w-8 h-8" style={{ color: gold }} />
          <div>
            <h1 className="serif cream-hi" style={{ fontSize: 28, fontWeight: 900 }}>Admin Beta</h1>
            <p className="body-f muted2" style={{ fontSize: 14 }}>Métriques et vérifications — {metrics?.periodDays ?? 30} derniers jours</p>
          </div>
        </div>

        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Tâches publiées', value: metrics.tasksPosted },
              { label: 'Ouvertes', value: metrics.tasksOpen },
              { label: 'Candidatures', value: metrics.applicationsTotal },
              { label: 'En attente', value: metrics.pendingApplications },
              { label: 'Moy. candidatures/job', value: metrics.avgApplicationsPerOpenJob },
              { label: 'Taux sélection', value: `${metrics.selectionRatePercent}%` },
              { label: 'Taux complétion', value: `${metrics.completionRatePercent}%` },
              { label: 'Remboursements', value: metrics.refundTransactions },
              { label: 'ID à vérifier', value: metrics.pendingVerifications },
            ].map((s) => (
              <div key={s.label} className="stitch-box" style={card}>
                <p className="body-f muted2" style={{ fontSize: 12 }}>{s.label}</p>
                <p className="serif cream-hi" style={{ fontSize: 24, fontWeight: 900 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="stitch-box" style={{ ...card, marginBottom: 28 }}>
          <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield className="w-5 h-5" style={{ color: gold }} /> Vérifications en attente ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="body-f muted">Aucun document en attente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map((p) => (
                <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: 12, background: 'rgba(15,25,36,0.5)', borderRadius: 8 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p className="serif cream-hi" style={{ fontWeight: 700 }}>{p.firstName} {p.lastName}</p>
                    <p className="body-f muted2" style={{ fontSize: 13 }}>{p.email}</p>
                    <p className="body-f muted2" style={{ fontSize: 12 }}>{p.serviceTypes.join(', ')}</p>
                    {p.rejectedAt && p.rejectionReason && (
                      <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(196,107,107,0.12)', border: '1px solid rgba(196,107,107,0.3)', borderRadius: 6 }}>
                        <p className="body-f" style={{ fontSize: 11, color: '#E8A0A0', fontWeight: 600, marginBottom: 2 }}>
                          Rejet précédent · {new Date(p.rejectedAt).toLocaleDateString('fr-CA')}
                        </p>
                        <p className="body-f" style={{ fontSize: 12, color: '#E8D5C5' }}>{p.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                  {p.licenseDocumentUrl && (
                    <a href={p.licenseDocumentUrl} target="_blank" rel="noreferrer" className="ghost-btn" style={{ padding: '8px 12px', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ExternalLink className="w-4 h-4" /> Voir document
                    </a>
                  )}
                  <button type="button" disabled={processing === p.id} onClick={() => approve(p.id)} className="gold-btn" style={{ padding: '8px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Check className="w-4 h-4" /> Approuver
                  </button>
                  <button type="button" disabled={processing === p.id} onClick={() => { setRejecting(p); setRejectConfirm(false); setRejectReason(''); }} className="ghost-btn" style={{ padding: '8px 14px', fontSize: 13, color: '#C46B6B', borderColor: 'rgba(196,107,107,0.35)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <X className="w-4 h-4" /> Rejeter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {metrics && metrics.recentTasks.length > 0 && (
          <div className="stitch-box" style={card}>
            <h2 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Tâches récentes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metrics.recentTasks.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                  <Link to={`/jobs/${t.id}`} className="body-f cream-hi" style={{ textDecoration: 'none' }}>{t.title}</Link>
                  <span className="body-f muted2">{t.applications} candid. · {t.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {rejecting && (
        <div role="dialog" aria-modal="true" onClick={cancelReject} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} className="stitch-box" style={{ ...card, maxWidth: 520, width: '100%' }}>
            <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              Rejeter le document
            </h3>
            <p className="body-f muted2" style={{ fontSize: 13, marginBottom: 16 }}>
              {rejecting.firstName} {rejecting.lastName} — {rejecting.email}
            </p>

            <label className="body-f muted2" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              Motif (sera envoyé au travailleur par courriel)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); if (rejectConfirm) setRejectConfirm(false); }}
              placeholder="Expliquez pourquoi le document est refusé..."
              rows={4}
              maxLength={500}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15,25,36,0.6)',
                border: '1px solid rgba(217,179,140,0.25)',
                color: '#F5E6D3',
                fontFamily: 'inherit',
                fontSize: 14,
                resize: 'vertical',
                marginBottom: 10,
              }}
            />

            <div style={{ marginBottom: 16 }}>
              <p className="body-f muted2" style={{ fontSize: 11, marginBottom: 6 }}>Suggestions rapides :</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {REJECTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      background: 'rgba(217,179,140,0.08)',
                      border: '1px solid rgba(217,179,140,0.2)',
                      color: '#D9B38C',
                      borderRadius: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={cancelReject}
                className="ghost-btn"
                style={{ padding: '10px 16px', fontSize: 14 }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={processing === rejecting.id || !rejectReason.trim()}
                onClick={reject}
                className="ghost-btn"
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  color: rejectConfirm ? '#fff' : '#C46B6B',
                  background: rejectConfirm ? '#C46B6B' : 'transparent',
                  borderColor: '#C46B6B',
                  cursor: processing === rejecting.id || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: !rejectReason.trim() ? 0.5 : 1,
                }}
              >
                {processing === rejecting.id ? 'Envoi...' : rejectConfirm ? 'Confirmer le rejet' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
