/**
 * ProDashboard — Tableau de bord du prestataire
 * Intègre VerificationIdentite (Le Sceau de Confiance) + L'Atelier (Trinité Financière)
 */

import { useState } from 'react';
import { VerificationIdentite } from '../components/features/onboarding/VerificationIdentite';
import { AtelierSouverain } from '../components/features/atelier/AtelierSouverain';
import type { IdentityStatus } from '../components/features/onboarding/VerificationIdentite';

export function ProDashboard() {
  const [identityStatus, setIdentityStatus] = useState<IdentityStatus>('unverified');

  return (
    <div className="space-y-12">
      {/* Passeport Professionnel — Sceau de Confiance */}
      <section className="mx-auto max-w-xl">
        <VerificationIdentite
          status={identityStatus}
          onStatusChange={setIdentityStatus}
        />
      </section>

      {/* L'Atelier — Écosystème de Recrutement Souverain */}
      <section>
        <AtelierSouverain
          apiUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}
          proId="33333333-3333-3333-3333-333333333302"
        />
      </section>
    </div>
  );
}
