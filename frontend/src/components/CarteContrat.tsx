/**
 * CarteContrat — Job Card component
 * Aesthetic: Saddle / King Ranch / Northern Ventures (Cuir & Couture)
 * Content: French (Québec)
 * Code: English variable names
 */

export type JobStatus = 'Ouvert' | 'En cours' | 'Complet';

export type ServiceType =
  | 'Déneigement'
  | 'Grand Ménage'
  | 'Petits Travaux'
  | 'Plomberie'
  | 'Électricité'
  | 'Nettoyage';

export interface CarteContratProps {
  jobTitle: ServiceType;
  pricePerHour: number;
  status: JobStatus;
  location?: string;
  description?: string;
  onSoumissionner?: () => void;
}

/**
 * Formats price in Québec style: "40,00 $/h"
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString('fr-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} $/h`;
}

const statusStyles: Record<JobStatus, string> = {
  Ouvert: 'border-emerald-500/60 text-emerald-400 bg-emerald-950/40',
  'En cours': 'border-amber-500/60 text-amber-400 bg-amber-950/40',
  Complet: 'border-stone-500/60 text-stone-400 bg-stone-950/40',
};

export function CarteContrat({
  jobTitle,
  pricePerHour,
  status,
  location,
  description,
  onSoumissionner,
}: CarteContratProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:scale-[1.02]"
      style={{
        /* Cuir estampé — Patine: gradient for aged leather depth */
        background: `linear-gradient(145deg, #2d2416 0%, #3d3220 40%, #2a2218 100%)`,
        /* Couture apparente — Gold stitching border */
        boxShadow: `
          inset 0 0 0 2px rgba(201, 162, 39, 0.4),
          inset 0 2px 4px rgba(0,0,0,0.3),
          0 4px 12px rgba(0,0,0,0.4)
        `,
        border: '1px dashed rgba(201, 162, 39, 0.5)',
      }}
      role="article"
      aria-labelledby={`job-title-${jobTitle.replace(/\s/g, '-')}`}
    >
      {/* Decorative corner stitch */}
      <div
        className="absolute top-2 right-2 h-8 w-8 opacity-40"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(201, 162, 39, 0.3) 2px,
            rgba(201, 162, 39, 0.3) 4px
          )`,
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
        }}
      />

      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <h2
          id={`job-title-${jobTitle.replace(/\s/g, '-')}`}
          className="text-xl font-semibold text-[#e8e0d4]"
        >
          {jobTitle}
        </h2>
        <span
          className={`rounded px-2.5 py-0.5 text-xs font-medium border ${statusStyles[status]}`}
        >
          {status}
        </span>
      </header>

      <p className="mb-2 text-2xl font-bold text-[#d4af37]">
        {formatPrice(pricePerHour)}
      </p>

      {location && (
        <p className="mb-2 text-sm text-[#a89f8f]">
          📍 {location}
        </p>
      )}

      {description && (
        <p className="mb-4 line-clamp-2 text-sm text-[#e8e0d4]/90">
          {description}
        </p>
      )}

      {onSoumissionner && status === 'Ouvert' && (
        <button
          onClick={onSoumissionner}
          className="mt-4 w-full rounded-md px-4 py-2.5 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:ring-offset-2 focus:ring-offset-[#2d2416] disabled:opacity-50"
          style={{
            /* Cuir estampé — inset shadow for embossed button */
            background: 'linear-gradient(180deg, #4a3f2e 0%, #2d2416 100%)',
            border: '1px solid rgba(201, 162, 39, 0.5)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)',
            color: '#e8e0d4',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #5c4d3a 0%, #3d3220 100%)';
            e.currentTarget.style.borderColor = 'rgba(201, 162, 39, 0.8)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #4a3f2e 0%, #2d2416 100%)';
            e.currentTarget.style.borderColor = 'rgba(201, 162, 39, 0.5)';
          }}
        >
          Soumissionner
        </button>
      )}
    </article>
  );
}
