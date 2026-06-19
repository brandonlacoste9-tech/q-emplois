export interface PriceGuideRange {
  min: number;
  max: number;
  unit: 'job' | 'hour';
  note?: string;
}

const MONTREAL_CITIES = new Set([
  'montréal',
  'montreal',
  'laval',
  'longueuil',
  'brossard',
  'terrebonne',
  'repentigny',
  'saint-laurent',
  'verdun',
  'plateau',
]);

export function isMontrealArea(city?: string | null): boolean {
  if (!city) return false;
  const normalized = city.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return MONTREAL_CITIES.has(normalized) || normalized.includes('montreal');
}

const BASE_GUIDES: Record<string, PriceGuideRange> = {
  demenagement: { min: 89, max: 249, unit: 'job' },
  menage: { min: 49, max: 129, unit: 'job' },
  montage_meubles: { min: 45, max: 99, unit: 'job' },
  nettoyage: { min: 49, max: 149, unit: 'job' },
  jardinage: { min: 39, max: 89, unit: 'hour' },
  livraison: { min: 25, max: 65, unit: 'job' },
  coursier: { min: 20, max: 55, unit: 'job' },
  plomberie: { min: 75, max: 175, unit: 'hour' },
  electricite: { min: 75, max: 165, unit: 'hour' },
  menuiserie: { min: 55, max: 95, unit: 'hour' },
  peinture: { min: 45, max: 75, unit: 'hour' },
  bricolage: { min: 35, max: 65, unit: 'hour' },
  manutention: { min: 30, max: 55, unit: 'hour' },
  autre: { min: 35, max: 89, unit: 'job' },
};

export function getPriceGuide(serviceType: string, city?: string | null): PriceGuideRange {
  const base = BASE_GUIDES[serviceType] ?? BASE_GUIDES.autre;
  if (!isMontrealArea(city)) {
    return {
      ...base,
      min: Math.max(25, Math.round(base.min * 0.9)),
      max: Math.round(base.max * 0.9),
    };
  }
  return { ...base };
}

export function getAllPriceGuides(city?: string | null): Record<string, PriceGuideRange> {
  const result: Record<string, PriceGuideRange> = {};
  for (const key of Object.keys(BASE_GUIDES)) {
    result[key] = getPriceGuide(key, city);
  }
  return result;
}

export function formatPriceGuideLabel(guide: PriceGuideRange): string {
  const suffix = guide.unit === 'hour' ? '/h' : '';
  return `${guide.min}–${guide.max} $${suffix}`;
}
