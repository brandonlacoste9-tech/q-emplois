/** Approximate coordinates for Quebec cities and postal FSA prefixes (Montreal area). */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  montreal: { lat: 45.5017, lng: -73.5673 },
  montréal: { lat: 45.5017, lng: -73.5673 },
  laval: { lat: 45.6066, lng: -73.7124 },
  longueuil: { lat: 45.5312, lng: -73.5186 },
  quebec: { lat: 46.8139, lng: -71.208 },
  québec: { lat: 46.8139, lng: -71.208 },
  gatineau: { lat: 45.4765, lng: -75.7013 },
  sherbrooke: { lat: 45.4042, lng: -71.8929 },
  'trois-rivieres': { lat: 46.3432, lng: -72.543 },
  'trois-rivières': { lat: 46.3432, lng: -72.543 },
  verdun: { lat: 45.4584, lng: -73.5703 },
  rosemont: { lat: 45.543, lng: -73.592 },
  hull: { lat: 45.4298, lng: -75.709 },
};

const FSA_COORDS: Record<string, { lat: number; lng: number }> = {
  H1A: { lat: 45.590, lng: -73.534 },
  H1B: { lat: 45.650, lng: -73.500 },
  H2X: { lat: 45.515, lng: -73.575 },
  H2S: { lat: 45.545, lng: -73.595 },
  H2J: { lat: 45.525, lng: -73.565 },
  H4P: { lat: 45.495, lng: -73.655 },
  H2K: { lat: 45.535, lng: -73.545 },
  H2V: { lat: 45.505, lng: -73.585 },
  H4G: { lat: 45.455, lng: -73.575 },
  H3A: { lat: 45.505, lng: -73.575 },
  G1A: { lat: 46.815, lng: -71.210 },
  J8Y: { lat: 45.476, lng: -75.701 },
};

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

export function geocodeQuebecAddress(
  city: string,
  postalCode?: string,
): { lat: number; lng: number } | null {
  const cityKey = normalizeCity(city);
  if (CITY_COORDS[cityKey]) return CITY_COORDS[cityKey];

  const fsa = postalCode?.replace(/\s/g, '').toUpperCase().slice(0, 3);
  if (fsa && FSA_COORDS[fsa]) return FSA_COORDS[fsa];

  if (fsa?.startsWith('H')) return CITY_COORDS.montreal;
  if (fsa?.startsWith('G')) return CITY_COORDS.quebec;
  if (fsa?.startsWith('J')) return CITY_COORDS.gatineau;

  return null;
}
