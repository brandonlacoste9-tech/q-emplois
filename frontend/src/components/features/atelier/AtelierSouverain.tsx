/**
 * L'Atelier — Écosystème de Recrutement Souverain
 * Esthétique "Saddle" / Palette Impériale
 * Trinité Financière : Revenu Net, TPS/TVQ, Coffre-fort
 * Opportunités Max (TI-GUY) : Chasses actives en temps réel
 * Dossier Photo + Facturation Impériale
 */

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Camera,
  FileText,
  TrendingUp,
} from 'lucide-react';

const theme = {
  cuirBleu: '#1F2F3F',
  orChaud: '#B87B44',
  filCreme: '#D9B38C',
};

export interface Lead {
  id: string;
  titre: string;
  client: string;
  localisation: string;
  montant_net: number;
  tps: number;
  tvq: number;
  total_coffre_fort?: number;
  sceau_authenticite: boolean;
  source?: string;
  status?: string;
}

export interface AtelierSouverainProps {
  apiUrl?: string;
  /** ID du Pro connecté (Passeport Professionnel) */
  proId?: string;
}

export function AtelierSouverain({
  apiUrl = 'http://localhost:3001',
  proId = '33333333-3333-3333-3333-333333333302',
}: AtelierSouverainProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (leadId: string, region?: string) => {
    if (!proId) return;
    setClaimingId(leadId);
    try {
      const res = await fetch(`${apiUrl}/api/traction/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'lead_claim',
          pro_id: proId,
          lead_id: leadId,
          metadata: { region: region ?? 'Québec' },
        }),
      });
      if (res.ok) {
        alert("Contrat revendiqué avec succès. Sceau d'authenticité apposé.");
      } else {
        const data = await res.json();
        alert(data.error ?? 'Échec de la revendication.');
      }
    } catch (err) {
      console.error('Échec de la revendication souveraine.', err);
      alert('Impossible de joindre le serveur.');
    } finally {
      setClaimingId(null);
    }
  };

  const handlePartnerClick = async () => {
    if (!proId) return;
    try {
      await fetch(`${apiUrl}/api/traction/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'partner_click',
          pro_id: proId,
          metadata: { region: 'Québec' },
        }),
      });
    } catch {
      // Silencieux
    }
    // TODO: Ouvrir page Assurance
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/leads`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data);
        }
      } catch (err) {
        console.error('Erreur lors de la patrouille de Max:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000); // Rafraîchissement toutes les 30s
    return () => clearInterval(interval);
  }, [apiUrl]);
  // Logique Fiscale Québécoise
  const montantNet = 1450.0;
  const tps = montantNet * 0.05;
  const tvq = montantNet * 0.09975;
  const totalCoffreFort = montantNet + tps + tvq;

  return (
    <div
      className="min-h-screen p-4 font-sans text-stone-200 selection:bg-[#B87B44]/30 md:p-10"
      style={{ backgroundColor: theme.cuirBleu }}
    >
      {/* Conteneur Impérial avec Bordure Cousue */}
      <div
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] border-2 border-dashed p-6 shadow-2xl md:p-12"
        style={{
          borderColor: theme.filCreme,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
        }}
      >
        {/* En-tête : Identité Qué-Emplois */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 border-b border-stone-800 pb-10 md:flex-row md:items-center">
          <div>
            <h1
              className="mb-2 font-serif text-5xl tracking-tight"
              style={{ color: theme.filCreme }}
            >
              L'Atelier
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] italic opacity-60">
              Propulsé par Northern Ventures — Québec
            </p>
          </div>
          <div
            className="flex items-center gap-3 rounded-full border px-6 py-3 shadow-inner"
            style={{
              borderColor: theme.orChaud + '40',
              backgroundColor: theme.orChaud + '10',
            }}
          >
            <ShieldCheck style={{ color: theme.orChaud }} size={20} />
            <div className="flex flex-col">
              <span
                className="text-[10px] font-bold uppercase tracking-tighter"
                style={{ color: theme.orChaud }}
              >
                Profil Vérifié
              </span>
              <span className="text-[9px] italic opacity-70">
                Conformité RBQ Active
              </span>
            </div>
          </div>
        </div>

        {/* La Trinité Financière */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-stone-800 bg-black/30 p-8 backdrop-blur-sm">
            <p className="mb-4 text-[10px] font-bold italic uppercase tracking-widest opacity-50">
              Revenu Net Pro
            </p>
            <h2 className="text-4xl font-light">
              {montantNet.toLocaleString('fr-CA', {
                style: 'currency',
                currency: 'CAD',
              })}
            </h2>
          </div>

          <div className="rounded-3xl border border-stone-800 bg-black/30 p-8 backdrop-blur-sm">
            <p className="mb-4 text-[10px] font-bold italic uppercase tracking-widest opacity-50">
              Redevances (TPS/TVQ)
            </p>
            <h2 className="text-4xl font-light">
              {(tps + tvq).toLocaleString('fr-CA', {
                style: 'currency',
                currency: 'CAD',
              })}
            </h2>
            <div className="mt-3 flex gap-4 text-[9px] font-bold uppercase tracking-tighter opacity-40">
              <span>TPS: {tps.toFixed(2)} $</span>
              <span>TVQ: {tvq.toFixed(2)} $</span>
            </div>
          </div>

          <div
            className="relative rounded-3xl border-2"
            style={{
              borderColor: theme.orChaud + '60',
              backgroundColor: theme.orChaud + '05',
              boxShadow: '0 0 40px rgba(184,123,68,0.1)',
            }}
          >
            <div className="flex items-center justify-between p-8 pb-0">
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: theme.orChaud }}
              >
                Le Coffre-fort
              </p>
              <Lock style={{ color: theme.orChaud }} size={16} />
            </div>
            <div className="p-8 pt-4">
              <h2
                className="text-4xl font-semibold italic"
                style={{ color: theme.filCreme }}
              >
                {totalCoffreFort.toLocaleString('fr-CA', {
                  style: 'currency',
                  currency: 'CAD',
                })}
              </h2>
              <p className="mt-3 font-serif text-[10px] italic opacity-70">
                Fonds en séquestre sécurisés
              </p>
            </div>
          </div>
        </div>

        {/* Opportunités Max (TI-GUY) — Chasses Actives */}
        <div className="mt-16">
          <div className="mb-8 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: theme.orChaud }}
              />
              <h3
                className="text-sm font-black uppercase tracking-[0.3em]"
                style={{ color: theme.filCreme }}
              >
                Radar de Max (TI-GUY)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading && leads.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-stone-800 p-12 text-center opacity-20">
                <p className="text-xs uppercase tracking-[0.2em] italic">
                  Chargement du radar...
                </p>
              </div>
            ) : leads.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-stone-800 p-12 text-center opacity-20">
                <p className="text-xs uppercase tracking-[0.2em] italic">
                  Max patrouille le Québec pour vous...
                </p>
              </div>
            ) : (
              leads.map((lead) => (
                <div
                  key={lead.id}
                  className="group rounded-[2rem] border-2 bg-black/20 p-8 transition-all hover:bg-black/40"
                  style={{ borderColor: theme.orChaud + '30' }}
                >
                  <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div>
                      <div className="mb-2 flex gap-2">
                        <span
                          className="rounded border px-2 py-0.5 text-[9px] font-bold uppercase"
                          style={{
                            color: theme.orChaud,
                            borderColor: theme.orChaud + '40',
                          }}
                        >
                          {lead.localisation}
                        </span>
                        {lead.sceau_authenticite && (
                          <span className="rounded border border-green-500/20 bg-green-950/20 px-2 py-0.5 text-[9px] font-bold uppercase text-green-500">
                            Vérifié
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-2xl italic text-white">
                        {lead.titre}
                      </h4>
                      <p className="text-xs uppercase tracking-tighter opacity-50">
                        {lead.client}
                      </p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p
                          className="text-2xl font-light"
                          style={{ color: theme.filCreme }}
                        >
                          {lead.montant_net.toFixed(2)} $
                          <span className="text-xs italic opacity-40"> Net</span>
                        </p>
                        <p className="text-[9px] uppercase tracking-tighter opacity-40">
                          TPS: {lead.tps.toFixed(2)} $ | TVQ: {lead.tvq.toFixed(2)} $
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleClaim(lead.id, lead.localisation)}
                        disabled={claimingId === lead.id}
                        className="rounded-xl px-8 py-4 font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: theme.orChaud,
                          color: theme.cuirBleu,
                        }}
                      >
                        {claimingId === lead.id ? 'Revendication...' : 'Revendiquer'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Partenaire Impérial — Assurance Pro-Souveraine */}
        <div
          className="relative mb-16 overflow-hidden rounded-[2.5rem] border-2 border-dashed p-8"
          style={{
            borderColor: theme.orChaud + '30',
            backgroundColor: theme.orChaud + '05',
          }}
        >
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-6">
              <div className="rounded-2xl border border-stone-800 bg-black/20 p-5 shadow-inner">
                <TrendingUp style={{ color: theme.orChaud }} size={32} />
              </div>
              <div>
                <p
                  className="mb-1 text-[9px] font-black uppercase tracking-widest opacity-50"
                  style={{ color: theme.orChaud }}
                >
                  Partenaire Impérial
                </p>
                <h4 className="font-serif text-xl text-white">
                  Assurance Pro-Souveraine
                </h4>
                <p className="text-xs opacity-60">
                  Protection complète adaptée à vos contrats Qué-Emplois.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePartnerClick}
              className="rounded-lg border px-6 py-3 font-bold uppercase tracking-widest text-[10px] transition-colors hover:bg-stone-100/5"
              style={{ borderColor: theme.orChaud, color: theme.orChaud }}
            >
              En savoir plus
            </button>
          </div>
        </div>

        {/* Dossier Photo & Sceau de Facturation */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-stone-800 bg-black/20 p-8">
            <div className="mb-6 flex items-center gap-3">
              <Camera size={18} style={{ color: theme.orChaud }} />
              <h3
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: theme.filCreme }}
              >
                Dossier Photo
              </h3>
            </div>
            <div
              className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed opacity-30 transition-opacity hover:opacity-100"
              style={{ borderColor: theme.filCreme + '40' }}
            >
              <Camera size={24} className="mb-2" />
              <span className="text-[10px] uppercase">Preuve de Travail</span>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-800 bg-black/20 p-8">
            <div className="mb-6 flex items-center gap-3">
              <FileText size={18} style={{ color: theme.orChaud }} />
              <h3
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: theme.filCreme }}
              >
                Sceau de Facturation
              </h3>
            </div>
            <div className="mb-6 rounded-2xl border border-stone-800 bg-black/20 p-6 font-serif text-sm italic opacity-60">
              &quot;Dossier #7721 — Prêt pour émission.&quot;
            </div>
            <button
              type="button"
              className="w-full rounded-2xl py-5 font-black uppercase tracking-[0.3em]"
              style={{
                backgroundColor: theme.orChaud,
                color: theme.cuirBleu,
                border: `3px dashed ${theme.cuirBleu}`,
                boxShadow: `0 0 0 6px ${theme.orChaud}`,
              }}
            >
              Émettre la Facture Impériale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
