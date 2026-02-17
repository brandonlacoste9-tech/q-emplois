/**
 * VerificationIdentite — "Leather Wallet" / Passeport Professionnel
 * Design: Saddle aesthetic, pocket-style upload zone
 * Sovereign Concierge: Upload → Manual Admin Approval
 * Content: French (Québec)
 */

import { useState, useRef } from 'react';

export type IdentityStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface VerificationIdentiteProps {
  status: IdentityStatus;
  onStatusChange?: (status: IdentityStatus) => void;
}

const statusConfig: Record<
  IdentityStatus,
  { icon: string; label: string; color: string; bgClass: string }
> = {
  unverified: {
    icon: '🔴',
    label: 'Non vérifié',
    color: '#7f1d1d',
    bgClass: 'bg-red-950/40',
  },
  pending: {
    icon: '🟠',
    label: 'En attente',
    color: '#b45309',
    bgClass: 'bg-amber-950/40',
  },
  verified: {
    icon: '🛡️',
    label: 'Vérifié',
    color: '#FFD700',
    bgClass: 'bg-amber-900/30',
  },
  rejected: {
    icon: '🔴',
    label: 'Refusé',
    color: '#7f1d1d',
    bgClass: 'bg-red-950/40',
  },
};

export function VerificationIdentite({
  status,
  onStatusChange,
}: VerificationIdentiteProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = statusConfig[status];

  const handleUpload = () => {
    if (status === 'verified') return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Mock: set status to 'pending' after 2s delay
    setTimeout(() => {
      setIsUploading(false);
      onStatusChange?.('pending');
      e.target.value = '';
    }, 2000);
  };

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(145deg, #2A1B12 0%, #1f1510 100%)',
        boxShadow: `
          inset 0 0 0 2px rgba(201, 162, 39, 0.4),
          inset 0 2px 4px rgba(0,0,0,0.3),
          0 8px 24px rgba(0,0,0,0.4)
        `,
        border: '2px dashed rgba(201, 162, 39, 0.5)',
      }}
    >
      {/* Header — Double stitching */}
      <div
        className="px-6 py-4"
        style={{
          borderBottom: '2px dashed rgba(201, 162, 39, 0.5)',
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#e8e0d4]">
            Votre Passeport Professionnel
          </h3>
          {/* Status badge — stamped effect */}
          <span
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${config.bgClass}`}
            style={{
              color: config.color,
              border: `1px solid ${config.color}66`,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            <span>{config.icon}</span>
            {config.label}
          </span>
        </div>
      </div>

      {/* Body — Pocket / Upload zone */}
      <div className="p-6 space-y-4">
        <p className="text-sm text-[#a89f8f]">
          Téléversez une photo claire de votre Permis de conduire ou RAMQ.
        </p>

        {/* Upload Zone — Pocket (inset shadow) */}
        <div
          onClick={handleUpload}
          className="relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg transition-all duration-200"
          style={{
            background: 'linear-gradient(180deg, #1a1209 0%, #0f0b06 100%)',
            border: '1px solid rgba(42,27,18,0.8)',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)',
          }}
          onMouseEnter={(e) => {
            if (status !== 'verified' && !isUploading) {
              e.currentTarget.style.background =
                'linear-gradient(180deg, #241a0f 0%, #151008 100%)';
              e.currentTarget.style.borderColor = 'rgba(201, 162, 39, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              'linear-gradient(180deg, #1a1209 0%, #0f0b06 100%)';
            e.currentTarget.style.borderColor = 'rgba(42,27,18,0.8)';
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-amber-600/30" />
              <span className="text-sm text-[#a89f8f]">
                Envoi en cours...
              </span>
            </div>
          ) : status === 'verified' ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background: 'linear-gradient(145deg, #FFD700 0%, #daa520 100%)',
                  boxShadow:
                    'inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                <span className="text-2xl">🛡️</span>
              </div>
              <span className="text-sm font-medium text-[#FFD700]">
                Identité vérifiée
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#a89f8f]">
              <svg
                className="h-12 w-12 opacity-60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm">
                Glissez votre document ici ou cliquez
              </span>
            </div>
          )}
        </div>

        {/* Note — Loi 25 */}
        <p className="text-xs text-[#8a8175]">
          Vos données restent au Québec (Loi 25). Validation manuelle sous 24 h.
        </p>
      </div>
    </div>
  );
}
