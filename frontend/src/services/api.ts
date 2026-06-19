import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { 
  User, 
  TradesmanProfile, 
  Job, 
  Transaction, 
  Conversation, 
  Message, 
  Notification,
  DashboardStats,
  ServiceType,
  PriceGuideRange,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/login', { email, password });
    return {
      user: response.data.user,
      token: response.data.accessToken,
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    serviceTypes: ServiceType[];
  }): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/register', {
      ...data,
      consentGiven: true,
    });
    return {
      user: response.data.user,
      token: response.data.accessToken,
    };
  }

  async registerClient(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/register', {
      ...data,
      consentGiven: true,
    });
    return {
      user: response.data.user,
      token: response.data.accessToken,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    await this.client.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.client.post('/auth/reset-password', { token, password });
  }

  async getProfile(): Promise<TradesmanProfile> {
    const response = await this.client.get('/profile');
    return response.data;
  }

  async updateUser(data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>) {
    const response = await this.client.put('/users/me', data);
    return response.data;
  }

  async updateProvider(data: {
    serviceTypes: ServiceType[];
    hourlyRate?: number;
    serviceRadiusKm?: number;
    licenseNumber?: string;
    licenseDocumentUrl?: string;
    locationAddress?: string;
    locationLat?: number;
    locationLng?: number;
  }) {
    const response = await this.client.put('/providers/me', data);
    return response.data;
  }

  /** @deprecated use updateUser + updateProvider */
  async updateProfile(data: Partial<TradesmanProfile>): Promise<TradesmanProfile> {
    await this.updateUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    });
    if (data.serviceTypes?.length) {
      await this.updateProvider({
        serviceTypes: data.serviceTypes,
        hourlyRate: data.hourlyRate,
        serviceRadiusKm: data.serviceRadius,
        licenseNumber: data.licenseNumber,
        locationAddress: data.address?.street,
        locationLat: data.address?.coordinates?.lat,
        locationLng: data.address?.coordinates?.lng,
      });
    }
    return this.getProfile();
  }

  async getJobs(filters?: {
    status?: string;
    serviceType?: string;
    dateFrom?: string;
    dateTo?: string;
    perspective?: 'mine' | 'board';
  }): Promise<Job[]> {
    const response = await this.client.get('/jobs', { params: filters });
    return response.data;
  }

  async getJob(id: string): Promise<Job> {
    const response = await this.client.get(`/jobs/${id}`);
    return response.data;
  }

  async createJob(data: Partial<Job>): Promise<Job> {
    const response = await this.client.post('/jobs', {
      title: data.title,
      description: data.description,
      serviceType: data.serviceType,
      address: data.address?.street ?? '',
      city: data.address?.city,
      postalCode: data.address?.postalCode,
      locationLat: data.address?.coordinates?.lat,
      locationLng: data.address?.coordinates?.lng,
      scheduledDate: data.scheduledDate,
      estimatedPrice: data.estimatedPrice,
      estimatedDuration: data.estimatedDuration ?? 60,
    });
    return response.data;
  }

  async acceptJob(id: string): Promise<Job> {
    const response = await this.client.post(`/jobs/${id}/accept`);
    return response.data;
  }

  async applyToJob(id: string, message?: string): Promise<Job> {
    const response = await this.client.post(`/jobs/${id}/apply`, { message });
    return response.data;
  }

  async getJobApplications(jobId: string) {
    const response = await this.client.get(`/jobs/${jobId}/applications`);
    return response.data;
  }

  async selectTasker(jobId: string, taskerId: string): Promise<Job> {
    const response = await this.client.post(`/jobs/${jobId}/select/${taskerId}`);
    return response.data;
  }

  async withdrawApplication(jobId: string): Promise<void> {
    await this.client.post(`/jobs/${jobId}/applications/withdraw`);
  }

  async cancelJob(id: string): Promise<Job> {
    const response = await this.client.post(`/jobs/${id}/cancel`);
    return response.data;
  }

  async getPriceGuides(city?: string): Promise<Record<string, PriceGuideRange>> {
    const response = await this.client.get('/jobs/guides/prices', { params: city ? { city } : {} });
    return response.data;
  }

  async getPublicTaskerProfile(userId: string) {
    const response = await this.client.get(`/providers/${userId}/public`);
    return response.data;
  }

  async declineJob(id: string, reason?: string): Promise<Job> {
    const response = await this.client.post(`/jobs/${id}/decline`, { reason });
    return response.data;
  }

  async completeJob(id: string): Promise<Job> {
    const response = await this.client.post(`/jobs/${id}/complete`);
    return response.data;
  }

  async startJob(id: string): Promise<Job> {
    const response = await this.client.post(`/jobs/${id}/start`);
    return response.data;
  }

  async deleteJob(id: string): Promise<void> {
    await this.client.delete(`/jobs/${id}`);
  }

  async getCreditBalance(): Promise<{
    balance: number;
    isFoundingTasker: boolean;
    lifetimeDiscountPercent: number;
  }> {
    const response = await this.client.get('/credits/balance');
    return response.data;
  }

  async purchaseCreditPack(pack: 'starter' | 'standard' | 'pro'): Promise<{ checkoutUrl: string }> {
    const response = await this.client.post('/credits/purchase', { pack });
    return response.data;
  }

  async getCreditPacks(): Promise<Record<string, { credits: number; priceCad: number; label: string }>> {
    const response = await this.client.get('/credits/packs');
    return response.data;
  }

  async createReview(data: { taskId: string; rating: number; comment?: string }) {
    const response = await this.client.post('/reviews', data);
    return response.data;
  }

  async getReviewsForUser(userId: string) {
    const response = await this.client.get(`/reviews/user/${userId}`);
    return response.data;
  }

  async getReviewsForTask(taskId: string) {
    const response = await this.client.get(`/reviews/task/${taskId}`);
    return response.data;
  }

  async createEscrow(data: {
    providerId: string;
    taskDescription: string;
    totalAmount: number;
    milestones: { description: string; amount: number }[];
  }) {
    const response = await this.client.post('/payments/escrow', data);
    return response.data;
  }

  async getTransactions(): Promise<Transaction[]> {
    const response = await this.client.get('/credits/transactions');
    return response.data.map((t: { id: string; amount: number; type: string; description?: string; createdAt: string }) => ({
      id: t.id,
      jobId: '',
      amount: Math.abs(t.amount),
      fee: 0,
      netAmount: t.amount,
      status: 'completed' as const,
      type: t.type === 'purchase' ? 'payment' as const : 'payout' as const,
      createdAt: t.createdAt,
      description: t.description ?? t.type,
    }));
  }

  async getEarningsSummary(): Promise<{
    totalEarned: number;
    pendingPayout: number;
    thisMonth: number;
  }> {
    const stats = await this.getDashboardStats();
    return {
      totalEarned: stats.earningsThisMonth,
      pendingPayout: 0,
      thisMonth: stats.earningsThisMonth,
    };
  }

  async exportTransactions(): Promise<Blob> {
    const txs = await this.getTransactions();
    return new Blob([JSON.stringify(txs, null, 2)], { type: 'application/json' });
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.client.get('/conversations');
    return response.data;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.client.get(`/conversations/${conversationId}/messages`);
    return response.data;
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await this.client.post(`/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  }

  async markAsRead(conversationId: string): Promise<void> {
    await this.client.post(`/conversations/${conversationId}/read`);
  }

  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.client.post(`/notifications/${id}/read`);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  async getEscrowContracts() {
    const response = await this.client.get('/payments/escrow');
    return response.data;
  }

  async releaseEscrowMilestone(contractId: string, milestoneId: string) {
    const response = await this.client.post(
      `/payments/escrow/${contractId}/milestones/${milestoneId}/release`,
    );
    return response.data;
  }

  async updateAvailability(data: {
    day: string;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
  }): Promise<void> {
    await this.client.patch('/availability', data);
  }
}

export const api = new ApiService();
export default api;