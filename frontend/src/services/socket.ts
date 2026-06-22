import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;
let currentBaseUrl: string | null = null;

function buildSocket(baseUrl: string, token: string): Socket {
  const instance = io(baseUrl.replace('/api/v1', ''), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  instance.on('connect', () => {
    console.log('[Socket] connected');
  });

  instance.on('disconnect', (reason) => {
    console.log('[Socket] disconnected:', reason);
  });

  instance.on('connect_error', (err) => {
    console.warn('[Socket] connect_error:', err.message);
  });

  return instance;
}

export const socketService = {
  connect(token: string, baseUrl: string) {
    if (socket && currentToken === token && currentBaseUrl === baseUrl) {
      if (!socket.connected) socket.connect();
      return socket;
    }

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    currentToken = token;
    currentBaseUrl = baseUrl;
    socket = buildSocket(baseUrl, token);
    return socket;
  },

  disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    currentToken = null;
    currentBaseUrl = null;
  },

  getSocket() {
    return socket;
  },

  reconnectIfNeeded() {
    if (!currentToken || !currentBaseUrl) return null;
    if (socket?.connected) return socket;
    return this.connect(currentToken, currentBaseUrl);
  },
};