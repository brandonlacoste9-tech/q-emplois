import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  ChatMessageType,
  ConversationStatus,
  MessageReportStatus,
  TaskApplicationStatus,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationService as ExternalNotificationService } from '../common/services/notification.service';
import { ChatGateway } from './chat.gateway';
import { containsContactInfo, CONTACT_INFO_BLOCKED_MSG } from './message-moderation';

const MESSAGE_RATE_NEW_ACCOUNT = 10;
const MESSAGE_RATE_DEFAULT = 30;
const MESSAGE_RATE_WINDOW_MS = 60_000;
const NEW_ACCOUNT_DAYS = 7;

export const MESSAGE_REPORT_REASONS = [
  'harassment',
  'spam',
  'contact_info',
  'inappropriate',
  'other',
] as const;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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

    if (conversation.status === ConversationStatus.inquiry) {
      if (task.status !== TaskStatus.open) {
        throw new ForbiddenException('Cette tâche n\'accepte plus de questions.');
      }
      if (userId === conversation.clientId || userId === conversation.providerId) return;
      throw new ForbiddenException('Accès refusé à cette conversation.');
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
    if (
      (conversation.status === ConversationStatus.application
        || conversation.status === ConversationStatus.inquiry)
      && containsContactInfo(content)
    ) {
      throw new BadRequestException(CONTACT_INFO_BLOCKED_MSG);
    }
  }

  private async assertRateLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });
    if (!user) return;

    const isNewAccount =
      Date.now() - user.createdAt.getTime() < NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
    const maxPerMinute = isNewAccount ? MESSAGE_RATE_NEW_ACCOUNT : MESSAGE_RATE_DEFAULT;
    const since = new Date(Date.now() - MESSAGE_RATE_WINDOW_MS);

    const recentCount = await this.prisma.chatMessage.count({
      where: {
        senderId: userId,
        createdAt: { gte: since },
        type: { in: [ChatMessageType.text, ChatMessageType.image] },
      },
    });

    if (recentCount >= maxPerMinute) {
      throw new HttpException(
        'Trop de messages envoyés. Réessayez dans un moment.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
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

  async openInquiryConversation(clientId: string, providerId: string, taskId: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { clientId, providerId, taskId },
    });

    if (conversation) {
      if (conversation.status === ConversationStatus.archived) {
        conversation = await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { status: ConversationStatus.inquiry, updatedAt: new Date() },
        });
        await this.postSystemMessage(conversation.id, 'Fil de questions relancé.');
      }
      return conversation.id;
    }

    conversation = await this.prisma.conversation.create({
      data: {
        clientId,
        providerId,
        taskId,
        status: ConversationStatus.inquiry,
      },
    });
    await this.postSystemMessage(
      conversation.id,
      'Fil de questions — posez vos questions sur la tâche. Téléphone et adresse masqués jusqu\'à la sélection.',
    );
    return conversation.id;
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
    } else if (conversation.status === ConversationStatus.inquiry) {
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.application, updatedAt: new Date() },
      });
      await this.postSystemMessage(conversation.id, 'Candidature envoyée — ce fil devient une candidature officielle.');
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
      const [application, conversation] = await Promise.all([
        this.prisma.taskApplication.findUnique({
          where: { taskId_taskerId: { taskId, taskerId: userId } },
        }),
        this.prisma.conversation.findFirst({
          where: { taskId, providerId: userId },
        }),
      ]);
      if (!application && !conversation) {
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

  async listConversations(userId: string, unreadOnly = false) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ clientId: userId }, { providerId: userId }],
        ...(unreadOnly
          ? { messages: { some: this.unreadWhere(userId) } }
          : {}),
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
    await this.assertRateLimit(userId);

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

  async searchMessages(userId: string, q: string, limit = 30) {
    const query = q.trim();
    if (query.length < 2) {
      throw new BadRequestException('Recherche trop courte (min. 2 caractères).');
    }

    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ clientId: userId }, { providerId: userId }] },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length === 0) return { results: [] };

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId: { in: conversationIds },
        type: { in: [ChatMessageType.text, ChatMessageType.image] },
        content: { contains: query, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      include: {
        conversation: {
          include: {
            task: { select: { title: true } },
            client: { select: { firstName: true, lastName: true } },
            provider: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return {
      results: messages.map((m) => {
        const conv = m.conversation;
        const isClient = conv.clientId === userId;
        const other = isClient ? conv.provider : conv.client;
        return {
          message: this.mapMessage(m),
          conversationId: m.conversationId,
          jobTitle: conv.task?.title,
          otherPartyName: [other.firstName, other.lastName].filter(Boolean).join(' ') || 'Utilisateur',
        };
      }),
    };
  }

  async reportMessage(
    userId: string,
    conversationId: string,
    messageId: string,
    reason: string,
    details?: string,
  ) {
    if (!MESSAGE_REPORT_REASONS.includes(reason as (typeof MESSAGE_REPORT_REASONS)[number])) {
      throw new BadRequestException('Motif de signalement invalide.');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }

    const message = await this.prisma.chatMessage.findFirst({
      where: { id: messageId, conversationId },
    });
    if (!message) throw new NotFoundException('Message introuvable.');
    if (message.type === ChatMessageType.system) {
      throw new BadRequestException('Les messages système ne peuvent pas être signalés.');
    }
    if (message.senderId === userId) {
      throw new BadRequestException('Vous ne pouvez pas signaler votre propre message.');
    }

    const existing = await this.prisma.messageReport.findFirst({
      where: { messageId, reporterId: userId },
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà signalé ce message.');
    }

    const report = await this.prisma.messageReport.create({
      data: {
        messageId,
        conversationId,
        reporterId: userId,
        reason,
        details: details?.trim() || null,
      },
    });

    await this.auditService.log({
      userId,
      action: 'message_reported',
      resource: 'chat_message',
      resourceId: messageId,
      details: { conversationId, reason, reportId: report.id },
    });

    return { success: true, reportId: report.id };
  }

  async listConversationsAdmin(q?: string, page = 1) {
    const take = 50;
    const skip = (page - 1) * take;
    const trimmed = q?.trim();

    const where = trimmed
      ? {
          OR: [
            { id: trimmed },
            { client: { email: { contains: trimmed, mode: 'insensitive' as const } } },
            { provider: { email: { contains: trimmed, mode: 'insensitive' as const } } },
            { task: { title: { contains: trimmed, mode: 'insensitive' as const } } },
            { client: { firstName: { contains: trimmed, mode: 'insensitive' as const } } },
            { client: { lastName: { contains: trimmed, mode: 'insensitive' as const } } },
            { provider: { firstName: { contains: trimmed, mode: 'insensitive' as const } } },
            { provider: { lastName: { contains: trimmed, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          client: { select: { email: true, firstName: true, lastName: true } },
          provider: { select: { email: true, firstName: true, lastName: true } },
          task: { select: { id: true, title: true, status: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const pendingByConv = await this.prisma.messageReport.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        status: MessageReportStatus.pending,
      },
      _count: { id: true },
    });
    const pendingMap = new Map(pendingByConv.map((p) => [p.conversationId, p._count.id]));

    return {
      conversations: conversations.map((c) => ({
        id: c.id,
        status: c.status,
        jobId: c.taskId,
        jobTitle: c.task?.title,
        jobStatus: c.task?.status,
        clientEmail: c.client.email,
        clientName: [c.client.firstName, c.client.lastName].filter(Boolean).join(' '),
        providerEmail: c.provider.email,
        providerName: [c.provider.firstName, c.provider.lastName].filter(Boolean).join(' '),
        messageCount: c._count.messages,
        pendingReports: pendingMap.get(c.id) ?? 0,
        lastMessage: c.messages[0] ? this.mapMessage(c.messages[0]) : undefined,
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
      page,
    };
  }

  async getConversationAdmin(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        client: { select: { id: true, email: true, firstName: true, lastName: true } },
        provider: { select: { id: true, email: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true, status: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');

    const senderIds = [...new Set(conversation.messages.map((m) => m.senderId).filter(Boolean))] as string[];
    const senders = senderIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: senderIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    return {
      id: conversation.id,
      status: conversation.status,
      job: conversation.task,
      client: conversation.client,
      provider: conversation.provider,
      messages: conversation.messages.map((m) => {
        const sender = m.senderId ? senderMap.get(m.senderId) : null;
        const senderName = sender
          ? [sender.firstName, sender.lastName].filter(Boolean).join(' ') || sender.email
          : 'Système';
        return this.mapMessage(m, senderName);
      }),
    };
  }

  async listMessageReports(status?: MessageReportStatus, page = 1) {
    const take = 50;
    const skip = (page - 1) * take;
    const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      this.prisma.messageReport.findMany({
        where,
        include: {
          message: true,
          reporter: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.messageReport.count({ where }),
    ]);

    const conversationIds = [...new Set(reports.map((r) => r.conversationId))];
    const conversations = conversationIds.length
      ? await this.prisma.conversation.findMany({
          where: { id: { in: conversationIds } },
          include: {
            task: { select: { title: true } },
            client: { select: { email: true } },
            provider: { select: { email: true } },
          },
        })
      : [];
    const convMap = new Map(conversations.map((c) => [c.id, c]));

    return {
      reports: reports.map((r) => {
        const conv = convMap.get(r.conversationId);
        return {
          id: r.id,
          status: r.status,
          reason: r.reason,
          details: r.details,
          adminNote: r.adminNote,
          createdAt: r.createdAt.toISOString(),
          reviewedAt: r.reviewedAt?.toISOString() ?? null,
          conversationId: r.conversationId,
          messageId: r.messageId,
          messagePreview: this.previewContent(r.message),
          reporterEmail: r.reporter.email,
          reporterName: [r.reporter.firstName, r.reporter.lastName].filter(Boolean).join(' '),
          jobTitle: conv?.task?.title,
          clientEmail: conv?.client.email,
          providerEmail: conv?.provider.email,
        };
      }),
      total,
      page,
    };
  }

  async resolveMessageReport(
    adminId: string,
    reportId: string,
    status: 'reviewed' | 'dismissed',
    adminNote?: string,
  ) {
    const report = await this.prisma.messageReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Signalement introuvable.');
    if (report.status !== MessageReportStatus.pending) {
      throw new BadRequestException('Ce signalement a déjà été traité.');
    }

    const nextStatus =
      status === 'reviewed' ? MessageReportStatus.reviewed : MessageReportStatus.dismissed;

    const updated = await this.prisma.messageReport.update({
      where: { id: reportId },
      data: {
        status: nextStatus,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNote: adminNote?.trim() || null,
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'message_report_resolved',
      resource: 'message_report',
      resourceId: reportId,
      details: { status: nextStatus, conversationId: report.conversationId, messageId: report.messageId },
    });

    return updated;
  }
}