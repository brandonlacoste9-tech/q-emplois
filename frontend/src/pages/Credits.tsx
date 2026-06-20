import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatPrice } from '../utils';
import { CREDIT_PACKS, type CreditPackKey } from '../utils/creditPacks';
import { Coins, Award, Loader2, ShoppingCart, AlertCircle } from 'lucide-react';
import { gold } from '../styles/design-tokens';
import { getApiErrorMessage } from '../utils/apiError';

export function Credits() {
  const { canTask, setMode } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [balance, setBalance] = useState({ balance: 0, isFoundingTasker: false, lifetimeDiscountPercent: 0 });
  const [packs, setPacks] = useState(CREDIT_PACKS);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [transactions, setTransactions] = useState<Array<{ id: string; amount: number; type: string; description?: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<CreditPackKey | null>(null);

  useEffect(() => {
    if (canTask) setMode('tasker');
  }, [canTask, setMode]);

  const load = useCallback(async () => {
    if (!canTask) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [bal, pk, txs, payConfig] = await Promise.all([
        api.getCreditBalance(),
        api.getCreditPacks().catch(() => CREDIT_PACKS),
        api.getTransactions().catch(() => []),
        api.getPaymentConfig().catch(() => ({ configured: false, publishableKey: null })),
      ]);
      setBalance(bal);
      setPacks({ ...CREDIT_PACKS, ...pk } as typeof CREDIT_PACKS);
      setStripeConfigured(payConfig.configured);
      setTransactions(
        txs.map((t) => ({
          id: t.id,
          amount: t.netAmount,
          type: t.type,
          description: t.description,
          createdAt: t.createdAt,
        })),
      );
    } catch {
      addToast('Erreur lors du chargement des crédits', 'error');
      setPacks(CREDIT_PACKS);
      setStripeConfigured(false);
    } finally {
      setLoading(false);
    }
  }, [canTask, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('success')) {
      addToast('Achat de crédits réussi!', 'success');
      load();
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('cancelled')) {
      addToast('Achat annulé', 'info');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, addToast, load, setSearchParams]);

  const handlePurchase = async (pack: CreditPackKey) => {
    if (stripeConfigured === false) {
      addToast('Paiement Stripe non configuré sur le serveur', 'error');
      return;
    }
    setPurchasing(pack);
    try {
      const { checkoutUrl } = await api.purchaseCreditPack(pack);
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      addToast('Stripe non configuré — impossible de démarrer le paiement', 'error');
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Impossible de démarrer le paiement'), 'error');
    } finally {
      setPurchasing(null);
    }
  };

  if (!canTask) {
    return (
      <div className="leather" style={{ minHeight: '100vh', padding: '32px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p className="body-f muted">Configurez votre profil travailleur pour acheter des crédits.</p>
          <Link to="/profile?setup=tasker" className="gold-btn" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', textDecoration: 'none' }}>
            Activer le mode travailleur
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, marginBottom: 8 }}>
          Mes crédits
        </h1>
        <p className="body-f muted" style={{ marginBottom: 28 }}>
          1 crédit = 1 candidature à une tâche
        </p>

        {stripeConfigured === false && (
          <div className="stitch-box body-f" style={{ background: 'rgba(196,107,107,0.12)', padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#C46B6B', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="cream-hi" style={{ fontWeight: 600, marginBottom: 4 }}>Paiement en ligne bientôt disponible</p>
              <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                Stripe n&apos;est pas encore configuré sur l&apos;API. Les boutons d&apos;achat seront actifs dès que les clés Stripe seront ajoutées sur Railway.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 className="w-8 h-8" style={{ color: gold, animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 32 }}>
              <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24 }}>
                <Coins className="w-8 h-8" style={{ color: gold, marginBottom: 12 }} />
                <p className="body-f muted2" style={{ fontSize: 13 }}>Solde actuel</p>
                <p className="serif cream-hi" style={{ fontSize: 36, fontWeight: 900 }}>{balance.balance}</p>
              </div>
              {balance.isFoundingTasker && (
                <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24 }}>
                  <Award className="w-8 h-8" style={{ color: gold, marginBottom: 12 }} />
                  <p className="body-f muted2" style={{ fontSize: 13 }}>Founding Tasker</p>
                  <p className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700 }}>
                    +{balance.lifetimeDiscountPercent}% crédits bonus sur achats
                  </p>
                </div>
              )}
            </div>

            <h2 className="serif cream-hi" style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Acheter des crédits</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 36 }}>
              {(Object.entries(packs) as [CreditPackKey, (typeof CREDIT_PACKS)[CreditPackKey]][]).map(([key, pack]) => (
                <div key={key} className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 20, display: 'flex', flexDirection: 'column' }}>
                  <p className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700 }}>{pack.label}</p>
                  <p className="body-f muted" style={{ fontSize: 14, margin: '8px 0 16px' }}>{formatPrice(pack.priceCad)}</p>
                  <button
                    type="button"
                    onClick={() => handlePurchase(key)}
                    disabled={purchasing === key || stripeConfigured === false}
                    className="gold-btn"
                    style={{ marginTop: 'auto', padding: 10, fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: stripeConfigured === false ? 0.5 : 1 }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {purchasing === key ? 'Redirection…' : 'Acheter'}
                  </button>
                </div>
              ))}
            </div>

            <h2 className="serif cream-hi" style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Historique</h2>
            <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 0, overflow: 'hidden' }}>
              {transactions.length === 0 ? (
                <p className="body-f muted" style={{ padding: 24, textAlign: 'center' }}>Aucune transaction</p>
              ) : (
                transactions.slice(0, 20).map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(217,179,140,0.08)' }}>
                    <div>
                      <p className="body-f cream-hi" style={{ fontSize: 14 }}>{tx.description}</p>
                      <p className="body-f muted2" style={{ fontSize: 12 }}>{new Date(tx.createdAt).toLocaleDateString('fr-CA')}</p>
                    </div>
                    <span className="body-f" style={{ fontWeight: 700, color: tx.amount >= 0 ? '#7FB069' : '#C46B6B' }}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
