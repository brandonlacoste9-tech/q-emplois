import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, TradesmanProfile, ServiceType } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

export type AppMode = 'client' | 'tasker';
const MODE_STORAGE_KEY = 'qemplois_mode';

interface AuthContextType {
  user: User | null;
  profile: TradesmanProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mode: AppMode;
  isClientMode: boolean;
  canTask: boolean;
  setMode: (mode: AppMode) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerClient: (data: ClientRegisterData) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  serviceTypes: ServiceType[];
}

interface ClientRegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredMode(): AppMode {
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  return stored === 'tasker' ? 'tasker' : 'client';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TradesmanProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setModeState] = useState<AppMode>(readStoredMode);

  const canTask =
    (profile?.serviceTypes?.length ?? 0) > 0 || profile?.isTaskerEnabled === true;
  const isClientMode = mode === 'client';

  useEffect(() => {
    if (!canTask && mode === 'tasker') {
      setModeState('client');
      localStorage.setItem(MODE_STORAGE_KEY, 'client');
    }
  }, [canTask, mode]);

  const setMode = useCallback((next: AppMode) => {
    if (next === 'tasker' && !canTask) return;
    setModeState(next);
    localStorage.setItem(MODE_STORAGE_KEY, next);
  }, [canTask]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async (background = false) => {
    try {
      if (!background) setIsLoading(true);
      const profileData = await api.getProfile();
      setProfile(profileData);
      setUser(profileData);
      
      const token = localStorage.getItem('token');
      if (token && !background) {
        socketService.connect(token, 'https://q-emplois-api-production-f1a6.up.railway.app/api/v1');
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
    } finally {
      if (!background) setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const { user: userData, token } = await api.login(email, password);
    localStorage.setItem('token', token);
    setUser(userData);
    await loadUser(false);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { user: userData, token } = await api.register(data);
    localStorage.setItem('token', token);
    localStorage.setItem(MODE_STORAGE_KEY, 'tasker');
    setModeState('tasker');
    setUser(userData as unknown as TradesmanProfile);
    try {
      await loadUser(false);
    } catch {
      // Account created; profile fetch can retry on next page
    }
  }, []);

  const registerClient = useCallback(async (data: ClientRegisterData) => {
    const { user: userData, token } = await api.registerClient(data);
    localStorage.setItem('token', token);
    localStorage.setItem(MODE_STORAGE_KEY, 'client');
    setModeState('client');
    setUser(userData as unknown as TradesmanProfile);
    try {
      await loadUser(false);
    } catch {
      // Account created; profile fetch can retry on next page
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    socketService.disconnect();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.forgotPassword(email);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadUser(true);
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    mode,
    isClientMode,
    canTask,
    setMode,
    login,
    register,
    registerClient,
    logout,
    forgotPassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
