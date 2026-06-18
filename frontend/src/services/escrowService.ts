/**
 * Q-EMPLOIS Escrow Service — L'Atelier milestone-release system
 */

import { api } from './api';

export interface Milestone {
  id: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'LOCKED' | 'RELEASED';
  verifiedBy?: 'AI' | 'USER' | 'ADMIN';
}

export interface EscrowContract {
  id: string;
  clientId: string;
  proId: string;
  totalAmount: number;
  milestones: Milestone[];
  createdAt: Date;
}

export const escrowService = {
  async listContracts() {
    return api.getEscrowContracts();
  },

  async releaseMilestone(contractId: string, milestoneId: string) {
    return api.releaseEscrowMilestone(contractId, milestoneId);
  },

  calculateTaxReserves(totalAmount: number) {
    const gst = totalAmount * 0.05;
    const qst = totalAmount * 0.09975;
    return {
      gst: Math.round(gst * 100) / 100,
      qst: Math.round(qst * 100) / 100,
      total: Math.round((gst + qst) * 100) / 100,
    };
  },
};