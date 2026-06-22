import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private userSockets = new Map<string, Socket[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

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

  emitToUser(userId: string, event: string, payload: unknown) {
    const sockets = this.userSockets.get(userId);
    if (sockets?.length) {
      sockets.forEach((socket) => socket.emit(event, payload));
    }
  }

  emitNewMessage(recipientId: string, message: unknown) {
    this.emitToUser(recipientId, 'newMessage', message);
  }

  emitMessagesRead(recipientId: string, payload: { conversationId: string; readBy: string }) {
    this.emitToUser(recipientId, 'messagesRead', payload);
  }

  isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!(sockets && sockets.length > 0);
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: { conversationId?: string }) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !payload?.conversationId) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: payload.conversationId },
      select: { clientId: true, providerId: true },
    });
    if (!conversation) return;
    if (conversation.clientId !== userId && conversation.providerId !== userId) return;

    const recipientId = conversation.clientId === userId
      ? conversation.providerId
      : conversation.clientId;

    this.emitToUser(recipientId, 'typing', {
      conversationId: payload.conversationId,
      userId,
    });
  }
}