import type { ServiceType } from '../types';

export const BOOKING_DRAFT_KEY = 'qemplois_booking_draft';

export interface BookingDraft {
  title: string;
  description: string;
  serviceType: ServiceType;
  scheduledDate: string;
  estimatedPrice: string;
  street: string;
  city: string;
  postalCode: string;
  photoUrls: string[];
}

export function saveBookingDraft(draft: BookingDraft): void {
  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
}

export function loadBookingDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  sessionStorage.removeItem(BOOKING_DRAFT_KEY);
}
