/**
 * SoumissionModal — "The Contract Sheet"
 * Design: Cream paper on leather desk, dark leather header
 * RBQ Gatekeeper (Loi R-20), Pricing strategy, Handshake button
 * Connecté à l'API backend (POST /api/bids)
 * Content: French (Québec)
 */

import { useState } from 'react';
import type { Job, ProProfile } from '../types/job';

export interface SoumissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  proProfile: ProProfile;
  /** URL de l'API backend (ex: http://localhost:3001) */
  apiUrl?: string;
}

export function SoumissionModal({
  isOpen,
  onClose,
  job,
  proProfile,
  apiUrl = 'http://localhost:3001',
}: SoumissionModalProps) {
  const [pricingType, setPricingType] = useState<'hourly' | 'fixed'>('hourly');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [fixedPrice, setFixedPrice] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const requiresRbq = job.category?.requires_rbq ?? false;
  const hasValidRbq = proProfile.rbq_license != null && proProfile.rbq_license.trim() !== '';
  const isBlocked = requiresRbq && !hasValidRbq;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    const price = pricingType === 'hourly' ? parseFloat(hourlyRate) : parseFloat(fixedPrice);
    if (isNaN(price) || price < 20) {
      setServerError('Le tarif minimum sur Q-emplois est de 20 $.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch(`${apiUrl}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          proId: proProfile.id,
          price,
          priceType: pricingType === 'hourly' ? 'hourly' : 'flat_rate',
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setServerError(data.message ?? "Une erreur est survenue.");
        return;
      }

      onClose();
      // Succès — on pourrait ajouter un toast ici
    } catch (err) {
      setServerError("Impossible de joindre le serveur. Vérifiez que l'API est démarrée.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="soumission-modal-title"
    >
      {/* Leather desk backdrop — dimmed */}
      <div
        className="absolute inset-0 bg-[#1a1209]/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* The Contract Sheet — cream paper on desk */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-lg shadow-2xl"
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
        }}
      >
        {/* Header — Dark Leather with Gold Stitching */}
        <header
          className="relative px-6 py-4"
          style={{
            background: 'linear-gradient(180deg, #2A1B12 0%, #1f1510 100%)',
            borderBottom: '2px dashed rgba(201, 162, 39, 0.6)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              id="soumission-modal-title"
              className="text-lg font-semibold text-[#e8e0d4]"
            >
              Soumissionner sur ce contrat
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-[#a89f8f] transition-colors hover:bg-white/10 hover:text-[#e8e0d4] focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
              aria-label="Fermer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-[#d4af37]">{job.title_fr}</p>
        </header>

        {/* Body — Cream Paper */}
        <div
          className="px-6 py-5"
          style={{
            background: '#F5F5DC',
            color: '#2A1B12',
          }}
        >
          {/* Erreur serveur — Sceau Rouge */}
          {serverError && (
            <div
              className="mb-5 flex items-start gap-4 rounded-lg border-2 p-4"
              style={{
                borderColor: '#7f1d1d',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div className="text-3xl" aria-hidden>🛑</div>
              <div>
                <p className="font-bold text-red-900">{serverError}</p>
              </div>
            </div>
          )}

          {/* RBQ Gatekeeper — Sceau de Sécurité (Wax Seal Style) */}
          {isBlocked && (
            <div
              className="mb-5 flex items-start gap-4 rounded-lg border-2 p-4"
              style={{
                borderColor: '#7f1d1d',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div className="text-3xl" aria-hidden>🛑</div>
              <div>
                <h4 className="font-bold text-red-900">
                  Accès Restreint (Loi R-20)
                </h4>
                <p className="mt-1 text-sm text-red-800">
                  Ce contrat nécessite une licence RBQ valide ({job.category?.name_fr ?? 'Plomberie/Électricité'}).
                  Veuillez mettre à jour votre profil pour soumissionner.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Budget Reference */}
            {job.client_budget != null && (
              <div className="rounded-md p-3" style={{ background: 'rgba(42,27,18,0.06)' }}>
                <p className="text-sm font-medium text-[#2A1B12]">
                  Budget du client (référence) :{' '}
                  <span className="text-[#8B6914]">
                    {job.client_budget.toLocaleString('fr-CA', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    $
                    {job.budget_type === 'fixed' ? '' : '/h'}
                  </span>
                </p>
              </div>
            )}

            {/* Pricing Strategy Toggle */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#2A1B12]">
                Stratégie tarifaire
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPricingType('hourly')}
                  className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: pricingType === 'hourly' ? 'rgba(42,27,18,0.12)' : 'transparent',
                    border: '1px solid rgba(42,27,18,0.2)',
                    color: '#2A1B12',
                    boxShadow: pricingType === 'hourly' ? 'inset 0 2px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Taux horaire
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType('fixed')}
                  className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: pricingType === 'fixed' ? 'rgba(42,27,18,0.12)' : 'transparent',
                    border: '1px solid rgba(42,27,18,0.2)',
                    color: '#2A1B12',
                    boxShadow: pricingType === 'fixed' ? 'inset 0 2px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Forfait
                </button>
              </div>
            </div>

            {/* Price Input — Inset (pressed into paper) */}
            {pricingType === 'hourly' ? (
              <div>
                <label htmlFor="hourly-rate" className="mb-1 block text-sm font-medium text-[#2A1B12]">
                  Taux horaire ($/h)
                </label>
                <input
                  id="hourly-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  disabled={isBlocked}
                  className="w-full rounded-md px-4 py-2.5 text-[#2A1B12] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(42,27,18,0.04)',
                    border: '1px solid rgba(42,27,18,0.2)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
                  }}
                  placeholder="Ex: 45,00"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="fixed-price" className="mb-1 block text-sm font-medium text-[#2A1B12]">
                  Prix forfaitaire ($)
                </label>
                <input
                  id="fixed-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  disabled={isBlocked}
                  className="w-full rounded-md px-4 py-2.5 text-[#2A1B12] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(42,27,18,0.04)',
                    border: '1px solid rgba(42,27,18,0.2)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
                  }}
                  placeholder="Ex: 250,00"
                />
              </div>
            )}

            {/* Message (optional) */}
            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium text-[#2A1B12]">
                Message au client (optionnel)
              </label>
              <textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isBlocked}
                className="w-full resize-none rounded-md px-4 py-2.5 text-[#2A1B12] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(42,27,18,0.04)',
                  border: '1px solid rgba(42,27,18,0.2)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
                }}
                placeholder="Présentez votre offre..."
              />
            </div>

            {/* Handshake Button — Envoyer mon offre */}
            <button
              type="submit"
              disabled={isBlocked || isSubmitting}
              className="w-full rounded-md px-4 py-3 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isBlocked ? '#9ca3af' : '#D2691E',
                border: `2px dashed ${isBlocked ? '#6b7280' : 'rgba(201, 162, 39, 0.8)'}`,
                boxShadow: isBlocked
                  ? 'none'
                  : 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.2)',
              }}
            >
              {isSubmitting ? 'Signature en cours...' : 'Envoyer mon offre'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
