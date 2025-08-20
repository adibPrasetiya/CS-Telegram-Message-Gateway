import { Response } from 'express';
import prisma from '../utils/database';
import { AuthRequest } from '../middleware/auth';

export class ClientController {
  // Get all registered clients (clients who have chatted before)
  async getClients(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause for search
      const whereClause: any = {
        // Only include clients who have chatted (have sessions)
        sessions: {
          some: {}
        }
      };

      if (search) {
        whereClause.OR = [
          {
            name: {
              contains: search as string
            }
          },
          {
            username: {
              contains: search as string
            }
          }
        ];
      }

      const [clients, totalCount] = await Promise.all([
        prisma.client.findMany({
          where: whereClause,
          include: {
            sessions: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1,
              select: {
                id: true,
                status: true,
                createdAt: true,
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
              }
            },
            _count: {
              select: {
                sessions: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: offset,
          take: limitNum
        }),
        prisma.client.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      // Transform data to include last session info and current status
      const clientsWithStatus = clients.map(client => ({
        id: client.id,
        name: client.name,
        username: client.username,
        telegramId: client.telegramId,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        totalSessions: client._count.sessions,
        lastSession: client.sessions[0] || null,
        hasActiveSession: client.sessions[0]?.status === 'ACTIVE',
        canStartConversation: !client.sessions[0] || client.sessions[0]?.status === 'ENDED'
      }));

      res.json({
        clients: clientsWithStatus,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Start a new conversation with a client
  async startConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      // Check if client already has an active session
      const existingActiveSession = await prisma.session.findFirst({
        where: {
          clientId: clientId,
          status: 'ACTIVE'
        }
      });

      if (existingActiveSession) {
        res.status(400).json({ 
          error: 'Client already has an active session',
          sessionId: existingActiveSession.id
        });
        return;
      }

      // Create new session
      const newSession = await prisma.session.create({
        data: {
          clientId: clientId,
          csId: userId,
          status: 'ACTIVE'
        },
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
          }
        }
      });

      res.json({
        message: 'Conversation started successfully',
        session: newSession
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get client details
  async getClientDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          sessions: {
            orderBy: {
              createdAt: 'desc'
            },
            include: {
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
            }
          },
          _count: {
            select: {
              sessions: true
            }
          }
        }
      });

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      res.json(client);
    } catch (error) {
      console.error('Error fetching client details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const clientController = new ClientController();