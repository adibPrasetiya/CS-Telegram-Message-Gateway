import { Router } from 'express';
import { HistoryController } from '../controllers/historyController';
import { authenticate } from '../middleware/auth';

const router = Router();
const historyController = new HistoryController();

// Get session history with pagination and filters
router.get('/sessions', authenticate, historyController.getSessionHistory);

// Get specific session details with all chat messages
router.get('/sessions/:sessionId', authenticate, historyController.getSessionDetails);

// Get CS performance statistics (admin only)
router.get('/stats/cs-performance', authenticate, historyController.getCSPerformanceStats);

// Search chat history by message content
router.get('/search', authenticate, historyController.searchChatHistory);

export default router;