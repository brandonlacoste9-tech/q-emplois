import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationService as ExternalNotificationService } from '../common/services/notification.service';
import { TaskStatus } from '@prisma/client';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly externalNotifications: ExternalNotificationService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  private async assertMessagingAllowed(
    conversation: { taskId: string | null; clientId: string; providerId: string },
    userId: string,
  ) {
    if (!conversation.taskId) return;
    const task = await this.prisma.task.findUnique({
      where: { id: conversation.taskId },
      select: { status: true, clientId: true, taskerId: true },
    });
    if (!task || task.status === TaskStatus.open) {
      if (task?.clientId === userId) return;
      throw new ForbiddenException(
        'La messagerie s\'ouvre lorsque vous avez choisi un travailleur.',
      );
    }
  }

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ clientId: userId }, { providerId: userId }],
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        client: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => {
      const isClient = c.clientId === userId;
      const other = isClient ? c.provider : c.client;
      const last = c.messages[0];
      return {
        id: c.id,
        clientId: c.clientId,
        clientName: [other.firstName, other.lastName].filter(Boolean).join(' '),
        jobId: c.taskId ?? undefined,
        jobTitle: c.task?.title,
        unreadCount: 0,
        updatedAt: c.updatedAt.toISOString(),
        lastMessage: last
          ? {
              id: last.id,
              conversationId: c.id,
              senderId: last.senderId,
              senderName: '',
              content: last.content,
              createdAt: last.createdAt.toISOString(),
              isRead: last.isRead,
            }
          : undefined,
      };
    });
  }

  async getMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }
    await this.assertMessagingAllowed(conversation, userId);

    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        client: true,
        provider: true,
      }
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }
    await this.assertMessagingAllowed(conversation, userId);

    const message = await this.prisma.chatMessage.create({
      data: { conversationId, senderId: userId, content },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const isClient = conversation.clientId === userId;
    const recipientId = isClient ? conversation.providerId : conversation.clientId;
    const sender = isClient ? conversation.client : conversation.provider;
    const senderName = [sender.firstName, sender.lastName].filter(Boolean).join(' ');

    // Notify the recipient via real-time WebSocket
    this.chatGateway.emitNewMessage(recipientId, {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: senderName,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead,
    });

    // Notify the recipient via in-app notifications
    await this.notificationsService.create(
      recipientId,
      'new_message',
      'Nouveau message',
      content.slice(0, 120),
      { conversationId, senderId: userId, content: content.slice(0, 500) },
    );

    // If recipient is offline, send Email & Push notification
    if (!this.chatGateway.isUserConnected(recipientId)) {
      await this.externalNotifications.notifyOfflineMessage(
        recipientId,
        senderName || 'Un utilisateur',
        content,
        conversationId
      );
    }

    return message;
  }

  async markRead(userId: string, conversationId: string) {
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
    return { success: true };
  }
}