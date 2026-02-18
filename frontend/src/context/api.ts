// Mock API for build purposes
export const api = {
  getProfile: async () => ({ id: '1', email: 'test@example.com' }),
  login: async (email: string, password: string) => ({ user: { id: '1', email }, token: 'mock' }),
  register: async (data: any) => ({ user: { id: '1', ...data }, token: 'mock' }),
  forgotPassword: async (email: string) => {},
};
