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
  private static instance: BotConfigService | null = null;
  private detectedGroups: TelegramGroup[] = [];
  private isListeningForGroups = false;
  private groupDetectionListeners: ((groups: TelegramGroup[]) => void)[] = [];

  constructor() {
    if (BotConfigService.instance) {
      return BotConfigService.instance;
    }
    BotConfigService.instance = this;
  }

  static getInstance(): BotConfigService {
    if (!BotConfigService.instance) {
      BotConfigService.instance = new BotConfigService();
    }
    return BotConfigService.instance;
  }

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
      // Validate bot token format first
      if (!botToken || !botToken.includes(':') || botToken.length < 20) {
        return {
          success: false,
          error: 'Invalid bot token format. Token should be in format: 123456789:ABCdefGHijKLmnOPqrSTUvwxYZ'
        };
      }

      // Test the bot token by making a request to Telegram Bot API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'TelegramHelpDesk/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: any = await response.json().catch(() => ({}));
          return {
            success: false,
            error: errorData.description || `HTTP ${response.status}: ${response.statusText}`
          };
        }

        const data: any = await response.json();

        if (data.ok && data.result) {
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            error: 'Connection timeout. Please check your internet connection and try again.'
          };
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Bot connection test error:', error);
      
      // Handle specific error types
      if (error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: 'Cannot reach Telegram servers. Please check your internet connection.'
        };
      }
      
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'Connection timeout. Please try again in a moment.'
        };
      }

      if (error.name === 'TypeError' && error.message.includes('fetch failed')) {
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        error: 'Failed to connect to Telegram API. Please try again later.'
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
    console.log('BotConfigService: Starting group listener, instance ID:', this.constructor.name);
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
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TelegramHelpDesk/1.0'
          },
          body: JSON.stringify({
            chat_id: config.groupId,
            text: message,
            parse_mode: 'HTML'
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: any = await response.json().catch(() => ({}));
          return {
            success: false,
            message: errorData.description || `HTTP ${response.status}: ${response.statusText}`
          };
        }

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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            message: 'Connection timeout. Please check your internet connection and try again.'
          };
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Test notification error:', error);
      
      // Handle specific error types
      if (error.code === 'ENOTFOUND') {
        return {
          success: false,
          message: 'Cannot reach Telegram servers. Please check your internet connection.'
        };
      }
      
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          message: 'Connection timeout. Please try again in a moment.'
        };
      }

      if (error.name === 'TypeError' && error.message.includes('fetch failed')) {
        return {
          success: false,
          message: 'Network error. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        message: 'Failed to send test notification. Please try again later.'
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

  // Method to handle real group detection
  async simulateGroupDetection(groups: TelegramGroup[]): Promise<void> {
    console.log('BotConfigService: Group detection called, isListening:', this.isListeningForGroups, 'Instance:', this.constructor.name);
    
    if (this.isListeningForGroups) {
      console.log('Group detection: Adding groups to detected list:', groups);
      this.detectedGroups = [...this.detectedGroups, ...groups];
      
      // Emit real-time update via WebSocket
      try {
        const io = (global as any).io;
        if (io) {
          io.to('bot_config').emit('groups_detected', {
            isWaitingForInvitation: this.isListeningForGroups,
            detectedGroups: this.detectedGroups
          });
          console.log('Group detection: Emitted groups_detected event via WebSocket');
        }
      } catch (error) {
        console.error('Error emitting group detection via WebSocket:', error);
      }
      
      // Notify all listeners about the new groups
      this.groupDetectionListeners.forEach(listener => {
        try {
          listener(this.detectedGroups);
        } catch (error) {
          console.error('Error notifying group detection listener:', error);
        }
      });
    } else {
      console.log('Group detection: Not listening for groups, ignoring detection. isListening:', this.isListeningForGroups);
    }
  }

  // Add listener for group detection
  addGroupDetectionListener(listener: (groups: TelegramGroup[]) => void): void {
    this.groupDetectionListeners.push(listener);
  }

  // Remove listener for group detection
  removeGroupDetectionListener(listener: (groups: TelegramGroup[]) => void): void {
    const index = this.groupDetectionListeners.indexOf(listener);
    if (index > -1) {
      this.groupDetectionListeners.splice(index, 1);
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