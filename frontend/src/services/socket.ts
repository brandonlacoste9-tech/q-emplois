import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const socketService = {
  connect(token: string, baseUrl: string) {
    if (socket) {
      socket.disconnect();
    }

    // Connect to WebSocket server with the JWT token in auth payload
    socket = io(baseUrl.replace('/api/v1', ''), {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },
};
