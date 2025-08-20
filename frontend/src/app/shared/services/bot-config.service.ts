import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BotConfig {
  id: string;
  botToken?: string;
  isConnected: boolean;
  botUsername?: string;
  groupId?: string;
  groupTitle?: string;
  isGroupConfigured: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BotConnectionTest {
  success: boolean;
  botInfo?: {
    id: number;
    username: string;
    firstName: string;
    canJoinGroups: boolean;
    canReadAllGroupMessages: boolean;
    supportsInlineQueries: boolean;
  };
  error?: string;
}

export interface TelegramGroup {
  id: string;
  title: string;
  type: 'group' | 'supergroup';
  memberCount?: number;
  inviteLink?: string;
}

export interface GroupInvitationStatus {
  isWaitingForInvitation: boolean;
  detectedGroups: TelegramGroup[];
  currentGroup?: TelegramGroup;
}

export interface BotNotificationSettings {
  newClientMessage: boolean;
  csMessageHandling: boolean;
  sessionEnded: boolean;
  sessionStarted: boolean;
  clientConnected: boolean;
  clientDisconnected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BotConfigService {
  private apiUrl = `${environment.apiUrl}/bot-config`;
  
  // Reactive state management
  private botConfigSubject = new BehaviorSubject<BotConfig | null>(null);
  public botConfig$ = this.botConfigSubject.asObservable();
  
  private groupInvitationStatusSubject = new BehaviorSubject<GroupInvitationStatus>({
    isWaitingForInvitation: false,
    detectedGroups: []
  });
  public groupInvitationStatus$ = this.groupInvitationStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get current bot configuration
  getBotConfig(): Observable<BotConfig> {
    return this.http.get<BotConfig>(this.apiUrl);
  }

  // Test bot token connection
  testBotConnection(botToken: string): Observable<BotConnectionTest> {
    return this.http.post<BotConnectionTest>(`${this.apiUrl}/test-connection`, {
      botToken
    });
  }

  // Save bot token
  saveBotToken(botToken: string): Observable<BotConfig> {
    return this.http.post<BotConfig>(`${this.apiUrl}/token`, {
      botToken
    });
  }

  // Start waiting for group invitation
  startGroupInvitationListener(): Observable<GroupInvitationStatus> {
    return this.http.post<GroupInvitationStatus>(`${this.apiUrl}/start-group-listener`, {});
  }

  // Stop waiting for group invitation
  stopGroupInvitationListener(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/stop-group-listener`, {});
  }

  // Get detected groups
  getDetectedGroups(): Observable<TelegramGroup[]> {
    return this.http.get<TelegramGroup[]>(`${this.apiUrl}/detected-groups`);
  }

  // Confirm and register group
  confirmGroup(groupId: string): Observable<BotConfig> {
    return this.http.post<BotConfig>(`${this.apiUrl}/confirm-group`, {
      groupId
    });
  }

  // Get notification settings
  getNotificationSettings(): Observable<BotNotificationSettings> {
    return this.http.get<BotNotificationSettings>(`${this.apiUrl}/notification-settings`);
  }

  // Update notification settings
  updateNotificationSettings(settings: BotNotificationSettings): Observable<BotNotificationSettings> {
    return this.http.put<BotNotificationSettings>(`${this.apiUrl}/notification-settings`, settings);
  }

  // Send test notification
  sendTestNotification(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/test-notification`, {});
  }

  // Reset bot configuration
  resetBotConfig(): Observable<void> {
    return this.http.delete<void>(this.apiUrl);
  }

  // Update local state
  updateBotConfig(config: BotConfig): void {
    this.botConfigSubject.next(config);
  }

  updateGroupInvitationStatus(status: GroupInvitationStatus): void {
    this.groupInvitationStatusSubject.next(status);
  }

  // Get current state
  getCurrentBotConfig(): BotConfig | null {
    return this.botConfigSubject.value;
  }

  getCurrentGroupInvitationStatus(): GroupInvitationStatus {
    return this.groupInvitationStatusSubject.value;
  }
}