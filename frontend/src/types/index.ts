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

// Q-EMPLOIS: Tous types de jobs - pas seulement les métiers traditionnels
export type ServiceType = 
  // 🏠 Services à domicile
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
  | 'montage_meubles'
  | 'nettoyage'
  // 🚚 Livraison & Transport
  | 'livraison'
  | 'coursier'
  | 'chauffeur'
  | 'remorquage'
  // 💻 Tech & Digital
  | 'informatique'
  | 'reparation_tech'
  | 'aide_informatique'
  | 'photo_video'
  | 'graphisme'
  // 🎓 Éducation & Services
  | 'tutorat'
  | 'cours_particuliers'
  | 'garderie'
  | 'aide_personnes_agees'
  | 'promenade_animaux'
  | 'garde_animaux'
  // 🎉 Événements & Animation
  | 'serveur'
  | 'barman'
  | 'securite'
  | 'animateur'
  | 'dj'
  // 💪 Physique & Main d'œuvre
  | 'manutention'
  | 'aide_menagere'
  | 'bricolage'
  | 'portage'
  // 🎨 Créatif
  | 'peinture_artistique'
  | 'couture'
  | 'decoration'
  // ✨ Autre
  | 'autre';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  // Services à domicile
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  menuiserie: 'Menuiserie',
  peinture: 'Peinture (résidentielle)',
  chauffage: 'Chauffage',
  climatisation: 'Climatisation',
  toiture: 'Toiture',
  renovation: 'Rénovation',
  jardinage: 'Jardinage',
  menage: 'Ménage',
  demenagement: 'Déménagement',
  montage_meubles: 'Montage de meubles',
  nettoyage: 'Nettoyage professionnel',
  // Livraison & Transport
  livraison: 'Livraison',
  coursier: 'Coursier',
  chauffeur: 'Chauffeur',
  remorquage: 'Remorquage',
  // Tech & Digital
  informatique: 'Informatique',
  reparation_tech: 'Réparation tech (téléphone, PC)',
  aide_informatique: 'Aide informatique',
  photo_video: 'Photo/Vidéo',
  graphisme: 'Graphisme',
  // Éducation & Services
  tutorat: 'Tutorat',
  cours_particuliers: 'Cours particuliers',
  garderie: 'Garde d\'enfants',
  aide_personnes_agees: 'Aide aux personnes âgées',
  promenade_animaux: 'Promenade d\'animaux',
  garde_animaux: 'Garde d\'animaux',
  // Événements
  serveur: 'Serveur/Serveuse',
  barman: 'Barman/Barmaid',
  securite: 'Sécurité/Portier',
  animateur: 'Animateur',
  dj: 'DJ',
  // Main d'œuvre
  manutention: 'Manutention',
  aide_menagere: 'Aide ménagère',
  bricolage: 'Bricolage',
  portage: 'Portage/Reprise',
  // Créatif
  peinture_artistique: 'Peinture artistique',
  couture: 'Couture/Retouches',
  decoration: 'Décoration',
  // Autre
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
