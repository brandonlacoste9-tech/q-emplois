const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
const URL_PATTERN = /https?:\/\/|www\./i;

export function containsContactInfo(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  return (
    EMAIL_PATTERN.test(normalized)
    || PHONE_PATTERN.test(normalized)
    || URL_PATTERN.test(normalized)
  );
}

export const CONTACT_INFO_BLOCKED_MSG =
  'Pour votre sécurité, ne partagez pas de téléphone, courriel ou lien avant la sélection du travailleur.';