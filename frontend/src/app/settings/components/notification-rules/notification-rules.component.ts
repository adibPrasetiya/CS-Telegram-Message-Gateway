import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BotConfigService, BotConfig, BotNotificationSettings } from '../../../shared/services/bot-config.service';

@Component({
  selector: 'app-notification-rules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notification-rules-container">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-content">
          <div class="header-title">
            <i class="fas fa-bell"></i>
            <div>
              <h1>Notification Rules</h1>
              <p>Customize which events trigger Telegram notifications</p>
            </div>
          </div>
          <div class="header-status" *ngIf="notificationSettings">
            <div class="status-indicator" [class.configured]="botConfig?.notificationsEnabled">
              <i class="fas" [class.fa-check-circle]="botConfig?.notificationsEnabled" 
                 [class.fa-times-circle]="!botConfig?.notificationsEnabled"></i>
              <span>{{ botConfig?.notificationsEnabled ? 'Enabled' : 'Disabled' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Settings Content -->
      <div class="notification-config-content">
        <div class="notification-panels">
          <!-- Client Events Panel -->
          <div class="notification-panel">
            <div class="panel-header">
              <div class="panel-icon">
                <i class="fas fa-user"></i>
              </div>
              <div class="panel-title">
                <h3>Client Events</h3>
                <p>Notifications related to client activities</p>
              </div>
            </div>
            
            <div class="notification-items">
              <div class="notification-item">
                <div class="item-info">
                  <h4>New Client Messages</h4>
                  <p>Get notified when clients send new messages</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" 
                         [(ngModel)]="notificationSettings.newClientMessage"
                         (change)="onNotificationSettingChange()"
                         [disabled]="isSavingNotifications">
                  <span class="slider"></span>
                </label>
              </div>
              
              <div class="notification-item">
                <div class="item-info">
                  <h4>Client Connected</h4>
                  <p>Notification when a new client starts a conversation</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" 
                         [(ngModel)]="notificationSettings.clientConnected"
                         (change)="onNotificationSettingChange()"
                         [disabled]="isSavingNotifications">
                  <span class="slider"></span>
                </label>
              </div>
              
              <div class="notification-item">
                <div class="item-info">
                  <h4>Client Disconnected</h4>
                  <p>Notification when a client ends their session</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" 
                         [(ngModel)]="notificationSettings.clientDisconnected"
                         (change)="onNotificationSettingChange()"
                         [disabled]="isSavingNotifications">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Session Events Panel -->
          <div class="notification-panel">
            <div class="panel-header">
              <div class="panel-icon">
                <i class="fas fa-comments"></i>
              </div>
              <div class="panel-title">
                <h3>Session Events</h3>
                <p>Notifications about chat session lifecycle</p>
              </div>
            </div>
            
            <div class="notification-items">
              <div class="notification-item">
                <div class="item-info">
                  <h4>Session Started</h4>
                  <p>When a customer service agent starts handling a session</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" 
                         [(ngModel)]="notificationSettings.sessionStarted"
                         (change)="onNotificationSettingChange()"
                         [disabled]="isSavingNotifications">
                  <span class="slider"></span>
                </label>
              </div>
              
              <div class="notification-item">
                <div class="item-info">
                  <h4>Session Ended</h4>
                  <p>When a chat session is closed</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" 
                         [(ngModel)]="notificationSettings.sessionEnded"
                         (change)="onNotificationSettingChange()"
                         [disabled]="isSavingNotifications">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- CS Activity Panel -->
          <div class="notification-panel">
            <div class="panel-header">
              <div class="panel-icon">
                <i class="fas fa-headset"></i>
              </div>
              <div class="panel-title">
                <h3>CS Activity</h3>
                <p>Notifications about customer service activities</p>
              </div>
            </div>
            
            <div class="notification-items">
              <div class="notification-item">
                <div class="item-info">
                  <h4>CS Message Handling</h4>
                  <p>When customer service agents handle messages</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" 
                         [(ngModel)]="notificationSettings.csMessageHandling"
                         (change)="onNotificationSettingChange()"
                         [disabled]="isSavingNotifications">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="notification-actions">
          <button class="btn-primary" 
                  (click)="saveNotificationSettings()"
                  [disabled]="isSavingNotifications || !hasNotificationChanges">
            <i *ngIf="!isSavingNotifications" class="fas fa-save"></i>
            <i *ngIf="isSavingNotifications" class="fas fa-spinner fa-spin"></i>
            {{ isSavingNotifications ? 'Saving...' : 'Save Settings' }}
          </button>
          
          <button class="btn-secondary" 
                  (click)="sendTestNotification()"
                  [disabled]="isSavingNotifications">
            <i class="fas fa-paper-plane"></i>
            Send Test Notification
          </button>
          
          <button class="btn-secondary" 
                  (click)="resetNotificationSettings()"
                  [disabled]="isSavingNotifications">
            <i class="fas fa-undo"></i>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-rules-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .settings-header {
      background: #232e3c;
      border-bottom: 1px solid #2b374a;
      padding: 24px 32px;
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-title i {
      font-size: 32px;
      color: #5288c1;
    }

    .header-title h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
      margin: 0;
    }

    .header-title p {
      color: #8696a8;
      font-size: 16px;
      margin: 4px 0 0 0;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .status-indicator.configured {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .notification-config-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    .notification-panels {
      max-width: 800px;
      margin: 0 auto 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .notification-panel {
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 12px;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: #17212b;
      border-bottom: 1px solid #2b374a;
    }

    .panel-header .panel-icon {
      width: 40px;
      height: 40px;
      background: rgba(82, 136, 193, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .panel-header .panel-icon i {
      color: #5288c1;
      font-size: 18px;
    }

    .panel-title h3 {
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .panel-title p {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
    }

    .notification-items {
      padding: 0;
    }

    .notification-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #2b374a;
      transition: background-color 0.2s;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item:hover {
      background: rgba(82, 136, 193, 0.03);
    }

    .item-info h4 {
      color: #ffffff;
      font-size: 15px;
      font-weight: 500;
      margin: 0 0 4px 0;
    }

    .item-info p {
      color: #8696a8;
      font-size: 13px;
      margin: 0;
      line-height: 1.4;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 52px;
      height: 28px;
      margin-left: 16px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #2b374a;
      transition: 0.3s;
      border-radius: 28px;
      border: 2px solid #2b374a;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 2px;
      bottom: 2px;
      background-color: #8696a8;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #5288c1;
      border-color: #5288c1;
    }

    input:checked + .slider:before {
      transform: translateX(24px);
      background-color: white;
    }

    input:disabled + .slider {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .notification-actions {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 24px;
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 12px;
    }

    .btn-primary, .btn-secondary {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      white-space: nowrap;
    }

    .btn-primary {
      background: #5288c1;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #4a7ba7;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class NotificationRulesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  botConfig: BotConfig | null = null;
  notificationSettings: BotNotificationSettings = {
    newClientMessage: true,
    csMessageHandling: true,
    sessionEnded: true,
    sessionStarted: true,
    clientConnected: true,
    clientDisconnected: true
  };
  originalNotificationSettings: BotNotificationSettings = { ...this.notificationSettings };
  isSavingNotifications: boolean = false;
  hasNotificationChanges: boolean = false;

  constructor(
    private botConfigService: BotConfigService
  ) {}

  ngOnInit(): void {
    this.loadNotificationSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotificationSettings(): void {
    this.botConfigService.getNotificationSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.notificationSettings = settings;
          this.originalNotificationSettings = { ...settings };
          this.hasNotificationChanges = false;
        },
        error: (error) => {
          console.error('Error loading notification settings:', error);
        }
      });
  }

  onNotificationSettingChange(): void {
    this.hasNotificationChanges = JSON.stringify(this.notificationSettings) !== JSON.stringify(this.originalNotificationSettings);
  }

  saveNotificationSettings(): void {
    if (!this.hasNotificationChanges) return;

    this.isSavingNotifications = true;

    this.botConfigService.updateNotificationSettings(this.notificationSettings)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedSettings) => {
          this.notificationSettings = updatedSettings;
          this.originalNotificationSettings = { ...updatedSettings };
          this.hasNotificationChanges = false;
          this.isSavingNotifications = false;
          
          if (this.botConfig) {
            this.botConfig.notificationsEnabled = true;
          }
          
          console.log('Notification settings saved successfully');
        },
        error: (error) => {
          console.error('Error saving notification settings:', error);
          this.isSavingNotifications = false;
        }
      });
  }

  resetNotificationSettings(): void {
    this.notificationSettings = {
      newClientMessage: true,
      csMessageHandling: true,
      sessionEnded: true,
      sessionStarted: true,
      clientConnected: true,
      clientDisconnected: true
    };
    this.onNotificationSettingChange();
  }

  sendTestNotification(): void {
    this.botConfigService.sendTestNotification()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            console.log('Test notification sent successfully');
          } else {
            console.error('Test notification failed:', result.message);
          }
        },
        error: (error) => {
          console.error('Error sending test notification:', error);
        }
      });
  }
}