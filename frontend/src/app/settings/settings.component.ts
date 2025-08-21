import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BotConfigService, BotConfig, BotConnectionTest, GroupInvitationStatus } from '../shared/services/bot-config.service';
import { SocketService } from '../shared/services/socket.service';
import { StepperComponent, StepperStep } from '../shared/components/stepper/stepper.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, StepperComponent],
  template: `
<div class="settings-container">
  <!-- Sidebar Menu -->
  <div class="menu-sidebar">
    <div class="sidebar-header">
      <i class="fas fa-cog"></i>
      <h3>Settings</h3>
    </div>
    
    <div class="panel-list">
      <!-- Bot Configuration -->
      <div class="panel-item" 
           [class.active]="activeConfigSection === 'bot'"
           (click)="setActiveConfigSection('bot')">
        <div class="panel-icon">
          <i class="fab fa-telegram-plane"></i>
        </div>
        <div class="panel-content">
          <strong>Bot Configuration</strong>
          <span>Telegram bot setup and notifications</span>
        </div>
        <div class="panel-status">
          <div class="status-dot" 
               [class.connected]="botConfig?.isConnected && botConfig?.isGroupConfigured"
               [class.disconnected]="!botConfig?.isConnected || !botConfig?.isGroupConfigured"></div>
        </div>
      </div>
      
      <!-- Notification Settings -->
      <div class="panel-item disabled">
        <div class="panel-icon">
          <i class="fas fa-bell"></i>
        </div>
        <div class="panel-content">
          <strong>Notification Rules</strong>
          <span>Customize alert preferences</span>
        </div>
        <div class="panel-status">
          <div class="coming-soon">Soon</div>
        </div>
      </div>
      
      <!-- User Management -->
      <div class="panel-item disabled">
        <div class="panel-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="panel-content">
          <strong>User Management</strong>
          <span>Manage user accounts and permissions</span>
        </div>
        <div class="panel-status">
          <div class="coming-soon">Soon</div>
        </div>
      </div>
      
      <!-- System Settings -->
      <div class="panel-item disabled">
        <div class="panel-icon">
          <i class="fas fa-server"></i>
        </div>
        <div class="panel-content">
          <strong>System Settings</strong>
          <span>Application configuration</span>
        </div>
        <div class="panel-status">
          <div class="coming-soon">Soon</div>
        </div>
      </div>
      
      <!-- Security -->
      <div class="panel-item disabled">
        <div class="panel-icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="panel-content">
          <strong>Security</strong>
          <span>Authentication and access control</span>
        </div>
        <div class="panel-status">
          <div class="coming-soon">Soon</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="main-content">
    <!-- Welcome Section (when no section is active) -->
    <div class="welcome-section" *ngIf="!activeConfigSection">
      <div>
        <i class="fas fa-cog welcome-icon"></i>
        <h2>Settings</h2>
        <p>Select a configuration option from the sidebar to get started</p>
      </div>
    </div>

    <!-- Bot Configuration Section -->
    <div class="config-section" *ngIf="activeConfigSection === 'bot'">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-content">
          <div class="header-title">
            <i class="fab fa-telegram-plane"></i>
            <div>
              <h1>Telegram Bot Configuration</h1>
              <p>Set up your Telegram bot for help desk notifications</p>
            </div>
          </div>
          <div class="header-status" *ngIf="botConfig">
            <div class="status-indicator" [class.connected]="botConfig.isConnected" [class.configured]="botConfig.isGroupConfigured">
              <i class="fas" [class.fa-check-circle]="botConfig.isConnected && botConfig.isGroupConfigured" 
                 [class.fa-exclamation-triangle]="botConfig.isConnected && !botConfig.isGroupConfigured"
                 [class.fa-times-circle]="!botConfig.isConnected"></i>
              <span>{{ getStatusText() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stepper and Content -->
      <div class="bot-config-content">
        <!-- Stepper -->
        <app-stepper [steps]="stepperSteps" (stepClick)="onStepClick($event)"></app-stepper>
    
    <!-- Step Content -->
    <div class="step-content">
      <!-- Step 1: Bot Token -->
      <div class="step-panel" *ngIf="currentStep === 'token'">
        <div class="step-header">
          <h2>Connect Your Telegram Bot</h2>
          <p>Enter your Telegram bot token to establish the connection</p>
        </div>

        <!-- Current Bot Info (if connected) -->
        <div class="current-bot-card" *ngIf="botConfig?.isConnected">
          <div class="bot-info">
            <div class="bot-avatar">
              <i class="fab fa-telegram-plane"></i>
            </div>
            <div class="bot-details">
              <h3>{{ '@' + (botConfig?.botUsername || '') }}</h3>
              <p>Connected and ready</p>
            </div>
            <div class="bot-status">
              <span class="status-badge connected">Connected</span>
            </div>
          </div>
          <div class="bot-actions">
            <button class="btn-secondary" (click)="editBotToken()">
              <i class="fas fa-edit"></i>
              Change Bot Token
            </button>
            <button class="btn-danger" (click)="disconnectBot()">
              <i class="fas fa-unlink"></i>
              Disconnect
            </button>
          </div>
        </div>

        <!-- Token Input Form -->
        <div class="token-form" [class.editing]="isEditingToken" *ngIf="!botConfig?.isConnected || isEditingToken">
          <div class="form-group">
            <label for="botToken">Bot Token</label>
            <div class="token-input-group">
              <input 
                id="botToken"
                type="password" 
                [(ngModel)]="botTokenInput" 
                placeholder="Enter bot token (e.g., 123456789:ABCdefGHijKLmnOPqrSTUvwxYZ)"
                class="form-input"
                [disabled]="isTestingConnection || isSavingToken">
              <button 
                class="btn-test"
                (click)="testBotConnection()"
                [disabled]="!botTokenInput || isTestingConnection || isSavingToken">
                <i *ngIf="!isTestingConnection" class="fas fa-plug"></i>
                <i *ngIf="isTestingConnection" class="fas fa-spinner fa-spin"></i>
                {{ isTestingConnection ? 'Testing...' : 'Test' }}
              </button>
            </div>
          </div>

          <!-- Test Result -->
          <div *ngIf="connectionTestResult" class="test-result">
            <div *ngIf="connectionTestResult.success" class="result-success">
              <i class="fas fa-check-circle"></i>
              <div class="result-content">
                <h4>Connection Successful!</h4>
                <p>Bot: <strong>{{ '@' + (connectionTestResult.botInfo?.username || '') }}</strong> ({{ connectionTestResult.botInfo?.firstName }})</p>
              </div>
              <button 
                class="btn-primary"
                (click)="saveBotToken()"
                [disabled]="isSavingToken">
                <i *ngIf="!isSavingToken" class="fas fa-save"></i>
                <i *ngIf="isSavingToken" class="fas fa-spinner fa-spin"></i>
                {{ isSavingToken ? 'Saving...' : 'Save & Continue' }}
              </button>
            </div>
            
            <div *ngIf="!connectionTestResult.success" class="result-error">
              <i class="fas fa-exclamation-triangle"></i>
              <div class="result-content">
                <h4>Connection Failed</h4>
                <p>{{ connectionTestResult.error }}</p>
              </div>
            </div>
          </div>

          <!-- Cancel Edit -->
          <div class="form-actions" *ngIf="isEditingToken">
            <button class="btn-secondary" (click)="cancelEditToken()">
              <i class="fas fa-times"></i>
              Cancel
            </button>
          </div>
        </div>

        <!-- Help Section -->
        <div class="help-section" *ngIf="!botConfig?.isConnected">
          <h3>How to get a Bot Token:</h3>
          <ol>
            <li>Open Telegram and search for <strong>&#64;BotFather</strong></li>
            <li>Send <code>/newbot</code> command</li>
            <li>Follow the prompts to create your bot</li>
            <li>Copy the bot token and paste it above</li>
          </ol>
        </div>
      </div>

      <!-- Step 2: Group Setup -->
      <div class="step-panel" *ngIf="currentStep === 'group'">
        <div class="step-header">
          <h2>Configure Notification Group</h2>
          <p>Set up a Telegram group to receive help desk notifications</p>
        </div>

        <!-- Current Group (if configured) -->
        <div class="current-group-card" *ngIf="botConfig?.isGroupConfigured">
          <div class="group-info">
            <div class="group-avatar">
              <i class="fas fa-users"></i>
            </div>
            <div class="group-details">
              <h3>{{ botConfig?.groupTitle }}</h3>
              <p>Receiving notifications</p>
            </div>
            <div class="group-status">
              <span class="status-badge active">Active</span>
            </div>
          </div>
          <div class="group-actions">
            <button class="btn-secondary" (click)="sendTestNotification()">
              <i class="fas fa-paper-plane"></i>
              Send Test
            </button>
            <button class="btn-secondary" (click)="changeGroup()">
              <i class="fas fa-edit"></i>
              Change Group
            </button>
          </div>
        </div>

        <!-- Group Setup -->
        <div class="group-setup" *ngIf="!botConfig?.isGroupConfigured">
          <!-- Benefits -->
          <div class="benefits-card">
            <h3>Notification Types</h3>
            <div class="benefit-list">
              <div class="benefit-item">
                <i class="fas fa-comment-dots"></i>
                <span>New client messages</span>
              </div>
              <div class="benefit-item">
                <i class="fas fa-play-circle"></i>
                <span>Chat session started</span>
              </div>
              <div class="benefit-item">
                <i class="fas fa-stop-circle"></i>
                <span>Chat session ended</span>
              </div>
              <div class="benefit-item">
                <i class="fas fa-headset"></i>
                <span>CS activity updates</span>
              </div>
            </div>
          </div>

          <!-- Setup Actions -->
          <div class="setup-actions" *ngIf="!groupInvitationStatus.isWaitingForInvitation">
            <button class="btn-primary" (click)="startGroupSetup()">
              <i class="fas fa-users"></i>
              Start Group Setup
            </button>
          </div>

          <!-- Waiting for Invitation -->
          <div class="waiting-state" *ngIf="groupInvitationStatus.isWaitingForInvitation">
            <div class="waiting-header">
              <div class="pulse-indicator"></div>
              <h3>Waiting for Bot Invitation</h3>
              <p>Add <strong>{{ '@' + (botConfig?.botUsername || '') }}</strong> to your Telegram group</p>
            </div>
            
            <div class="setup-instructions">
              <h4>Setup Steps:</h4>
              <ol>
                <li>Open your Telegram group (or create a new one)</li>
                <li>Tap the group name → Add Members</li>
                <li>Search for <strong>{{ '@' + (botConfig?.botUsername || '') }}</strong></li>
                <li>Add the bot to the group</li>
                <li>Return here to confirm</li>
              </ol>
            </div>

            <div class="waiting-actions">
              <button class="btn-secondary" (click)="cancelGroupSetup()">
                <i class="fas fa-times"></i>
                Cancel Setup
              </button>
            </div>
          </div>

          <!-- Group Detected -->
          <div class="group-detected" *ngIf="groupInvitationStatus.detectedGroups.length > 0">
            <div class="detected-header">
              <i class="fas fa-check-circle"></i>
              <h3>Groups Detected!</h3>
              <p>Select the group you want to use for notifications</p>
            </div>
            
            <div class="group-list">
              <div 
                *ngFor="let group of groupInvitationStatus.detectedGroups" 
                class="group-option"
                [class.selected]="selectedGroupId === group.id"
                (click)="selectGroup(group.id)">
                <div class="group-icon">
                  <i class="fas fa-users"></i>
                </div>
                <div class="group-info">
                  <h4>{{ group.title }}</h4>
                  <p>{{ group.type | titlecase }} • {{ group.memberCount || 'Unknown' }} members</p>
                </div>
                <div class="selection-indicator">
                  <i class="fas fa-check"></i>
                </div>
              </div>
            </div>
            
            <div class="confirmation-actions">
              <button class="btn-primary" (click)="confirmGroup()" [disabled]="!selectedGroupId">
                <i class="fas fa-check"></i>
                Confirm & Enable Notifications
              </button>
              <button class="btn-secondary" (click)="cancelGroupSetup()">
                <i class="fas fa-times"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Notifications -->
      <div class="step-panel" *ngIf="currentStep === 'notifications'">
        <div class="step-header">
          <h2>Notification Settings</h2>
          <p>Customize which events trigger notifications</p>
        </div>

        <div class="notification-settings">
          <div class="setting-group">
            <h3>Client Events</h3>
            <div class="setting-item">
              <div class="setting-info">
                <h4>New Client Messages</h4>
                <p>Get notified when clients send new messages</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [checked]="true">
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h4>Client Connected</h4>
                <p>Notification when a new client starts a conversation</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [checked]="true">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <h3>Session Events</h3>
            <div class="setting-item">
              <div class="setting-info">
                <h4>Session Started</h4>
                <p>When a customer service agent starts handling a session</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [checked]="true">
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h4>Session Ended</h4>
                <p>When a chat session is closed</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [checked]="true">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <button class="btn-primary">
            <i class="fas fa-save"></i>
            Save Settings
          </button>
        </div>
      </div>

      <!-- Step 4: Complete -->
      <div class="step-panel" *ngIf="currentStep === 'complete'">
        <div class="completion-card">
          <div class="completion-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h2>Configuration Complete!</h2>
          <p>Your Telegram bot is now configured and ready to send notifications</p>
          
          <div class="summary-info">
            <div class="summary-item">
              <span class="label">Bot:</span>
              <span class="value">{{ '@' + (botConfig?.botUsername || '') }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Group:</span>
              <span class="value">{{ botConfig?.groupTitle }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Status:</span>
              <span class="value status-active">Active</span>
            </div>
          </div>

          <div class="completion-actions">
            <button class="btn-primary" (click)="sendTestNotification()">
              <i class="fas fa-paper-plane"></i>
              Send Test Notification
            </button>
            <button class="btn-secondary" (click)="goToStep('notifications')">
              <i class="fas fa-cog"></i>
              Manage Settings
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    /* Container */
    .settings-container {
      display: flex;
      background: #17212b;
      height: 100vh;
    }

    /* Sidebar Menu Styles */
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

    /* Main Content Area */
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

    .welcome-icon {
      font-size: 80px;
      margin-bottom: 24px;
      color: #5288c1;
    }

    .config-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header for Bot Configuration */
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

    /* Bot Configuration Content */
    .bot-config-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    .bot-config-content::-webkit-scrollbar {
      width: 6px;
    }

    .bot-config-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .bot-config-content::-webkit-scrollbar-thumb {
      background: #2b374a;
      border-radius: 3px;
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

    .header-status {
      display: flex;
      align-items: center;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
      border: 1px solid rgba(220, 53, 69, 0.3);
    }

    .status-indicator.connected {
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
      border-color: rgba(255, 193, 7, 0.3);
    }

    .status-indicator.configured {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
      border-color: rgba(40, 167, 69, 0.3);
    }

    /* Main Content */
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    .main-content::-webkit-scrollbar {
      width: 6px;
    }

    .main-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .main-content::-webkit-scrollbar-thumb {
      background: #2b374a;
      border-radius: 3px;
    }

    /* Step Content */
    .step-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .step-panel {
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 24px;
    }

    .step-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .step-header h2 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .step-header p {
      color: #8696a8;
      font-size: 16px;
      margin: 0;
    }

    /* Current Bot Card */
    .current-bot-card {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .bot-info {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .bot-avatar {
      width: 48px;
      height: 48px;
      background: rgba(82, 136, 193, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bot-avatar i {
      color: #5288c1;
      font-size: 20px;
    }

    .bot-details h3 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .bot-details p {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
    }

    .bot-status {
      margin-left: auto;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.connected {
      background: rgba(40, 167, 69, 0.2);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .status-badge.active {
      background: rgba(40, 167, 69, 0.2);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .bot-actions {
      display: flex;
      gap: 12px;
    }

    /* Token Form */
    .token-form {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .token-form.editing {
      border-color: #5288c1;
      background: rgba(82, 136, 193, 0.05);
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .token-input-group {
      display: flex;
      gap: 12px;
    }

    .form-input {
      flex: 1;
      padding: 12px 16px;
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 8px;
      color: #ffffff;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #5288c1;
      box-shadow: 0 0 0 3px rgba(82, 136, 193, 0.1);
    }

    .form-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Test Result */
    .test-result {
      margin-top: 20px;
    }

    .result-success, .result-error {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .result-success {
      background: rgba(40, 167, 69, 0.1);
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .result-error {
      background: rgba(220, 53, 69, 0.1);
      border: 1px solid rgba(220, 53, 69, 0.3);
    }

    .result-success i {
      color: #28a745;
      font-size: 24px;
      margin-top: 2px;
    }

    .result-error i {
      color: #dc3545;
      font-size: 24px;
      margin-top: 2px;
    }

    .result-content {
      flex: 1;
    }

    .result-content h4 {
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .result-content p {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
    }

    .result-success .result-content h4 {
      color: #28a745;
    }

    .result-error .result-content h4 {
      color: #dc3545;
    }

    /* Help Section */
    .help-section {
      background: rgba(82, 136, 193, 0.05);
      border: 1px solid rgba(82, 136, 193, 0.2);
      border-radius: 12px;
      padding: 24px;
      margin-top: 24px;
    }

    .help-section h3 {
      color: #5288c1;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .help-section ol {
      color: #8696a8;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      padding-left: 20px;
    }

    .help-section code {
      background: rgba(82, 136, 193, 0.1);
      color: #5288c1;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    /* Current Group Card */
    .current-group-card {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .group-info {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .group-avatar {
      width: 48px;
      height: 48px;
      background: rgba(82, 136, 193, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .group-avatar i {
      color: #5288c1;
      font-size: 20px;
    }

    .group-details h3 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .group-details p {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
    }

    .group-status {
      margin-left: auto;
    }

    .group-actions {
      display: flex;
      gap: 12px;
    }

    /* Benefits Card */
    .benefits-card {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .benefits-card h3 {
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .benefit-list {
      display: grid;
      gap: 12px;
    }

    .benefit-item {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #8696a8;
      font-size: 14px;
    }

    .benefit-item i {
      color: #5288c1;
      font-size: 16px;
      width: 20px;
      text-align: center;
    }

    .benefit-item span {
      color: #ffffff;
    }

    /* Setup Actions */
    .setup-actions {
      text-align: center;
      margin-bottom: 24px;
    }

    /* Waiting State */
    .waiting-state {
      background: rgba(82, 136, 193, 0.05);
      border: 1px solid rgba(82, 136, 193, 0.2);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }

    .waiting-header {
      margin-bottom: 24px;
    }

    .pulse-indicator {
      width: 20px;
      height: 20px;
      background: #5288c1;
      border-radius: 50%;
      margin: 0 auto 16px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }

    .waiting-header h3 {
      color: #5288c1;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .waiting-header p {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
    }

    .setup-instructions {
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      text-align: left;
    }

    .setup-instructions h4 {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .setup-instructions ol {
      color: #8696a8;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      padding-left: 20px;
    }

    .waiting-actions {
      text-align: center;
    }

    /* Group Detected */
    .group-detected {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .detected-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .detected-header i {
      color: #28a745;
      font-size: 32px;
      margin-bottom: 12px;
    }

    .detected-header h3 {
      color: #28a745;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .detected-header p {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
    }

    .group-list {
      margin-bottom: 24px;
    }

    .group-option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 12px;
    }

    .group-option:hover {
      background: #2b374a;
      border-color: #5288c1;
    }

    .group-option.selected {
      background: rgba(82, 136, 193, 0.1);
      border-color: #5288c1;
    }

    .group-option .group-icon {
      width: 40px;
      height: 40px;
      background: rgba(82, 136, 193, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .group-option .group-icon i {
      color: #5288c1;
      font-size: 16px;
    }

    .group-option .group-info {
      flex: 1;
    }

    .group-option .group-info h4 {
      color: #ffffff;
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 4px 0;
    }

    .group-option .group-info p {
      color: #8696a8;
      font-size: 12px;
      margin: 0;
    }

    .selection-indicator {
      width: 24px;
      height: 24px;
      border: 2px solid #2b374a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .group-option.selected .selection-indicator {
      border-color: #5288c1;
      background: #5288c1;
    }

    .selection-indicator i {
      color: white;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .group-option.selected .selection-indicator i {
      opacity: 1;
    }

    .confirmation-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
    }

    /* Notification Settings */
    .notification-settings {
      margin-bottom: 32px;
    }

    .setting-group {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .setting-group h3 {
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 20px 0;
    }

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      border-bottom: 1px solid #2b374a;
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-info h4 {
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 4px 0;
    }

    .setting-info p {
      color: #8696a8;
      font-size: 12px;
      margin: 0;
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
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
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #5288c1;
    }

    input:checked + .slider:before {
      transform: translateX(24px);
    }

    .settings-actions {
      text-align: center;
    }

    /* Completion Card */
    .completion-card {
      text-align: center;
      padding: 40px 24px;
    }

    .completion-icon {
      margin-bottom: 24px;
    }

    .completion-icon i {
      color: #28a745;
      font-size: 64px;
    }

    .completion-card h2 {
      color: #28a745;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .completion-card p {
      color: #8696a8;
      font-size: 16px;
      margin: 0 0 32px 0;
    }

    .summary-info {
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #2b374a;
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-item .label {
      color: #8696a8;
      font-size: 14px;
      font-weight: 500;
    }

    .summary-item .value {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
    }

    .summary-item .value.status-active {
      color: #28a745;
    }

    .completion-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-danger, .btn-test {
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

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #c82333;
    }

    .btn-test {
      background: #17a2b8;
      color: white;
    }

    .btn-test:hover:not(:disabled) {
      background: #138496;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled,
    .btn-danger:disabled,
    .btn-test:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-actions {
      margin-top: 20px;
      text-align: center;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .settings-container {
        flex-direction: column;
      }

      .menu-sidebar {
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid #2b374a;
      }

      .settings-header {
        padding: 16px 20px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .bot-config-content {
        padding: 20px;
      }

      .step-panel {
        padding: 20px;
      }

      .token-input-group {
        flex-direction: column;
      }

      .confirmation-actions {
        flex-direction: column;
      }

      .completion-actions {
        flex-direction: column;
      }

      .bot-actions,
      .group-actions {
        flex-direction: column;
      }

      .panel-item {
        padding: 12px 16px;
      }

      .sidebar-header {
        padding: 16px;
      }
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Stepper management
  currentStep: string = 'token';
  stepperSteps: StepperStep[] = [];
  isEditingToken: boolean = false;

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

  constructor(
    private botConfigService: BotConfigService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    // Initialize stepper steps
    this.initializeStepperSteps();
    
    // Load initial configuration
    this.loadBotConfiguration();
    
    // Listen for real-time group detection
    this.socketService.onGroupsDetected()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        console.log('Frontend: Groups detected via socket', status);
        this.groupInvitationStatus = status;
        this.botConfigService.updateGroupInvitationStatus(status);
      });
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
          this.updateStepperSteps();
          
          // Auto-navigate to the next incomplete step
          if (config.isConnected && !config.isGroupConfigured) {
            this.currentStep = 'group';
          } else if (config.isGroupConfigured && !config.notificationsEnabled) {
            this.currentStep = 'notifications';
          } else if (config.isConnected && config.isGroupConfigured) {
            this.currentStep = 'complete';
          }
          this.updateStepperSteps();
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
          this.updateStepperSteps();
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
          this.isEditingToken = false;
          
          // Move to next step
          this.currentStep = 'group';
          this.updateStepperSteps();
          
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
          
          // Move to next step
          this.currentStep = 'notifications';
          this.updateStepperSteps();
          
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

  // Stepper management methods
  initializeStepperSteps(): void {
    this.stepperSteps = [
      {
        id: 'token',
        title: 'Bot Token',
        description: 'Connect your bot',
        isCompleted: false,
        isActive: true,
        icon: 'fa-robot'
      },
      {
        id: 'group',
        title: 'Group Setup',
        description: 'Configure notifications',
        isCompleted: false,
        isActive: false,
        isDisabled: true,
        icon: 'fa-users'
      },
      {
        id: 'notifications',
        title: 'Settings',
        description: 'Customize alerts',
        isCompleted: false,
        isActive: false,
        isDisabled: true,
        icon: 'fa-bell'
      },
      {
        id: 'complete',
        title: 'Complete',
        description: 'Ready to use',
        isCompleted: false,
        isActive: false,
        isDisabled: true,
        icon: 'fa-check'
      }
    ];
  }

  updateStepperSteps(): void {
    this.stepperSteps.forEach(step => {
      step.isActive = step.id === this.currentStep;
      
      // Update completion status
      switch (step.id) {
        case 'token':
          step.isCompleted = this.botConfig?.isConnected || false;
          break;
        case 'group':
          step.isCompleted = this.botConfig?.isGroupConfigured || false;
          step.isDisabled = !this.botConfig?.isConnected;
          break;
        case 'notifications':
          step.isCompleted = this.botConfig?.notificationsEnabled || false;
          step.isDisabled = !this.botConfig?.isGroupConfigured;
          break;
        case 'complete':
          step.isCompleted = this.botConfig?.isConnected && this.botConfig?.isGroupConfigured || false;
          step.isDisabled = !this.botConfig?.isGroupConfigured;
          break;
      }
    });
  }

  onStepClick(event: { step: StepperStep; index: number }): void {
    if (!event.step.isDisabled) {
      this.currentStep = event.step.id;
      this.updateStepperSteps();
    }
  }

  goToStep(stepId: string): void {
    const step = this.stepperSteps.find(s => s.id === stepId);
    if (step && !step.isDisabled) {
      this.currentStep = stepId;
      this.updateStepperSteps();
    }
  }

  getStatusText(): string {
    if (!this.botConfig) return 'Not configured';
    
    if (this.botConfig.isConnected && this.botConfig.isGroupConfigured) {
      return 'Fully configured';
    } else if (this.botConfig.isConnected) {
      return 'Bot connected';
    } else {
      return 'Not connected';
    }
  }

  editBotToken(): void {
    this.isEditingToken = true;
    this.botTokenInput = '';
    this.connectionTestResult = null;
  }

  cancelEditToken(): void {
    this.isEditingToken = false;
    this.botTokenInput = '';
    this.connectionTestResult = null;
  }
}