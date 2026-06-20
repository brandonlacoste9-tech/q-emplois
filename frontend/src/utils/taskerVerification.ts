import type { TradesmanProfile } from '../types';

export type TaskerVerificationStatus = 'verified' | 'pending' | 'unverified' | 'expired';

export function getTaskerVerificationStatus(
  profile: Pick<TradesmanProfile, 'isVerified' | 'licenseDocument'> | null | undefined,
  verificationExpiresAt?: string | null,
): TaskerVerificationStatus {
  if (!profile) return 'unverified';
  if (profile.isVerified && verificationExpiresAt) {
    if (new Date(verificationExpiresAt) < new Date()) return 'expired';
  }
  if (profile.isVerified) return 'verified';
  if (profile.licenseDocument) return 'pending';
  return 'unverified';
}

export function canTaskerApply(
  profile: Pick<TradesmanProfile, 'isVerified' | 'licenseDocument'> | null | undefined,
  verificationExpiresAt?: string | null,
): boolean {
  return getTaskerVerificationStatus(profile, verificationExpiresAt) === 'verified';
}

export const VERIFICATION_LABELS: Record<TaskerVerificationStatus, string> = {
  verified: 'Profil vérifié',
  pending: 'En revue',
  unverified: 'Non vérifié',
  expired: 'Vérification expirée',
};

export const VERIFICATION_HINTS: Record<TaskerVerificationStatus, string> = {
  verified: 'Vous pouvez postuler aux tâches.',
  pending: 'Votre pièce d\'identité est en cours de vérification (sous 48 h).',
  unverified: 'Téléversez une pièce d\'identité sur votre profil pour commencer.',
  expired: 'Votre vérification a expiré (12 mois). Téléversez une nouvelle pièce d\'identité pour continuer.',
};
