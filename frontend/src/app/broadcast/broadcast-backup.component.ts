import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BroadcastService, BroadcastRequest, BroadcastHistoryItem, BroadcastDetails } from '../shared/services/broadcast.service';
import { AuthService } from '../shared/services/auth.service';
import { User } from '../shared/models';
import { SidebarContainerComponent } from '../shared/components/sidebar-container/sidebar-container.component';
import { SidebarNavigationComponent } from '../shared/components/sidebar-navigation/sidebar-navigation.component';
import { ListPanelComponent } from '../shared/components/list-panel/list-panel.component';
import { ListItemComponent } from '../shared/components/list-item/list-item.component';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
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
          [showEmptyState]="!loading && broadcasts.length === 0"
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
          
            <!-- New Broadcast Form -->
            <div *ngIf="showNewBroadcastForm" class="new-broadcast-form">
              <div class="form-header">
                <h3>Send New Broadcast</h3>
                <button class="btn-close" (click)="cancelNewBroadcast()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              
              <div class="form-content">
                <div class="form-group">
                  <label for="broadcastMessage">Message</label>
                  <textarea 
                    id="broadcastMessage"
                    [(ngModel)]="newBroadcastMessage"
                    placeholder="Enter your broadcast message..."
                    rows="4"
                    maxlength="1000"
                    [disabled]="isSendingBroadcast"
                  ></textarea>
                  <div class="char-count" 
                       [class.warning]="newBroadcastMessage.length > 800"
                       [class.error]="newBroadcastMessage.length > 950">
                    {{ newBroadcastMessage.length }}/1000
                    <span *ngIf="newBroadcastMessage.length > 800 && newBroadcastMessage.length <= 950"> - Getting close to limit</span>
                    <span *ngIf="newBroadcastMessage.length > 950"> - Almost at limit!</span>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="messageType">Message Type</label>
                  <select 
                    id="messageType"
                    [(ngModel)]="newBroadcastType"
                    [disabled]="isSendingBroadcast"
                  >
                    <option value="TEXT">📝 Text Message</option>
                    <option value="LINK">🔗 Link</option>
                    <option value="IMAGE">🖼️ Image</option>
                    <option value="FILE">📎 File</option>
                    <option value="VIDEO">🎥 Video</option>
                  </select>
                </div>
                
                <!-- Message Type Help Text -->
                <div class="form-group">
                  <div class="message-type-help">
                    <small class="help-text">
                      <span *ngIf="newBroadcastType === 'TEXT'">
                        <i class="fas fa-info-circle"></i> 
                        Send a plain text message to all registered clients
                      </span>
                      <span *ngIf="newBroadcastType === 'LINK'">
                        <i class="fas fa-info-circle"></i> 
                        Send a clickable link - include full URL in your message
                      </span>
                      <span *ngIf="newBroadcastType === 'IMAGE'">
                        <i class="fas fa-info-circle"></i> 
                        Send an image with optional caption text
                      </span>
                      <span *ngIf="newBroadcastType === 'FILE'">
                        <i class="fas fa-info-circle"></i> 
                        Send a file attachment with description
                      </span>
                      <span *ngIf="newBroadcastType === 'VIDEO'">
                        <i class="fas fa-info-circle"></i> 
                        Send a video with optional caption
                      </span>
                    </small>
                  </div>
                </div>
                
                <div class="form-actions">
                  <button 
                    class="btn-secondary" 
                    (click)="cancelNewBroadcast()"
                    [disabled]="isSendingBroadcast"
                  >
                    Cancel
                  </button>
                  <button 
                    class="btn-primary" 
                    (click)="sendBroadcast()"
                    [disabled]="!isValidBroadcast() || isSendingBroadcast"
                  >
                    <i *ngIf="!isSendingBroadcast" class="fas fa-paper-plane"></i>
                    <i *ngIf="isSendingBroadcast" class="fas fa-spinner fa-spin"></i>
                    {{ getBroadcastButtonText() }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Broadcast List Items -->
            <div *ngIf="!showNewBroadcastForm">
            <app-list-item
              *ngFor="let broadcast of broadcasts"
              [data]="getListItemData(broadcast)"
              (itemClick)="selectBroadcast(broadcast)">
            </app-list-item>
          </div>
          
          <!-- Pagination Footer -->
          <div slot="footer">
            <app-pagination
              [pagination]="pagination"
              (pageChange)="goToPage($event)"
              [showTotalCount]="true">
            </app-pagination>
          </div>
        </app-list-panel>
      </div>

      <!-- Broadcast Details Panel (Right Side) -->
      <div slot="main-content" class="broadcast-details-panel">
        <!-- Welcome Screen -->
        <div *ngIf="!selectedBroadcast" class="welcome-screen">
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
          </div>
        </div>

        <!-- Broadcast Details View -->
        <div *ngIf="selectedBroadcast" class="broadcast-details-container">
          <!-- Broadcast Header -->
          <div class="broadcast-details-header">
            <div class="broadcast-details-info">
              <h3 class="broadcast-title">Broadcast Details</h3>
              <p class="broadcast-subtitle">
                Sent by {{ selectedBroadcast.sender.name }} • {{ formatDateTime(selectedBroadcast.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Broadcast Message -->
          <div class="broadcast-message-section">
            <h4>Message</h4>
            <div class="message-content">
              <p>{{ selectedBroadcast.message }}</p>
            </div>
            <div class="message-meta">
              <span class="message-type">{{ selectedBroadcast.messageType }}</span>
            </div>
          </div>

          <!-- Broadcast Statistics -->
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

          <!-- Recipient Details -->
          <div class="recipients-section" *ngIf="broadcastDetails">
            <h4>Recipients ({{ broadcastDetails.recipients.length }})</h4>
            <div class="recipients-list">
              <div 
                *ngFor="let recipient of broadcastDetails.recipients" 
                class="recipient-item"
                [class]="'status-' + recipient.status.toLowerCase()"
              >
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
export class BroadcastComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  
  // Broadcast list
  broadcasts: BroadcastHistoryItem[] = [];
  pagination: any = null;
  loading = false;

  // Selected broadcast
  selectedBroadcast: BroadcastHistoryItem | null = null;
  broadcastDetails: BroadcastDetails | null = null;

  // New broadcast form
  showNewBroadcastForm = false;
  newBroadcastMessage = '';
  newBroadcastType: 'TEXT' | 'LINK' | 'IMAGE' | 'FILE' | 'VIDEO' = 'TEXT';
  isSendingBroadcast = false;

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
    private broadcastService: BroadcastService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Check for mobile
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    this.loadBroadcasts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', () => this.checkMobile());
  }

  loadBroadcasts(page: number = 1): void {
    this.loading = true;
    
    this.broadcastService.getBroadcastHistory(page, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.broadcasts = response.broadcasts;
          this.pagination = response.pagination;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading broadcasts:', error);
          this.showToast('Error loading broadcasts', 'error');
          this.loading = false;
        }
      });
  }

  selectBroadcast(broadcast: BroadcastHistoryItem): void {
    this.selectedBroadcast = broadcast;
    this.loadBroadcastDetails(broadcast.id);
  }

  loadBroadcastDetails(broadcastId: string): void {
    this.broadcastService.getBroadcastDetails(broadcastId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.broadcastDetails = details;
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
      messageType: this.newBroadcastType
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
    this.showNewBroadcastForm = true;
  }

  cancelNewBroadcast(): void {
    console.log('Cancelling new broadcast form...');
    this.showNewBroadcastForm = false;
    this.newBroadcastMessage = '';
    this.newBroadcastType = 'TEXT';
    this.isSendingBroadcast = false;
  }

  isValidBroadcast(): boolean {
    const message = this.newBroadcastMessage.trim();
    return message.length >= 3 && message.length <= 1000;
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

  goToPage(page: number): void {
    this.loadBroadcasts(page);
  }

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
    return {
      id: broadcast.id,
      title: this.truncateMessage(broadcast.message, 50),
      subtitle: `${broadcast.statistics.total} recipients`,
      time: this.formatTime(broadcast.createdAt),
      avatarName: broadcast.sender.name,
      isOnline: false,
      status: broadcast.status.toLowerCase(),
      badges: [
        {
          text: broadcast.statistics.sent.toString(),
          type: 'count' as const,
          variant: 'success'
        },
        ...(broadcast.statistics.failed > 0 ? [{
          text: broadcast.statistics.failed.toString(),
          type: 'count' as const,
          variant: 'error'
        }] : [])
      ],
      customData: {
        statistics: broadcast.statistics,
        status: broadcast.status
      }
    };
  }
}