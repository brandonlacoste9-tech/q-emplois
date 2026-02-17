// Types for Q-EMPLOIS Tradesmen Portal

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface TradesmanProfile extends User {
  serviceTypes: ServiceType[];
  hourlyRate: number;
  serviceRadius: number; // in km
  licenseNumber?: string;
  licenseDocument?: string;
  bio?: string;
  address?: Address;
  availability: Availability;
}

export type ServiceType = 
  | 'plomberie'
  | 'electricite'
  | 'menuiserie'
  | 'peinture'
  | 'chauffage'
  | 'climatisation'
  | 'toiture'
  | 'renovation'
  | 'jardinage'
  | 'menage'
  | 'demenagement'
  | 'autre';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  menuiserie: 'Menuiserie',
  peinture: 'Peinture',
  chauffage: 'Chauffage',
  climatisation: 'Climatisation',
  toiture: 'Toiture',
  renovation: 'Rénovation',
  jardinage: 'Jardinage',
  menage: 'Ménage',
  demenagement: 'Déménagement',
  autre: 'Autre',
};

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface DayAvailability {
  isAvailable: boolean;
  startTime?: string; // HH:mm format
  endTime?: string;   // HH:mm format
}

export interface Job {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientPhone?: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  address: Address;
  scheduledDate: string;
  scheduledTime?: string;
  estimatedDuration: number; // in minutes
  estimatedPrice: number;
  status: JobStatus;
  createdAt: string;
  distance?: number; // in km
}

export type JobStatus = 
  | 'pending'      // En attente
  | 'accepted'     // Acceptée
  | 'in_progress'  // En cours
  | 'completed'    // Terminée
  | 'cancelled'    // Annulée
  | 'declined';    // Refusée

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  declined: 'Refusée',
};

export interface Transaction {
  id: string;
  jobId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'pending' | 'completed' | 'failed';
  type: 'payment' | 'payout' | 'refund';
  createdAt: string;
  description: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  jobId?: string;
  jobTitle?: string;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'new_job' | 'job_accepted' | 'job_cancelled' | 'message' | 'payment' | 'review';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface DashboardStats {
  jobsToday: number;
  jobsThisWeek: number;
  earningsThisWeek: number;
  earningsThisMonth: number;
  rating: number;
  pendingJobs: number;
}
