import { Request, Response } from 'express';
import { BotConfigService } from '../services/botConfigService';
import { AuthRequest } from '../middleware/auth';

const botConfigService = new BotConfigService();

export const getBotConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const config = await botConfigService.getBotConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting bot config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const testBotConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { botToken } = req.body;

    if (!botToken) {
      res.status(400).json({ error: 'Bot token is required' });
      return;
    }

    const result = await botConfigService.testBotConnection(botToken);
    res.json(result);
  } catch (error) {
    console.error('Error testing bot connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveBotToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { botToken } = req.body;

    if (!botToken) {
      res.status(400).json({ error: 'Bot token is required' });
      return;
    }

    const config = await botConfigService.saveBotToken(botToken);
    res.json(config);
  } catch (error) {
    console.error('Error saving bot token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const startGroupListener = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const status = await botConfigService.startGroupInvitationListener();
    res.json(status);
  } catch (error) {
    console.error('Error starting group listener:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const stopGroupListener = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await botConfigService.stopGroupInvitationListener();
    res.json({ message: 'Group listener stopped' });
  } catch (error) {
    console.error('Error stopping group listener:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDetectedGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const groups = await botConfigService.getDetectedGroups();
    res.json(groups);
  } catch (error) {
    console.error('Error getting detected groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const confirmGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { groupId } = req.body;

    if (!groupId) {
      res.status(400).json({ error: 'Group ID is required' });
      return;
    }

    const config = await botConfigService.confirmGroup(groupId);
    res.json(config);
  } catch (error) {
    console.error('Error confirming group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const settings = await botConfigService.getNotificationSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const settings = req.body;
    const updatedSettings = await botConfigService.updateNotificationSettings(settings);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendTestNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await botConfigService.sendTestNotification();
    res.json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetBotConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await botConfigService.resetBotConfig();
    res.json({ message: 'Bot configuration reset successfully' });
  } catch (error) {
    console.error('Error resetting bot config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};