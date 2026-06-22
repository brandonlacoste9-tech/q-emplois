import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  ChatMessageType,
  ConversationStatus,
  TaskApplicationStatus,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationService as ExternalNotificationService } from '../common/services/notification.service';
import { ChatGateway } from './chat.gateway';
import { containsContactInfo, CONTACT_INFO_BLOCKED_MSG } from './message-moderation';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly externalNotifications: ExternalNotificationService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  private mapMessage(
    message: {
      id: string;
      conversationId: string;
      senderId: string | null;
      type: ChatMessageType;
      content: string;
      attachmentUrl?: string | null;
      createdAt: Date;
      isRead: boolean;
    },
    senderName = '',
  ) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName,
      type: message.type,
      content: message.content,
      attachmentUrl: message.attachmentUrl ?? undefined,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead,
    };
  }

  private unreadWhere(userId: string) {
    return {
      type: { in: [ChatMessageType.text, ChatMessageType.image] },
      senderId: { not: userId },
      isRead: false,
    };
  }

  private previewContent(message: { type: ChatMessageType; content: string }) {
    if (message.type === ChatMessageType.image) return '📷 Photo';
    if (message.type === ChatMessageType.system) return message.content;
    return message.content;
  }

  private mapConversation(
    c: {
      id: string;
      clientId: string;
      providerId: string;
      taskId: string | null;
      status: ConversationStatus;
      updatedAt: Date;
      client: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
      provider: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
      task: { id: string; title: string; status: TaskStatus } | null;
      messages: Array<{
        id: string;
        conversationId: string;
        senderId: string | null;
        type: ChatMessageType;
        content: string;
        attachmentUrl?: string | null;
        createdAt: Date;
        isRead: boolean;
      }>;
      _count: { messages: number };
    },
    userId: string,
  ) {
    const isClient = c.clientId === userId;
    const other = isClient ? c.provider : c.client;
    const last = c.messages[0];
    return {
      id: c.id,
      clientId: c.clientId,
      providerId: c.providerId,
      status: c.status,
      clientName: [other.firstName, other.lastName].filter(Boolean).join(' ') || 'Utilisateur',
      clientAvatar: other.avatarUrl ?? undefined,
      jobId: c.taskId ?? undefined,
      jobTitle: c.task?.title,
      jobStatus: c.task?.status,
      unreadCount: c._count.messages,
      updatedAt: c.updatedAt.toISOString(),
      lastMessage: last ? this.mapMessage(last) : undefined,
    };
  }

  private async assertMessagingAllowed(
    conversation: {
      id: string;
      taskId: string | null;
      clientId: string;
      providerId: string;
      status: ConversationStatus;
    },
    userId: string,
  ) {
    if (conversation.status === ConversationStatus.archived) {
      throw new ForbiddenException('Cette conversation est archivée.');
    }

    if (!conversation.taskId) return;

    const task = await this.prisma.task.findUnique({
      where: { id: conversation.taskId },
      select: { status: true, clientId: true, taskerId: true },
    });
    if (!task) return;

    if (task.status === TaskStatus.completed || task.status === TaskStatus.cancelled) {
      throw new ForbiddenException('Cette tâche est terminée — messagerie en lecture seule.');
    }

    if (conversation.status === ConversationStatus.application) {
      if (task.status !== TaskStatus.open) {
        throw new ForbiddenException('Cette candidature n\'est plus active.');
      }
      if (userId === conversation.clientId) return;
      if (userId === conversation.providerId) {
        const app = await this.prisma.taskApplication.findUnique({
          where: {
            taskId_taskerId: { taskId: conversation.taskId, taskerId: userId },
          },
        });
        if (app?.status === TaskApplicationStatus.pending) return;
      }
      throw new ForbiddenException('Accès refusé à cette conversation.');
    }

    if (task.status === TaskStatus.open) {
      if (userId === conversation.clientId) return;
      throw new ForbiddenException('La messagerie complète s\'ouvre après la sélection du travailleur.');
    }
  }

  private async assertCanSend(
    conversation: { status: ConversationStatus },
    content: string,
  ) {
    if (conversation.status === ConversationStatus.application && containsContactInfo(content)) {
      throw new BadRequestException(CONTACT_INFO_BLOCKED_MSG);
    }
  }

  async ensureTaskConversation(clientId: string, providerId: string, taskId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { clientId, providerId, taskId },
    });
    if (existing) return existing.id;

    const created = await this.prisma.conversation.create({
      data: { clientId, providerId, taskId, status: ConversationStatus.active },
    });
    return created.id;
  }

  async openApplicationConversation(
    clientId: string,
    providerId: string,
    taskId: string,
    introMessage?: string,
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { clientId, providerId, taskId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          clientId,
          providerId,
          taskId,
          status: ConversationStatus.application,
        },
      });
      await this.postSystemMessage(
        conversation.id,
        'Fil de candidature — téléphone et adresse masqués jusqu\'à la sélection.',
      );
    } else if (conversation.status === ConversationStatus.archived) {
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.application, updatedAt: new Date() },
      });
      await this.postSystemMessage(conversation.id, 'Candidature relancée.');
    }

    if (introMessage?.trim()) {
      const trimmed = introMessage.trim();
      const existingIntro = await this.prisma.chatMessage.findFirst({
        where: {
          conversationId: conversation.id,
          senderId: providerId,
          type: ChatMessageType.text,
          content: trimmed,
        },
      });
      if (!existingIntro) {
        const message = await this.prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: providerId,
            type: ChatMessageType.text,
            content: trimmed,
          },
        });
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
        const tasker = await this.prisma.user.findUnique({
          where: { id: providerId },
          select: { firstName: true, lastName: true },
        });
        const senderName = [tasker?.firstName, tasker?.lastName].filter(Boolean).join(' ');
        const payload = this.mapMessage(message, senderName);
        this.chatGateway.emitNewMessage(clientId, payload);
      }
    }

    return conversation.id;
  }

  async archiveApplicationConversation(
    clientId: string,
    providerId: string,
    taskId: string,
    reason?: string,
  ) {
    const conv = await this.prisma.conversation.findFirst({
      where: { clientId, providerId, taskId },
    });
    if (!conv || conv.status === ConversationStatus.archived) return;

    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { status: ConversationStatus.archived },
    });
    if (reason) {
      await this.postSystemMessage(conv.id, reason);
    }
  }

  async archiveTaskConversations(taskId: string, reason?: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { taskId, status: { not: ConversationStatus.archived } },
    });
    for (const conv of conversations) {
      await this.prisma.conversation.update({
        where: { id: conv.id },
        data: { status: ConversationStatus.archived },
      });
      if (reason) {
        await this.postSystemMessage(conv.id, reason);
      }
    }
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
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.active },
    });
    await this.postSystemMessage(
      conversationId,
      `${taskerName} a été choisi(e) pour cette tâche. Coordonnez les détails ici — téléphone et adresse débloqués.`,
    );
    return conversationId;
  }

  async listJobConversations(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { clientId: true, taskerId: true, status: true, title: true },
    });
    if (!task) throw new NotFoundException('Tâche non trouvée.');

    const isClient = task.clientId === userId;
    if (!isClient && task.taskerId !== userId) {
      const application = await this.prisma.taskApplication.findUnique({
        where: { taskId_taskerId: { taskId, taskerId: userId } },
      });
      if (!application) {
        throw new ForbiddenException('Accès refusé.');
      }
    }

    const where = isClient
      ? { taskId, clientId: userId }
      : { taskId, OR: [{ providerId: userId }, { clientId: userId }] };

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        provider: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        task: { select: { id: true, title: true, status: true } },
        _count: {
          select: { messages: { where: this.unreadWhere(userId) } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => this.mapConversation(c, userId));
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

    return conversations.map((c) => this.mapConversation(c, userId));
  }

  async getUnreadTotal(userId: string) {
    const total = await this.prisma.chatMessage.count({
      where: {
        ...this.unreadWhere(userId),
        conversation: {
          OR: [{ clientId: userId }, { providerId: userId }],
          status: { not: ConversationStatus.archived },
        },
      },
    });
    return { total };
  }

  async getMessages(userId: string, conversationId: string, after?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledDate: true,
            estimatedPrice: true,
          },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    const canSend =
      conversation.status !== ConversationStatus.archived
      && !(conversation.task?.status === TaskStatus.completed
        || conversation.task?.status === TaskStatus.cancelled);

    return {
      messages: messages.map((m) => this.mapMessage(m)),
      conversationStatus: conversation.status,
      canSend,
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

  async sendMessage(
    userId: string,
    conversationId: string,
    payload: { content?: string; attachmentUrl?: string; type?: 'text' | 'image' },
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        client: true,
        provider: true,
        task: { select: { status: true } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }
    await this.assertMessagingAllowed(conversation, userId);

    const isImage = !!payload.attachmentUrl?.trim();
    const text = payload.content?.trim() ?? '';
    if (!isImage && !text) {
      throw new BadRequestException('Le message ne peut pas être vide.');
    }
    if (isImage && payload.type === 'text') {
      throw new BadRequestException('Type de message invalide pour une pièce jointe.');
    }

    await this.assertCanSend(conversation, text);

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        type: isImage ? ChatMessageType.image : ChatMessageType.text,
        content: isImage ? (text || '📷 Photo') : text,
        attachmentUrl: isImage ? payload.attachmentUrl!.trim() : null,
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
    const preview = this.previewContent(message);

    const mapped = this.mapMessage(message, senderName);
    this.chatGateway.emitNewMessage(recipientId, mapped);

    await this.notificationsService.create(
      recipientId,
      'new_message',
      isImage ? 'Nouvelle photo' : 'Nouveau message',
      preview.slice(0, 120),
      {
        conversationId,
        senderId: userId,
        content: preview.slice(0, 500),
        type: message.type,
        attachmentUrl: message.attachmentUrl ?? undefined,
      },
    );

    if (!this.chatGateway.isUserConnected(recipientId)) {
      await this.externalNotifications.notifyOfflineMessage(
        recipientId,
        senderName || 'Un utilisateur',
        preview,
        conversationId,
      );
    }

    return mapped;
  }

  async markRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { clientId: true, providerId: true },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }

    const updated = await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        type: { in: [ChatMessageType.text, ChatMessageType.image] },
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

    if (updated.count > 0) {
      const senderId = conversation.clientId === userId
        ? conversation.providerId
        : conversation.clientId;
      this.chatGateway.emitMessagesRead(senderId, { conversationId, readBy: userId });
    }

    return { success: true };
  }
}