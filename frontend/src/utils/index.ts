export function cn(...inputs: Array<string | undefined | false | null | 0 | 0n>) {
  return inputs.filter(Boolean).join(' ');
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-CA', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${mins} min`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/** Public location label for job board (hides exact address when redacted). */
export function formatJobLocation(job: {
  address: { street?: string; city?: string; postalCode?: string };
  distance?: number;
  contactRedacted?: boolean;
  addressRedacted?: boolean;
}): string {
  const city = job.address.city || 'Québec';
  const hideAddress = job.addressRedacted ?? job.contactRedacted;
  if (hideAddress) {
    const area = job.address.postalCode;
    const approx = job.distance != null ? formatDistance(job.distance) : null;
    if (approx && area) return `${approx} · ${city} · ${area}`;
    if (approx) return `${approx} · ${city}`;
    if (area) return area.startsWith('Secteur') ? `${city} · ${area}` : `${city} (${area})`;
    return city;
  }
  if (job.address.street) return `${job.address.street}, ${city}`;
  return city;
}
