import TelegramBot from 'node-telegram-bot-api';
import prisma from '../utils/database';
import { TelegramMessage } from '../types';
import { Stream } from 'stream';

export class TelegramService {
  private bot!: TelegramBot;
  private processedMessages: Map<string, number> = new Map();
  private static instance: TelegramService | null = null;

  constructor() {
    if (TelegramService.instance) {
      console.warn('TelegramService instance already exists. Returning existing instance.');
      return TelegramService.instance;
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    if (token === 'your-telegram-bot-token-here') {
      console.error('TELEGRAM_BOT_TOKEN is set to default example value');
      throw new Error('Please configure a valid TELEGRAM_BOT_TOKEN');
    }

    try {
      console.log('Initializing Telegram bot with token:', token.substring(0, 10) + '...');
      this.bot = new TelegramBot(token, { 
        polling: {
          interval: 1000,
          autoStart: true,
        },
        // Suppress deprecation warning about file content-type
        filepath: false
      });
      this.setupMessageHandlers();
      TelegramService.instance = this;
      console.log('Telegram bot initialized successfully');
      
      // Test the bot connection
      this.testBotConnection();
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  private async testBotConnection(): Promise<void> {
    try {
      const me = await this.bot.getMe();
      console.log('Telegram bot connection verified:', {
        id: me.id,
        username: me.username,
        first_name: me.first_name
      });
    } catch (error) {
      console.error('Failed to verify Telegram bot connection:', error);
    }
  }

  private setupMessageHandlers(): void {
    this.bot.on('message', async (msg) => {
      try {
        await this.handleIncomingMessage(msg);
      } catch (error) {
        console.error('Error handling Telegram message:', error);
      }
    });

    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
      // If it's a conflict error, stop and restart polling
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        console.log('Conflict detected. Stopping and restarting bot...');
        this.stopPolling();
        setTimeout(() => {
          this.startPolling();
        }, 5000);
      }
    });
  }

  async handleIncomingMessage(msg: any): Promise<void> {
    console.log('Handling incoming Telegram message:', {
      messageId: msg.message_id,
      chatId: msg.chat.id,
      fromId: msg.from.id,
      hasText: !!msg.text,
      hasPhoto: !!msg.photo,
      hasDocument: !!msg.document,
      hasVideo: !!msg.video,
      hasCaption: !!msg.caption,
      caption: msg.caption
    });

    // Simple deduplication: store processed message IDs in memory for a short time
    const messageKey = `${msg.chat.id}_${msg.message_id}`;
    if (this.processedMessages.has(messageKey)) {
      console.log('Duplicate message detected, skipping:', messageKey);
      return;
    }
    
    // Add to processed messages and clean up old entries
    this.processedMessages.set(messageKey, Date.now());
    this.cleanupProcessedMessages();

    const telegramId = msg.from.id.toString();
    const name = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();
    const username = msg.from.username;

    let client = await prisma.client.findUnique({
      where: { telegramId }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          telegramId,
          name,
          username
        }
      });
    }

    let session = await prisma.session.findFirst({
      where: {
        clientId: client.id,
        status: 'ACTIVE'
      },
      include: {
        cs: true
      }
    });

    if (!session) {
      const availableCS = await this.getNextAvailableCS();
      
      if (!availableCS) {
        // Store message for later processing when CS becomes available
        await this.storeUnassignedMessage(client.id, msg);
        await this.sendMessage(
          msg.chat.id, 
          'Maaf, saat ini tidak ada Customer Service yang tersedia. Tim kami akan segera membantu Anda begitu ada yang online. Pesan Anda telah tersimpan dan akan segera direspons.'
        );
        return;
      }

      session = await prisma.session.create({
        data: {
          clientId: client.id,
          csId: availableCS.id,
          status: 'ACTIVE'
        },
        include: {
          cs: true,
          client: true
        }
      });

      // Auto-join the assigned CS to the session room and notify them
      const io = (global as any).io;
      if (io && session) {
        // Join the CS to the session room automatically
        const csSockets = await io.in(`cs_${availableCS.id}`).fetchSockets();
        csSockets.forEach((socket: any) => {
          socket.join(`session_${session!.id}`);
        });

        // Notify the assigned CS about the new session
        io.to(`cs_${availableCS.id}`).emit('new_session_assigned', {
          sessionId: session.id,
          client: {
            id: client.id,
            name: client.name,
            username: client.username,
            telegramId: client.telegramId
          },
          message: 'New chat session assigned to you'
        });

        console.log(`New session ${session.id} assigned to CS ${availableCS.name} (${availableCS.id})`);
      }

      // Notify client that they are connected to CS
      await this.sendMessage(
        msg.chat.id,
        `Halo! Anda terhubung dengan Customer Service kami. CS ${availableCS.name} (${availableCS.email}) akan membantu Anda. Silakan sampaikan pertanyaan atau keluhan Anda.`
      );
    }

    const messageType = this.getMessageType(msg);
    const messageContent = this.extractMessageContent(msg);
    const fileUrl = await this.handleFile(msg);

    console.log('Extracted message data:', {
      messageType,
      messageContent,
      fileUrl,
      hasFileUrl: !!fileUrl
    });

    const chat = await prisma.chat.create({
      data: {
        sessionId: session.id,
        senderType: 'CLIENT',
        messageType,
        message: messageContent,
        fileUrl,
        isRead: false
      }
    });

    if (session.cs) {
      const io = (global as any).io;
      if (io) {
        console.log(`Emitting new_message to session_${session.id} and new_session_message to cs_${session.csId}`);
        
        // Emit to session room (for CS agents currently viewing this session)
        io.to(`session_${session.id}`).emit('new_message', {
          id: chat.id,
          sessionId: chat.sessionId,
          senderType: chat.senderType,
          messageType: chat.messageType,
          message: chat.message,
          fileUrl: chat.fileUrl,
          isRead: chat.isRead,
          createdAt: chat.createdAt
        });
        
        // Emit to CS specific room for notifications (for the assigned CS agent)
        io.to(`cs_${session.csId}`).emit('new_session_message', {
          sessionId: session.id,
          clientName: client.name,
          message: messageContent,
          messageType,
          fileUrl,
          timestamp: new Date()
        });
        
        console.log(`Message emitted to CS ${session.csId} for session ${session.id}`);
      } else {
        console.error('Socket.IO instance not available');
      }
    } else {
      console.log('Session has no assigned CS, storing message for later processing');
    }
  }

  private async getNextAvailableCS() {
    const onlineCS = await prisma.user.findMany({
      where: {
        role: 'CS',
        statusOnline: true
      },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });

    if (onlineCS.length === 0) {
      return null;
    }

    onlineCS.sort((a, b) => a.sessions.length - b.sessions.length);
    return onlineCS[0];
  }

  private getMessageType(msg: any): 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK' {
    if (msg.photo) return 'IMAGE';
    if (msg.document) return 'FILE';
    if (msg.video) return 'VIDEO';
    if (msg.text && this.containsLink(msg.text)) return 'LINK';
    return 'TEXT';
  }

  private extractMessageContent(msg: any): string {
    if (msg.text) return msg.text;
    if (msg.photo) return msg.caption || 'Image';
    if (msg.document) {
      const caption = msg.caption;
      const fileName = msg.document.file_name;
      
      if (caption && fileName) {
        // Show both caption and filename if both exist
        return `${caption} (${fileName})`;
      } else if (caption) {
        // Show just caption if only caption exists
        return caption;
      } else if (fileName) {
        // Show just filename if only filename exists
        return fileName;
      } else {
        // Fallback
        return 'Document';
      }
    }
    if (msg.video) return msg.caption || 'Video';
    return '';
  }

  private async handleFile(msg: any): Promise<string | undefined> {
    try {
      let fileId: string | undefined;
      
      if (msg.photo) {
        fileId = msg.photo[msg.photo.length - 1].file_id;
      } else if (msg.document) {
        fileId = msg.document.file_id;
      } else if (msg.video) {
        fileId = msg.video.file_id;
      }

      if (fileId) {
        const fileInfo = await this.bot.getFile(fileId);
        return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
      }
    } catch (error) {
      console.error('Error handling file:', error);
    }
    
    return undefined;
  }

  private containsLink(text: string): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
  }

  async sendMessage(chatId: number, message: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, message);
    } catch (error: any) {
      console.error('Error sending Telegram message:', error);
      
      // Enhance error information for better debugging
      if (error.code === 429 || error.message?.includes('Too Many Requests')) {
        const retryAfter = error.response?.parameters?.retry_after || 30;
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds. Code: 429`);
      }
      
      if (error.code === 403) {
        throw new Error(`Bot blocked by user or chat not found. Chat ID: ${chatId}. Code: 403`);
      }
      
      if (error.code === 400) {
        throw new Error(`Bad request - invalid chat ID or message format. Chat ID: ${chatId}. Code: 400`);
      }
      
      throw error;
    }
  }

  async sendPhoto(chatId: number, photo: string | Stream, caption?: string): Promise<void> {
    try {
      console.log(`Sending photo to chat ${chatId}, type: ${typeof photo}`);
      await this.bot.sendPhoto(chatId, photo, { caption });
    } catch (error: any) {
      console.error('Error sending Telegram photo:', error);
      
      // Enhance error information for better debugging
      if (error.code === 429 || error.message?.includes('Too Many Requests')) {
        const retryAfter = error.response?.parameters?.retry_after || 30;
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds. Code: 429`);
      }
      
      if (error.code === 403) {
        throw new Error(`Bot blocked by user or chat not found. Chat ID: ${chatId}. Code: 403`);
      }
      
      if (error.code === 400) {
        throw new Error(`Bad request - invalid photo or chat ID. Chat ID: ${chatId}. Code: 400`);
      }
      
      throw error;
    }
  }

  async sendDocument(chatId: number, document: string | Stream, caption?: string): Promise<void> {
    try {
      console.log(`Sending document to chat ${chatId}, type: ${typeof document}`);
      await this.bot.sendDocument(chatId, document, { caption });
    } catch (error: any) {
      console.error('Error sending Telegram document:', error);
      
      // Enhance error information for better debugging
      if (error.code === 429 || error.message?.includes('Too Many Requests')) {
        const retryAfter = error.response?.parameters?.retry_after || 30;
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds. Code: 429`);
      }
      
      if (error.code === 403) {
        throw new Error(`Bot blocked by user or chat not found. Chat ID: ${chatId}. Code: 403`);
      }
      
      if (error.code === 400) {
        throw new Error(`Bad request - invalid document or chat ID. Chat ID: ${chatId}. Code: 400`);
      }
      
      throw error;
    }
  }

  async sendVideo(chatId: number, video: string | Stream, caption?: string): Promise<void> {
    try {
      console.log(`Sending video to chat ${chatId}, type: ${typeof video}`);
      await this.bot.sendVideo(chatId, video, { caption });
    } catch (error: any) {
      console.error('Error sending Telegram video:', error);
      
      // Enhance error information for better debugging
      if (error.code === 429 || error.message?.includes('Too Many Requests')) {
        const retryAfter = error.response?.parameters?.retry_after || 30;
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds. Code: 429`);
      }
      
      if (error.code === 403) {
        throw new Error(`Bot blocked by user or chat not found. Chat ID: ${chatId}. Code: 403`);
      }
      
      if (error.code === 400) {
        throw new Error(`Bad request - invalid video or chat ID. Chat ID: ${chatId}. Code: 400`);
      }
      
      throw error;
    }
  }

  private cleanupProcessedMessages(): void {
    const now = Date.now();
    const maxAge = 60000; // 1 minute
    
    for (const [key, timestamp] of this.processedMessages.entries()) {
      if (now - timestamp > maxAge) {
        this.processedMessages.delete(key);
      }
    }
  }

  private async storeUnassignedMessage(clientId: string, msg: any): Promise<void> {
    const messageType = this.getMessageType(msg);
    const messageContent = this.extractMessageContent(msg);
    const fileUrl = await this.handleFile(msg);

    // Create a pending message that will be processed when CS becomes available
    await prisma.pendingMessage.create({
      data: {
        clientId,
        messageType,
        message: messageContent,
        fileUrl,
        telegramMessageId: msg.message_id.toString(),
        originalMessage: JSON.stringify(msg)
      }
    });

    console.log(`Stored unassigned message from client ${clientId}`);
  }

  public async processPendingMessages(): Promise<void> {
    console.log('Processing pending messages for newly online CS...');
    
    // Get all pending messages
    const pendingMessages = await prisma.pendingMessage.findMany({
      include: {
        client: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (pendingMessages.length === 0) {
      console.log('No pending messages to process');
      return;
    }

    console.log(`Processing ${pendingMessages.length} pending messages`);

    for (const pendingMsg of pendingMessages) {
      try {
        // Check if client already has an active session
        const existingSession = await prisma.session.findFirst({
          where: {
            clientId: pendingMsg.clientId,
            status: 'ACTIVE'
          }
        });

        if (existingSession) {
          // Client already has an active session, skip this message
          await prisma.pendingMessage.delete({
            where: { id: pendingMsg.id }
          });
          continue;
        }

        // Get available CS
        const availableCS = await this.getNextAvailableCS();
        
        if (!availableCS) {
          // Still no CS available, leave message pending
          console.log('Still no CS available for pending messages');
          break;
        }

        // Create session for this client
        const session = await prisma.session.create({
          data: {
            clientId: pendingMsg.clientId,
            csId: availableCS.id,
            status: 'ACTIVE'
          },
          include: {
            cs: true,
            client: true
          }
        });

        // Create the chat message
        await prisma.chat.create({
          data: {
            sessionId: session.id,
            senderType: 'CLIENT',
            messageType: pendingMsg.messageType,
            message: pendingMsg.message,
            fileUrl: pendingMsg.fileUrl,
            isRead: false
          }
        });

        // Auto-join CS to session and notify
        const io = (global as any).io;
        if (io) {
          const csSockets = await io.in(`cs_${availableCS.id}`).fetchSockets();
          csSockets.forEach((socket: any) => {
            socket.join(`session_${session.id}`);
          });

          io.to(`cs_${availableCS.id}`).emit('new_session_assigned', {
            sessionId: session.id,
            client: {
              id: pendingMsg.client.id,
              name: pendingMsg.client.name,
              username: pendingMsg.client.username,
              telegramId: pendingMsg.client.telegramId
            },
            message: 'New chat session with pending message assigned to you'
          });
        }

        // Notify client that CS is now available with CS information
        await this.sendMessage(
          parseInt(pendingMsg.client.telegramId),
          `Customer Service sekarang tersedia! Anda terhubung dengan CS ${availableCS.name} (${availableCS.email}) yang akan membantu Anda. Pesan Anda telah diterima dan akan segera direspons.`
        );

        // Remove processed pending message
        await prisma.pendingMessage.delete({
          where: { id: pendingMsg.id }
        });

        console.log(`Processed pending message for client ${pendingMsg.client.name}, assigned to CS ${availableCS.name}`);

      } catch (error) {
        console.error(`Error processing pending message ${pendingMsg.id}:`, error);
      }
    }
  }

  public stopPolling(): void {
    try {
      if (this.bot) {
        this.bot.stopPolling();
        console.log('Telegram bot polling stopped');
      }
    } catch (error) {
      console.error('Error stopping Telegram bot polling:', error);
    }
  }

  public startPolling(): void {
    try {
      if (this.bot) {
        this.bot.startPolling({ restart: true });
        console.log('Telegram bot polling started');
      }
    } catch (error) {
      console.error('Error starting Telegram bot polling:', error);
    }
  }

  public static getInstance(): TelegramService | null {
    return TelegramService.instance;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const me = await this.bot.getMe();
      console.log('Bot connection test successful:', me.username);
      return true;
    } catch (error) {
      console.error('Bot connection test failed:', error);
      throw new Error(`Telegram bot connection failed: ${error}`);
    }
  }

  public static resetInstance(): void {
    if (TelegramService.instance) {
      TelegramService.instance.stopPolling();
      TelegramService.instance = null;
    }
  }
}