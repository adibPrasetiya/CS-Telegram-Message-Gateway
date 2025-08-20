import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../utils/database';
import { TelegramService } from './telegramService';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class SocketService {
  private io: Server;
  private telegramService: TelegramService;

  constructor(io: Server, telegramService: TelegramService) {
    this.io = io;
    this.telegramService = telegramService;
    this.setupMiddleware();
    this.setupEventHandlers();
    
    (global as any).io = io;
  }

  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyAccessToken(token);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);

      this.handleJoinRooms(socket);
      this.handleChatEvents(socket);
      this.handleStatusEvents(socket);
      this.handleDisconnection(socket);
    });
  }

  private async handleJoinRooms(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId) return;

    socket.join(`user_${socket.userId}`);

    if (socket.userRole === 'CS') {
      socket.join(`cs_${socket.userId}`);
      
      const activeSessions = await prisma.session.findMany({
        where: {
          csId: socket.userId,
          status: 'ACTIVE'
        }
      });

      activeSessions.forEach(session => {
        socket.join(`session_${session.id}`);
      });

      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { statusOnline: true }
        });
      } catch (error) {
        console.error(`Failed to update user status for user ${socket.userId}:`, error);
        socket.emit('error', { message: 'User not found. Please login again.' });
        return;
      }

      socket.broadcast.emit('cs_status_changed', {
        csId: socket.userId,
        online: true
      });

      // Process pending messages when CS comes online
      try {
        await this.telegramService.processPendingMessages();
      } catch (error) {
        console.error('Error processing pending messages:', error);
      }
    }
  }

  private handleChatEvents(socket: AuthenticatedSocket): void {
    socket.on('join_session', async (data: { sessionId: string }) => {
      const { sessionId } = data;
      
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { client: true, cs: true }
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (socket.userRole === 'CS' && session.csId !== socket.userId) {
        socket.emit('error', { message: 'Unauthorized to join this session' });
        return;
      }

      socket.join(`session_${sessionId}`);
      
      const messages = await prisma.chat.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: 50
      });

      socket.emit('session_joined', {
        sessionId,
        client: session.client,
        cs: session.cs,
        messages
      });
    });

    socket.on('leave_session', (data: { sessionId: string }) => {
      socket.leave(`session_${data.sessionId}`);
    });

    socket.on('typing_start', (data: { sessionId: string }) => {
      socket.to(`session_${data.sessionId}`).emit('user_typing', {
        userId: socket.userId,
        userRole: socket.userRole
      });
    });

    socket.on('typing_stop', (data: { sessionId: string }) => {
      socket.to(`session_${data.sessionId}`).emit('user_stop_typing', {
        userId: socket.userId,
        userRole: socket.userRole
      });
    });
  }

  private handleStatusEvents(socket: AuthenticatedSocket): void {
    socket.on('get_online_cs', async () => {
      const onlineCS = await prisma.user.findMany({
        where: {
          role: 'CS',
          statusOnline: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          statusOnline: true
        }
      });

      socket.emit('online_cs_list', onlineCS);
    });

    socket.on('update_status', async (data: { online: boolean }) => {
      if (!socket.userId) return;

      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { statusOnline: data.online }
        });
      } catch (error) {
        console.error(`Failed to update user status for user ${socket.userId}:`, error);
        return;
      }

      if (socket.userRole === 'CS') {
        socket.broadcast.emit('cs_status_changed', {
          csId: socket.userId,
          online: data.online
        });
      }
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);

      if (!socket.userId) return;

      if (socket.userRole === 'CS') {
        const connectedSockets = await this.io.in(`cs_${socket.userId}`).fetchSockets();
        
        if (connectedSockets.length === 0) {
          try {
            await prisma.user.update({
              where: { id: socket.userId },
              data: { statusOnline: false }
            });
          } catch (error) {
            console.error(`Failed to update user status for user ${socket.userId}:`, error);
          }

          socket.broadcast.emit('cs_status_changed', {
            csId: socket.userId,
            online: false
          });
        }
      }
    });
  }

  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  public emitToCS(csId: string, event: string, data: any): void {
    this.io.to(`cs_${csId}`).emit(event, data);
  }

  public emitToSession(sessionId: string, event: string, data: any): void {
    this.io.to(`session_${sessionId}`).emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }
}