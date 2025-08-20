import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../shared/services/auth.service';
import { ChatService } from '../shared/services/chat.service';
import { SocketService } from '../shared/services/socket.service';
import { User, SessionInfo, ChatMessage } from '../shared/models';
import { NavigationItem } from '../shared/components/sidebar-navigation/sidebar-navigation.component';
import { ListPanelConfig } from '../shared/components/list-panel/list-panel.component';
import { ListItemData } from '../shared/components/list-item/list-item.component';
import { 
  SidebarContainerComponent, 
  SidebarNavigationComponent, 
  ListPanelComponent, 
  ListItemComponent,
  SearchInputComponent
} from '../shared/components';
import { SettingsComponent } from '../settings/settings.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    SidebarContainerComponent,
    SidebarNavigationComponent,
    ListPanelComponent,
    ListItemComponent,
    SearchInputComponent,
    SettingsComponent
  ],
  template: `
    <!-- End Session Confirmation Dialog -->
    <div *ngIf="showEndSessionDialog" class="dialog-overlay" (click)="cancelEndSession()">
      <div class="dialog-container" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>End Chat Session</h3>
          <button class="dialog-close" (click)="cancelEndSession()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-content">
          <p>Are you sure you want to end this chat session with <strong>{{ activeSession?.client?.name }}</strong>?</p>
          <p class="dialog-warning">This action cannot be undone and the customer will be notified that the session has ended.</p>
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" (click)="cancelEndSession()" [disabled]="isEndingSession">
            Cancel
          </button>
          <button class="btn-danger" (click)="endSession()" [disabled]="isEndingSession">
            <i *ngIf="isEndingSession" class="fas fa-spinner fa-spin"></i>
            <span *ngIf="!isEndingSession">End Session</span>
            <span *ngIf="isEndingSession">Ending...</span>
          </button>
        </div>
      </div>
    </div>

    <app-sidebar-container
      [collapsed]="sidebarCollapsed"
      [isMobile]="isMobile"
      [showMobileMenu]="showMobileMenu"
      [showMobileContent]="showMobileChat"
      (toggleSidebar)="toggleSidebar()"
      (toggleMobileMenu)="toggleMobileMenu()">
      
      <!-- Navigation Sidebar -->
      <app-sidebar-navigation slot="navigation"
        [currentUser]="currentUser"
        [navigationItems]="navigationItems"
        [collapsed]="sidebarCollapsed"
        [isMobile]="isMobile"
        [showMobileMenu]="showMobileMenu"
        (itemClick)="onNavigationItemClick($event)"
        (logout)="logout()">
      </app-sidebar-navigation>

      <!-- Content Panels -->
      <div slot="content-panels">
        <!-- Chat List Panel -->
        <app-list-panel *ngIf="activeMenuTab === 'chats'"
          [config]="chatListConfig"
          [loading]="isLoadingChats"
          [showEmptyState]="!isLoadingChats && filteredSessions.length === 0"
          [titleIcon]="'fa-comments'"
          [isMobile]="isMobile"
          [mobileHidden]="showMobileChat && isMobile">
          
          <!-- Search Input -->
          <app-search-input slot="search"
            [(ngModel)]="searchTerm"
            (search)="filterChats()"
            placeholder="Search chats..."
            [loading]="false">
          </app-search-input>
          
          <!-- Chat List Items -->
          <div slot="list-items" class="sessions-scroll-container" #sessionsContainer>
            <app-list-item
              *ngFor="let session of filteredSessions; trackBy: trackBySessionId"
              [data]="getListItemData(session)"
              (itemClick)="selectSession(session)">
            </app-list-item>
            
            <!-- Loading indicator for infinite scroll -->
            <div *ngIf="chatService.isLoadingSessions() && sessions.length > 0" class="loading-more-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading more sessions...</span>
            </div>
            
            <!-- End of list indicator -->
            <div *ngIf="!chatService.hasMoreSessions() && sessions.length > 0" class="end-of-list-indicator">
              <i class="fas fa-check-circle"></i>
              <span>All sessions loaded</span>
            </div>
          </div>
        </app-list-panel>

      </div>

      <!-- Main Content Area -->
      <div slot="main-content" class="chat-main-area" [class.mobile-hidden]="!showMobileChat && isMobile">
        <!-- Settings Content -->
        <app-settings *ngIf="activeMenuTab === 'settings'"></app-settings>
        
        <!-- Welcome Screen -->
        <div *ngIf="!activeSession && activeMenuTab !== 'settings'" class="welcome-screen">
          <div class="welcome-content">
            <i class="fas fa-comments welcome-icon"></i>
            <h2>Telegram Help Desk</h2>
            <p>Select a chat from the sidebar to start helping customers</p>
            <div class="welcome-stats">
              <div class="stat-item">
                <span class="stat-number">{{ sessions.length }}</span>
                <span class="stat-label">Total Chats</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ getActiveChatsCount() }}</span>
                <span class="stat-label">Active Now</span>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeSession" class="chat-container">
          <!-- Chat Header -->
          <div class="chat-header">
            <button class="back-btn" *ngIf="isMobile" (click)="closeMobileChat()">
              <i class="fas fa-arrow-left"></i>
            </button>
            
            <div class="chat-header-info">
              <div class="chat-header-avatar">
                <div class="avatar-circle" [class.online]="activeSession.client.isOnline">
                  {{ activeSession.client.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="chat-header-details">
                <h3 class="chat-title">{{ activeSession.client.name }}</h3>
                <p class="chat-subtitle">
                  {{ '@' + (activeSession.client.username || 'N/A') }}
                  <span class="online-status" *ngIf="activeSession.client.isOnline"> • online</span>
                </p>
              </div>
            </div>

            <div class="chat-header-actions">
              <button class="btn-danger" (click)="confirmEndSession()" [disabled]="isEndingSession" title="End session">
                <i *ngIf="isEndingSession" class="fas fa-spinner fa-spin"></i>
                <span *ngIf="!isEndingSession">End Chat</span>
                <span *ngIf="isEndingSession">Ending...</span>
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="messages-area" #messagesContainer>
            <div class="messages-wrapper">
              <!-- Loading more messages indicator -->
              <div *ngIf="isLoadingMessages && activeSession" class="loading-more-indicator">
                <div class="spinner"></div>
                <span>Loading older messages...</span>
              </div>
              
              <div 
                *ngFor="let message of messages; trackBy: trackByMessageId" 
                class="message-wrapper"
                [class.outgoing]="message.senderType === 'CS'"
                [class.incoming]="message.senderType === 'CLIENT'"
              >
                <div class="message-bubble">
                  <div class="message-content">
                    <!-- Text messages -->
                    <p *ngIf="message.messageType === 'TEXT' || message.messageType === 'LINK'" class="message-text">{{ message.message }}</p>
                    
                    <!-- Image messages -->
                    <div *ngIf="message.messageType === 'IMAGE'" class="message-image">
                      <img [src]="message.fileUrl" [alt]="message.message" class="chat-image" />
                      <p *ngIf="message.message && message.message !== 'Image'" class="image-caption">{{ message.message }}</p>
                    </div>
                    
                    <!-- File/Document messages -->
                    <div *ngIf="message.messageType === 'FILE'" class="message-file">
                      <div class="file-info" (click)="openFile(message.fileUrl, message.message)">
                        <i class="fas fa-file-alt file-icon"></i>
                        <div class="file-details">
                          <span class="file-name">{{ message.message }}</span>
                          <span class="file-action">Click to {{ getFileAction(message.message) }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Video messages -->
                    <div *ngIf="message.messageType === 'VIDEO'" class="message-video">
                      <video [src]="message.fileUrl" controls class="chat-video"></video>
                      <p *ngIf="message.message && message.message !== 'Video'" class="video-caption">{{ message.message }}</p>
                    </div>
                    
                    <div class="message-meta">
                      <span class="message-time">{{ formatMessageTime(message.createdAt) }}</span>
                      <span *ngIf="message.senderType === 'CS'" class="message-status">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="message-input-area">
            <div class="input-container">
              <button 
                class="btn-icon attachment-btn" 
                (click)="triggerFileInput()" 
                [disabled]="isSendingMessage"
                title="Attach file"
              >
                <i *ngIf="!isSendingMessage" class="fas fa-paperclip"></i>
                <div *ngIf="isSendingMessage" class="sending-spinner"></div>
              </button>
              <input 
                type="file" 
                #fileInput 
                style="display: none" 
                (change)="onFileSelected($event)"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,video/mp4,video/mpeg,video/quicktime"
              >
              <div class="text-input-wrapper">
                <input 
                  type="text" 
                  class="message-input"
                  placeholder="Write a message..."
                  [(ngModel)]="newMessage"
                  (keyup.enter)="sendMessage()"
                  [disabled]="isSendingMessage"
                  #messageInput
                >
              </div>
              <button 
                class="send-btn"
                (click)="sendMessage()"
                [disabled]="!newMessage.trim() || isSendingMessage"
                title="Send message"
              >
                <i *ngIf="!isSendingMessage" class="fas fa-paper-plane"></i>
                <div *ngIf="isSendingMessage" class="sending-spinner"></div>
              </button>
            </div>
          </div>
        </div>
      </div>


    </app-sidebar-container>
  `,
  styles: [`
    /* Content Panels Container */
    [slot="content-panels"] {
      display: flex;
      flex-direction: row;
    }
    
    /* Main Content Area */
    .chat-main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #17212b;
      height: 100vh;
    }
    
    /* Settings Content */
    .settings-content {
      padding: 20px;
    }

    .settings-section {
      margin-bottom: 32px;
    }

    .settings-section h4 {
      color: #5288c1;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    .setting-item {
      padding: 16px 0;
      border-bottom: 1px solid #1a252f;
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .setting-info strong {
      color: #ffffff;
      font-size: 15px;
    }

    .setting-info span {
      color: #8696a8;
      font-size: 14px;
    }

    .setting-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      color: #ffffff;
    }

    .setting-toggle input {
      margin: 0;
    }

    /* Main Chat Area */
    .chat-main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #17212b;
    }

    .welcome-screen {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .welcome-content {
      text-align: center;
      max-width: 400px;
      padding: 40px;
    }

    .welcome-icon {
      font-size: 80px;
      margin-bottom: 24px;
      color: #5288c1;
    }

    .welcome-content h2 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 400;
      margin-bottom: 12px;
    }

    .welcome-content p {
      color: #8696a8;
      font-size: 16px;
      margin-bottom: 32px;
    }

    .welcome-stats {
      display: flex;
      gap: 32px;
      justify-content: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-number {
      color: #5288c1;
      font-size: 32px;
      font-weight: 600;
    }

    .stat-label {
      color: #8696a8;
      font-size: 14px;
      margin-top: 4px;
    }

    /* Chat Container */
    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0; /* Important for flexbox scrolling */
    }

    .chat-header {
      background: #232e3c;
      padding: 16px 20px;
      border-bottom: 1px solid #2b374a;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .back-btn {
      background: none;
      border: none;
      color: #8696a8;
      font-size: 20px;
      cursor: pointer;
      margin-right: 12px;
      padding: 8px;
      border-radius: 50%;
    }

    .back-btn:hover {
      background: #2b374a;
    }

    .chat-header-info {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .chat-header-avatar {
      margin-right: 12px;
    }

    .chat-header-details {
      flex: 1;
    }

    .chat-title {
      color: #ffffff;
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 2px 0;
    }

    .chat-subtitle {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
    }

    .online-status {
      color: #4caf50;
    }

    .chat-header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn-danger {
      background: #d32f2f;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-danger:hover {
      background: #b71c1c;
    }

    /* Messages Area */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      background: #0e1621;
      min-height: 0; /* Important for flexbox scrolling */
      max-height: calc(100vh - 180px); /* Constrain height to enable scrolling */
    }

    .messages-area::-webkit-scrollbar {
      width: 6px;
    }

    .messages-area::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-area::-webkit-scrollbar-thumb {
      background: #2b374a;
      border-radius: 3px;
    }

    .messages-wrapper {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message-wrapper {
      display: flex;
      max-width: 70%;
    }

    .message-wrapper.outgoing {
      align-self: flex-end;
    }

    .message-wrapper.incoming {
      align-self: flex-start;
    }

    .message-bubble {
      max-width: 100%;
    }

    .message-content {
      padding: 8px 12px;
      border-radius: 12px;
      position: relative;
    }

    .message-wrapper.incoming .message-content {
      background: #232e3c;
      border-bottom-left-radius: 4px;
    }

    .message-wrapper.outgoing .message-content {
      background: #5288c1;
      border-bottom-right-radius: 4px;
    }

    .message-text {
      color: #ffffff;
      font-size: 15px;
      line-height: 1.4;
      margin: 0 0 4px 0;
      word-wrap: break-word;
    }

    .message-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    .message-time {
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }

    .message-status {
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }

    /* File Message Styles */
    .message-image {
      margin-bottom: 8px;
    }

    .chat-image {
      max-width: 300px;
      max-height: 300px;
      width: 100%;
      height: auto;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.2s;
      object-fit: contain;
    }

    @media (max-width: 768px) {
      .chat-image {
        max-width: 250px;
        max-height: 250px;
      }
    }

    @media (max-width: 480px) {
      .chat-image {
        max-width: 200px;
        max-height: 200px;
      }
    }

    .chat-image:hover {
      opacity: 0.9;
    }

    .image-caption, .video-caption {
      color: #ffffff;
      font-size: 14px;
      line-height: 1.4;
      margin: 8px 0 0 0;
      word-wrap: break-word;
    }

    .message-file {
      margin-bottom: 8px;
    }

    .file-info {
      display: flex;
      align-items: center;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
      max-width: 250px;
    }

    .file-info:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .file-icon {
      font-size: 24px;
      margin-right: 12px;
      color: #5288c1;
    }

    .file-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .file-name {
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }

    .file-action {
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
    }

    .message-video {
      margin-bottom: 8px;
    }

    .chat-video {
      max-width: 300px;
      max-height: 300px;
      border-radius: 8px;
    }

    /* Message Input */
    .message-input-area {
      background: #232e3c;
      padding: 12px 20px;
      border-top: 1px solid #2b374a;
      flex-shrink: 0; /* Prevent input area from shrinking */
      position: sticky;
      bottom: 0;
      z-index: 10;
    }

    .input-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .attachment-btn,
    .emoji-btn {
      background: transparent;
      border: none;
      color: #8696a8;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .attachment-btn:hover,
    .emoji-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .text-input-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      background: #17212b;
      border-radius: 24px;
      padding: 0 16px;
    }

    .message-input {
      flex: 1;
      background: none;
      border: none;
      color: #ffffff;
      font-size: 15px;
      padding: 12px 8px;
    }

    .message-input::placeholder {
      color: #8696a8;
    }

    .message-input:focus {
      outline: none;
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #5288c1;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      background: #4a7bb0;
    }

    .send-btn:disabled {
      background: #2b374a;
      color: #8696a8;
      cursor: not-allowed;
    }

    .sending-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .welcome-stats {
        flex-direction: column;
        gap: 16px;
      }
    }

    @media (max-width: 480px) {
      .chat-list-panel {
        width: 100vw;
      }

      .welcome-content {
        padding: 20px;
      }

      .welcome-icon {
        font-size: 60px;
      }

      .welcome-content h2 {
        font-size: 24px;
      }
    }

    /* Dialog Styles */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }

    .dialog-container {
      background: #232e3c;
      border-radius: 12px;
      max-width: 480px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      border: 1px solid #2b374a;
    }

    .dialog-header {
      padding: 20px 24px;
      border-bottom: 1px solid #2b374a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dialog-header h3 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .dialog-close {
      background: none;
      border: none;
      color: #8696a8;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .dialog-close:hover {
      background: #2b374a;
      color: #ffffff;
    }

    .dialog-content {
      padding: 24px;
    }

    .dialog-content p {
      color: #ffffff;
      line-height: 1.5;
      margin: 0 0 16px 0;
    }

    .dialog-content p:last-child {
      margin-bottom: 0;
    }

    .dialog-warning {
      color: #ffa726 !important;
      font-size: 14px;
      background: rgba(255, 167, 38, 0.1);
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #ffa726;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #2b374a;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-secondary {
      background: #2b374a;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #354050;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-danger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .fa-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Sessions Scroll Container Styles */
    .sessions-scroll-container {
      overflow-y: auto;
      max-height: calc(100vh - 200px);
      padding-right: 4px;
      
      /* Smooth scrolling behavior */
      scroll-behavior: smooth;
      
      /* Custom scrollbar styling */
      scrollbar-width: thin;
      scrollbar-color: #5288c1 #17212b;
    }

    /* Webkit scrollbar styling for sessions container */
    .sessions-scroll-container::-webkit-scrollbar {
      width: 8px;
    }

    .sessions-scroll-container::-webkit-scrollbar-track {
      background: #17212b;
      border-radius: 4px;
    }

    .sessions-scroll-container::-webkit-scrollbar-thumb {
      background: #5288c1;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .sessions-scroll-container::-webkit-scrollbar-thumb:hover {
      background: #4a7bb0;
    }

    .sessions-scroll-container::-webkit-scrollbar-thumb:active {
      background: #3e6a96;
    }

    /* Loading and status indicators for sessions */
    .loading-more-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      color: #8696a8;
      font-size: 14px;
      background: #1a2332;
      border-radius: 8px;
      margin: 8px 0;
    }

    .loading-more-indicator i {
      color: #5288c1;
      font-size: 16px;
    }

    .end-of-list-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 12px;
      color: #6c7b8a;
      font-size: 13px;
      font-style: italic;
      border-top: 1px solid #1a252f;
      margin-top: 8px;
    }

    .end-of-list-indicator i {
      color: #4caf50;
      font-size: 14px;
    }

    /* Spinner for loading states */
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(82, 136, 193, 0.3);
      border-top: 2px solid #5288c1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('sessionsContainer') sessionsContainer!: ElementRef<HTMLDivElement>;
  
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  sessions: SessionInfo[] = [];
  filteredSessions: SessionInfo[] = [];
  activeSession: SessionInfo | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  searchTerm = '';
  
  // Pagination state
  hasMoreMessages = false;
  isLoadingMessages = false;
  messagesTotal = 0;
  
  // UI State
  activeMenuTab: 'chats' | 'settings' = 'chats';
  isMobile = false;
  showMobileMenu = false;
  showMobileChat = false;
  isLoadingChats = false;
  isSendingMessage = false;
  sidebarCollapsed = false;
  showEndSessionDialog = false;
  isEndingSession = false;
  
  // Navigation and panel configurations
  navigationItems: NavigationItem[] = [
    { id: 'chats', icon: 'fa-comments', label: 'Chats', isActive: true },
    { id: 'history', icon: 'fa-history', label: 'History' },
    { id: 'clients', icon: 'fa-users', label: 'Clients' },
    { id: 'broadcast', icon: 'fa-bullhorn', label: 'Broadcast' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings', isVisible: false }
  ];
  
  chatListConfig: ListPanelConfig = {
    title: 'Chats',
    showSearch: true,
    searchPlaceholder: 'Search chats...',
    emptyStateIcon: 'fa-comments',
    emptyStateTitle: 'No chats found',
    emptyStateMessage: 'Wait for customers to start conversations'
  };
  
  settingsConfig: ListPanelConfig = {
    title: 'Settings'
  };
  
  // Settings
  notificationSettings = {
    sound: true,
    desktop: true
  };


  constructor(
    private authService: AuthService,
    public chatService: ChatService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    
    // Restore sidebar state from localStorage BEFORE setting up resize listener
    if (!this.isMobile) {
      const savedSidebarState = localStorage.getItem('sidebarCollapsed');
      if (savedSidebarState !== null) {
        this.sidebarCollapsed = JSON.parse(savedSidebarState);
      } else {
        this.sidebarCollapsed = false; // Default state
      }
    }
    
    window.addEventListener('resize', () => this.checkMobile());

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.updateNavigationItems();
      });

    this.socketService.connect();
    this.loadSessions();
    this.setupSocketListeners();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
    
    // Clean up scroll listeners
    if (this.messagesContainer?.nativeElement && this.scrollHandler) {
      const element = this.messagesContainer.nativeElement;
      element.removeEventListener('scroll', this.scrollHandler);
    }
    
    if (this.sessionsContainer?.nativeElement && this.sessionsScrollHandler) {
      const element = this.sessionsContainer.nativeElement;
      element.removeEventListener('scroll', this.sessionsScrollHandler);
    }
  }

  private loadSessions(): void {
    this.isLoadingChats = true;
    
    // Reset sessions and load initial page
    this.chatService.resetSessions();
    
    this.chatService.loadInitialSessions(15).subscribe({
      next: (response) => {
        console.log('Initial sessions loaded:', response.data.length, 'of', response.pagination.total);
        this.sessions = response.data;
        this.filteredSessions = this.sessions;
        this.chatService.updateSessionsFromResponse(response, false); // false = not appending
        this.isLoadingChats = false;
        this.filterChats();
        
        // If active session is no longer in the list, clear it
        if (this.activeSession && !this.sessions.find(s => s.id === this.activeSession!.id)) {
          console.log('Active session no longer exists, clearing it');
          this.activeSession = null;
          this.messages = [];
          
          if (this.isMobile) {
            this.showMobileChat = false;
          }
        }
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.isLoadingChats = false;
        this.chatService.setLoadingSessions(false);
        
        // Don't clear sessions on error to prevent UI from disappearing
        // Show an error message instead
        if (error.status === 401) {
          console.log('Authentication error, redirecting to login');
          this.logout();
        }
      }
    });
  }

  private loadMoreSessions(): void {
    if (this.chatService.isLoadingSessions() || !this.chatService.hasMoreSessions()) {
      return;
    }

    console.log('Loading more sessions...');
    
    this.chatService.loadMoreSessions().subscribe({
      next: (response) => {
        if (response) {
          console.log('More sessions loaded:', response.data.length, 'more sessions');
          // Update the local sessions array
          this.sessions = [...this.sessions, ...response.data];
          this.filteredSessions = this.sessions;
          this.chatService.updateSessionsFromResponse(response, true); // true = appending
          this.filterChats();
        }
      },
      error: (error) => {
        console.error('Error loading more sessions:', error);
        this.chatService.setLoadingSessions(false);
      }
    });
  }

  private setupSocketListeners(): void {
    this.socketService.onNewMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (this.activeSession && message.sessionId === this.activeSession.id) {
          // Only add CS messages here (sent from dashboard)
          if (message.senderType === 'CS') {
            this.messages.push(message);
            this.scrollToBottom();
          }
        }
        // Update only the specific session instead of loading all sessions
        this.updateSessionWithNewMessage(message);
      });

    this.socketService.onSessionEnded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('Session ended event received:', data);
        
        // Remove the session from sessions array
        const sessionIndex = this.sessions.findIndex(s => s.id === data.sessionId);
        if (sessionIndex !== -1) {
          const sessionName = this.sessions[sessionIndex].client.name;
          this.sessions.splice(sessionIndex, 1);
          console.log(`Session with ${sessionName} removed from list`);
        }
        
        // Clear active session if it was the ended one
        if (this.activeSession && data.sessionId === this.activeSession.id) {
          this.activeSession = null;
          this.messages = [];
          console.log('Active session cleared');
          
          // Close mobile chat view if on mobile
          if (this.isMobile) {
            this.showMobileChat = false;
          }
        }
        
        // Update filtered sessions
        this.filterChats();
      });

    this.socketService.onNewSessionAssigned()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('New session assigned:', data);
        // Refresh sessions list to show the new session
        this.loadSessions();
        // Optional: Show notification to user
        console.log(`New chat session assigned: ${data.client.name}`);
      });

    this.socketService.onNewSessionMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('New session message received:', data);
        
        // If the message is for the currently active session, add it to the messages
        if (this.activeSession && data.sessionId === this.activeSession.id) {
          // Check if message already exists to prevent duplicates
          const existingMessage = this.messages.find(m => 
            m.message === data.message && 
            m.createdAt.toString() === data.timestamp.toString() &&
            m.senderType === 'CLIENT'
          );
          
          if (!existingMessage) {
            const newMessage = {
              id: `temp-${Date.now()}`, // Temporary ID until we get the real one from the database
              sessionId: data.sessionId,
              senderType: 'CLIENT' as const,
              messageType: data.messageType as any,
              message: data.message,
              fileUrl: data.fileUrl,
              isRead: false,
              createdAt: data.timestamp
            };
            this.messages.push(newMessage);
            this.scrollToBottom();
          }
        }
        
        // Update session data without full reload
        this.updateSessionWithIncomingMessage(data);
        
        // Show notification if the message is for a different session
        if (!this.activeSession || data.sessionId !== this.activeSession.id) {
          console.log(`New message from ${data.clientName}: ${data.message}`);
          // You can add toast notification here if needed
        }
      });
  }

  selectSession(session: SessionInfo): void {
    this.activeSession = session;
    
    // Reset pagination state for new session
    this.messages = [];
    this.hasMoreMessages = true; // Assume there might be more until we know otherwise
    this.isLoadingMessages = false;
    this.messagesTotal = 0;
    
    this.loadMessages(session.id);
    
    if (session.unreadCount > 0) {
      this.chatService.markAsRead(session.id).subscribe();
    }

    this.socketService.joinSession(session.id);

    if (this.isMobile) {
      this.showMobileChat = true;
    }
  }

  private loadMessages(sessionId: string, loadMore: boolean = false): void {
    this.isLoadingMessages = true;
    
    // For loading more (older messages), use lastMessageId
    const lastMessageId = loadMore && this.messages.length > 0 ? this.messages[0].id : undefined;
    
    console.log('Loading messages:', {
      sessionId,
      loadMore,
      lastMessageId,
      currentMessagesCount: this.messages.length
    });
    
    this.chatService.getSessionMessages(sessionId, 50, 0, lastMessageId).subscribe({
      next: (response) => {
        console.log('Messages loaded:', {
          loadMore,
          newMessagesCount: response.messages.length,
          hasMore: response.hasMore,
          total: response.total
        });
        
        if (loadMore) {
          // Prepend older messages to the beginning of the array
          this.messages = [...response.messages, ...this.messages];
        } else {
          // Replace all messages (initial load)
          this.messages = response.messages;
        }
        
        this.hasMoreMessages = response.hasMore;
        this.messagesTotal = response.total;
        this.chatService.updateMessages(this.messages);
        
        if (!loadMore) {
          this.scrollToBottom();
          // Setup scroll listener after initial messages are loaded and rendered
          setTimeout(() => {
            this.setupMessagesScrollListener();
          }, 100);
        }
        
        this.isLoadingMessages = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoadingMessages = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeSession) return;

    this.isSendingMessage = true;
    const request = {
      sessionId: this.activeSession.id,
      message: this.newMessage.trim(),
      messageType: 'TEXT' as const
    };

    this.chatService.sendMessage(request).subscribe({
      next: (response) => {
        // Don't manually add the message here - let Socket.IO handle it
        // The message will be received via onNewMessage subscription
        this.newMessage = '';
        this.isSendingMessage = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isSendingMessage = false;
      }
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file || !this.activeSession) return;
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'video/mp4', 'video/mpeg', 'video/quicktime'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please upload images, PDFs, documents, or videos.');
      target.value = '';
      return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size is too large. Maximum size is 10MB.');
      target.value = '';
      return;
    }
    
    this.uploadFile(file);
    
    // Reset the input
    target.value = '';
  }

  uploadFile(file: File): void {
    if (!this.activeSession) return;
    
    this.isSendingMessage = true;
    
    this.chatService.uploadFile(this.activeSession.id, file).subscribe({
      next: (response) => {
        // Don't manually add the message here - let Socket.IO handle it
        // The message will be received via onNewMessage subscription
        this.isSendingMessage = false;
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        
        let errorMessage = 'Failed to upload file.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        alert(errorMessage);
        this.isSendingMessage = false;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.messagesContainer) {
          const element = this.messagesContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  confirmEndSession(): void {
    if (!this.activeSession) {
      return;
    }
    this.showEndSessionDialog = true;
    
    // Add ESC key listener
    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.showEndSessionDialog && !this.isEndingSession) {
        this.cancelEndSession();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    document.addEventListener('keydown', escapeHandler);
  }

  cancelEndSession(): void {
    this.showEndSessionDialog = false;
    this.isEndingSession = false;
  }

  endSession(): void {
    if (!this.activeSession || this.isEndingSession) {
      return;
    }

    this.isEndingSession = true;

    this.chatService.endSession(this.activeSession.id).subscribe({
      next: (response) => {
        console.log('Session ended successfully:', response.message);
        
        // Close dialog and reset states
        this.showEndSessionDialog = false;
        this.isEndingSession = false;
        
        // Clear active session and messages
        const sessionName = this.activeSession?.client?.name || 'Unknown';
        this.activeSession = null;
        this.messages = [];
        
        // Reload sessions to get updated list
        this.loadSessions();
        
        // Show success notification (you can implement a toast notification system)
        console.log(`Chat session with ${sessionName} has been ended successfully.`);
        
        // Close mobile chat view if on mobile
        if (this.isMobile) {
          this.showMobileChat = false;
        }
      },
      error: (error) => {
        console.error('Error ending session:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.error || error.message,
          activeSessionId: this.activeSession?.id
        });
        this.isEndingSession = false;
        
        let errorMessage = 'Failed to end session. Please try again.';
        if (error.status === 401) {
          errorMessage = 'Authentication error. Please login again.';
          this.logout();
        } else if (error.status === 404) {
          errorMessage = 'Session not found or already ended.';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        alert(errorMessage);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  navigateToHistory(): void {
    this.router.navigate(['/history']);
  }

  navigateToClients(): void {
    this.router.navigate(['/clients']);
  }

  navigateToBroadcast(): void {
    this.router.navigate(['/broadcast']);
  }

  // UI Methods
  checkMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    // If switching from mobile to desktop, hide mobile menu and restore sidebar state
    if (wasMobile && !this.isMobile) {
      this.showMobileMenu = false;
      // Restore sidebar state from localStorage when switching to desktop
      const savedSidebarState = localStorage.getItem('sidebarCollapsed');
      if (savedSidebarState !== null) {
        this.sidebarCollapsed = JSON.parse(savedSidebarState);
      }
    }
    
    // If switching from desktop to mobile, reset sidebar collapsed state
    if (!wasMobile && this.isMobile) {
      this.sidebarCollapsed = false;
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.showMobileMenu = !this.showMobileMenu;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      // Save sidebar state to localStorage
      localStorage.setItem('sidebarCollapsed', JSON.stringify(this.sidebarCollapsed));
    }
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  private updateNavigationItems(): void {
    // Update navigation items based on user role
    this.navigationItems = [
      { id: 'chats', icon: 'fa-comments', label: 'Chats', isActive: this.activeMenuTab === 'chats' },
      { id: 'history', icon: 'fa-history', label: 'History' },
      { id: 'clients', icon: 'fa-users', label: 'Clients' },
      { id: 'broadcast', icon: 'fa-bullhorn', label: 'Broadcast' },
      { id: 'settings', icon: 'fa-cog', label: 'Settings', isVisible: this.currentUser?.role === 'ADMIN', isActive: this.activeMenuTab === 'settings' }
    ];
  }
  
  onNavigationItemClick(item: NavigationItem): void {
    if (item.id === 'chats' || item.id === 'settings') {
      this.setActiveMenuTab(item.id as 'chats' | 'settings');
    } else if (item.id === 'history') {
      this.navigateToHistory();
    } else if (item.id === 'clients') {
      this.navigateToClients();
    } else if (item.id === 'broadcast') {
      this.navigateToBroadcast();
    }
  }
  
  setActiveMenuTab(tab: 'chats' | 'settings'): void {
    // Only allow access to settings for admin users
    if (tab === 'settings' && this.currentUser?.role !== 'ADMIN') {
      return;
    }
    
    this.activeMenuTab = tab;
    this.updateNavigationItems();
    if (this.isMobile) {
      this.showMobileMenu = false;
    }
  }
  
  getListItemData(session: SessionInfo): ListItemData {
    return {
      id: session.id,
      title: session.client.name,
      subtitle: session.lastMessage?.senderType === 'CS' ? 'You: ' + (session.lastMessage?.message || 'No messages yet') : (session.lastMessage?.message || 'No messages yet'),
      time: this.formatChatTime(session.lastMessage?.createdAt),
      avatarName: session.client.name,
      isOnline: session.client.isOnline,
      isActive: this.activeSession?.id === session.id,
      badges: [
        ...(session.unreadCount > 0 ? [{ text: session.unreadCount.toString(), type: 'count' as const, variant: 'unread' }] : []),
        ...(session.status === 'ACTIVE' ? [{ text: 'Active', type: 'status' as const, variant: 'active' }] : [])
      ]
    };
  }


  filterChats(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSessions = this.sessions;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredSessions = this.sessions.filter(session =>
        session.client.name.toLowerCase().includes(term) ||
        session.client.username?.toLowerCase().includes(term) ||
        session.lastMessage?.message.toLowerCase().includes(term)
      );
    }
  }

  getActiveChatsCount(): number {
    return this.sessions.filter(session => session.status === 'ACTIVE').length;
  }

  closeMobileChat(): void {
    this.showMobileChat = false;
  }

  trackBySessionId(index: number, session: any): string {
    return session.id;
  }

  trackByMessageId(index: number, message: any): string {
    return message.id;
  }

  formatChatTime(date?: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  formatMessageTime(date?: Date): string {
    if (!date) return '';
    
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getFileAction(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (!extension) return 'download';
    
    if (['pdf'].includes(extension)) {
      return 'open';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'view';
    } else {
      return 'download';
    }
  }

  openFile(fileUrl?: string, fileName?: string): void {
    if (!fileUrl) return;
    
    const extension = fileName?.toLowerCase().split('.').pop();
    
    if (extension === 'pdf') {
      // Open PDF in new tab
      window.open(fileUrl, '_blank');
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      // Open image in new tab
      window.open(fileUrl, '_blank');
    } else {
      // Download file
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private setupScrollListener(): void {
    // Will be set up after view init
  }

  private setupSessionsScrollListener(): void {
    if (!this.sessionsContainer?.nativeElement) {
      console.warn('Sessions container not available for scroll listener setup');
      return;
    }
    
    const element = this.sessionsContainer.nativeElement;
    let scrollTimeout: number;
    
    // Remove existing listener if any
    element.removeEventListener('scroll', this.sessionsScrollHandler);
    
    console.log('Setting up sessions scroll listener with initial state:', {
      hasMoreSessions: this.chatService.hasMoreSessions(),
      sessionsCount: this.sessions.length,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      canScroll: element.scrollHeight > element.clientHeight
    });
    
    // Create the scroll handler for sessions
    this.sessionsScrollHandler = () => {
      // Debounce scroll events for performance
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold from bottom
        
        // Debug scroll position
        console.log('Sessions scroll event:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          isNearBottom,
          hasMoreSessions: this.chatService.hasMoreSessions(),
          isLoading: this.chatService.isLoadingSessions(),
          sessionsCount: this.sessions.length,
          canScroll: scrollHeight > clientHeight
        });
        
        // Check if user scrolled to bottom and all conditions are met
        if (isNearBottom && 
            this.chatService.hasMoreSessions() && 
            !this.chatService.isLoadingSessions() &&
            scrollHeight > clientHeight) { // Ensure container is actually scrollable
          console.log('Triggering loadMoreSessions...');
          this.loadMoreSessions();
        }
      }, 150); // Debounce time for better responsiveness
    };
    
    element.addEventListener('scroll', this.sessionsScrollHandler);
    
    // Also trigger an initial check in case the container is not scrollable yet
    setTimeout(() => {
      if (element.scrollHeight <= element.clientHeight && 
          this.chatService.hasMoreSessions() && 
          !this.chatService.isLoadingSessions()) {
        console.log('Sessions container not scrollable, loading more sessions automatically');
        this.loadMoreSessions();
      }
    }, 200);
  }

  ngAfterViewInit(): void {
    // Add a small delay to ensure the view is fully initialized
    setTimeout(() => {
      this.setupMessagesScrollListener();
      this.setupSessionsScrollListener();
    }, 100);
  }

  private setupMessagesScrollListener(): void {
    if (!this.messagesContainer?.nativeElement) {
      console.warn('Messages container not available for scroll listener setup');
      return;
    }
    
    const element = this.messagesContainer.nativeElement;
    let scrollTimeout: number;
    
    // Remove existing listener if any
    element.removeEventListener('scroll', this.scrollHandler);
    
    console.log('Setting up scroll listener with initial state:', {
      hasMoreMessages: this.hasMoreMessages,
      messagesCount: this.messages.length,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      canScroll: element.scrollHeight > element.clientHeight
    });
    
    // Create the scroll handler as a class method to properly remove it later
    this.scrollHandler = () => {
      // Debounce scroll events for performance
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const isNearTop = scrollTop < 100; // Increased threshold for better UX
        
        // Debug scroll position
        console.log('Scroll event:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          isNearTop,
          hasMoreMessages: this.hasMoreMessages,
          isLoading: this.isLoadingMessages,
          activeSession: !!this.activeSession,
          messagesCount: this.messages.length,
          canScroll: scrollHeight > clientHeight
        });
        
        // Check if user scrolled to top and all conditions are met
        if (isNearTop && 
            this.hasMoreMessages && 
            !this.isLoadingMessages && 
            this.activeSession &&
            scrollHeight > clientHeight) { // Ensure container is actually scrollable
          console.log('Triggering loadMoreMessages...');
          this.loadMoreMessages();
        }
      }, 150); // Reduced debounce time for better responsiveness
    };
    
    element.addEventListener('scroll', this.scrollHandler);
    
    // Also trigger an initial check in case the container is not scrollable yet
    setTimeout(() => {
      if (element.scrollHeight <= element.clientHeight && this.hasMoreMessages && !this.isLoadingMessages) {
        console.log('Container not scrollable, loading more messages automatically');
        this.loadMoreMessages();
      }
    }, 200);
  }

  private scrollHandler = () => {}; // Will be overridden in setupMessagesScrollListener
  private sessionsScrollHandler = () => {}; // Will be overridden in setupSessionsScrollListener

  private loadMoreMessages(): void {
    if (!this.activeSession || this.isLoadingMessages || !this.hasMoreMessages) {
      console.log('LoadMoreMessages cancelled:', {
        hasActiveSession: !!this.activeSession,
        isLoading: this.isLoadingMessages,
        hasMore: this.hasMoreMessages
      });
      return;
    }
    
    // Store current scroll position to maintain it after loading
    const element = this.messagesContainer.nativeElement;
    const previousScrollHeight = element.scrollHeight;
    const previousScrollTop = element.scrollTop;
    
    console.log('Before loading more messages:', {
      previousScrollHeight,
      previousScrollTop,
      currentMessagesCount: this.messages.length,
      sessionId: this.activeSession.id
    });
    
    this.loadMessages(this.activeSession.id, true);
    
    // After loading, maintain scroll position relative to the new content
    setTimeout(() => {
      const newScrollHeight = element.scrollHeight;
      const heightDifference = newScrollHeight - previousScrollHeight;
      
      // Adjust scroll position to maintain user's view
      if (heightDifference > 0) {
        element.scrollTop = previousScrollTop + heightDifference;
      }
      
      console.log('After loading more messages:', {
        newScrollHeight,
        heightDifference,
        newScrollTop: element.scrollTop,
        newMessagesCount: this.messages.length
      });
      
      // Re-setup scroll listener if needed to ensure it's still working
      if (element.scrollHeight > element.clientHeight) {
        this.setupMessagesScrollListener();
      }
    }, 200);
  }

  private updateSessionWithNewMessage(message: any): void {
    const sessionIndex = this.sessions.findIndex(s => s.id === message.sessionId);
    if (sessionIndex !== -1) {
      this.sessions[sessionIndex].lastMessage = {
        id: message.id,
        sessionId: message.sessionId,
        senderType: message.senderType,
        messageType: message.messageType,
        message: message.message,
        fileUrl: message.fileUrl,
        isRead: message.isRead,
        createdAt: message.createdAt
      };
      
      // Update filtered sessions
      this.filterChats();
    }
  }

  private updateSessionWithIncomingMessage(data: any): void {
    const sessionIndex = this.sessions.findIndex(s => s.id === data.sessionId);
    if (sessionIndex !== -1) {
      // Update unread count if the message is not for the active session
      if (!this.activeSession || data.sessionId !== this.activeSession.id) {
        this.sessions[sessionIndex].unreadCount = (this.sessions[sessionIndex].unreadCount || 0) + 1;
      }
      
      // Update last message
      this.sessions[sessionIndex].lastMessage = {
        id: `temp-${Date.now()}`,
        sessionId: data.sessionId,
        senderType: 'CLIENT',
        messageType: data.messageType,
        message: data.message,
        fileUrl: data.fileUrl,
        isRead: false,
        createdAt: data.timestamp
      };
      
      // Update filtered sessions
      this.filterChats();
    }
  }

}