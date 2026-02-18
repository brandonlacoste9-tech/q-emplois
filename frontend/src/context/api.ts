// Mock API for build purposes
export const api = {
  getProfile: async () => ({ id: '1', email: 'test@example.com' }),
  login: async (_email: string, _password: string) => ({ user: { id: '1', email: _email }, token: 'mock' }),
  register: async (data: { email: string }) => ({ user: { id: '1', ...data }, token: 'mock' }),
  forgotPassword: async (_email: string) => {},
};
