import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BotConfigService, BotConfig, BotConnectionTest, GroupInvitationStatus } from '../shared/services/bot-config.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <!-- Sidebar Menu -->
      <div class="menu-sidebar">
        <div class="sidebar-header">
          <i class="fas fa-cogs"></i>
          <h3>Configuration</h3>
        </div>
        <div class="panel-list">
          <div class="panel-item" [class.active]="activeConfigSection === 'bot'" (click)="setActiveConfigSection('bot')">
            <div class="panel-icon">
              <i class="fab fa-telegram-plane"></i>
            </div>
            <div class="panel-content">
              <strong>Bot Configuration</strong>
              <span>Telegram bot settings</span>
            </div>
            <div class="panel-status">
              <span class="status-dot" [class.connected]="botConfig?.isConnected" [class.disconnected]="!botConfig?.isConnected"></span>
            </div>
          </div>
          
          <div class="panel-item disabled">
            <div class="panel-icon">
              <i class="fas fa-users-cog"></i>
            </div>
            <div class="panel-content">
              <strong>User Management</strong>
              <span>Manage service agents</span>
            </div>
            <div class="panel-status">
              <span class="coming-soon">Soon</span>
            </div>
          </div>
          
          <div class="panel-item disabled">
            <div class="panel-icon">
              <i class="fas fa-robot"></i>
            </div>
            <div class="panel-content">
              <strong>Bot Behavior</strong>
              <span>Configure responses</span>
            </div>
            <div class="panel-status">
              <span class="coming-soon">Soon</span>
            </div>
          </div>
          
          <div class="panel-item disabled">
            <div class="panel-icon">
              <i class="fas fa-tachometer-alt"></i>
            </div>
            <div class="panel-content">
              <strong>Rate Limiting</strong>
              <span>Control message rates</span>
            </div>
            <div class="panel-status">
              <span class="coming-soon">Soon</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="main-content">
        <!-- Welcome Message -->
        <div class="welcome-section" *ngIf="!activeConfigSection">
          <div>
            <i class="fas fa-cogs welcome-icon"></i>
            <h2>Configuration Settings</h2>
            <p>Select a configuration option from the sidebar to manage your help desk settings.</p>
          </div>
        </div>

        <!-- Bot Configuration Section -->
        <div class="config-section" *ngIf="activeConfigSection === 'bot'">
        
        <!-- Bot Token Section -->
        <div class="config-subsection" *ngIf="!botConfig?.isConnected">
          <h5>Step 1: Connect Your Telegram Bot</h5>
          <p class="subsection-description">
            Enter your Telegram bot token to connect the help desk system with your Telegram bot.
          </p>
          
          <div class="bot-token-form">
            <div class="form-group">
              <div class="token-input-container">
                <input 
                  type="password" 
                  [(ngModel)]="botTokenInput" 
                  placeholder="Enter bot token (e.g., 123456789:ABCdefGHijKLmnOPqrSTUvwxYZ)"
                  class="bot-token-input"
                  [disabled]="isTestingConnection || isSavingToken">
                <button 
                  class="btn-test-connection"
                  (click)="testBotConnection()"
                  [disabled]="!botTokenInput || isTestingConnection || isSavingToken">
                  <i *ngIf="!isTestingConnection" class="fas fa-plug"></i>
                  <i *ngIf="isTestingConnection" class="fas fa-spinner fa-spin"></i>
                  {{ isTestingConnection ? 'Testing...' : 'Test Connection' }}
                </button>
              </div>
            </div>
            
            <!-- Connection Test Result -->
            <div *ngIf="connectionTestResult" class="connection-result">
              <div *ngIf="connectionTestResult.success" class="result-success">
                <i class="fas fa-check-circle"></i>
                <div class="result-info">
                  <strong>Connection successful!</strong>
                  <div class="bot-info">
                    Bot: <strong>{{ '@' + (connectionTestResult.botInfo?.username || '') }}</strong> 
                    ({{ connectionTestResult.botInfo?.firstName }})
                  </div>
                </div>
                <button 
                  class="btn-save-token"
                  (click)="saveBotToken()"
                  [disabled]="isSavingToken">
                  <i *ngIf="!isSavingToken" class="fas fa-save"></i>
                  <i *ngIf="isSavingToken" class="fas fa-spinner fa-spin"></i>
                  {{ isSavingToken ? 'Saving...' : 'Save Token' }}
                </button>
              </div>
              
              <div *ngIf="!connectionTestResult.success" class="result-error">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="result-info">
                  <strong>Connection failed</strong>
                  <div class="error-message">{{ connectionTestResult.error }}</div>
                </div>
              </div>
            </div>
            
            <!-- Current Bot Status -->
            <div *ngIf="botConfig?.isConnected" class="current-bot-status">
              <div class="status-success">
                <i class="fas fa-check-circle"></i>
                <div class="status-info">
                  <strong>Bot connected successfully</strong>
                  <div class="bot-details">
                    <span>{{ '@' + (botConfig?.botUsername || '') }}</span>
                    <span class="status-badge connected">Connected</span>
                  </div>
                </div>
                <button class="btn-disconnect" (click)="disconnectBot()" title="Disconnect bot">
                  <i class="fas fa-unlink"></i>
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Group Configuration Section -->
        <div class="config-subsection" *ngIf="botConfig?.isConnected">
          <h5>Step 2: Group Notifications Setup</h5>
          <p class="subsection-description">
            Invite the bot to your Telegram group to receive real-time notifications about:
          </p>
          <div class="notification-types">
            <div class="notification-item">
              <i class="fas fa-comment-dots"></i>
              <span>Client incoming messages</span>
            </div>
            <div class="notification-item">
              <i class="fas fa-play-circle"></i>
              <span>New chat session creation</span>
            </div>
            <div class="notification-item">
              <i class="fas fa-headset"></i>
              <span>Customer service message handling</span>
            </div>
            <div class="notification-item">
              <i class="fas fa-stop-circle"></i>
              <span>Chat session ended</span>
            </div>
            <div class="notification-item">
              <i class="fas fa-bell"></i>
              <span>System status updates</span>
            </div>
          </div>
          
          <div class="group-config">
            <!-- Not configured state -->
            <div *ngIf="!botConfig?.isGroupConfigured && !groupInvitationStatus.isWaitingForInvitation" class="group-setup">
              <button class="btn-setup-group" (click)="startGroupSetup()">
                <i class="fas fa-users"></i>
                Start Group Setup
              </button>
              <div class="setup-instructions">
                <p><strong>Setup Instructions:</strong></p>
                <ol>
                  <li>Click "Start Group Setup" to begin listening for bot invitations</li>
                  <li>Open your Telegram group (or create a new one)</li>
                  <li>Add the bot <strong>{{ '@' + (botConfig?.botUsername || '') }}</strong> as a member</li>
                  <li>Return here to confirm the group selection</li>
                </ol>
                <div class="info-note">
                  <i class="fas fa-info-circle"></i>
                  <span>All team members in the group will receive help desk notifications</span>
                </div>
              </div>
            </div>
            
            <!-- Waiting for invitation state -->
            <div *ngIf="groupInvitationStatus.isWaitingForInvitation" class="group-waiting">
              <div class="waiting-indicator">
                <div class="pulse-dot"></div>
                <div class="waiting-info">
                  <strong>Listening for bot invitation...</strong>
                  <p>Add the bot <strong>{{ '@' + (botConfig?.botUsername || '') }}</strong> to your Telegram group now</p>
                </div>
                <button class="btn-cancel-setup" (click)="cancelGroupSetup()">
                  <i class="fas fa-times"></i>
                  Cancel Setup
                </button>
              </div>
              
              <!-- Instructions -->
              <div class="invitation-instructions">
                <h6>Steps to add the bot:</h6>
                <ol>
                  <li>Open your Telegram group</li>
                  <li>Tap the group name at the top</li>
                  <li>Tap "Add Members" or "Invite Members"</li>
                  <li>Search for <strong>{{ '@' + (botConfig?.botUsername || '') }}</strong></li>
                  <li>Select and add the bot to the group</li>
                </ol>
              </div>
            </div>
            
            <!-- Group detected state -->
            <div *ngIf="groupInvitationStatus.detectedGroups.length > 0" class="group-detected">
              <div class="detected-header">
                <i class="fas fa-exclamation-circle"></i>
                <strong>Bot added to group!</strong>
              </div>
              
              <div class="detected-groups">
                <div 
                  *ngFor="let group of groupInvitationStatus.detectedGroups" 
                  class="detected-group"
                  [class.selected]="selectedGroupId === group.id"
                  (click)="selectGroup(group.id)">
                  <div class="group-icon">
                    <i class="fas fa-users"></i>
                  </div>
                  <div class="group-info">
                    <strong>{{ group.title }}</strong>
                    <span>{{ group.type | titlecase }} • {{ group.memberCount || 'Unknown' }} members</span>
                  </div>
                  <div class="group-actions">
                    <div class="radio-indicator" [class.selected]="selectedGroupId === group.id">
                      <i class="fas fa-check"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="group-confirmation">
                <p><strong>Confirm Group Selection</strong></p>
                <div class="confirmation-details">
                  <div class="confirmation-info">
                    <i class="fas fa-info-circle"></i>
                    <span>All help desk notifications will be sent to this group. Everyone in the group will receive updates about client messages, chat sessions, and system activities.</span>
                  </div>
                </div>
                <div class="confirmation-actions">
                  <button class="btn-confirm-group" (click)="confirmGroup()" [disabled]="!selectedGroupId">
                    <i class="fas fa-check"></i>
                    Confirm & Enable Notifications
                  </button>
                  <button class="btn-cancel-setup" (click)="cancelGroupSetup()">
                    <i class="fas fa-times"></i>
                    Cancel Setup
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Group configured state -->
            <div *ngIf="botConfig?.isGroupConfigured" class="group-configured">
              <div class="configured-success">
                <i class="fas fa-check-circle"></i>
                <div class="configured-info">
                  <strong>Group notifications configured</strong>
                  <div class="group-details">
                    <span><strong>{{ botConfig?.groupTitle }}</strong></span>
                    <span class="status-badge connected">Active</span>
                  </div>
                </div>
                <div class="configured-actions">
                  <button class="btn-test-notification" (click)="sendTestNotification()">
                    <i class="fas fa-paper-plane"></i>
                    Send Test
                  </button>
                  <button class="btn-change-group" (click)="changeGroup()">
                    <i class="fas fa-edit"></i>
                    Change Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      background: #17212b;
      height: 100vh;
    }

    /* Sidebar Menu Styles - matching ListPanelComponent */
    .menu-sidebar {
      width: 360px;
      height: 100vh;
      background: #0e1621;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #2b374a;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 20px;
      margin: 0;
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #2b374a;
      flex-shrink: 0;
    }

    .sidebar-header h3 {
      margin: 0;
      color: #ffffff;
    }

    .sidebar-header i {
      color: #5288c1;
      font-size: 20px;
    }

    .panel-list {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .panel-list::-webkit-scrollbar {
      width: 4px;
    }

    .panel-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .panel-list::-webkit-scrollbar-thumb {
      background: #2b374a;
      border-radius: 2px;
    }

    .panel-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 1px solid rgba(43, 55, 74, 0.3);
      min-height: 72px;
    }

    .panel-item:not(.disabled):hover {
      background: rgba(82, 136, 193, 0.05);
    }

    .panel-item.active {
      background: rgba(82, 136, 193, 0.1);
      border-right: 3px solid #5288c1;
    }

    .panel-item.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .panel-icon {
      width: 44px;
      height: 44px;
      background: rgba(82, 136, 193, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .panel-icon i {
      font-size: 18px;
      color: #5288c1;
    }

    .panel-content {
      flex: 1;
      min-width: 0;
    }

    .panel-content strong {
      color: #ffffff;
      display: block;
      font-size: 16px;
      margin-bottom: 4px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .panel-content span {
      color: #8696a8;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .panel-status {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .status-dot.connected {
      background: #4caf50;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
    }

    .status-dot.disconnected {
      background: #f44336;
      box-shadow: 0 0 8px rgba(244, 67, 54, 0.4);
    }

    .coming-soon {
      background: rgba(108, 117, 125, 0.2);
      color: #8696a8;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Main Content Area Styles - matching clients component */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #17212b;
      height: 100vh;
      overflow: hidden;
    }

    .welcome-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .welcome-section > div {
      text-align: center;
      max-width: 400px;
      padding: 40px;
    }

    .welcome-section h2 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 400;
      margin-bottom: 12px;
    }

    .welcome-section p {
      color: #8696a8;
      font-size: 16px;
      margin: 0;
    }

    .config-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      max-width: none;
    }

    .welcome-icon {
      font-size: 80px;
      margin-bottom: 24px;
      color: #5288c1;
    }

    /* Notification Types */
    .notification-types {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .notification-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      color: #8696a8;
      font-size: 14px;
    }

    .notification-item i {
      color: #5288c1;
      font-size: 16px;
      width: 20px;
      text-align: center;
    }

    .notification-item span {
      color: #ffffff;
    }

    /* Info Note */
    .info-note {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background: rgba(82, 136, 193, 0.1);
      border: 1px solid rgba(82, 136, 193, 0.3);
      border-radius: 6px;
      color: #5288c1;
      font-size: 13px;
    }

    .info-note i {
      font-size: 16px;
      flex-shrink: 0;
    }

    /* Confirmation Details */
    .confirmation-details {
      margin-bottom: 16px;
    }

    .confirmation-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: rgba(82, 136, 193, 0.1);
      border: 1px solid rgba(82, 136, 193, 0.3);
      border-radius: 8px;
      color: #5288c1;
    }

    .confirmation-info i {
      font-size: 18px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .confirmation-info span {
      font-size: 14px;
      line-height: 1.5;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .section-header h4 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-back {
      background: #2b374a;
      border: 1px solid #354050;
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #354050;
      border-color: #5288c1;
    }

    .config-subsection {
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 16px;
      display: table;
      width: auto;
    }

    .config-subsection h5 {
      color: #ffffff;
      font-size: 16px;
      margin: 0 0 12px 0;
    }

    .subsection-description {
      color: #8696a8;
      font-size: 14px;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .bot-token-form .form-group {
      margin-bottom: 16px;
    }

    .token-input-container {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .bot-token-input {
      width: 320px;
      padding: 10px 12px;
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 6px;
      color: #ffffff;
      font-size: 14px;
    }

    .bot-token-input:focus {
      outline: none;
      border-color: #5288c1;
      box-shadow: 0 0 0 2px rgba(82, 136, 193, 0.2);
    }

    .btn-test-connection,
    .btn-save-token {
      padding: 12px 20px;
      background: #5288c1;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .btn-test-connection:hover:not(:disabled),
    .btn-save-token:hover:not(:disabled) {
      background: #4a7ba7;
    }

    .btn-test-connection:disabled,
    .btn-save-token:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .connection-result {
      margin-top: 16px;
    }

    .result-success,
    .result-error {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
    }

    .result-success {
      background: rgba(40, 167, 69, 0.1);
      border: 1px solid #28a745;
      color: #28a745;
    }

    .result-error {
      background: rgba(220, 53, 69, 0.1);
      border: 1px solid #dc3545;
      color: #dc3545;
    }

    .result-success i,
    .result-error i {
      font-size: 20px;
      flex-shrink: 0;
    }

    .result-info {
      flex: 1;
    }

    .result-info strong {
      display: block;
      margin-bottom: 4px;
    }

    .bot-info {
      font-size: 13px;
      opacity: 0.9;
    }

    .error-message {
      font-size: 13px;
      opacity: 0.9;
    }

    .current-bot-status {
      margin-top: 16px;
    }

    .status-success {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(40, 167, 69, 0.1);
      border: 1px solid #28a745;
      border-radius: 8px;
      color: #28a745;
    }

    .status-success i {
      font-size: 20px;
      flex-shrink: 0;
    }

    .status-info {
      flex: 1;
    }

    .status-info strong {
      display: block;
      margin-bottom: 4px;
    }

    .bot-details {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-badge {
      background: rgba(40, 167, 69, 0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .btn-disconnect {
      padding: 8px 16px;
      background: #dc3545;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-disconnect:hover {
      background: #c82333;
    }

    .group-config {
      margin-top: 20px;
    }

    .btn-setup-group {
      background: #5288c1;
      border: none;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .btn-setup-group:hover {
      background: #4a7ba7;
    }

    .setup-instructions {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 6px;
      padding: 16px;
    }

    .setup-instructions p {
      margin: 0 0 12px 0;
      color: #ffffff;
      font-weight: 500;
    }

    .setup-instructions ol {
      margin: 0;
      padding-left: 20px;
      color: #8696a8;
      font-size: 14px;
      line-height: 1.6;
    }

    .waiting-indicator {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(82, 136, 193, 0.1);
      border: 1px solid #5288c1;
      border-radius: 8px;
      color: #5288c1;
      margin-bottom: 16px;
    }

    .pulse-dot {
      width: 12px;
      height: 12px;
      background: #5288c1;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
      100% { opacity: 1; transform: scale(1); }
    }

    .waiting-info {
      flex: 1;
    }

    .waiting-info strong {
      display: block;
      margin-bottom: 4px;
    }

    .waiting-info p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .btn-cancel-setup {
      background: #6c757d;
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-cancel-setup:hover {
      background: #5a6268;
    }

    .invitation-instructions {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 6px;
      padding: 16px;
    }

    .invitation-instructions h6 {
      color: #ffffff;
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .invitation-instructions ol {
      margin: 0;
      padding-left: 20px;
      color: #8696a8;
      font-size: 14px;
      line-height: 1.6;
    }

    .group-detected {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 8px;
      padding: 20px;
    }

    .detected-header {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #ffc107;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .detected-groups {
      margin-bottom: 20px;
    }

    .detected-group {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 8px;
    }

    .detected-group:last-child {
      margin-bottom: 0;
    }

    .detected-group:hover {
      background: #2b374a;
      border-color: #5288c1;
    }

    .detected-group.selected {
      background: rgba(82, 136, 193, 0.1);
      border-color: #5288c1;
    }

    .group-icon {
      width: 32px;
      height: 32px;
      background: rgba(82, 136, 193, 0.1);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .group-icon i {
      color: #5288c1;
      font-size: 14px;
    }

    .group-info {
      flex: 1;
    }

    .group-info strong {
      color: #ffffff;
      display: block;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .group-info span {
      color: #8696a8;
      font-size: 12px;
    }

    .radio-indicator {
      width: 20px;
      height: 20px;
      border: 2px solid #2b374a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .radio-indicator.selected {
      border-color: #5288c1;
      background: #5288c1;
    }

    .radio-indicator i {
      color: white;
      font-size: 10px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .radio-indicator.selected i {
      opacity: 1;
    }

    .group-confirmation p {
      color: #ffffff;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .confirmation-actions {
      display: flex;
      gap: 12px;
    }

    .btn-confirm-group {
      background: #28a745;
      border: none;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-confirm-group:hover:not(:disabled) {
      background: #218838;
    }

    .btn-confirm-group:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .configured-success {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(40, 167, 69, 0.1);
      border: 1px solid #28a745;
      border-radius: 8px;
      color: #28a745;
    }

    .configured-success i {
      font-size: 20px;
      flex-shrink: 0;
    }

    .configured-info {
      flex: 1;
    }

    .configured-info strong {
      display: block;
      margin-bottom: 4px;
    }

    .group-details {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .configured-actions {
      display: flex;
      gap: 8px;
    }

    .btn-test-notification,
    .btn-change-group {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-test-notification {
      background: #17a2b8;
      color: white;
    }

    .btn-test-notification:hover {
      background: #138496;
    }

    .btn-change-group {
      background: #6c757d;
      color: white;
    }

    .btn-change-group:hover {
      background: #5a6268;
    }

    @media (max-width: 768px) {
      .settings-container {
        flex-direction: column;
      }

      .menu-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #2b374a;
      }

      .main-content {
        padding: 16px;
      }

      .panel-item {
        padding: 12px 16px;
      }

      .sidebar-header {
        padding: 16px;
      }

      .token-input-container {
        flex-direction: column;
        align-items: stretch;
      }

      .bot-token-input {
        max-width: none;
      }

      .config-subsection {
        display: block;
        width: 100%;
      }

      .bot-token-input {
        width: 100%;
      }

      .confirmation-actions {
        flex-direction: column;
      }

      .configured-actions {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Bot Configuration
  activeConfigSection: string = '';
  botConfig: BotConfig | null = null;
  groupInvitationStatus: GroupInvitationStatus = {
    isWaitingForInvitation: false,
    detectedGroups: []
  };
  
  // Bot Token Management
  botTokenInput: string = '';
  isTestingConnection: boolean = false;
  isSavingToken: boolean = false;
  connectionTestResult: BotConnectionTest | null = null;
  
  // Group Selection
  selectedGroupId: string = '';
  isSettingUpGroup: boolean = false;

  constructor(private botConfigService: BotConfigService) {}

  ngOnInit(): void {
    // Load initial configuration
    this.loadBotConfiguration();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveConfigSection(section: string): void {
    this.activeConfigSection = section;
    if (section === 'bot') {
      this.loadBotConfiguration();
    }
  }

  loadBotConfiguration(): void {
    this.botConfigService.getBotConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.botConfig = config;
          this.botConfigService.updateBotConfig(config);
        },
        error: (error) => {
          console.error('Error loading bot configuration:', error);
          // Create default config if none exists
          this.botConfig = {
            id: 'default',
            isConnected: false,
            isGroupConfigured: false,
            notificationsEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      });

    // Subscribe to group invitation status
    this.botConfigService.groupInvitationStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.groupInvitationStatus = status;
      });
  }

  testBotConnection(): void {
    if (!this.botTokenInput) return;

    this.isTestingConnection = true;
    this.connectionTestResult = null;

    this.botConfigService.testBotConnection(this.botTokenInput)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.connectionTestResult = result;
          this.isTestingConnection = false;
        },
        error: (error) => {
          console.error('Error testing bot connection:', error);
          this.connectionTestResult = {
            success: false,
            error: error.error?.message || 'Connection test failed'
          };
          this.isTestingConnection = false;
        }
      });
  }

  saveBotToken(): void {
    if (!this.botTokenInput || !this.connectionTestResult?.success) return;

    this.isSavingToken = true;

    this.botConfigService.saveBotToken(this.botTokenInput)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.botConfig = config;
          this.botConfigService.updateBotConfig(config);
          this.isSavingToken = false;
          this.botTokenInput = '';
          this.connectionTestResult = null;
          console.log('Bot token saved successfully');
        },
        error: (error) => {
          console.error('Error saving bot token:', error);
          this.isSavingToken = false;
        }
      });
  }

  disconnectBot(): void {
    this.botConfigService.resetBotConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.botConfig = {
            id: 'default',
            isConnected: false,
            isGroupConfigured: false,
            notificationsEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.botConfigService.updateBotConfig(this.botConfig);
          console.log('Bot disconnected successfully');
        },
        error: (error) => {
          console.error('Error disconnecting bot:', error);
        }
      });
  }

  startGroupSetup(): void {
    this.isSettingUpGroup = true;
    
    this.botConfigService.startGroupInvitationListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.groupInvitationStatus = status;
          this.botConfigService.updateGroupInvitationStatus(status);
        },
        error: (error) => {
          console.error('Error starting group setup:', error);
          this.isSettingUpGroup = false;
        }
      });
  }

  cancelGroupSetup(): void {
    this.botConfigService.stopGroupInvitationListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.groupInvitationStatus = {
            isWaitingForInvitation: false,
            detectedGroups: []
          };
          this.selectedGroupId = '';
          this.isSettingUpGroup = false;
          this.botConfigService.updateGroupInvitationStatus(this.groupInvitationStatus);
        },
        error: (error) => {
          console.error('Error canceling group setup:', error);
        }
      });
  }

  selectGroup(groupId: string): void {
    this.selectedGroupId = groupId;
  }

  confirmGroup(): void {
    if (!this.selectedGroupId) return;

    this.botConfigService.confirmGroup(this.selectedGroupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.botConfig = config;
          this.botConfigService.updateBotConfig(config);
          this.groupInvitationStatus = {
            isWaitingForInvitation: false,
            detectedGroups: []
          };
          this.selectedGroupId = '';
          this.isSettingUpGroup = false;
          this.botConfigService.updateGroupInvitationStatus(this.groupInvitationStatus);
          console.log('Group configuration saved successfully');
        },
        error: (error) => {
          console.error('Error confirming group:', error);
        }
      });
  }

  changeGroup(): void {
    // Reset group configuration and start over
    if (this.botConfig) {
      this.botConfig.isGroupConfigured = false;
      this.botConfig.groupId = undefined;
      this.botConfig.groupTitle = undefined;
    }
    this.startGroupSetup();
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