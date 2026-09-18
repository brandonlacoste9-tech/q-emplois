/**
 * Public site configuration for soft-launch (jobs-only beta).
 * Keep share links, SEO, and copy pointing at the production domain.
 */

export const PUBLIC_SITE_URL = 'https://q-emplois.ca';

/** Live NestJS API (Render). Fallback also hard-coded in api.ts. */
export const PUBLIC_API_URL =
  'https://q-emplois-api.onrender.com/api/v1';

/** Geographic wedge for beta marketing. */
export const BETA_WEDGE = {
  fr: 'Québec seulement · Montréal · Québec · Laval · Gatineau',
  en: 'Québec only · Montreal · Québec City · Laval · Gatineau',
} as const;

export const FOUNDING_TASKER = {
  limit: 50,
  bonusCredits: 60,
  lifetimeDiscountPercent: 20,
} as const;

/** Absolute URL for share/copy text (no trailing slash). */
export function sitePath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${PUBLIC_SITE_URL}${p}`;
}
