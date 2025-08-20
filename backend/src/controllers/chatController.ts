import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ChatService } from '../services/chatService';
import { sendMessageSchema, endSessionSchema } from '../utils/validation';
import { TelegramService } from '../services/telegramService';
import path from 'path';

let telegramService: TelegramService;
let chatService: ChatService;

try {
  telegramService = new TelegramService();
  chatService = new ChatService(telegramService);
} catch (error) {
  console.error('Failed to initialize Telegram service:', error);
}

export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const csId = req.user.role === 'CS' ? req.user.id : undefined;
    const sessions = await chatService.getSessions(csId);
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSessionMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { sessionId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Maximum 100 messages per request
    const offset = parseInt(req.query.offset as string) || 0;
    const lastMessageId = req.query.lastMessageId as string;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const result = await chatService.getSessionMessages(sessionId, limit, offset, lastMessageId);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting session messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== 'CS' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only CS and ADMIN can send messages' });
      return;
    }

    const { error, value } = sendMessageSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const message = await chatService.sendMessage(
      value.sessionId,
      req.user.id,
      value.message,
      value.messageType,
      req.user.role
    );
    
    res.json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== 'CS' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only CS and ADMIN can mark messages as read' });
      return;
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    await chatService.markMessagesAsRead(sessionId, req.user.id, req.user.role);
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const endSession = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('endSession API called with:', {
    userId: req.user?.id,
    userRole: req.user?.role,
    sessionId: req.body?.sessionId,
    timestamp: new Date().toISOString()
  });
  
  try {
    if (!req.user) {
      console.log('endSession failed: no user in request');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== 'CS' && req.user.role !== 'ADMIN') {
      console.log('endSession failed: insufficient role:', req.user.role);
      res.status(403).json({ error: 'Only CS and ADMIN can end sessions' });
      return;
    }

    const { error, value } = endSessionSchema.validate(req.body);
    
    if (error) {
      console.log('endSession validation error:', error.details[0].message);
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    console.log('Calling chatService.endSession with:', value.sessionId, req.user.id, req.user.role);
    await chatService.endSession(value.sessionId, req.user.id, req.user.role);
    
    console.log('endSession completed successfully for session:', value.sessionId);
    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('Error ending session:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      sessionId: req.body?.sessionId,
      userId: req.user?.id
    });
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== 'CS' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only CS and ADMIN can upload files' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    // Determine message type based on file mimetype
    let messageType: 'IMAGE' | 'FILE' | 'VIDEO' = 'FILE';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'IMAGE';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'VIDEO';
    }

    // Create file URL
    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
    
    // Send message with file
    const message = await chatService.sendMessage(
      sessionId,
      req.user.id,
      req.file.originalname, // Use original filename as message
      messageType,
      req.user.role,
      fileUrl // Pass file URL
    );

    res.json({
      message: 'File uploaded and sent successfully',
      data: message,
      fileUrl
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};