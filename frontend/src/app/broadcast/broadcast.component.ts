import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BroadcastService, BroadcastRequest, BroadcastHistoryItem, BroadcastDetails, BroadcastRecipient } from '../shared/services/broadcast.service';
import { AuthService } from '../shared/services/auth.service';
import { User } from '../shared/models';
import { SidebarContainerComponent } from '../shared/components/sidebar-container/sidebar-container.component';
import { SidebarNavigationComponent } from '../shared/components/sidebar-navigation/sidebar-navigation.component';
import { ListPanelComponent } from '../shared/components/list-panel/list-panel.component';
import { ListItemComponent } from '../shared/components/list-item/list-item.component';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../shared/components/search-input/search-input.component';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { NavigationItem } from '../shared/components/sidebar-navigation/sidebar-navigation.component';
import { ListPanelConfig } from '../shared/components/list-panel/list-panel.component';
import { ListItemData } from '../shared/components/list-item/list-item.component';

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    SidebarContainerComponent,
    SidebarNavigationComponent,
    ListPanelComponent,
    ListItemComponent,
    SearchInputComponent,
    PaginationComponent,
    ToastComponent
  ],
  template: `
    <app-sidebar-container
      [collapsed]="sidebarCollapsed"
      [isMobile]="isMobile"
      [showMobileMenu]="showMobileMenu"
      [showMobileContent]="showMobileContent"
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
        <!-- Broadcast List Panel -->
        <app-list-panel
          [config]="broadcastListConfig"
          [loading]="loading"
          [showEmptyState]="!loading && broadcasts.length === 0 && !showNewBroadcastForm"
          [titleIcon]="'fa-bullhorn'"
          [isMobile]="isMobile"
          [mobileHidden]="showMobileContent && isMobile"
          [hasFooterContent]="true">
          
          <!-- Header Actions -->
          <div slot="search">
            <button 
              class="btn-new-broadcast"
              (click)="openNewBroadcastForm()"
              [disabled]="isSendingBroadcast"
              type="button"
            >
              <i class="fas fa-plus"></i>
              New Broadcast
            </button>
          </div>
          
          <!-- List Items -->
          <div slot="list-items" class="broadcasts-scroll-container" #broadcastsContainer>
            <app-list-item
              *ngFor="let broadcast of broadcasts; trackBy: trackByBroadcastId"
              [data]="getListItemData(broadcast)"
              (itemClick)="selectBroadcast(broadcast)">
            </app-list-item>
            
            <!-- Loading indicator for infinite scroll -->
            <div *ngIf="broadcastService.isLoadingBroadcasts() && broadcasts.length > 0" class="loading-more-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading more broadcasts...</span>
            </div>
            
            <!-- End of list indicator -->
            <div *ngIf="!broadcastService.hasMoreBroadcasts() && broadcasts.length > 0" class="end-of-list-indicator">
              <i class="fas fa-check-circle"></i>
              <span>All broadcasts loaded</span>
            </div>
          </div>
          
          <!-- Pagination Info Footer (showing current count) -->
          <div slot="footer" *ngIf="pagination">
            <div class="pagination-info">
              <span class="pagination-count">
                <i class="fas fa-bullhorn"></i>
                Showing {{ broadcasts.length }} of {{ pagination.totalCount }} broadcasts
              </span>
              <span *ngIf="broadcastService.hasMoreBroadcasts()" class="pagination-more">
                <i class="fas fa-chevron-down"></i>
                Scroll for more
              </span>
            </div>
          </div>
        </app-list-panel>
      </div>

      <!-- Broadcast Details Panel (Right Side) -->
      <div slot="main-content" class="broadcast-details-panel">
        <!-- Create New Broadcast -->
        <div *ngIf="showNewBroadcastForm" class="broadcast-composer">
          <div class="composer-header">
            <div class="composer-title">
              <i class="fas fa-bullhorn"></i>
              <h2>Create Broadcast Message</h2>
            </div>
            <button class="btn-close" (click)="cancelNewBroadcast()" [disabled]="isSendingBroadcast">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="composer-content">
            <!-- Recipients Info -->
            <div class="recipients-section">
              <div class="recipients-header">
                <i class="fas fa-users"></i>
                <span class="recipients-label">Recipients</span>
              </div>
              <div class="recipients-info">
                <span class="recipients-count">All registered clients</span>
                <span class="recipients-note">Message will be sent to all active Telegram users</span>
              </div>
            </div>

            <!-- Message Type Selection -->
            <div class="message-type-section">
              <label class="section-label">
                <i class="fas fa-tag"></i>
                Message Type
              </label>
              <div class="message-type-options">
                <div 
                  *ngFor="let type of messageTypes" 
                  class="type-option"
                  [class.selected]="newBroadcastType === type.value"
                  (click)="newBroadcastType = type.value">
                  <div class="type-icon">{{ type.emoji }}</div>
                  <div class="type-info">
                    <div class="type-name">{{ type.name }}</div>
                    <div class="type-description">{{ type.description }}</div>
                  </div>
                  <div class="type-radio">
                    <i class="fas" [class.fa-dot-circle]="newBroadcastType === type.value" [class.fa-circle]="newBroadcastType !== type.value"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message Composer -->
            <div class="message-composer-section">
              <label class="section-label">
                <i class="fas fa-edit"></i>
                Message Content
              </label>
              <div class="composer-editor">
                <textarea 
                  class="message-textarea"
                  [(ngModel)]="newBroadcastMessage"
                  placeholder="Write your broadcast message here..."
                  [disabled]="isSendingBroadcast"
                  maxlength="1000">
                </textarea>
                <div class="composer-toolbar">
                  <div class="char-counter" 
                       [class.warning]="newBroadcastMessage.length > 800"
                       [class.error]="newBroadcastMessage.length > 950">
                    <i class="fas fa-font"></i>
                    {{ newBroadcastMessage.length }} / 1000 characters
                  </div>
                  <div class="formatting-tips">
                    <small><i class="fas fa-lightbulb"></i> Tip: Keep it concise and engaging</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- File Attachment Section -->
            <div class="attachment-section" *ngIf="['IMAGE', 'FILE', 'VIDEO'].includes(newBroadcastType)">
              <label class="section-label">
                <i class="fas fa-paperclip"></i>
                File Attachment
                <span class="optional-label" *ngIf="newBroadcastMessage.trim().length > 0">(Optional)</span>
              </label>
              
              <!-- File Upload Area -->
              <div class="file-upload-area" *ngIf="!selectedFile">
                <input type="file" 
                       #fileInput 
                       (change)="onFileSelected($event)"
                       [accept]="getAcceptedFileTypes()"
                       style="display: none;">
                <div class="upload-dropzone" (click)="fileInput.click()">
                  <div class="upload-icon">
                    <i class="fas" [class]="getUploadIcon()"></i>
                  </div>
                  <div class="upload-text">
                    <div class="upload-title">Click to select {{ newBroadcastType.toLowerCase() }}</div>
                    <div class="upload-subtitle">Maximum size: 10MB</div>
                  </div>
                </div>
              </div>
              
              <!-- File Preview -->
              <div class="file-preview" *ngIf="selectedFile">
                <!-- Image Preview -->
                <div class="image-preview" *ngIf="filePreviewUrl">
                  <img [src]="filePreviewUrl" alt="Preview" class="preview-image">
                </div>
                
                <!-- File Info -->
                <div class="file-info">
                  <div class="file-details">
                    <div class="file-icon">
                      <i class="fas" [class]="getFileIcon(selectedFile)"></i>
                    </div>
                    <div class="file-meta">
                      <div class="file-name">{{ selectedFile.name }}</div>
                      <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
                    </div>
                  </div>
                  <button class="btn-remove-file" 
                          (click)="removeFile()"
                          [disabled]="isSendingBroadcast"
                          type="button">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Preview Section -->
            <div class="message-preview-section" *ngIf="newBroadcastMessage.trim().length > 0 || selectedFile">
              <label class="section-label">
                <i class="fas fa-eye"></i>
                Message Preview
              </label>
              <div class="message-preview">
                <div class="preview-header">
                  <div class="preview-avatar">
                    <i class="fas fa-robot"></i>
                  </div>
                  <div class="preview-sender">
                    <div class="sender-name">Help Desk Bot</div>
                    <div class="sender-type">{{ getMessageTypeDisplay() }}</div>
                  </div>
                </div>
                <div class="preview-content" *ngIf="newBroadcastMessage.trim().length > 0">
                  {{ newBroadcastMessage }}
                </div>
                <div class="preview-attachment" *ngIf="selectedFile">
                  <div class="attachment-info">
                    <i class="fas" [class]="getFileIcon(selectedFile)"></i>
                    <span>{{ selectedFile.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="composer-actions">
              <button 
                class="btn-cancel" 
                (click)="cancelNewBroadcast()"
                [disabled]="isSendingBroadcast">
                <i class="fas fa-times"></i>
                Cancel
              </button>
              <button 
                class="btn-send" 
                (click)="sendBroadcast()"
                [disabled]="!isValidBroadcast() || isSendingBroadcast">
                <i *ngIf="!isSendingBroadcast" class="fas fa-paper-plane"></i>
                <i *ngIf="isSendingBroadcast" class="fas fa-spinner fa-spin"></i>
                {{ getBroadcastButtonText() }}
              </button>
            </div>
          </div>
        </div>

        <!-- Welcome Screen -->
        <div *ngIf="!selectedBroadcast && !showNewBroadcastForm" class="welcome-screen">
          <div class="welcome-content">
            <i class="fas fa-bullhorn welcome-icon"></i>
            <h2>Broadcast Management</h2>
            <p>Send messages to all registered clients or view broadcast history</p>
            
            <div class="welcome-stats" *ngIf="pagination">
              <div class="stat-item">
                <div class="stat-number">{{ pagination.totalCount || 0 }}</div>
                <div class="stat-label">Total Broadcasts</div>
              </div>
            </div>

            <div class="welcome-actions">
              <button class="btn-primary-large" (click)="openNewBroadcastForm()">
                <i class="fas fa-plus"></i>
                Create New Broadcast
              </button>
            </div>
          </div>
        </div>

        <!-- Broadcast Details View -->
        <div *ngIf="selectedBroadcast && !showNewBroadcastForm" class="broadcast-details-container">
          <div class="broadcast-details-header">
            <div class="broadcast-details-info">
              <h3 class="broadcast-title">Broadcast Details</h3>
              <p class="broadcast-subtitle">
                Sent by {{ selectedBroadcast.sender.name }} • {{ formatDateTime(selectedBroadcast.createdAt) }}
              </p>
            </div>
          </div>

          <div class="broadcast-message-section">
            <h4>Message Content</h4>
            
            <!-- Text Message -->
            <div class="message-content" *ngIf="selectedBroadcast.message && selectedBroadcast.message.trim()">
              <p>{{ selectedBroadcast.message }}</p>
            </div>
            
            <!-- File Attachment -->
            <div class="attachment-display" *ngIf="selectedBroadcast.fileUrl">
              <div class="attachment-header">
                <i class="fas fa-paperclip"></i>
                <span>Attachment</span>
              </div>
              
              <!-- Image Display -->
              <div class="attachment-image" *ngIf="selectedBroadcast.messageType === 'IMAGE'">
                <img [src]="selectedBroadcast.fileUrl" 
                     [alt]="selectedBroadcast.message || 'Broadcast image'" 
                     class="broadcast-image"
                     (error)="onImageError($event)">
              </div>
              
              <!-- File Display -->
              <div class="attachment-file" *ngIf="selectedBroadcast.messageType === 'FILE' || selectedBroadcast.messageType === 'VIDEO'">
                <div class="file-display">
                  <div class="file-icon">
                    <i class="fas" [class]="getFileTypeIcon(selectedBroadcast.fileUrl!)"></i>
                  </div>
                  <div class="file-info">
                    <div class="file-name">{{ getFileName(selectedBroadcast.fileUrl!) }}</div>
                    <div class="file-type">{{ selectedBroadcast.messageType }}</div>
                  </div>
                  <a [href]="selectedBroadcast.fileUrl" target="_blank" class="btn-download">
                    <i class="fas fa-download"></i>
                    Download
                  </a>
                </div>
              </div>
              
              <!-- Video Display -->
              <div class="attachment-video" *ngIf="selectedBroadcast.messageType === 'VIDEO'">
                <video controls class="broadcast-video">
                  <source [src]="selectedBroadcast.fileUrl" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            
            <!-- No Content Message -->
            <div class="no-content-message" *ngIf="!selectedBroadcast.message && !selectedBroadcast.fileUrl">
              <p><i class="fas fa-info-circle"></i> No message content available</p>
            </div>
            
            <div class="message-meta">
              <span class="message-type">{{ selectedBroadcast.messageType }}</span>
              <span class="file-indicator" *ngIf="selectedBroadcast.fileUrl">
                <i class="fas fa-paperclip"></i>
                Has attachment
              </span>
            </div>
          </div>

          <div class="broadcast-stats-section">
            <h4>Delivery Statistics</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ selectedBroadcast.statistics.total }}</div>
                <div class="stat-label">Total Recipients</div>
              </div>
              <div class="stat-card success">
                <div class="stat-value">{{ selectedBroadcast.statistics.sent }}</div>
                <div class="stat-label">Successfully Sent</div>
              </div>
              <div class="stat-card error">
                <div class="stat-value">{{ selectedBroadcast.statistics.failed }}</div>
                <div class="stat-label">Failed</div>
              </div>
              <div class="stat-card pending">
                <div class="stat-value">{{ selectedBroadcast.statistics.pending }}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>
          </div>

          <div class="recipients-section" *ngIf="broadcastDetails">
            <div class="recipients-header">
              <h4>Recipients ({{ broadcastDetails.statistics?.total || 0 }})</h4>
              
              <!-- Recipient Filters -->
              <div class="recipients-filters">
                <!-- Status Filter -->
                <div class="filter-group">
                  <label>Status:</label>
                  <select [(ngModel)]="recipientStatusFilter" (change)="onRecipientFilterChange()">
                    <option value="ALL">All ({{ broadcastDetails.statistics?.total || 0 }})</option>
                    <option value="SENT">Sent ({{ broadcastDetails.statistics?.sent || 0 }})</option>
                    <option value="FAILED">Failed ({{ broadcastDetails.statistics?.failed || 0 }})</option>
                    <option value="PENDING">Pending ({{ broadcastDetails.statistics?.pending || 0 }})</option>
                  </select>
                </div>
                
                <!-- Search Filter -->
                <div class="filter-group">
                  <app-search-input
                    [(ngModel)]="recipientSearchQuery"
                    (search)="onRecipientSearchChange()"
                    placeholder="Search recipients..."
                    [loading]="loadingRecipients">
                  </app-search-input>
                </div>
              </div>
            </div>
            
            <div class="recipients-list">
              <!-- Loading indicator -->
              <div *ngIf="loadingRecipients" class="recipients-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading recipients...</span>
              </div>
              
              <!-- Recipients list -->
              <div *ngIf="!loadingRecipients">
                <div 
                  *ngFor="let recipient of recipients; trackBy: trackByRecipientId" 
                  class="recipient-item"
                  [class]="'status-' + recipient.status.toLowerCase()">
                  <div class="recipient-info">
                    <div class="recipient-avatar">
                      {{ recipient.client.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="recipient-details">
                      <h5 class="recipient-name">{{ recipient.client.name }}</h5>
                      <p class="recipient-username">
                        <span *ngIf="recipient.client.username">{{ '@' + recipient.client.username }}</span>
                        <span *ngIf="!recipient.client.username">No username</span>
                        <span class="telegram-id"> • ID: {{ recipient.client.telegramId }}</span>
                      </p>
                    </div>
                  </div>
                  <div class="recipient-status">
                    <span class="status-badge" [class]="'status-' + recipient.status.toLowerCase()">
                      {{ recipient.status }}
                    </span>
                    <span *ngIf="recipient.sentAt" class="sent-time">
                      {{ formatTime(recipient.sentAt) }}
                    </span>
                  </div>
                </div>
                
                <!-- No recipients found -->
                <div *ngIf="recipients.length === 0" class="no-recipients">
                  <i class="fas fa-user-slash"></i>
                  <p>No recipients found</p>
                </div>
              </div>
            </div>
            
            <!-- Traditional Pagination -->
            <div class="recipients-pagination" *ngIf="recipientsPagination && recipientsPagination.totalPages > 1">
              <app-pagination
                [pagination]="recipientsPagination"
                [showPageNumbers]="true"
                [showFirstLast]="true"
                (pageChange)="goToRecipientPage($event)">
              </app-pagination>
            </div>
            
            <!-- Pagination Info -->
            <div class="recipients-pagination-info" *ngIf="recipientsPagination">
              <span class="pagination-count">
                <i class="fas fa-users"></i>
                Showing {{ getRecipientRangeText() }} of {{ recipientsPagination.totalCount }} recipients
              </span>
            </div>
          </div>
        </div>
      </div>

    </app-sidebar-container>

    <!-- Success/Error Messages -->
    <app-toast
      [visible]="!!toastMessage"
      [type]="toastType"
      [message]="toastMessage"
      (close)="toastMessage = ''"
      [duration]="5000">
    </app-toast>
  `,
  styleUrls: ['./broadcast.component.css']
})
export class BroadcastComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('broadcastsContainer') broadcastsContainer!: ElementRef<HTMLDivElement>;
  private destroy$ = new Subject<void>();
  private broadcastsScrollHandler = () => {}; // Will be overridden in setupBroadcastsScrollListener
  private currentScrollableElement: Element | null = null;

  currentUser: User | null = null;
  
  // Broadcast list
  broadcasts: BroadcastHistoryItem[] = [];
  pagination: any = null;
  loading = false;

  // Selected broadcast
  selectedBroadcast: BroadcastHistoryItem | null = null;
  broadcastDetails: BroadcastDetails | null = null;

  // Recipients pagination
  recipients: BroadcastRecipient[] = [];
  recipientsPagination: any = null;
  loadingRecipients = false;
  recipientStatusFilter: 'ALL' | 'PENDING' | 'SENT' | 'FAILED' = 'ALL';
  recipientSearchQuery = '';
  recipientsPerPage = 20;
  currentRecipientPage = 1;
  private recipientSearchSubject = new Subject<string>();

  // New broadcast form
  showNewBroadcastForm = false;
  newBroadcastMessage = '';
  newBroadcastType: 'TEXT' | 'LINK' | 'IMAGE' | 'FILE' | 'VIDEO' = 'TEXT';
  isSendingBroadcast = false;
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;

  // Message type options for the composer
  messageTypes = [
    {
      value: 'TEXT' as const,
      name: 'Text Message',
      emoji: '📝',
      description: 'Send a plain text message to all clients'
    },
    {
      value: 'LINK' as const,
      name: 'Link',
      emoji: '🔗',
      description: 'Send a clickable link with your message'
    },
    {
      value: 'IMAGE' as const,
      name: 'Image',
      emoji: '🖼️',
      description: 'Send an image with optional caption'
    },
    {
      value: 'FILE' as const,
      name: 'File',
      emoji: '📎',
      description: 'Send a file attachment with description'
    },
    {
      value: 'VIDEO' as const,
      name: 'Video',
      emoji: '🎥',
      description: 'Send a video with optional caption'
    }
  ];

  // UI state
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  sidebarCollapsed = false;
  isMobile = false;
  showMobileMenu = false;
  showMobileContent = false;

  // Navigation configuration
  navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      icon: 'fa-comments',
      label: 'Chats',
      isActive: false
    },
    {
      id: 'clients',
      icon: 'fa-users',
      label: 'Clients',
      isActive: false
    },
    {
      id: 'history',
      icon: 'fa-history',
      label: 'History',
      isActive: false
    },
    {
      id: 'broadcast',
      icon: 'fa-bullhorn',
      label: 'Broadcast',
      isActive: true
    }
  ];

  // List panel configuration
  broadcastListConfig: ListPanelConfig = {
    title: 'Broadcasts',
    showSearch: true,
    searchPlaceholder: 'New Broadcast',
    showPagination: true,
    emptyStateIcon: 'fa-bullhorn',
    emptyStateTitle: 'No broadcasts sent',
    emptyStateMessage: 'Create your first broadcast message'
  };

  constructor(
    public broadcastService: BroadcastService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Setup recipient search debouncing
    this.recipientSearchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentRecipientPage = 1; // Reset to first page when search changes
      this.loadRecipients(1);
    });
    
    // Check for mobile
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    this.loadBroadcasts();
  }

  ngAfterViewInit(): void {
    // Add a small delay to ensure the view is fully initialized
    setTimeout(() => {
      this.setupBroadcastsScrollListener();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', () => this.checkMobile());
    
    // Clean up broadcast scroll listener
    if (this.currentScrollableElement && this.broadcastsScrollHandler) {
      this.currentScrollableElement.removeEventListener('scroll', this.broadcastsScrollHandler);
    }
  }

  loadBroadcasts(): void {
    this.loading = true;

    // Reset broadcasts and load initial page with infinite scroll
    this.broadcastService.resetBroadcasts();
    
    this.broadcastService
      .loadInitialBroadcasts(15)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Initial broadcasts loaded:', response.broadcasts.length, 'of', response.pagination.totalCount);
          this.broadcasts = response.broadcasts;
          this.pagination = response.pagination;
          this.broadcastService.updateBroadcastsFromResponse(response, false); // false = not appending
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading broadcasts:', error);
          this.showToast('Error loading broadcasts', 'error');
          this.loading = false;
          this.broadcastService.setLoadingBroadcasts(false);
        }
      });
  }

  private loadMoreBroadcasts(): void {
    if (this.broadcastService.isLoadingBroadcasts() || !this.broadcastService.hasMoreBroadcasts()) {
      return;
    }

    console.log('Loading more broadcasts...');
    
    this.broadcastService.loadMoreBroadcasts().subscribe({
      next: (response) => {
        if (response) {
          console.log('More broadcasts loaded:', response.broadcasts.length, 'more broadcasts');
          // Update the local broadcasts array
          this.broadcasts = [...this.broadcasts, ...response.broadcasts];
          this.pagination = response.pagination;
          this.broadcastService.updateBroadcastsFromResponse(response, true); // true = appending
        }
      },
      error: (error) => {
        console.error('Error loading more broadcasts:', error);
        this.broadcastService.setLoadingBroadcasts(false);
      }
    });
  }

  selectBroadcast(broadcast: BroadcastHistoryItem): void {
    this.selectedBroadcast = broadcast;
    this.showNewBroadcastForm = false; // Hide composer if open
    this.showMobileContent = true; // Show details on mobile
    this.loadBroadcastDetails(broadcast.id);
  }

  loadBroadcastDetails(broadcastId: string): void {
    this.broadcastService.getBroadcastDetails(broadcastId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          // Handle backward compatibility - if statistics don't exist, create them from existing data
          if (!details.statistics && details.recipients) {
            const total = details.recipients.length;
            const sent = details.recipients.filter(r => r.status === 'SENT').length;
            const failed = details.recipients.filter(r => r.status === 'FAILED').length;
            const pending = details.recipients.filter(r => r.status === 'PENDING').length;
            
            details.statistics = {
              total,
              sent,
              failed,
              pending
            };
          } else if (!details.statistics) {
            // If no statistics and no recipients, create from basic counts
            details.statistics = {
              total: details.recipientCount || 0,
              sent: details.sentCount || 0,
              failed: details.failedCount || 0,
              pending: (details.recipientCount || 0) - (details.sentCount || 0) - (details.failedCount || 0)
            };
          }
          
          this.broadcastDetails = details;
          console.log('Broadcast details loaded:', details);
          
          // Load recipients with pagination (or use existing recipients as fallback)
          this.loadRecipients();
        },
        error: (error) => {
          console.error('Error loading broadcast details:', error);
          this.showToast('Error loading broadcast details', 'error');
        }
      });
  }

  sendBroadcast(): void {
    // Validate message
    if (!this.isValidBroadcast()) {
      if (!this.newBroadcastMessage.trim()) {
        this.showToast('Please enter a broadcast message', 'error');
      } else if (this.newBroadcastMessage.trim().length < 3) {
        this.showToast('Message must be at least 3 characters long', 'error');
      } else if (this.newBroadcastMessage.trim().length > 1000) {
        this.showToast('Message cannot exceed 1000 characters', 'error');
      }
      return;
    }

    // Show confirmation dialog
    const message = this.newBroadcastMessage.trim();
    const messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
    const confirmMessage = `Send "${messagePreview}" as ${this.newBroadcastType.toLowerCase()} to all clients?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isSendingBroadcast = true;
    
    const broadcastData: BroadcastRequest = {
      message: message,
      messageType: this.newBroadcastType,
      file: this.selectedFile || undefined
    };

    this.broadcastService.sendBroadcast(broadcastData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showToast(`Broadcast sent successfully to ${response.broadcast.recipientCount} clients!`, 'success');
          this.cancelNewBroadcast();
          this.loadBroadcasts(); // Refresh the list
        },
        error: (error) => {
          console.error('Error sending broadcast:', error);
          const errorMessage = error.error?.message || error.error?.error || 'Error sending broadcast';
          this.showToast(errorMessage, 'error');
          this.isSendingBroadcast = false;
        }
      });
  }

  openNewBroadcastForm(): void {
    console.log('Opening new broadcast form...');
    this.selectedBroadcast = null; // Clear any selected broadcast
    this.showNewBroadcastForm = true;
    this.showMobileContent = true; // Show on mobile
  }

  cancelNewBroadcast(): void {
    console.log('Cancelling new broadcast form...');
    this.showNewBroadcastForm = false;
    this.newBroadcastMessage = '';
    this.newBroadcastType = 'TEXT';
    this.isSendingBroadcast = false;
    this.selectedFile = null;
    this.filePreviewUrl = null;
    this.showMobileContent = false; // Hide on mobile
  }

  getMessageTypeDisplay(): string {
    const messageType = this.messageTypes.find(type => type.value === this.newBroadcastType);
    return messageType ? `${messageType.emoji} ${messageType.name}` : '📝 Text Message';
  }


  getBroadcastButtonText(): string {
    if (this.isSendingBroadcast) {
      return 'Sending...';
    }
    
    const message = this.newBroadcastMessage.trim();
    if (message.length === 0) {
      return 'Enter Message';
    }
    if (message.length < 3) {
      return 'Message Too Short';
    }
    if (message.length > 1000) {
      return 'Message Too Long';
    }
    
    return 'Send Broadcast';
  }

  // Remove old pagination method
  // goToPage method is no longer needed with infinite scroll

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    
    setTimeout(() => {
      this.toastMessage = '';
    }, 5000);
  }

  truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + '...';
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  // Navigation methods
  onNavigationItemClick(item: NavigationItem): void {
    // Update active state
    this.navigationItems.forEach(navItem => {
      navItem.isActive = navItem.id === item.id;
    });

    // Navigate based on item
    switch (item.id) {
      case 'dashboard':
        this.router.navigate(['/dashboard']);
        break;
      case 'clients':
        this.router.navigate(['/clients']);
        break;
      case 'history':
        this.router.navigate(['/history']);
        break;
      case 'broadcast':
        // Already on broadcast page
        break;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // UI state methods
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.showMobileMenu = false;
      this.showMobileContent = false;
    }
  }

  // Helper method for list items
  getListItemData(broadcast: BroadcastHistoryItem): ListItemData {
    const badges = [];
    
    // Always show sent count
    if (broadcast.statistics.sent > 0) {
      badges.push({
        text: `${broadcast.statistics.sent} sent`,
        type: 'count' as const,
        variant: 'success'
      });
    }
    
    // Show failed count if any
    if (broadcast.statistics.failed > 0) {
      badges.push({
        text: `${broadcast.statistics.failed} failed`,
        type: 'count' as const,
        variant: 'error'
      });
    }
    
    // Show pending count if any
    if (broadcast.statistics.pending > 0) {
      badges.push({
        text: `${broadcast.statistics.pending} pending`,
        type: 'count' as const,
        variant: 'warning'
      });
    }
    
    // Calculate not received (total - sent - failed - pending)
    const notReceived = broadcast.statistics.total - broadcast.statistics.sent - broadcast.statistics.failed - broadcast.statistics.pending;
    if (notReceived > 0) {
      badges.push({
        text: `${notReceived} not received`,
        type: 'count' as const,
        variant: 'info'
      });
    }

    return {
      id: broadcast.id,
      title: this.truncateMessage(broadcast.message, 50),
      subtitle: `${broadcast.statistics.total} total recipients • ${this.getMessageTypeEmoji(broadcast.messageType)} ${broadcast.messageType}`,
      time: this.formatTime(broadcast.createdAt),
      avatarName: broadcast.sender.name,
      isOnline: false,
      status: broadcast.status.toLowerCase(),
      badges: badges,
      customData: {
        statistics: broadcast.statistics,
        status: broadcast.status
      }
    };
  }

  private getMessageTypeEmoji(messageType: string): string {
    const type = this.messageTypes.find(t => t.value === messageType);
    return type ? type.emoji : '📝';
  }

  // File handling methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.showToast('File size must be less than 10MB', 'error');
        return;
      }

      // Validate file type based on selected message type
      if (!this.isValidFileType(file)) {
        this.showToast('Invalid file type for selected message type', 'error');
        return;
      }

      this.selectedFile = file;
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.filePreviewUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreviewUrl = null;
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.filePreviewUrl = null;
  }

  private isValidFileType(file: File): boolean {
    switch (this.newBroadcastType) {
      case 'IMAGE':
        return file.type.startsWith('image/');
      case 'VIDEO':
        return file.type.startsWith('video/');
      case 'FILE':
        // Allow most common file types
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
          'application/zip',
          'application/x-rar-compressed'
        ];
        return allowedTypes.includes(file.type) || file.type.startsWith('text/');
      default:
        return true;
    }
  }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) return 'fa-image';
    if (file.type.startsWith('video/')) return 'fa-video';
    if (file.type === 'application/pdf') return 'fa-file-pdf';
    if (file.type.includes('word')) return 'fa-file-word';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'fa-file-excel';
    if (file.type.includes('zip') || file.type.includes('rar')) return 'fa-file-archive';
    return 'fa-file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getAcceptedFileTypes(): string {
    switch (this.newBroadcastType) {
      case 'IMAGE':
        return 'image/*';
      case 'VIDEO':
        return 'video/*';
      case 'FILE':
        return '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar';
      default:
        return '*/*';
    }
  }

  getUploadIcon(): string {
    switch (this.newBroadcastType) {
      case 'IMAGE':
        return 'fa-image';
      case 'VIDEO':
        return 'fa-video';
      case 'FILE':
        return 'fa-file-upload';
      default:
        return 'fa-upload';
    }
  }

  getFileTypeIcon(fileUrl: string): string {
    const fileName = fileUrl.split('/').pop() || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'fa-image';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'fa-video';
      case 'pdf':
        return 'fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel';
      case 'zip':
      case 'rar':
        return 'fa-file-archive';
      default:
        return 'fa-file';
    }
  }

  getFileName(fileUrl: string): string {
    const fileName = fileUrl.split('/').pop() || 'Unknown file';
    // Remove the timestamp from the filename (format: basename-timestamp.extension)
    const parts = fileName.split('-');
    if (parts.length > 1) {
      const timestamp = parts[parts.length - 1].split('.')[0];
      if (/^\d+$/.test(timestamp)) {
        // Remove the last part (timestamp) and rejoin
        const nameWithoutTimestamp = parts.slice(0, -1).join('-');
        const extension = fileName.split('.').pop();
        return `${nameWithoutTimestamp}.${extension}`;
      }
    }
    return fileName;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('Failed to load image:', imgElement.src);
    // You could replace with a placeholder image here if needed
  }

  // Update isValidBroadcast to consider file attachments
  isValidBroadcast(): boolean {
    const message = this.newBroadcastMessage.trim();
    const hasValidMessage = message.length >= 3 && message.length <= 1000;
    
    // For file/image/video types, either message or file is required
    if (['FILE', 'IMAGE', 'VIDEO'].includes(this.newBroadcastType)) {
      return (hasValidMessage || this.selectedFile !== null) && message.length <= 1000;
    }
    
    return hasValidMessage;
  }

  trackByBroadcastId(index: number, broadcast: any): string {
    return broadcast.id;
  }

  private setupBroadcastsScrollListener(): void {
    if (!this.broadcastsContainer?.nativeElement) {
      console.warn('Broadcasts container not available for scroll listener setup');
      return;
    }
    
    // Find the scrollable parent element (list panel content area)
    let scrollableElement = this.broadcastsContainer.nativeElement.parentElement;
    while (scrollableElement && getComputedStyle(scrollableElement).overflowY !== 'auto' && 
           getComputedStyle(scrollableElement).overflowY !== 'scroll') {
      scrollableElement = scrollableElement.parentElement;
    }
    
    if (!scrollableElement) {
      console.warn('Could not find scrollable parent element');
      return;
    }
    
    let scrollTimeout: number;
    
    // Remove existing listener if any
    if (this.currentScrollableElement) {
      this.currentScrollableElement.removeEventListener('scroll', this.broadcastsScrollHandler);
    }
    this.currentScrollableElement = scrollableElement;
    
    console.log('Setting up broadcasts scroll listener with initial state:', {
      hasMoreBroadcasts: this.broadcastService.hasMoreBroadcasts(),
      broadcastsCount: this.broadcasts.length,
      scrollHeight: scrollableElement.scrollHeight,
      clientHeight: scrollableElement.clientHeight,
      canScroll: scrollableElement.scrollHeight > scrollableElement.clientHeight
    });
    
    // Create the scroll handler for broadcasts
    this.broadcastsScrollHandler = () => {
      // Debounce scroll events for performance
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        const scrollTop = scrollableElement!.scrollTop;
        const scrollHeight = scrollableElement!.scrollHeight;
        const clientHeight = scrollableElement!.clientHeight;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold from bottom
        
        // Debug scroll position
        console.log('Broadcasts scroll event:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          isNearBottom,
          hasMoreBroadcasts: this.broadcastService.hasMoreBroadcasts(),
          isLoading: this.broadcastService.isLoadingBroadcasts(),
          broadcastsCount: this.broadcasts.length,
          canScroll: scrollHeight > clientHeight
        });
        
        // Check if user scrolled to bottom and all conditions are met
        if (isNearBottom && 
            this.broadcastService.hasMoreBroadcasts() && 
            !this.broadcastService.isLoadingBroadcasts() &&
            scrollHeight > clientHeight) { // Ensure container is actually scrollable
          console.log('Triggering loadMoreBroadcasts...');
          this.loadMoreBroadcasts();
        }
      }, 150); // Debounce time for better responsiveness
    };
    
    scrollableElement.addEventListener('scroll', this.broadcastsScrollHandler);
    
    // Also trigger an initial check in case the container is not scrollable yet
    setTimeout(() => {
      if (scrollableElement!.scrollHeight <= scrollableElement!.clientHeight && 
          this.broadcastService.hasMoreBroadcasts() && 
          !this.broadcastService.isLoadingBroadcasts()) {
        console.log('Broadcasts container not scrollable, loading more broadcasts automatically');
        this.loadMoreBroadcasts();
      }
    }, 200);
  }

  // Recipients pagination methods
  loadRecipients(page: number = 1): void {
    if (!this.selectedBroadcast) return;

    this.loadingRecipients = true;
    this.currentRecipientPage = page;

    const statusFilter = this.recipientStatusFilter === 'ALL' ? undefined : this.recipientStatusFilter as 'PENDING' | 'SENT' | 'FAILED';
    const searchQuery = this.recipientSearchQuery || undefined;

    console.log('Loading recipients for broadcast:', this.selectedBroadcast.id, 'page:', page);

    this.broadcastService
      .getBroadcastRecipients(this.selectedBroadcast.id, page, this.recipientsPerPage, statusFilter, searchQuery)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Recipients loaded for page', page + ':', response.recipients.length, 'of', response.pagination.totalCount);
          this.recipients = response.recipients;
          this.recipientsPagination = response.pagination;
          this.loadingRecipients = false;
        },
        error: (error) => {
          console.error('Error loading recipients via pagination API:', error);
          
          // Fallback: Try to use recipients from broadcast details if available
          if (this.broadcastDetails?.recipients && page === 1) {
            console.log('Falling back to using recipients from broadcast details');
            this.useFallbackRecipients();
          } else {
            this.showToast('Error loading recipients', 'error');
            this.loadingRecipients = false;
          }
        }
      });
  }

  private useFallbackRecipients(): void {
    if (!this.broadcastDetails?.recipients) return;

    let filteredRecipients = [...this.broadcastDetails.recipients];

    // Apply status filter
    if (this.recipientStatusFilter !== 'ALL') {
      filteredRecipients = filteredRecipients.filter(r => r.status === this.recipientStatusFilter);
    }

    // Apply search filter
    if (this.recipientSearchQuery) {
      const query = this.recipientSearchQuery.toLowerCase();
      filteredRecipients = filteredRecipients.filter(r => 
        r.client.name.toLowerCase().includes(query) ||
        (r.client.username && r.client.username.toLowerCase().includes(query)) ||
        r.client.telegramId.includes(query)
      );
    }

    // Apply pagination to filtered results
    const totalCount = filteredRecipients.length;
    const totalPages = Math.ceil(totalCount / this.recipientsPerPage);
    const startIndex = (this.currentRecipientPage - 1) * this.recipientsPerPage;
    const endIndex = startIndex + this.recipientsPerPage;
    const paginatedRecipients = filteredRecipients.slice(startIndex, endIndex);

    this.recipients = paginatedRecipients;
    this.recipientsPagination = {
      currentPage: this.currentRecipientPage,
      totalPages: totalPages,
      totalCount: totalCount,
      hasNextPage: this.currentRecipientPage < totalPages,
      hasPrevPage: this.currentRecipientPage > 1,
      hasMore: this.currentRecipientPage < totalPages
    };
    
    this.loadingRecipients = false;
    console.log('Using fallback recipients:', paginatedRecipients.length, 'of', totalCount, 'recipients on page', this.currentRecipientPage);
  }

  goToRecipientPage(page: number): void {
    if (page === this.currentRecipientPage) return;
    this.loadRecipients(page);
  }

  getRecipientRangeText(): string {
    if (!this.recipientsPagination || this.recipients.length === 0) return '0';
    
    const start = (this.recipientsPagination.currentPage - 1) * this.recipientsPerPage + 1;
    const end = Math.min(start + this.recipients.length - 1, this.recipientsPagination.totalCount);
    
    if (start === end) {
      return start.toString();
    }
    
    return `${start}-${end}`;
  }

  onRecipientFilterChange(): void {
    console.log('Recipient filter changed:', this.recipientStatusFilter);
    this.currentRecipientPage = 1; // Reset to first page when filter changes
    this.loadRecipients(1);
  }

  onRecipientSearchChange(): void {
    console.log('Recipient search changed:', this.recipientSearchQuery);
    this.recipientSearchSubject.next(this.recipientSearchQuery);
  }

  trackByRecipientId(index: number, recipient: any): string {
    return recipient.id;
  }

}