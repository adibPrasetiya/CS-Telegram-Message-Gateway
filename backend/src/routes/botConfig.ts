import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBotConfig,
  testBotConnection,
  saveBotToken,
  startGroupListener,
  stopGroupListener,
  getDetectedGroups,
  confirmGroup,
  getNotificationSettings,
  updateNotificationSettings,
  sendTestNotification,
  resetBotConfig
} from '../controllers/botConfigController';

const router = Router();

// Get current bot configuration
router.get('/', authenticate, getBotConfig);

// Test bot token connection
router.post('/test-connection', testBotConnection);

// Save bot token
router.post('/token', authenticate, saveBotToken);

// Group management
router.post('/start-group-listener', authenticate, startGroupListener);
router.post('/stop-group-listener', authenticate, stopGroupListener);
router.get('/detected-groups', authenticate, getDetectedGroups);
router.post('/confirm-group', authenticate, confirmGroup);

// Notification settings
router.get('/notification-settings', authenticate, getNotificationSettings);
router.put('/notification-settings', authenticate, updateNotificationSettings);

// Test notification
router.post('/test-notification', authenticate, sendTestNotification);

// Reset configuration
router.delete('/', authenticate, resetBotConfig);

export default router;