import { Injectable, BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

// Define valid state transitions
const STATE_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.pending]: [
    BookingStatus.confirmed,
    BookingStatus.cancelled,
  ],
  [BookingStatus.confirmed]: [
    BookingStatus.in_progress,
    BookingStatus.cancelled,
  ],
  [BookingStatus.in_progress]: [
    BookingStatus.completed,
    BookingStatus.cancelled,
  ],
  [BookingStatus.completed]: [],
  [BookingStatus.cancelled]: [],
};

// Define who can trigger each transition
const TRANSITION_PERMISSIONS: Record<string, string[]> = {
  'pending->confirmed': ['provider', 'admin'],
  'pending->cancelled': ['client', 'provider', 'admin'],
  'confirmed->in_progress': ['provider', 'admin'],
  'confirmed->cancelled': ['client', 'provider', 'admin'],
  'in_progress->completed': ['provider', 'admin'],
  'in_progress->cancelled': ['provider', 'admin'],
};

@Injectable()
export class BookingStateMachine {
  canTransition(from: BookingStatus, to: BookingStatus, userRole: string): boolean {
    // Check if transition is valid
    const validTransitions = STATE_TRANSITIONS[from];
    if (!validTransitions.includes(to)) {
      return false;
    }

    // Check if user has permission
    const transitionKey = `${from}->${to}`;
    const allowedRoles = TRANSITION_PERMISSIONS[transitionKey] || [];
    
    // Admin can do anything
    if (userRole === 'admin') return true;
    
    return allowedRoles.includes(userRole);
  }

  validateTransition(from: BookingStatus, to: BookingStatus, userRole: string): void {
    if (!this.canTransition(from, to, userRole)) {
      if (!STATE_TRANSITIONS[from].includes(to)) {
        throw new BadRequestException(
          `Transition invalide: impossible de passer de "${this.translateStatus(from)}" à "${this.translateStatus(to)}".`
        );
      }
      throw new BadRequestException(
        'Vous n\'avez pas les permissions nécessaires pour effectuer cette transition.'
      );
    }
  }

  getValidTransitions(status: BookingStatus, userRole: string): BookingStatus[] {
    const allTransitions = STATE_TRANSITIONS[status] || [];
    return allTransitions.filter(to => this.canTransition(status, to, userRole));
  }

  private translateStatus(status: BookingStatus): string {
    const translations: Record<BookingStatus, string> = {
      [BookingStatus.pending]: 'en attente',
      [BookingStatus.confirmed]: 'confirmée',
      [BookingStatus.in_progress]: 'en cours',
      [BookingStatus.completed]: 'terminée',
      [BookingStatus.cancelled]: 'annulée',
    };
    return translations[status] || status;
  }
}