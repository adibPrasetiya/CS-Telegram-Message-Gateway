import { Router } from 'express';
import { getSessions, getSessionMessages, sendMessage, markAsRead, endSession, uploadFile } from '../controllers/chatController';
import { authenticate, authorize } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';

const router = Router();

router.get('/sessions', authenticate, getSessions);
router.get('/sessions/:sessionId/messages', authenticate, getSessionMessages);
router.post('/messages', authenticate, authorize(['CS']), sendMessage);
router.post('/upload', authenticate, authorize(['CS']), upload.single('file'), uploadFile, handleUploadError);
router.put('/sessions/:sessionId/read', authenticate, authorize(['CS']), markAsRead);
router.post('/sessions/end', authenticate, authorize(['CS']), endSession);

export default router;