import { Response } from 'express';
import prisma from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { TelegramService } from '../services/telegramService';
import path from 'path';
import fs from 'fs';

export class BroadcastController {
  // Send broadcast message to all registered clients
  async sendBroadcast(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { message, messageType = 'TEXT' } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const file = req.file;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Only admins and CS can send broadcasts
      if (userRole !== 'ADMIN' && userRole !== 'CS') {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      // For file/image/video types, either message or file is required
      const requiresFile = ['IMAGE', 'FILE', 'VIDEO'].includes(messageType);
      if (!message && !file) {
        res.status(400).json({ error: 'Message or file is required' });
        return;
      }

      if (requiresFile && !file && !message) {
        res.status(400).json({ error: `File is required for ${messageType} message type` });
        return;
      }

      // Get all registered clients (clients who have chatted before)
      const registeredClients = await prisma.client.findMany({
        where: {
          sessions: {
            some: {}
          }
        },
        select: {
          id: true,
          name: true,
          username: true,
          telegramId: true
        }
      });

      if (registeredClients.length === 0) {
        res.status(400).json({ error: 'No registered clients found' });
        return;
      }

      // Create file URL if file was uploaded
      let fileUrl: string | undefined;
      if (file) {
        const backendUrl = process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:3000';
        fileUrl = `${backendUrl}/uploads/${file.filename}`;
        console.log(`File uploaded: ${file.filename}, URL: ${fileUrl}`);
      }

      // Create broadcast record
      const broadcast = await prisma.broadcast.create({
        data: {
          message: message || '', // Use empty string if no message provided with file
          messageType,
          fileUrl,
          sentBy: userId,
          recipientCount: registeredClients.length
        }
      });

      // Create broadcast recipients records
      const broadcastRecipients = registeredClients.map(client => ({
        broadcastId: broadcast.id,
        clientId: client.id,
        status: 'PENDING' as const
      }));

      await prisma.broadcastRecipient.createMany({
        data: broadcastRecipients
      });

      // Get Telegram service instance
      const telegramService = TelegramService.getInstance();
      if (!telegramService) {
        console.error('Telegram service instance not available');
        res.status(500).json({ error: 'Telegram service not available. Please check bot configuration.' });
        return;
      }

      // Test if bot is working before starting broadcast
      try {
        await telegramService.testConnection();
        console.log(`Starting broadcast to ${registeredClients.length} clients...`);
      } catch (error) {
        console.error('Telegram bot connection test failed:', error);
        res.status(500).json({ error: 'Telegram bot is not responding. Please check bot token and network connection.' });
        return;
      }

      // Update broadcast status to SENDING
      await prisma.broadcast.update({
        where: { id: broadcast.id },
        data: { status: 'SENDING' }
      });

      // Send messages to all clients with proper rate limiting
      let sentCount = 0;
      let failedCount = 0;
      const batchSize = 20; // Process in batches to avoid overwhelming the system
      const delayBetweenMessages = 1000; // 1 second delay to respect Telegram rate limits
      const retryAttempts = 3;

      // Create safe file path converter function (fallback if method binding fails)
      const getLocalFilePath = (fileUrl: string): string => {
        try {
          if (!fileUrl) {
            throw new Error('File URL is required');
          }
          
          // Convert URL to local file path
          // Example: http://localhost:3000/uploads/filename.jpg -> uploads/filename.jpg
          const url = new URL(fileUrl);
          const relativePath = url.pathname.substring(1); // Remove leading slash
          const fullPath = path.join(__dirname, '../..', relativePath);
          console.log(`Converting URL ${fileUrl} to local path: ${fullPath}`);
          return fullPath;
        } catch (error) {
          console.error(`Error converting file URL to local path: ${fileUrl}`, error);
          throw new Error(`Invalid file URL: ${fileUrl}`);
        }
      };
      
      console.log(`Broadcast details - Message: "${message}", Type: ${messageType}, File: ${fileUrl ? 'YES' : 'NO'}`);

      // Process clients in batches
      for (let i = 0; i < registeredClients.length; i += batchSize) {
        const batch = registeredClients.slice(i, i + batchSize);
        
        for (const client of batch) {
          let attempts = 0;
          let success = false;

          while (attempts < retryAttempts && !success) {
            try {
              // Validate and parse Telegram ID
              const telegramIdStr = client.telegramId.toString().trim();
              const chatId = parseInt(telegramIdStr);
              
              console.log(`Processing client ${client.name} - Telegram ID: ${telegramIdStr}, Parsed: ${chatId}`);
              
              // Skip invalid or fake chat IDs - be more lenient with validation
              if (isNaN(chatId) || chatId === 0) {
                console.error(`FAILED: Invalid Telegram ID for client ${client.name}: "${client.telegramId}" (parsed: ${chatId})`);
                await prisma.broadcastRecipient.updateMany({
                  where: {
                    broadcastId: broadcast.id,
                    clientId: client.id
                  },
                  data: {
                    status: 'FAILED',
                    sentAt: new Date()
                  }
                });
                failedCount++;
                success = true; // Don't retry for invalid IDs
                break;
              }

              // Send the message based on type
              console.log(`Message type: ${messageType}, Has fileUrl: ${!!fileUrl}, Has message: ${!!message}`);
              
              if (messageType === 'IMAGE' && fileUrl) {
                // For images, send file stream instead of URL
                const filePath = getLocalFilePath(fileUrl);
                console.log(`Sending image: ${filePath}`);
                if (fs.existsSync(filePath)) {
                  await telegramService.sendPhoto(chatId, filePath, message || undefined);
                } else {
                  throw new Error(`Image file not found: ${filePath}`);
                }
              } else if (messageType === 'VIDEO' && fileUrl) {
                // For videos, send file stream instead of URL
                const filePath = getLocalFilePath(fileUrl);
                console.log(`Sending video: ${filePath}`);
                if (fs.existsSync(filePath)) {
                  await telegramService.sendVideo(chatId, filePath, message || undefined);
                } else {
                  throw new Error(`Video file not found: ${filePath}`);
                }
              } else if (messageType === 'FILE' && fileUrl) {
                // For files, send file stream instead of URL
                const filePath = getLocalFilePath(fileUrl);
                console.log(`Sending document: ${filePath}`);
                if (fs.existsSync(filePath)) {
                  await telegramService.sendDocument(chatId, filePath, message || undefined);
                } else {
                  throw new Error(`Document file not found: ${filePath}`);
                }
              } else if ((messageType === 'IMAGE' || messageType === 'VIDEO' || messageType === 'FILE') && !fileUrl) {
                // File type message but no file URL - this should not happen
                throw new Error(`${messageType} message type requires a file, but no file URL provided`);
              } else {
                // For TEXT and LINK messages, or when no file is provided
                if (!message && !fileUrl) {
                  throw new Error('No message content or file provided');
                }
                const finalMessage = message || `File: ${fileUrl}`;
                console.log(`Sending text message: ${finalMessage.substring(0, 50)}...`);
                await telegramService.sendMessage(chatId, finalMessage);
              }

              // Update recipient status to SENT
              await prisma.broadcastRecipient.updateMany({
                where: {
                  broadcastId: broadcast.id,
                  clientId: client.id
                },
                data: {
                  status: 'SENT',
                  sentAt: new Date()
                }
              });

              sentCount++;
              success = true;
              console.log(`Broadcast message sent to client ${client.name} (${client.telegramId}) on attempt ${attempts + 1}`);

            } catch (error: any) {
              attempts++;
              console.error(`BROADCAST ERROR: Failed to send to client ${client.name} (ID: ${client.telegramId}) on attempt ${attempts}:`);
              console.error(`Error details:`, {
                message: error.message,
                code: error.code,
                response: error.response?.body || error.response,
                stack: error.stack?.split('\n')[0] // Just first line of stack
              });
              
              // Check if it's a rate limit error
              const isRateLimit = error.message?.includes('429') || 
                                 error.message?.includes('Too Many Requests') ||
                                 error.code === 429;
              
              // Check if it's a bot blocked error
              const isBotBlocked = error.code === 403 || 
                                  error.message?.includes('bot was blocked') ||
                                  error.message?.includes('user is deactivated') ||
                                  error.message?.includes('chat not found');
              
              if (isRateLimit && attempts < retryAttempts) {
                // Wait longer for rate limit errors
                console.log(`Rate limit detected for ${client.name}, waiting before retry attempt ${attempts + 1}`);
                await new Promise(resolve => setTimeout(resolve, 5000 * attempts)); // Exponential backoff
                continue;
              }
              
              if (isBotBlocked) {
                console.warn(`Bot blocked by user ${client.name} or chat not found - marking as failed permanently`);
                await prisma.broadcastRecipient.updateMany({
                  where: {
                    broadcastId: broadcast.id,
                    clientId: client.id
                  },
                  data: {
                    status: 'FAILED',
                    sentAt: new Date()
                  }
                });
                failedCount++;
                success = true; // Don't retry for blocked users
                break;
              }
              
              if (attempts >= retryAttempts) {
                // Update recipient status to FAILED after all attempts
                console.error(`FINAL FAILURE: All ${retryAttempts} attempts failed for client ${client.name}`);
                await prisma.broadcastRecipient.updateMany({
                  where: {
                    broadcastId: broadcast.id,
                    clientId: client.id
                  },
                  data: {
                    status: 'FAILED',
                    sentAt: new Date()
                  }
                });
                failedCount++;
                success = true; // Don't retry anymore
              }
            }
          }

          // Add delay between messages to respect Telegram rate limits
          if (i + batch.indexOf(client) < registeredClients.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
          }
        }

        // Add a longer delay between batches
        if (i + batchSize < registeredClients.length) {
          console.log(`Completed batch ${Math.floor(i/batchSize) + 1}, waiting before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Update broadcast status
      const finalStatus = failedCount === 0 ? 'COMPLETED' : (sentCount > 0 ? 'COMPLETED' : 'FAILED');
      await prisma.broadcast.update({
        where: { id: broadcast.id },
        data: {
          status: finalStatus,
          sentCount: sentCount
        }
      });

      res.json({
        message: `Broadcast sent successfully to ${sentCount} clients` + (failedCount > 0 ? ` (${failedCount} failed)` : ''),
        broadcast: {
          id: broadcast.id,
          recipientCount: registeredClients.length,
          sentCount: sentCount,
          failedCount: failedCount,
          sentAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get broadcast history
  async getBroadcastHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
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
      
      // CS can only see their own broadcasts, ADMIN can see all
      if (userRole === 'CS') {
        whereClause.sentBy = userId;
      }

      const [broadcasts, totalCount] = await Promise.all([
        prisma.broadcast.findMany({
          where: whereClause,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            recipients: {
              select: {
                status: true,
                sentAt: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    username: true
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
        }),
        prisma.broadcast.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      // Transform data to include statistics
      const broadcastsWithStats = broadcasts.map(broadcast => {
        const sentCount = broadcast.recipients.filter(r => r.status === 'SENT').length;
        const failedCount = broadcast.recipients.filter(r => r.status === 'FAILED').length;
        const pendingCount = broadcast.recipients.filter(r => r.status === 'PENDING').length;

        return {
          id: broadcast.id,
          message: broadcast.message,
          messageType: broadcast.messageType,
          fileUrl: broadcast.fileUrl,
          status: broadcast.status,
          createdAt: broadcast.createdAt,
          sender: broadcast.sender,
          statistics: {
            total: broadcast.recipientCount,
            sent: sentCount,
            failed: failedCount,
            pending: pendingCount
          }
        };
      });

      res.json({
        broadcasts: broadcastsWithStats,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    } catch (error) {
      console.error('Error fetching broadcast history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get broadcast details
  async getBroadcastDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { broadcastId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Build where clause based on user role
      const whereClause: any = { id: broadcastId };
      
      // CS can only see their own broadcasts, ADMIN can see all
      if (userRole === 'CS') {
        whereClause.sentBy = userId;
      }

      const broadcast = await prisma.broadcast.findFirst({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          recipients: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  telegramId: true
                }
              }
            },
            orderBy: {
              sentAt: 'desc'
            }
          }
        }
      });

      if (!broadcast) {
        res.status(404).json({ error: 'Broadcast not found or access denied' });
        return;
      }

      res.json(broadcast);
    } catch (error) {
      console.error('Error fetching broadcast details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private getLocalFilePath(fileUrl: string): string {
    return BroadcastController.convertFileUrlToPath(fileUrl);
  }

  // Static method as backup solution for file path conversion
  private static convertFileUrlToPath(fileUrl: string): string {
    try {
      if (!fileUrl) {
        throw new Error('File URL is required');
      }
      
      // Convert URL to local file path
      // Example: http://localhost:3000/uploads/filename.jpg -> uploads/filename.jpg
      const url = new URL(fileUrl);
      const relativePath = url.pathname.substring(1); // Remove leading slash
      const fullPath = path.join(__dirname, '../..', relativePath);
      console.log(`Converting URL ${fileUrl} to local path: ${fullPath}`);
      return fullPath;
    } catch (error) {
      console.error(`Error converting file URL to local path: ${fileUrl}`, error);
      throw new Error(`Invalid file URL: ${fileUrl}`);
    }
  }
}

export const broadcastController = new BroadcastController();