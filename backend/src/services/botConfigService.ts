import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BotInfo {
  id: number;
  username: string;
  firstName: string;
  canJoinGroups: boolean;
  canReadAllGroupMessages: boolean;
  supportsInlineQueries: boolean;
}

interface BotConnectionTest {
  success: boolean;
  botInfo?: BotInfo;
  error?: string;
}

interface TelegramGroup {
  id: string;
  title: string;
  type: 'group' | 'supergroup';
  memberCount?: number;
  inviteLink?: string;
}

interface GroupInvitationStatus {
  isWaitingForInvitation: boolean;
  detectedGroups: TelegramGroup[];
  currentGroup?: TelegramGroup;
}

interface BotNotificationSettings {
  newClientMessage: boolean;
  csMessageHandling: boolean;
  sessionEnded: boolean;
  sessionStarted: boolean;
  clientConnected: boolean;
  clientDisconnected: boolean;
}

export class BotConfigService {
  private detectedGroups: TelegramGroup[] = [];
  private isListeningForGroups = false;

  async getBotConfig() {
    let config = await prisma.botConfig.findFirst();

    if (!config) {
      // Create default config if none exists
      config = await prisma.botConfig.create({
        data: {
          isConnected: false,
          isGroupConfigured: false,
          notificationsEnabled: false,
        }
      });
    }

    return {
      id: config.id,
      botToken: config.botToken ? '***' : undefined, // Hide actual token
      isConnected: config.isConnected,
      botUsername: config.botUsername,
      groupId: config.groupId,
      groupTitle: config.groupTitle,
      isGroupConfigured: config.isGroupConfigured,
      notificationsEnabled: config.notificationsEnabled,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async testBotConnection(botToken: string): Promise<BotConnectionTest> {
    try {
      // Test the bot token by making a request to Telegram Bot API
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data: any = await response.json();

      if (data.ok) {
        return {
          success: true,
          botInfo: {
            id: data.result.id,
            username: data.result.username,
            firstName: data.result.first_name,
            canJoinGroups: data.result.can_join_groups,
            canReadAllGroupMessages: data.result.can_read_all_group_messages,
            supportsInlineQueries: data.result.supports_inline_queries,
          }
        };
      } else {
        return {
          success: false,
          error: data.description || 'Invalid bot token'
        };
      }
    } catch (error) {
      console.error('Bot connection test error:', error);
      return {
        success: false,
        error: 'Failed to connect to Telegram API'
      };
    }
  }

  async saveBotToken(botToken: string) {
    // First test the token
    const testResult = await this.testBotConnection(botToken);
    
    if (!testResult.success) {
      throw new Error(testResult.error || 'Invalid bot token');
    }

    // Save or update bot configuration
    let config = await prisma.botConfig.findFirst();
    
    if (config) {
      config = await prisma.botConfig.update({
        where: { id: config.id },
        data: {
          botToken,
          isConnected: true,
          botUsername: testResult.botInfo?.username,
          botFirstName: testResult.botInfo?.firstName,
          updatedAt: new Date(),
        }
      });
    } else {
      config = await prisma.botConfig.create({
        data: {
          botToken,
          isConnected: true,
          botUsername: testResult.botInfo?.username,
          botFirstName: testResult.botInfo?.firstName,
          isGroupConfigured: false,
          notificationsEnabled: false,
        }
      });
    }

    return {
      id: config.id,
      isConnected: config.isConnected,
      botUsername: config.botUsername,
      groupId: config.groupId,
      groupTitle: config.groupTitle,
      isGroupConfigured: config.isGroupConfigured,
      notificationsEnabled: config.notificationsEnabled,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async startGroupInvitationListener(): Promise<GroupInvitationStatus> {
    this.isListeningForGroups = true;
    this.detectedGroups = [];

    // In a real implementation, this would set up a webhook or polling mechanism
    // to detect when the bot is added to groups
    // For now, we'll simulate the listening state
    
    return {
      isWaitingForInvitation: true,
      detectedGroups: this.detectedGroups
    };
  }

  async stopGroupInvitationListener(): Promise<void> {
    this.isListeningForGroups = false;
    this.detectedGroups = [];
  }

  async getDetectedGroups(): Promise<TelegramGroup[]> {
    // In a real implementation, this would return groups detected from webhook events
    // For now, we'll return mock data or empty array
    return this.detectedGroups;
  }

  async confirmGroup(groupId: string) {
    // Find the group in detected groups
    const selectedGroup = this.detectedGroups.find(g => g.id === groupId);
    
    if (!selectedGroup) {
      throw new Error('Group not found');
    }

    // Update bot configuration
    let config = await prisma.botConfig.findFirst();
    
    if (!config) {
      throw new Error('Bot configuration not found');
    }

    config = await prisma.botConfig.update({
      where: { id: config.id },
      data: {
        groupId: selectedGroup.id,
        groupTitle: selectedGroup.title,
        groupType: selectedGroup.type,
        isGroupConfigured: true,
        notificationsEnabled: true,
        updatedAt: new Date(),
      }
    });

    // Stop listening for groups
    this.isListeningForGroups = false;
    this.detectedGroups = [];

    return {
      id: config.id,
      isConnected: config.isConnected,
      botUsername: config.botUsername,
      groupId: config.groupId,
      groupTitle: config.groupTitle,
      isGroupConfigured: config.isGroupConfigured,
      notificationsEnabled: config.notificationsEnabled,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async getNotificationSettings(): Promise<BotNotificationSettings> {
    const config = await prisma.botConfig.findFirst();
    
    if (!config) {
      throw new Error('Bot configuration not found');
    }

    return {
      newClientMessage: config.notifyNewClientMessage,
      csMessageHandling: config.notifyCsMessageHandling,
      sessionEnded: config.notifySessionEnded,
      sessionStarted: config.notifySessionStarted,
      clientConnected: config.notifyClientConnected,
      clientDisconnected: config.notifyClientDisconnected,
    };
  }

  async updateNotificationSettings(settings: BotNotificationSettings): Promise<BotNotificationSettings> {
    let config = await prisma.botConfig.findFirst();
    
    if (!config) {
      throw new Error('Bot configuration not found');
    }

    config = await prisma.botConfig.update({
      where: { id: config.id },
      data: {
        notifyNewClientMessage: settings.newClientMessage,
        notifyCsMessageHandling: settings.csMessageHandling,
        notifySessionEnded: settings.sessionEnded,
        notifySessionStarted: settings.sessionStarted,
        notifyClientConnected: settings.clientConnected,
        notifyClientDisconnected: settings.clientDisconnected,
        updatedAt: new Date(),
      }
    });

    return {
      newClientMessage: config.notifyNewClientMessage,
      csMessageHandling: config.notifyCsMessageHandling,
      sessionEnded: config.notifySessionEnded,
      sessionStarted: config.notifySessionStarted,
      clientConnected: config.notifyClientConnected,
      clientDisconnected: config.notifyClientDisconnected,
    };
  }

  async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    const config = await prisma.botConfig.findFirst();
    
    if (!config || !config.isConnected || !config.isGroupConfigured) {
      return {
        success: false,
        message: 'Bot is not properly configured'
      };
    }

    try {
      // Send test message to the configured group
      const message = '🤖 Test notification from Help Desk Bot\n\nThis is a test message to verify that notifications are working correctly.';
      
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.groupId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const data: any = await response.json();

      if (data.ok) {
        return {
          success: true,
          message: 'Test notification sent successfully'
        };
      } else {
        return {
          success: false,
          message: data.description || 'Failed to send test notification'
        };
      }
    } catch (error) {
      console.error('Test notification error:', error);
      return {
        success: false,
        message: 'Failed to send test notification'
      };
    }
  }

  async resetBotConfig(): Promise<void> {
    const config = await prisma.botConfig.findFirst();
    
    if (config) {
      await prisma.botConfig.update({
        where: { id: config.id },
        data: {
          botToken: null,
          isConnected: false,
          botUsername: null,
          botFirstName: null,
          groupId: null,
          groupTitle: null,
          groupType: null,
          isGroupConfigured: false,
          notificationsEnabled: false,
          updatedAt: new Date(),
        }
      });
    }

    // Stop any active listeners
    this.isListeningForGroups = false;
    this.detectedGroups = [];
  }

  // Method to simulate group detection (for testing purposes)
  async simulateGroupDetection(groups: TelegramGroup[]): Promise<void> {
    if (this.isListeningForGroups) {
      this.detectedGroups = groups;
    }
  }

  // Method to send notification to configured group
  async sendNotificationToGroup(message: string): Promise<boolean> {
    const config = await prisma.botConfig.findFirst();
    
    if (!config || !config.isConnected || !config.isGroupConfigured || !config.notificationsEnabled) {
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.groupId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const data: any = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Notification send error:', error);
      return false;
    }
  }
}