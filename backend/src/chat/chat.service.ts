import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }

    const message = await this.prisma.chatMessage.create({
      data: { conversationId, senderId: userId, content },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

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