import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClientService, ClientListItem, ClientDetails, SessionHistoryItem, SessionHistoryResponse } from '../shared/services/client.service';
import { AuthService } from '../shared/services/auth.service';
import { User } from '../shared/models';
import { 
  ListPanelComponent,
  ListItemComponent,
  SearchInputComponent,
  AvatarCircleComponent,
  ToastComponent,
  PaginationComponent
} from '../shared/components';
import { ListPanelConfig } from '../shared/components/list-panel/list-panel.component';
import { ListItemData } from '../shared/components/list-item/list-item.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ListPanelComponent,
    ListItemComponent,
    SearchInputComponent,
    AvatarCircleComponent,
    ToastComponent,
    PaginationComponent
  ],
  template: `
    <div class="clients-container">
      <!-- Client List Panel -->
      <app-list-panel
        [config]="clientListConfig"
        [loading]="loading"
        [showEmptyState]="!loading && clients.length === 0"
        [titleIcon]="'fa-users'"
        [isMobile]="isMobile"
        [mobileHidden]="false"
        [hasFooterContent]="true">
        
        <!-- Search Input -->
        <app-search-input slot="search"
          [(ngModel)]="searchQuery"
          (search)="onSearchChange()"
          placeholder="Search clients..."
          [loading]="loading">
        </app-search-input>
        
        <!-- Client List Items -->
        <div slot="list-items" class="clients-scroll-container" #clientsContainer>
          <app-list-item
            *ngFor="let client of clients; trackBy: trackByClientId"
            [data]="getListItemData(client)"
            (itemClick)="selectClient(client)">
          </app-list-item>
          
          <!-- Loading indicator for infinite scroll -->
          <div *ngIf="clientService.isLoadingClients() && clients.length > 0" class="loading-more-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading more clients...</span>
          </div>
          
          <!-- End of list indicator -->
          <div *ngIf="!clientService.hasMoreClients() && clients.length > 0" class="end-of-list-indicator">
            <i class="fas fa-check-circle"></i>
            <span>All clients loaded</span>
          </div>
        </div>
        
        <!-- Pagination Info Footer (showing current count) -->
        <div slot="footer" *ngIf="pagination">
          <div class="pagination-info">
            <span class="pagination-count">
              <i class="fas fa-users"></i>
              Showing {{ clients.length }} of {{ pagination.totalCount }} clients
            </span>
            <span *ngIf="clientService.hasMoreClients()" class="pagination-more">
              <i class="fas fa-chevron-down"></i>
              Scroll for more
            </span>
          </div>
        </div>
      </app-list-panel>

      <!-- Client Details Panel (Right Side) -->
      <div class="client-details-panel">
        <!-- Welcome Screen -->
        <div *ngIf="!selectedClient" class="welcome-screen">
          <div class="welcome-content">
            <i class="fas fa-users welcome-icon"></i>
            <h2>Client Management</h2>
            <p>Select a client from the list to view details and start conversations</p>
            
            <div class="welcome-stats" *ngIf="pagination">
              <div class="stat-item">
                <div class="stat-number">{{ pagination.totalCount || 0 }}</div>
                <div class="stat-label">Total Clients</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Client Details View -->
        <div *ngIf="selectedClient" class="client-details-container">
          <!-- Client Header -->
          <div class="client-details-header">
            <div class="client-details-info">
              <div class="client-details-avatar">
                <app-avatar-circle
                  [name]="selectedClient.name"
                  [isOnline]="selectedClient.hasActiveSession"
                  size="large">
                </app-avatar-circle>
              </div>
              <div class="client-details-text">
                <h3 class="client-title">{{ selectedClient.name }}</h3>
                <p class="client-subtitle">
                  <span *ngIf="selectedClient.username">{{ '@' + selectedClient.username }}</span>
                  <span *ngIf="!selectedClient.username">No username</span>
                  <span class="telegram-id"> • ID: {{ selectedClient.telegramId }}</span>
                </p>
              </div>
            </div>

            <div class="client-details-actions">
              <button 
                class="btn-start-conversation"
                [disabled]="!selectedClient.canStartConversation || isStartingConversation"
                (click)="startConversation()"
                title="{{ selectedClient.canStartConversation ? 'Start new conversation' : 'Client has active session' }}"
              >
                <i *ngIf="!isStartingConversation" class="fas fa-comment"></i>
                <i *ngIf="isStartingConversation" class="fas fa-spinner fa-spin"></i>
                {{ isStartingConversation ? 'Starting...' : 'Start Conversation' }}
              </button>
            </div>
          </div>

          <!-- Client Statistics -->
          <div class="client-stats" *ngIf="!loadingClientDetails && clientDetails">
            <div class="stat-card">
              <div class="stat-value">{{ clientDetails._count.sessions || selectedClient.totalSessions }}</div>
              <div class="stat-label">Total Sessions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ selectedClient.lastSession?._count?.chats || 0 }}</div>
              <div class="stat-label">Last Session Messages</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatDate(selectedClient.createdAt) }}</div>
              <div class="stat-label">First Contact</div>
            </div>
          </div>

          <!-- Loading indicator for client details -->
          <div *ngIf="loadingClientDetails" class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading client details...</span>
          </div>

          <!-- Session History -->
          <div class="session-history" *ngIf="selectedClient">
            <h4>Session History 
              <span *ngIf="sessionHistoryPagination">({{ sessionHistoryPagination.totalCount }})</span>
            </h4>
            
            <!-- Loading indicator -->
            <div *ngIf="loadingSessionHistory" class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading sessions...</span>
            </div>

            <div class="sessions-list" *ngIf="!loadingSessionHistory">
              <div *ngIf="sessionHistory.length === 0" class="no-sessions">
                <i class="fas fa-comment-slash"></i>
                <p>No sessions found</p>
              </div>

              <div 
                *ngFor="let session of sessionHistory" 
                class="session-item"
                [class.active]="session.status === 'ACTIVE'"
              >
                <div class="session-info">
                  <div class="session-header">
                    <span class="session-date">{{ formatDateTime(session.createdAt) }}</span>
                    <span class="session-status" [class]="'status-' + session.status.toLowerCase()">
                      {{ session.status }}
                    </span>
                  </div>
                  <div class="session-details">
                    <span *ngIf="session.cs" class="cs-name">
                      <i class="fas fa-headset"></i>
                      {{ session.cs.name }}
                    </span>
                    <span *ngIf="!session.cs" class="no-cs">
                      <i class="fas fa-user-slash"></i>
                      Unassigned
                    </span>
                    <span class="message-count">
                      <i class="fas fa-comment"></i>
                      {{ session._count.chats || 0 }} messages
                    </span>
                  </div>
                </div>
                <button 
                  class="btn-view-session" 
                  (click)="viewSession(session.id)"
                  title="View session details"
                >
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>

            <!-- Session History Pagination -->
            <div class="session-history-pagination" *ngIf="sessionHistoryPagination && sessionHistoryPagination.totalPages > 1">
              <app-pagination
                [pagination]="sessionHistoryPagination"
                [showPageNumbers]="true"
                [showFirstLast]="true"
                (pageChange)="goToSessionPage($event)">
              </app-pagination>
            </div>
          </div>
        </div>
      </div>

    <!-- Success/Error Messages -->
    <app-toast
      [visible]="!!toastMessage"
      [type]="toastType"
      [message]="toastMessage"
      (close)="toastMessage = ''"
      [duration]="5000">
    </app-toast>
  `,
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('clientsContainer') clientsContainer!: ElementRef<HTMLDivElement>;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private clientsScrollHandler = () => {}; // Will be overridden in setupClientsScrollListener
  private currentScrollableElement: Element | null = null;

  currentUser: User | null = null;
  
  // Client list
  clients: ClientListItem[] = [];
  pagination: any = null;
  loading = false;
  searchQuery = '';

  // Selected client
  selectedClient: ClientListItem | null = null;
  clientDetails: ClientDetails | null = null;
  loadingClientDetails = false;

  // Session history pagination
  sessionHistory: SessionHistoryItem[] = [];
  sessionHistoryPagination: any = null;
  loadingSessionHistory = false;
  sessionsPerPage = 10;
  currentSessionPage = 1;

  // UI state
  isStartingConversation = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  sidebarCollapsed = false;
  isMobile = false;
  showMobileMenu = false;
  showMobileContent = false;


  // List panel configuration
  clientListConfig: ListPanelConfig = {
    title: 'Clients',
    showSearch: true,
    searchPlaceholder: 'Search clients...',
    showPagination: true,
    emptyStateIcon: 'fa-users',
    emptyStateTitle: 'No clients found',
    emptyStateMessage: 'No clients available at the moment'
  };

  constructor(
    public clientService: ClientService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.loadClients();
    });

    // Check for mobile
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    this.loadClients();
  }

  ngAfterViewInit(): void {
    // Add a small delay to ensure the view is fully initialized
    setTimeout(() => {
      this.setupClientsScrollListener();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', () => this.checkMobile());
    
    // Clean up scroll listener
    if (this.currentScrollableElement && this.clientsScrollHandler) {
      this.currentScrollableElement.removeEventListener('scroll', this.clientsScrollHandler);
    }
  }

  loadClients(): void {
    this.loading = true;

    // Reset clients and load initial page with infinite scroll
    this.clientService.resetClients();
    
    this.clientService
      .loadInitialClients(15, this.searchQuery || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Initial clients loaded:', response.clients.length, 'of', response.pagination.totalCount);
          this.clients = response.clients;
          this.pagination = response.pagination;
          this.clientService.updateClientsFromResponse(response, false); // false = not appending
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading clients:', error);
          this.showToast('Error loading clients', 'error');
          this.loading = false;
          this.clientService.setLoadingClients(false);
        }
      });
  }

  private loadMoreClients(): void {
    if (this.clientService.isLoadingClients() || !this.clientService.hasMoreClients()) {
      return;
    }

    console.log('Loading more clients...');
    
    this.clientService.loadMoreClients(this.searchQuery || undefined).subscribe({
      next: (response) => {
        if (response) {
          console.log('More clients loaded:', response.clients.length, 'more clients');
          // Update the local clients array
          this.clients = [...this.clients, ...response.clients];
          this.pagination = response.pagination;
          this.clientService.updateClientsFromResponse(response, true); // true = appending
        }
      },
      error: (error) => {
        console.error('Error loading more clients:', error);
        this.clientService.setLoadingClients(false);
      }
    });
  }

  selectClient(client: ClientListItem): void {
    // Immediately clear previous data to prevent showing stale information
    this.clearSelectedClientData();
    
    // Set the selected client
    this.selectedClient = client;
    
    // Load new data
    this.loadClientDetails(client.id);
    this.loadSessionHistory(client.id, 1);
  }

  private clearSelectedClientData(): void {
    this.clientDetails = null;
    this.sessionHistory = [];
    this.sessionHistoryPagination = null;
    this.currentSessionPage = 1;
    this.loadingClientDetails = false;
    this.loadingSessionHistory = false;
  }

  loadClientDetails(clientId: string): void {
    this.loadingClientDetails = true;
    
    this.clientService.getClientDetails(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          // Only update if this is still the selected client (prevent race conditions)
          if (this.selectedClient && this.selectedClient.id === clientId) {
            this.clientDetails = details;
          }
          this.loadingClientDetails = false;
        },
        error: (error) => {
          console.error('Error loading client details:', error);
          this.showToast('Error loading client details', 'error');
          this.loadingClientDetails = false;
        }
      });
  }

  loadSessionHistory(clientId: string, page: number = 1): void {
    this.loadingSessionHistory = true;
    this.currentSessionPage = page;

    // Try the new paginated API first, fallback to client details if it fails
    this.clientService.getClientSessionHistory(clientId, page, this.sessionsPerPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Only update if this is still the selected client (prevent race conditions)
          if (this.selectedClient && this.selectedClient.id === clientId) {
            this.sessionHistory = response.sessions;
            this.sessionHistoryPagination = response.pagination;
          }
          this.loadingSessionHistory = false;
        },
        error: (error) => {
          console.warn('Paginated session history API not available, using fallback:', error);
          // Fallback: use client details and implement client-side pagination
          this.loadSessionHistoryFallback(clientId, page);
        }
      });
  }

  private loadSessionHistoryFallback(clientId: string, page: number): void {
    if (!this.clientDetails) {
      // Load client details first if not available
      this.clientService.getClientDetails(clientId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (details) => {
            // Only update if this is still the selected client
            if (this.selectedClient && this.selectedClient.id === clientId) {
              this.clientDetails = details;
              this.paginateSessionsFromClientDetails(page, clientId);
            } else {
              this.loadingSessionHistory = false;
            }
          },
          error: (error) => {
            console.error('Error loading client details for session history:', error);
            this.showToast('Error loading session history', 'error');
            this.loadingSessionHistory = false;
          }
        });
    } else {
      this.paginateSessionsFromClientDetails(page, clientId);
    }
  }

  private paginateSessionsFromClientDetails(page: number, clientId: string): void {
    // Ensure this is still the selected client
    if (!this.selectedClient || this.selectedClient.id !== clientId) {
      this.loadingSessionHistory = false;
      return;
    }

    if (!this.clientDetails?.sessions) {
      this.sessionHistory = [];
      this.sessionHistoryPagination = null;
      this.loadingSessionHistory = false;
      return;
    }

    const allSessions = this.clientDetails.sessions;
    const totalCount = allSessions.length;
    const totalPages = Math.ceil(totalCount / this.sessionsPerPage);
    const startIndex = (page - 1) * this.sessionsPerPage;
    const endIndex = startIndex + this.sessionsPerPage;
    const paginatedSessions = allSessions.slice(startIndex, endIndex);

    this.sessionHistory = paginatedSessions;
    this.sessionHistoryPagination = {
      currentPage: page,
      totalPages: totalPages,
      totalCount: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
    
    this.loadingSessionHistory = false;
    console.log('Using fallback session history pagination:', paginatedSessions.length, 'of', totalCount, 'sessions on page', page);
  }

  goToSessionPage(page: number): void {
    if (!this.selectedClient || page === this.currentSessionPage) return;
    this.loadSessionHistory(this.selectedClient.id, page);
  }

  startConversation(): void {
    if (!this.selectedClient || !this.selectedClient.canStartConversation) {
      return;
    }

    this.isStartingConversation = true;
    
    this.clientService.startConversation(this.selectedClient.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showToast('Conversation started successfully!', 'success');
          this.isStartingConversation = false;
          
          // Redirect to the new session in the dashboard
          setTimeout(() => {
            this.router.navigate(['/dashboard'], { 
              queryParams: { sessionId: response.session.id } 
            });
          }, 1000);
        },
        error: (error) => {
          console.error('Error starting conversation:', error);
          this.showToast(error.error?.error || 'Error starting conversation', 'error');
          this.isStartingConversation = false;
          
          // Refresh client list to update status
          this.loadClients();
        }
      });
  }

  viewSession(sessionId: string): void {
    this.router.navigate(['/dashboard/history'], { 
      queryParams: { sessionId: sessionId } 
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  // Navigation methods

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
  getListItemData(client: ClientListItem): ListItemData {
    return {
      id: client.id,
      title: client.name,
      subtitle: client.username ? `@${client.username}` : 'No username',
      time: this.formatTime(client.createdAt),
      avatarName: client.name,
      isOnline: client.hasActiveSession,
      status: client.hasActiveSession ? 'online' : 'offline',
      badges: [
        {
          text: client.totalSessions.toString(),
          type: 'count',
          variant: 'messages'
        }
      ],
      customData: {
        telegramId: client.telegramId,
        totalSessions: client.totalSessions
      }
    };
  }

  trackByClientId(index: number, client: any): string {
    return client.id;
  }

  private setupClientsScrollListener(): void {
    if (!this.clientsContainer?.nativeElement) {
      console.warn('Clients container not available for scroll listener setup');
      return;
    }
    
    // Find the scrollable parent element (list panel content area)
    let scrollableElement = this.clientsContainer.nativeElement.parentElement;
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
      this.currentScrollableElement.removeEventListener('scroll', this.clientsScrollHandler);
    }
    this.currentScrollableElement = scrollableElement;
    
    console.log('Setting up clients scroll listener with initial state:', {
      hasMoreClients: this.clientService.hasMoreClients(),
      clientsCount: this.clients.length,
      scrollHeight: scrollableElement.scrollHeight,
      clientHeight: scrollableElement.clientHeight,
      canScroll: scrollableElement.scrollHeight > scrollableElement.clientHeight
    });
    
    // Create the scroll handler for clients
    this.clientsScrollHandler = () => {
      // Debounce scroll events for performance
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        const scrollTop = scrollableElement!.scrollTop;
        const scrollHeight = scrollableElement!.scrollHeight;
        const clientHeight = scrollableElement!.clientHeight;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold from bottom
        
        // Debug scroll position
        console.log('Clients scroll event:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          isNearBottom,
          hasMoreClients: this.clientService.hasMoreClients(),
          isLoading: this.clientService.isLoadingClients(),
          clientsCount: this.clients.length,
          canScroll: scrollHeight > clientHeight
        });
        
        // Check if user scrolled to bottom and all conditions are met
        if (isNearBottom && 
            this.clientService.hasMoreClients() && 
            !this.clientService.isLoadingClients() &&
            scrollHeight > clientHeight) { // Ensure container is actually scrollable
          console.log('Triggering loadMoreClients...');
          this.loadMoreClients();
        }
      }, 150); // Debounce time for better responsiveness
    };
    
    scrollableElement.addEventListener('scroll', this.clientsScrollHandler);
    
    // Also trigger an initial check in case the container is not scrollable yet
    setTimeout(() => {
      if (scrollableElement!.scrollHeight <= scrollableElement!.clientHeight && 
          this.clientService.hasMoreClients() && 
          !this.clientService.isLoadingClients()) {
        console.log('Clients container not scrollable, loading more clients automatically');
        this.loadMoreClients();
      }
    }, 200);
  }
}