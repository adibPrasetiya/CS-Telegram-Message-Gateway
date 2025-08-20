import { Response } from 'express';
import prisma from '../utils/database';
import { AuthRequest } from '../middleware/auth';

export class HistoryController {
  async getSessionHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, clientName, dateFrom, dateTo } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause based on user role
      const whereClause: any = {};
      
      // CS can only see their own sessions, ADMIN can see all
      if (userRole === 'CS') {
        whereClause.csId = userId;
      }

      // Add optional filters
      if (status) {
        whereClause.status = status;
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          whereClause.createdAt.lte = new Date(dateTo as string);
        }
      }

      // Client name filter
      if (clientName) {
        whereClause.client = {
          name: {
            contains: clientName as string
          }
        };
      }

      const [sessions, totalCount] = await Promise.all([
        prisma.session.findMany({
          where: whereClause,
          include: {
            client: {
              select: {
                id: true,
                name: true,
                username: true,
                telegramId: true
              }
            },
            cs: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                chats: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: offset,
          take: limitNum
        }),
        prisma.session.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        sessions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    } catch (error) {
      console.error('Error fetching session history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSessionDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Build where clause based on user role
      const whereClause: any = { id: sessionId };
      
      // CS can only see their own sessions, ADMIN can see all
      if (userRole === 'CS') {
        whereClause.csId = userId;
      }

      const session = await prisma.session.findFirst({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              username: true,
              telegramId: true
            }
          },
          cs: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          chats: {
            orderBy: {
              createdAt: 'asc'
            },
            select: {
              id: true,
              senderType: true,
              messageType: true,
              message: true,
              fileUrl: true,
              isRead: true,
              createdAt: true
            }
          }
        }
      });

      if (!session) {
        res.status(404).json({ error: 'Session not found or access denied' });
        return;
      }

      res.json(session);
    } catch (error) {
      console.error('Error fetching session details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCSPerformanceStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Only admins can view performance stats for all CS
      if (userRole !== 'ADMIN') {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const { dateFrom, dateTo } = req.query;
      
      const whereClause: any = {
        role: 'CS'
      };

      const dateFilter: any = {};
      if (dateFrom) {
        dateFilter.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        dateFilter.lte = new Date(dateTo as string);
      }

      const csStats = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          sessions: {
            where: Object.keys(dateFilter).length > 0 ? {
              createdAt: dateFilter
            } : undefined,
            select: {
              id: true,
              status: true,
              createdAt: true,
              endedAt: true,
              _count: {
                select: {
                  chats: true
                }
              }
            }
          }
        }
      });

      // Calculate statistics for each CS
      const stats = csStats.map(cs => {
        const totalSessions = cs.sessions.length;
        const activeSessions = cs.sessions.filter(s => s.status === 'ACTIVE').length;
        const endedSessions = cs.sessions.filter(s => s.status === 'ENDED').length;
        const totalMessages = cs.sessions.reduce((sum, session) => sum + session._count.chats, 0);
        const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;

        // Calculate average session duration for ended sessions
        const endedSessionsWithDuration = cs.sessions.filter(s => s.status === 'ENDED' && s.endedAt);
        const avgSessionDuration = endedSessionsWithDuration.length > 0 
          ? endedSessionsWithDuration.reduce((sum, session) => {
              const duration = new Date(session.endedAt!).getTime() - new Date(session.createdAt).getTime();
              return sum + duration;
            }, 0) / endedSessionsWithDuration.length
          : 0;

        return {
          csId: cs.id,
          csName: cs.name,
          csEmail: cs.email,
          totalSessions,
          activeSessions,
          endedSessions,
          totalMessages,
          avgMessagesPerSession,
          avgSessionDurationMinutes: Math.round(avgSessionDuration / (1000 * 60))
        };
      });

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching CS performance stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async searchChatHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, page = 1, limit = 20 } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole || !query) {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build session filter based on user role
      const sessionWhere: any = {};
      if (userRole === 'CS') {
        sessionWhere.csId = userId;
      }

      const searchResults = await prisma.chat.findMany({
        where: {
          message: {
            contains: query as string
          },
          session: sessionWhere
        },
        include: {
          session: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  username: true
                }
              },
              cs: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limitNum
      });

      const totalCount = await prisma.chat.count({
        where: {
          message: {
            contains: query as string
          },
          session: sessionWhere
        }
      });

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        results: searchResults,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    } catch (error) {
      console.error('Error searching chat history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}