import { Injectable, Logger } from '@nestjs/common';

export interface GeoSuggestion {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  async searchQuebecAddresses(query: string): Promise<GeoSuggestion[]> {
    const q = query.trim();
    if (q.length < 3) return [];

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', `${q}, Québec, Canada`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '6');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('countrycodes', 'ca');

    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'Q-Emplois/1.0 (contact@qemplois.ca)' },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
        address?: Record<string, string>;
      }>;

      return data
        .filter((item) => {
          const state = item.address?.state?.toLowerCase() ?? '';
          return state.includes('quebec') || state.includes('québec') || !state;
        })
        .map((item) => {
          const addr = item.address ?? {};
          const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
          const city =
            addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? '';
          const postalCode = (addr.postcode ?? '').toUpperCase();
          return {
            label: item.display_name,
            street: street || q,
            city,
            postalCode,
            lat: Number(item.lat),
            lng: Number(item.lon),
          };
        })
        .filter((s) => s.city || s.postalCode);
    } catch (err) {
      this.logger.warn(`Geocode search failed: ${(err as Error).message}`);
      return [];
    }
  }
}
