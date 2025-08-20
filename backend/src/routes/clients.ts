import { Router } from 'express';
import { clientController } from '../controllers/clientController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all clients
router.get('/', clientController.getClients);

// Get client details
router.get('/:clientId', clientController.getClientDetails);

// Start conversation with a client
router.post('/:clientId/start-conversation', clientController.startConversation);

export default router;