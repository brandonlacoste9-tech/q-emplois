/**
 * Job & ProProfile types for Q-emplois
 * RBQ = Régie du bâtiment du Québec (Loi R-20)
 */

export interface JobCategory {
  id: string;
  name_fr: string;
  requires_rbq: boolean;
}

export interface Job {
  id: string;
  title_fr: string;
  category: JobCategory;
  description?: string;
  location?: string;
  /** Client's budget in CAD (reference for the Pro) */
  client_budget?: number;
  /** Budget type: hourly or fixed */
  budget_type?: 'hourly' | 'fixed';
}

export type IdentityStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface ProProfile {
  id: string;
  rbq_license: string | null;
  identity_status?: IdentityStatus;
  /** Other profile fields can be added here */
}
