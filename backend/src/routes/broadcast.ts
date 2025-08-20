import { Router } from 'express';
import { broadcastController } from '../controllers/broadcastController';
import { authenticate, authorize } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send broadcast message
router.post('/send', authorize(['CS', 'ADMIN']), upload.single('file'), broadcastController.sendBroadcast, handleUploadError);

// Get broadcast history
router.get('/history', broadcastController.getBroadcastHistory);

// Test broadcast system status
router.get('/test/status', async (req, res) => {
  try {
    const { TelegramService } = await import('../services/telegramService');
    const telegramService = TelegramService.getInstance();
    
    if (!telegramService) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Telegram service not initialized',
        suggestions: ['Check TELEGRAM_BOT_TOKEN in .env file', 'Restart the server']
      });
    }

    await telegramService.testConnection();
    
    // Check client count
    const { default: prisma } = await import('../utils/database');
    const clientCount = await prisma.client.count();
    const registeredClientCount = await prisma.client.count({
      where: {
        sessions: {
          some: {}
        }
      }
    });

    res.json({
      status: 'ok',
      telegramBotConnected: true,
      totalClients: clientCount,
      registeredClients: registeredClientCount,
      message: 'Broadcast system is ready'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      suggestions: [
        'Verify TELEGRAM_BOT_TOKEN is correctly set',
        'Check internet connection',
        'Ensure bot token is valid and not revoked'
      ]
    });
  }
});

// Get broadcast details
router.get('/:broadcastId', broadcastController.getBroadcastDetails);

export default router;