import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  // Map of userId -> Array of active socket instances
  private userSockets = new Map<string, Socket[]>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.userId;
      
      if (!userId) {
        client.disconnect();
        return;
      }

      client.data.userId = userId;

      const existingSockets = this.userSockets.get(userId) || [];
      existingSockets.push(client);
      this.userSockets.set(userId, existingSockets);
      
      this.logger.log(`Client connected: ${userId} (${client.id})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const existingSockets = this.userSockets.get(userId) || [];
      const updatedSockets = existingSockets.filter((s) => s.id !== client.id);
      
      if (updatedSockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, updatedSockets);
      }
      this.logger.log(`Client disconnected: ${userId} (${client.id})`);
    }
  }

  emitNewMessage(recipientId: string, message: any) {
    const sockets = this.userSockets.get(recipientId);
    if (sockets && sockets.length > 0) {
      sockets.forEach((socket) => {
        socket.emit('newMessage', message);
      });
    }
  }

  isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!(sockets && sockets.length > 0);
  }
}
