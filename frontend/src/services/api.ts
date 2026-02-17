import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  User, 
  TradesmanProfile, 
  Job, 
  Transaction, 
  Conversation, 
  Message, 
  Notification,
  DashboardStats,
  ServiceType 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    serviceTypes: ServiceType[];
  }): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await this.client.post('/auth/forgot-password', { email });
  }

  // Profile
  async getProfile(): Promise<TradesmanProfile> {
    const response = await this.client.get('/profile');
    return response.data;
  }

  async updateProfile(data: Partial<TradesmanProfile>): Promise<TradesmanProfile> {
    const response = await this.client.patch('/profile', data);
    return response.data;
  }

  async uploadLicense(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('license', file);
    const response = await this.client.post('/profile/license', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Jobs
  async getJobs(filters?: {
    status?: string;
    serviceType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Job[]> {
    const response = await this.client.get('/jobs', { params: filters });
    return response.data;
  }

  async getJob(id: string): Promise<Job> {
    const response = await this.client.get(`/jobs/${id}`);
    return response.data;
  }

  async acceptJob(id: string): Promise<Job> {
    const response = await this.client.post(`/jobs/${id}/accept`);
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

  // Earnings
  async getTransactions(): Promise<Transaction[]> {
    const response = await this.client.get('/earnings/transactions');
    return response.data;
  }

  async getEarningsSummary(): Promise<{
    totalEarned: number;
    pendingPayout: number;
    thisMonth: number;
  }> {
    const response = await this.client.get('/earnings/summary');
    return response.data;
  }

  async exportTransactions(): Promise<Blob> {
    const response = await this.client.get('/earnings/export', {
      responseType: 'blob',
    });
    return response.data;
  }

  // Messages
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

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.client.post(`/notifications/${id}/read`);
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  // Availability
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
