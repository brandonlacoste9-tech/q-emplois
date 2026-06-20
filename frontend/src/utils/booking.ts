import type { ServiceType } from '../types';

export function buildClientBookingHref(opts: {
  need?: string;
  service?: ServiceType | string;
  authenticated?: boolean;
}): string {
  const params = new URLSearchParams();
  if (opts.need?.trim()) params.set('need', opts.need.trim());
  if (opts.service) params.set('service', opts.service);
  const query = params.toString();
  const base = opts.authenticated ? '/post-job' : '/book';
  return query ? `${base}?${query}` : base;
}

export function parseServiceParam(value: string | null): ServiceType | '' {
  if (!value) return '';
  return value as ServiceType;
}

export function formatPriceGuideShort(min: number, max: number, unit: 'job' | 'hour', lang: 'fr' | 'en'): string {
  const suffix = unit === 'hour' ? (lang === 'fr' ? '/h' : '/hr') : '';
  return lang === 'fr' ? `${min}–${max} $${suffix}` : `$${min}–${max}${suffix}`;
}
