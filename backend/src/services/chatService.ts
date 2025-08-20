import prisma from '../utils/database';
import { SessionInfo, ChatMessage } from '../types';
import { TelegramService } from './telegramService';
import path from 'path';

export class ChatService {
  private telegramService: TelegramService;

  constructor(telegramService: TelegramService) {
    this.telegramService = telegramService;
  }

  async getSessions(csId?: string): Promise<SessionInfo[]> {
    const whereClause = csId 
      ? { csId, status: 'ACTIVE' as const }
      : { status: 'ACTIVE' as const };

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        client: true,
        cs: true,
        chats: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sessionInfos: SessionInfo[] = [];

    for (const session of sessions) {
      const unreadCount = await prisma.chat.count({
        where: {
          sessionId: session.id,
          senderType: 'CLIENT',
          isRead: false
        }
      });

      sessionInfos.push({
        id: session.id,
        clientId: session.clientId,
        csId: session.csId || undefined,
        status: session.status as 'ACTIVE' | 'ENDED',
        client: {
          id: session.client.id,
          telegramId: session.client.telegramId,
          name: session.client.name,
          username: session.client.username || undefined
        },
        cs: session.cs ? {
          id: session.cs.id,
          name: session.cs.name,
          email: session.cs.email
        } : undefined,
        lastMessage: session.chats[0] ? {
          id: session.chats[0].id,
          sessionId: session.chats[0].sessionId,
          senderType: session.chats[0].senderType as 'CLIENT' | 'CS',
          messageType: session.chats[0].messageType as 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK',
          message: session.chats[0].message,
          fileUrl: session.chats[0].fileUrl || undefined,
          isRead: session.chats[0].isRead,
          createdAt: session.chats[0].createdAt
        } : undefined,
        unreadCount
      });
    }

    return sessionInfos;
  }

  async getSessionMessages(sessionId: string, limit = 50, offset = 0, lastMessageId?: string): Promise<{
    messages: ChatMessage[],
    hasMore: boolean,
    total: number
  }> {
    // Build where clause for pagination
    const whereClause: any = { sessionId };
    
    // If lastMessageId is provided, get messages older than that message (for infinite scroll)
    if (lastMessageId) {
      const lastMessage = await prisma.chat.findUnique({
        where: { id: lastMessageId },
        select: { createdAt: true }
      });
      
      if (lastMessage) {
        whereClause.createdAt = {
          lt: lastMessage.createdAt
        };
      }
    }

    // Get total count for pagination info
    const total = await prisma.chat.count({
      where: { sessionId }
    });

    // Get messages with pagination
    const chats = await prisma.chat.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Get newest first, then reverse for display
      skip: offset,
      take: limit + 1 // Take one extra to check if there are more messages
    });

    // Check if there are more messages
    const hasMore = chats.length > limit;
    const messages = hasMore ? chats.slice(0, limit) : chats;

    // Reverse to show oldest first (chat order)
    const formattedMessages = messages.reverse().map(chat => ({
      id: chat.id,
      sessionId: chat.sessionId,
      senderType: chat.senderType as 'CLIENT' | 'CS',
      messageType: chat.messageType as 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK',
      message: chat.message,
      fileUrl: chat.fileUrl || undefined,
      isRead: chat.isRead,
      createdAt: chat.createdAt
    }));

    return {
      messages: formattedMessages,
      hasMore,
      total
    };
  }

  async sendMessage(sessionId: string, userId: string, message: string, messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK' = 'TEXT', userRole?: string, fileUrl?: string): Promise<ChatMessage> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { client: true }
    });

    if (!session || session.status !== 'ACTIVE') {
      throw new Error('Session not found or inactive');
    }

    // Allow ADMIN users to send messages to any session, CS users only to their assigned sessions
    if (userRole !== 'ADMIN' && session.csId !== userId) {
      throw new Error('Unauthorized to send message to this session');
    }

    const chat = await prisma.chat.create({
      data: {
        sessionId,
        senderType: 'CS',
        messageType,
        message,
        fileUrl,
        isRead: true
      }
    });

    try {
      const telegramChatId = parseInt(session.client.telegramId);
      
      switch (messageType) {
        case 'IMAGE':
          if (fileUrl) {
            // Extract filename from URL and construct local file path
            const filename = fileUrl.split('/').pop();
            if (filename) {
              const filePath = path.join(__dirname, '../../uploads', filename);
              await this.telegramService.sendPhoto(telegramChatId, filePath, message);
            } else {
              await this.telegramService.sendPhoto(telegramChatId, message);
            }
          } else {
            await this.telegramService.sendPhoto(telegramChatId, message);
          }
          break;
        case 'FILE':
          if (fileUrl) {
            // Extract filename from URL and construct local file path
            const filename = fileUrl.split('/').pop();
            if (filename) {
              const filePath = path.join(__dirname, '../../uploads', filename);
              await this.telegramService.sendDocument(telegramChatId, filePath, message);
            } else {
              await this.telegramService.sendDocument(telegramChatId, message);
            }
          } else {
            await this.telegramService.sendDocument(telegramChatId, message);
          }
          break;
        case 'VIDEO':
          if (fileUrl) {
            // Extract filename from URL and construct local file path
            const filename = fileUrl.split('/').pop();
            if (filename) {
              const filePath = path.join(__dirname, '../../uploads', filename);
              await this.telegramService.sendVideo(telegramChatId, filePath, message);
            } else {
              await this.telegramService.sendVideo(telegramChatId, message);
            }
          } else {
            await this.telegramService.sendVideo(telegramChatId, message);
          }
          break;
        default:
          await this.telegramService.sendMessage(telegramChatId, message);
      }
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
      console.error('Session client telegramId:', session.client.telegramId);
      console.error('Message type:', messageType);
      console.error('File URL:', fileUrl);
      console.error('Error details:', error instanceof Error ? error.message : error);
    }

    const io = (global as any).io;
    if (io) {
      io.to(`session_${sessionId}`).emit('new_message', {
        id: chat.id,
        sessionId: chat.sessionId,
        senderType: chat.senderType,
        messageType: chat.messageType,
        message: chat.message,
        fileUrl: chat.fileUrl,
        isRead: chat.isRead,
        createdAt: chat.createdAt
      });
    }

    return {
      id: chat.id,
      sessionId: chat.sessionId,
      senderType: chat.senderType as 'CLIENT' | 'CS',
      messageType: chat.messageType as 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK',
      message: chat.message,
      fileUrl: chat.fileUrl || undefined,
      isRead: chat.isRead,
      createdAt: chat.createdAt
    };
  }

  async markMessagesAsRead(sessionId: string, userId: string, userRole?: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Allow ADMIN users to mark any session messages as read, CS users only their assigned sessions
    if (userRole !== 'ADMIN' && session.csId !== userId) {
      throw new Error('Unauthorized or session not found');
    }

    await prisma.chat.updateMany({
      where: {
        sessionId,
        senderType: 'CLIENT',
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    const io = (global as any).io;
    if (io) {
      io.to(`cs_${userId}`).emit('messages_read', { sessionId });
    }
  }

  async endSession(sessionId: string, userId: string, userRole?: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { client: true }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Allow ADMIN users to end any session, CS users only their assigned sessions
    if (userRole !== 'ADMIN' && session.csId !== userId) {
      throw new Error('Unauthorized or session not found');
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date()
      }
    });

    try {
      const telegramChatId = parseInt(session.client.telegramId);
      await this.telegramService.sendMessage(
        telegramChatId, 
        'Sesi chat telah berakhir. Terima kasih telah menggunakan layanan kami. Jika Anda memiliki pertanyaan lain, silakan kirim pesan baru.'
      );
    } catch (error) {
      console.error('Error sending end session message to Telegram:', error);
    }

    const io = (global as any).io;
    if (io) {
      io.to(`cs_${userId}`).emit('session_ended', { sessionId });
      io.to(`session_${sessionId}`).emit('session_ended', { sessionId });
    }
  }
}