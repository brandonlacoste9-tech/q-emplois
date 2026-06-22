import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { ChatMessageType, TaskStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationService as ExternalNotificationService } from '../common/services/notification.service';
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

  private mapMessage(message: {
    id: string;
    conversationId: string;
    senderId: string | null;
    type: ChatMessageType;
    content: string;
    createdAt: Date;
    isRead: boolean;
  }, senderName = '') {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName,
      type: message.type,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead,
    };
  }

  private unreadWhere(userId: string) {
    return {
      type: ChatMessageType.text,
      senderId: { not: userId },
      isRead: false,
    };
  }

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

  async ensureTaskConversation(clientId: string, providerId: string, taskId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { clientId, providerId, taskId },
    });
    if (existing) return existing.id;

    const created = await this.prisma.conversation.create({
      data: { clientId, providerId, taskId },
    });
    return created.id;
  }

  async postSystemMessage(conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return;

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: null,
        type: ChatMessageType.system,
        content,
        isRead: false,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const payload = this.mapMessage(message);
    this.chatGateway.emitNewMessage(conversation.clientId, payload);
    this.chatGateway.emitNewMessage(conversation.providerId, payload);
  }

  async postTaskSystemMessage(taskId: string, content: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { clientId: true, taskerId: true },
    });
    if (!task?.taskerId) return;

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        taskId,
        clientId: task.clientId,
        providerId: task.taskerId,
      },
    });
    if (!conversation) return;

    await this.postSystemMessage(conversation.id, content);
  }

  async openTaskConversation(
    clientId: string,
    providerId: string,
    taskId: string,
    taskerName: string,
  ) {
    const conversationId = await this.ensureTaskConversation(clientId, providerId, taskId);
    await this.postSystemMessage(
      conversationId,
      `${taskerName} a été choisi(e) pour cette tâche. Vous pouvez coordonner les détails ici.`,
    );
    return conversationId;
  }

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ clientId: userId }, { providerId: userId }],
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        provider: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        task: { select: { id: true, title: true, status: true } },
        _count: {
          select: {
            messages: { where: this.unreadWhere(userId) },
          },
        },
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
        clientName: [other.firstName, other.lastName].filter(Boolean).join(' ') || 'Utilisateur',
        clientAvatar: other.avatarUrl ?? undefined,
        jobId: c.taskId ?? undefined,
        jobTitle: c.task?.title,
        jobStatus: c.task?.status,
        unreadCount: c._count.messages,
        updatedAt: c.updatedAt.toISOString(),
        lastMessage: last ? this.mapMessage(last) : undefined,
      };
    });
  }

  async getUnreadTotal(userId: string) {
    const total = await this.prisma.chatMessage.count({
      where: {
        ...this.unreadWhere(userId),
        conversation: {
          OR: [{ clientId: userId }, { providerId: userId }],
        },
      },
    });
    return { total };
  }

  async getMessages(userId: string, conversationId: string, after?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        task: { select: { id: true, title: true, status: true, scheduledDate: true, estimatedPrice: true } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }
    await this.assertMessagingAllowed(conversation, userId);

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      messages: messages.map((m) => this.mapMessage(m)),
      job: conversation.task
        ? {
            id: conversation.task.id,
            title: conversation.task.title,
            status: conversation.task.status,
            scheduledDate: conversation.task.scheduledDate?.toISOString() ?? null,
            estimatedPrice: Number(conversation.task.estimatedPrice),
          }
        : null,
    };
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        client: true,
        provider: true,
      },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }
    await this.assertMessagingAllowed(conversation, userId);

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        type: ChatMessageType.text,
        content,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const isClient = conversation.clientId === userId;
    const recipientId = isClient ? conversation.providerId : conversation.clientId;
    const sender = isClient ? conversation.client : conversation.provider;
    const senderName = [sender.firstName, sender.lastName].filter(Boolean).join(' ');

    const payload = this.mapMessage(message, senderName);
    this.chatGateway.emitNewMessage(recipientId, payload);

    await this.notificationsService.create(
      recipientId,
      'new_message',
      'Nouveau message',
      content.slice(0, 120),
      { conversationId, senderId: userId, content: content.slice(0, 500) },
    );

    if (!this.chatGateway.isUserConnected(recipientId)) {
      await this.externalNotifications.notifyOfflineMessage(
        recipientId,
        senderName || 'Un utilisateur',
        content,
        conversationId,
      );
    }

    return payload;
  }

  async markRead(userId: string, conversationId: string) {
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        type: ChatMessageType.text,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        type: ChatMessageType.system,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }
}