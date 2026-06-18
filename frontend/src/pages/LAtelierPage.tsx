import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { escrowService } from '../services/escrowService';
import { BrandLogo } from '../components/BrandLogo';
import { Loader2 } from 'lucide-react';

interface EscrowContract {
  id: string;
  taskDescription: string;
  totalAmount: number | string;
  status: string;
  milestones: Array<{
    id: string;
    description: string;
    amount: number | string;
    status: string;
  }>;
  client?: { firstName?: string; lastName?: string };
  provider?: { firstName?: string; lastName?: string };
}

export function LAtelierPage() {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [contracts, setContracts] = useState<EscrowContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    providerId: '',
    taskDescription: '',
    totalAmount: '',
    milestoneDesc: 'Jalon 1',
    milestoneAmount: '',
  });

  const load = () => {
    api.getEscrowContracts()
      .then(setContracts)
      .catch(() => addToast('Erreur de chargement L\'Atelier', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [addToast]);

  const totals = contracts.reduce((acc, c) => acc + Number(c.totalAmount), 0);
  const locked = contracts
    .filter((c) => c.status === 'locked')
    .reduce((acc, c) => acc + Number(c.totalAmount), 0);
  const taxReserves = escrowService.calculateTaxReserves(totals);

  const handleRelease = async (contractId: string, milestoneId: string) => {
    if (!window.confirm(lang === 'fr' ? 'Libérer les fonds pour ce jalon ?' : 'Release funds for this milestone?')) return;
    try {
      await api.releaseEscrowMilestone(contractId, milestoneId);
      addToast('Jalon libéré', 'success');
      load();
    } catch {
      addToast('Erreur lors de la libération', 'error');
    }
  };

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createEscrow({
        providerId: form.providerId,
        taskDescription: form.taskDescription,
        totalAmount: parseFloat(form.totalAmount),
        milestones: [{ description: form.milestoneDesc, amount: parseFloat(form.milestoneAmount || form.totalAmount) }],
      });
      addToast('Contrat escrow créé', 'success');
      setShowCreate(false);
      load();
    } catch {
      addToast('Stripe non configuré ou données invalides', 'error');
    } finally {
      setCreating(false);
    }
  };

  const t = {
    fr: {
      title: "L'Atelier",
      subtitle: 'Centre de commande — contrats escrow',
      revenue: 'Revenus totaux',
      escrow: 'En séquestre',
      taxes: 'Réserves TPS/TVQ',
      projects: 'Contrats actifs',
      newProject: 'Nouveau contrat',
      actionRelease: 'Libérer',
      empty: 'Aucun contrat escrow',
    },
    en: {
      title: "L'Atelier",
      subtitle: 'Command center — escrow contracts',
      revenue: 'Total revenue',
      escrow: 'In escrow',
      taxes: 'GST/QST reserves',
      projects: 'Active contracts',
      newProject: 'New contract',
      actionRelease: 'Release',
      empty: 'No escrow contracts',
    },
  }[lang];

  const isClient = profile?.role === 'client';

  return (
    <div className="leather" style={{ minHeight: '100vh', color: '#D9B38C' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', background: 'rgba(31,47,63,0.92)', borderBottom: '2px dashed rgba(217,179,140,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/dashboard"><BrandLogo size="md" /></Link>
          <span className="serif gold" style={{ fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.85rem' }}>L'Atelier</span>
        </div>
        <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} style={{ background: 'transparent', border: '1px dashed rgba(217,179,140,0.35)', color: '#D9B38C', padding: '4px 12px', cursor: 'pointer', borderRadius: 6, fontSize: 12 }}>
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </nav>

      <main style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ marginBottom: 40 }}>
          <h1 className="serif cream-hi" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 8 }}>{t.title}</h1>
          <p className="body-f gold">{t.subtitle}</p>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 className="w-8 h-8" style={{ animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
              {[
                { label: t.revenue, value: `$${totals.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}` },
                { label: t.escrow, value: `$${locked.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}` },
                { label: t.taxes, value: `$${taxReserves.total.toFixed(2)}` },
              ].map((card) => (
                <div key={card.label} className="stitch-box" style={{ background: 'rgba(21,35,50,0.6)', padding: 28 }}>
                  <p className="body-f gold" style={{ fontSize: 13, marginBottom: 8, textTransform: 'uppercase' }}>{card.label}</p>
                  <p className="serif cream-hi" style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{card.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="serif cream-hi" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{t.projects}</h2>
              {isClient && (
                <button className="gold-btn" style={{ padding: '10px 20px' }} onClick={() => setShowCreate(!showCreate)}>
                  + {t.newProject}
                </button>
              )}
            </div>

            {showCreate && isClient && (
              <form onSubmit={handleCreateEscrow} className="stitch-box" style={{ background: 'rgba(21,35,50,0.6)', padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <input className="q-field" placeholder="ID du travailleur (providerId)" value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })} required />
                  <input className="q-field" placeholder="Description de la tâche" value={form.taskDescription} onChange={(e) => setForm({ ...form, taskDescription: e.target.value })} required />
                  <input className="q-field" type="number" step="0.01" placeholder="Montant total ($)" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} required />
                  <input className="q-field" placeholder="Description jalon" value={form.milestoneDesc} onChange={(e) => setForm({ ...form, milestoneDesc: e.target.value })} />
                  <input className="q-field" type="number" step="0.01" placeholder="Montant jalon ($)" value={form.milestoneAmount} onChange={(e) => setForm({ ...form, milestoneAmount: e.target.value })} />
                  <button type="submit" disabled={creating} className="gold-btn" style={{ padding: 12 }}>{creating ? 'Création…' : 'Créer et financer via Stripe'}</button>
                </div>
              </form>
            )}

            {contracts.length === 0 ? (
              <p className="body-f muted" style={{ textAlign: 'center', padding: 32 }}>{t.empty}</p>
            ) : (
              <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.4)', overflow: 'auto' }}>
                <table className="body-f" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr className="gold" style={{ background: 'rgba(184,123,68,0.12)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: 16 }}>Description</th>
                      <th style={{ padding: 16 }}>Montant</th>
                      <th style={{ padding: 16 }}>Statut</th>
                      <th style={{ padding: 16 }}>Jalons</th>
                      <th style={{ padding: 16 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(217,179,140,0.08)' }}>
                        <td className="cream-hi" style={{ padding: 16 }}>{c.taskDescription}</td>
                        <td style={{ padding: 16 }}>${Number(c.totalAmount).toFixed(2)}</td>
                        <td style={{ padding: 16 }}>{c.status}</td>
                        <td style={{ padding: 16 }}>
                          {c.milestones.map((m) => (
                            <div key={m.id} style={{ fontSize: 12, marginBottom: 4 }}>
                              {m.description}: ${Number(m.amount).toFixed(2)} ({m.status})
                            </div>
                          ))}
                        </td>
                        <td style={{ padding: 16 }}>
                          {c.milestones.filter((m) => m.status === 'LOCKED').map((m) => (
                            <button key={m.id} onClick={() => handleRelease(c.id, m.id)} className="ghost-btn" style={{ fontSize: 12, padding: '4px 8px', marginRight: 4 }}>
                              {t.actionRelease}
                            </button>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default LAtelierPage;
