import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil, debounceTime, distinctUntilChanged } from "rxjs/operators";
import {
  HistoryService,
  SessionHistoryItem,
  SessionDetails,
  CSPerformanceStats,
  SearchResult,
} from "../shared/services/history.service";
import { AuthService } from "../shared/services/auth.service";
import { User } from "../shared/models";
import { 
  SidebarContainerComponent, 
  SidebarNavigationComponent, 
  ListPanelComponent, 
  ListItemComponent,
  SearchInputComponent,
  DropdownComponent, 
  DateRangeFilterComponent
} from "../shared/components";
import { NavigationItem } from '../shared/components/sidebar-navigation/sidebar-navigation.component';
import { ListPanelConfig } from '../shared/components/list-panel/list-panel.component';
import { ListItemData } from '../shared/components/list-item/list-item.component';
import { DropdownOption, DateRange } from "../shared/components";

@Component({
  selector: "app-history",
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    SidebarContainerComponent,
    SidebarNavigationComponent,
    ListPanelComponent,
    ListItemComponent,
    SearchInputComponent,
    DropdownComponent, 
    DateRangeFilterComponent
  ],
  template: `
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
        <!-- Session History List Panel -->
        <app-list-panel
          [config]="historyListConfig"
          [loading]="loading"
          [showEmptyState]="!loading && sessions.length === 0"
          [titleIcon]="'fa-history'"
          [isMobile]="isMobile"
          [mobileHidden]="showMobileChat && isMobile">
          
          <!-- Search Input -->
          <app-search-input slot="search"
            [(ngModel)]="filters.clientName"
            (search)="onClientNameChange()"
            placeholder="Search sessions..."
            [loading]="false">
          </app-search-input>
          
          <!-- Filters -->
          <div slot="filters" class="filters-container">
            <div class="filter-row">
              <app-dropdown
                [options]="statusFilterOptions"
                [selectedValue]="filters.status"
                placeholder="All Status"
                triggerIcon="fa-filter"
                (selectionChange)="onStatusFilterChange($event)">
              </app-dropdown>

              <div class="filter-actions">
                <button
                  class="btn-icon"
                  [class.active]="showAdvancedFilters"
                  (click)="showAdvancedFilters = !showAdvancedFilters"
                  title="Advanced filters"
                >
                  <i class="fas fa-calendar-alt"></i>
                </button>
                <button
                  class="btn-icon"
                  (click)="clearFilters()"
                  title="Clear filters"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <!-- Advanced Date Range Filter -->
            <div class="advanced-filters" *ngIf="showAdvancedFilters">
              <app-date-range-filter
                [startDate]="filters.dateFrom"
                [endDate]="filters.dateTo"
                (dateRangeChange)="onDateRangeChange($event)"
                (clear)="clearDateFilter()">
              </app-date-range-filter>
            </div>
          </div>
          
          <!-- Session List Items -->
          <div slot="list-items" class="sessions-scroll-container" #sessionsContainer>
            <app-list-item
              *ngFor="let session of sessions; trackBy: trackBySessionId"
              [data]="getListItemData(session)"
              (itemClick)="selectSession(session)">
            </app-list-item>
            
            <!-- Loading indicator for infinite scroll -->
            <div *ngIf="historyService.isLoadingSessions() && sessions.length > 0" class="loading-more-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading more sessions...</span>
            </div>
            
            <!-- End of list indicator -->
            <div *ngIf="!historyService.hasMoreSessions() && sessions.length > 0" class="end-of-list-indicator">
              <i class="fas fa-check-circle"></i>
              <span>All sessions loaded</span>
            </div>
          </div>
        </app-list-panel>
      </div>

      <!-- Main Content Area -->
      <div slot="main-content" class="chat-main-area" [class.mobile-hidden]="!showMobileChat && isMobile">
        <!-- Welcome Screen -->
        <div *ngIf="!selectedSession" class="welcome-screen">
          <div class="welcome-content">
            <i class="fas fa-history welcome-icon"></i>
            <h2>Sessions History</h2>
            <p>Select a session from the list to view its chat history</p>

            <div class="welcome-stats" *ngIf="pagination">
              <div class="stat-item">
                <div class="stat-number">{{ pagination.totalCount || 0 }}</div>
                <div class="stat-label">Total Sessions</div>
              </div>
            </div>

            <!-- Quick Actions for Admin -->
            <div *ngIf="currentUser?.role === 'ADMIN'" class="quick-actions">
              <button class="action-btn" (click)="showSearchTab()">
                <i class="fas fa-search"></i>
                Search Messages
              </button>
              <button class="action-btn" (click)="showStatsTab()">
                <i class="fas fa-chart-bar"></i>
                View Statistics
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="selectedSession" class="chat-container">
          <!-- Chat Header -->
          <div class="chat-header">
            <button class="back-btn" *ngIf="isMobile" (click)="closeMobileChat()">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div class="chat-header-info">
              <div class="chat-header-avatar">
                <div class="avatar-circle">
                  {{ selectedSession.client.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="chat-header-details">
                <h3 class="chat-title">{{ selectedSession.client.name }}</h3>
                <p class="chat-subtitle">
                  {{ "@" + (selectedSession.client.username || "N/A") }}
                  <span *ngIf="selectedSession.cs">
                    • CS: {{ selectedSession.cs.name }}</span
                  >
                </p>
              </div>
            </div>

            <div class="chat-header-actions">
              <span
                class="session-status"
                [class]="'status-' + selectedSession.status.toLowerCase()"
              >
                {{ selectedSession.status }}
              </span>
              <span class="session-date">{{
                formatDate(selectedSession.createdAt)
              }}</span>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="messages-area">
            <div class="messages-wrapper">
              <div
                *ngFor="let message of selectedSession.chats"
                class="message-wrapper"
                [class.outgoing]="message.senderType === 'CS'"
                [class.incoming]="message.senderType === 'CLIENT'"
              >
                <div class="message-bubble">
                  <div class="message-content">
                    <!-- Text messages -->
                    <p
                      *ngIf="message.messageType === 'TEXT'"
                      class="message-text"
                    >
                      {{ message.message }}
                    </p>

                    <!-- Media messages -->
                    <div
                      *ngIf="message.messageType === 'IMAGE'"
                      class="message-media"
                    >
                      <i class="fas fa-image"></i>
                      <span>{{ message.message }}</span>
                      <a
                        *ngIf="message.fileUrl"
                        [href]="message.fileUrl"
                        target="_blank"
                        class="media-link"
                        >View</a
                      >
                    </div>

                    <div
                      *ngIf="message.messageType === 'FILE'"
                      class="message-media"
                    >
                      <i class="fas fa-file"></i>
                      <span>{{ message.message }}</span>
                      <a
                        *ngIf="message.fileUrl"
                        [href]="message.fileUrl"
                        target="_blank"
                        class="media-link"
                        >Download</a
                      >
                    </div>

                    <div
                      *ngIf="message.messageType === 'VIDEO'"
                      class="message-media"
                    >
                      <i class="fas fa-video"></i>
                      <span>{{ message.message }}</span>
                      <a
                        *ngIf="message.fileUrl"
                        [href]="message.fileUrl"
                        target="_blank"
                        class="media-link"
                        >View</a
                      >
                    </div>

                    <div class="message-meta">
                      <span class="message-time">{{
                        formatTime(message.createdAt)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Session Info Footer -->
          <div class="message-input-area">
            <div class="session-summary">
              <span><i class="fas fa-comment"></i> {{ selectedSession.chats.length }} messages</span>
              <span *ngIf="selectedSession.endedAt">
                <i class="fas fa-clock"></i> {{ calculateDuration(selectedSession.createdAt, selectedSession.endedAt) }}
              </span>
              <span>
                <i class="fas fa-calendar"></i> {{ formatDateTime(selectedSession.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search/Stats Overlay -->
      <div class="overlay-panel" *ngIf="showOverlay" (click)="hideOverlay()">
        <div class="overlay-content" (click)="$event.stopPropagation()">
          <div class="overlay-header">
            <h3>
              <i *ngIf="overlayType === 'search'" class="fas fa-search"></i>
              <i *ngIf="overlayType === 'stats'" class="fas fa-chart-bar"></i>
              {{
                overlayType === "search"
                  ? "Search Messages"
                  : "CS Performance Statistics"
              }}
            </h3>
            <button class="btn-close" (click)="hideOverlay()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Search Content -->
          <div *ngIf="overlayType === 'search'" class="search-content">
            <div class="search-bar">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearchChange()"
                placeholder="Search messages..."
                class="search-input"
              />
              <i class="fas fa-search search-icon"></i>
            </div>

            <div class="search-results" *ngIf="searchResults.length > 0">
              <div
                *ngFor="let result of searchResults"
                class="search-result-item"
              >
                <div class="result-header">
                  <span
                    class="sender-type"
                    [class]="'sender-' + result.senderType.toLowerCase()"
                  >
                    {{ result.senderType === "CLIENT" ? "Client" : "CS" }}
                  </span>
                  <span class="result-date">{{
                    formatDate(result.createdAt)
                  }}</span>
                </div>
                <div
                  class="result-content"
                  [innerHTML]="highlightSearchTerm(result.message)"
                ></div>
                <button
                  class="view-btn"
                  (click)="viewSessionFromSearch(result)"
                >
                  View Session
                </button>
              </div>
            </div>

            <div class="loading" *ngIf="searchLoading">
              <div class="spinner"></div>
              <span>Searching...</span>
            </div>
          </div>

          <!-- Stats Content -->
          <div *ngIf="overlayType === 'stats'" class="stats-content">
            <div class="stats-filters">
              <input
                type="date"
                [(ngModel)]="statsFilters.dateFrom"
                (change)="loadCSStats()"
                class="filter-input"
              />
              <input
                type="date"
                [(ngModel)]="statsFilters.dateTo"
                (change)="loadCSStats()"
                class="filter-input"
              />
            </div>

            <div class="stats-grid" *ngIf="csStats.length > 0">
              <div *ngFor="let stat of csStats" class="stat-card">
                <div class="stat-header">
                  <h4>{{ stat.csName }}</h4>
                  <span class="stat-email">{{ stat.csEmail }}</span>
                </div>
                <div class="stat-metrics">
                  <div class="metric">
                    <div class="metric-value">{{ stat.totalSessions }}</div>
                    <div class="metric-label">Sessions</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">{{ stat.totalMessages }}</div>
                    <div class="metric-label">Messages</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">
                      {{ stat.avgSessionDurationMinutes }}m
                    </div>
                    <div class="metric-label">Avg Duration</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="loading" *ngIf="statsLoading">
              <div class="spinner"></div>
              <span>Loading statistics...</span>
            </div>
          </div>
        </div>
      </div>

    </app-sidebar-container>
  `,
  styleUrls: ["./history.component.css"],
})
export class HistoryComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sessionsContainer') sessionsContainer!: ElementRef<HTMLDivElement>;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private clientNameSubject = new Subject<string>();
  private sessionsScrollHandler = () => {}; // Will be overridden in setupSessionsScrollListener
  private currentScrollableElement: Element | null = null;

  currentUser: User | null = null;

  // Session history
  sessions: SessionHistoryItem[] = [];
  pagination: any = null;
  loading = false;
  filters = {
    status: "",
    clientName: "",
    dateFrom: "",
    dateTo: "",
  };

  // Selected session for chat view
  selectedSession: SessionDetails | null = null;

  // UI state
  showAdvancedFilters = false;
  showOverlay = false;
  overlayType: "search" | "stats" = "search";
  activeTab: "sessions" | "search" | "stats" = "sessions";

  // Mobile and sidebar state
  isMobile = false;
  showMobileMenu = false;
  showMobileChat = false;
  sidebarCollapsed = false;
  
  // Navigation and panel configurations
  navigationItems: NavigationItem[] = [
    { id: 'chats', icon: 'fa-comments', label: 'Chats' },
    { id: 'history', icon: 'fa-history', label: 'History', isActive: true },
    { id: 'clients', icon: 'fa-users', label: 'Clients' },
    { id: 'broadcast', icon: 'fa-bullhorn', label: 'Broadcast' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings', isVisible: false }
  ];
  
  historyListConfig: ListPanelConfig = {
    title: 'Session History',
    showSearch: true,
    showFilters: true,
    searchPlaceholder: 'Search sessions...',
    emptyStateIcon: 'fa-history',
    emptyStateTitle: 'No sessions found',
    emptyStateMessage: 'Try adjusting your filters'
  };

  // Search
  searchQuery = "";
  searchResults: SearchResult[] = [];
  searchPagination: any = null;
  searchLoading = false;
  currentSearchPage = 1;

  // CS Stats
  csStats: CSPerformanceStats[] = [];
  statsLoading = false;
  statsFilters = {
    dateFrom: "",
    dateTo: "",
  };

  // Filter options
  statusFilterOptions: DropdownOption[] = [
    { value: '', label: 'All Status', icon: 'fa-list' },
    { value: 'ACTIVE', label: 'Active Sessions', icon: 'fa-play-circle' },
    { value: 'ENDED', label: 'Ended Sessions', icon: 'fa-stop-circle' }
  ];

  constructor(
    public historyService: HistoryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkMobile();

    // Restore sidebar state from localStorage BEFORE setting up resize listener
    if (!this.isMobile) {
      const savedSidebarState = localStorage.getItem("sidebarCollapsed");
      if (savedSidebarState !== null) {
        this.sidebarCollapsed = JSON.parse(savedSidebarState);
      } else {
        this.sidebarCollapsed = false; // Default state
      }
    }

    window.addEventListener("resize", () => this.checkMobile());

    this.currentUser = this.authService.getCurrentUser();
    this.updateNavigationItems();

    // Setup search debouncing
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.performSearch(query);
      });

    // Setup client name filter debouncing
    this.clientNameSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    this.loadSessions();
  }

  ngAfterViewInit(): void {
    // Add a small delay to ensure the view is fully initialized
    setTimeout(() => {
      this.setupSessionsScrollListener();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up scroll listener
    if (this.currentScrollableElement && this.sessionsScrollHandler) {
      this.currentScrollableElement.removeEventListener('scroll', this.sessionsScrollHandler);
    }
  }

  private updateNavigationItems(): void {
    // Update navigation items based on user role
    this.navigationItems = [
      { id: 'chats', icon: 'fa-comments', label: 'Chats' },
      { id: 'history', icon: 'fa-history', label: 'History', isActive: true },
      { id: 'clients', icon: 'fa-users', label: 'Clients' },
      { id: 'broadcast', icon: 'fa-bullhorn', label: 'Broadcast' },
      { id: 'settings', icon: 'fa-cog', label: 'Settings', isVisible: this.currentUser?.role === 'ADMIN' }
    ];
  }
  
  onNavigationItemClick(item: NavigationItem): void {
    if (item.id === 'chats') {
      this.navigateToDashboard();
    } else if (item.id === 'clients') {
      this.navigateToClients();
    } else if (item.id === 'broadcast') {
      this.navigateToBroadcast();
    } else if (item.id === 'settings') {
      this.setActiveMenuTab('settings');
    }
  }
  
  getListItemData(session: SessionHistoryItem): ListItemData {
    return {
      id: session.id,
      title: session.client.name,
      subtitle: session.cs ? `CS: ${session.cs.name}` : 'Unassigned',
      time: this.formatTime(session.createdAt),
      avatarName: session.client.name,
      isActive: this.selectedSession?.id === session.id,
      badges: [
        { text: session._count.chats.toString(), type: 'count' as const, variant: 'messages' },
        ...(session.status === 'ACTIVE' ? [{ text: 'Active', type: 'status' as const, variant: 'active' }] : []),
        ...(session.status === 'ENDED' ? [{ text: 'Ended', type: 'status' as const, variant: 'ended' }] : [])
      ]
    };
  }

  setActiveTab(tab: "sessions" | "search" | "stats"): void {
    this.activeTab = tab;

    if (tab === "stats" && this.currentUser?.role === "ADMIN") {
      this.loadCSStats();
    }
  }

  loadSessions(page: number = 1): void {
    this.loading = true;

    const filters = {
      status: this.filters.status as "ACTIVE" | "ENDED" | undefined,
      clientName: this.filters.clientName || undefined,
      dateFrom: this.filters.dateFrom || undefined,
      dateTo: this.filters.dateTo || undefined,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) =>
        filters[key as keyof typeof filters] === undefined &&
        delete filters[key as keyof typeof filters]
    );

    // Reset sessions and load initial page with infinite scroll
    this.historyService.resetSessions();
    
    this.historyService
      .loadInitialSessions(15, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Initial history sessions loaded:', response.sessions.length, 'of', response.pagination.totalCount);
          this.sessions = response.sessions;
          this.pagination = response.pagination;
          this.historyService.updateSessionsFromResponse(response, false); // false = not appending
          this.loading = false;
        },
        error: (error) => {
          console.error("Error loading sessions:", error);
          this.loading = false;
          this.historyService.setLoadingSessions(false);
        },
      });
  }

  private loadMoreSessions(): void {
    if (this.historyService.isLoadingSessions() || !this.historyService.hasMoreSessions()) {
      return;
    }

    console.log('Loading more history sessions...');

    const filters = {
      status: this.filters.status as "ACTIVE" | "ENDED" | undefined,
      clientName: this.filters.clientName || undefined,
      dateFrom: this.filters.dateFrom || undefined,
      dateTo: this.filters.dateTo || undefined,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) =>
        filters[key as keyof typeof filters] === undefined &&
        delete filters[key as keyof typeof filters]
    );
    
    this.historyService.loadMoreSessions(filters).subscribe({
      next: (response) => {
        if (response) {
          console.log('More history sessions loaded:', response.sessions.length, 'more sessions');
          // Update the local sessions array
          this.sessions = [...this.sessions, ...response.sessions];
          this.pagination = response.pagination;
          this.historyService.updateSessionsFromResponse(response, true); // true = appending
        }
      },
      error: (error) => {
        console.error('Error loading more history sessions:', error);
        this.historyService.setLoadingSessions(false);
      }
    });
  }

  applyFilters(): void {
    this.loadSessions(1);
  }

  clearFilters(): void {
    this.filters = {
      status: "",
      clientName: "",
      dateFrom: "",
      dateTo: "",
    };
    this.loadSessions(1);
  }

  onClientNameChange(): void {
    this.clientNameSubject.next(this.filters.clientName);
  }

  onStatusFilterChange(value: string): void {
    this.filters.status = value;
    this.applyFilters();
  }

  onDateRangeChange(dateRange: DateRange): void {
    this.filters.dateFrom = dateRange.startDate;
    this.filters.dateTo = dateRange.endDate;
    this.applyFilters();
  }

  clearDateFilter(): void {
    this.filters.dateFrom = '';
    this.filters.dateTo = '';
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.loadSessions(page);
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  performSearch(query: string, page: number = 1): void {
    if (!query.trim()) {
      this.searchResults = [];
      this.searchPagination = null;
      return;
    }

    this.searchLoading = true;
    this.currentSearchPage = page;

    this.historyService
      .searchChatHistory(query, page, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.searchResults = response.results;
          this.searchPagination = response.pagination;
          this.searchLoading = false;
        },
        error: (error) => {
          console.error("Error searching messages:", error);
          this.searchLoading = false;
        },
      });
  }

  goToSearchPage(page: number): void {
    this.performSearch(this.searchQuery, page);
  }

  highlightSearchTerm(text: string): string {
    if (!this.searchQuery) return text;

    const regex = new RegExp(`(${this.searchQuery})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  loadCSStats(): void {
    if (this.currentUser?.role !== "ADMIN") return;

    this.statsLoading = true;

    this.historyService
      .getCSPerformanceStats(
        this.statsFilters.dateFrom || undefined,
        this.statsFilters.dateTo || undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.csStats = response.stats;
          this.statsLoading = false;
        },
        error: (error) => {
          console.error("Error loading CS stats:", error);
          this.statsLoading = false;
        },
      });
  }

  // Alias for backward compatibility
  viewSessionDetails(session: SessionHistoryItem): void {
    this.selectSession(session);
  }

  viewSessionFromSearch(result: SearchResult): void {
    this.viewSessionDetails(result.session);
  }

  closeSessionDetails(): void {
    this.selectedSession = null;
  }

  goBack(): void {
    this.router.navigate(["/dashboard"]);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  }

  // New methods for chat-like interface
  // selectSession method moved to the end with mobile support

  showSearchTab(): void {
    this.overlayType = "search";
    this.showOverlay = true;
  }

  showStatsTab(): void {
    this.overlayType = "stats";
    this.showOverlay = true;
    this.loadCSStats();
  }

  hideOverlay(): void {
    this.showOverlay = false;
  }

  // Navigation methods
  navigateToDashboard(): void {
    if (this.isMobile) {
      this.showMobileMenu = false;
    }
    this.router.navigate(["/dashboard"]);
  }

  navigateToClients(): void {
    if (this.isMobile) {
      this.showMobileMenu = false;
    }
    this.router.navigate(["/clients"]);
  }

  navigateToBroadcast(): void {
    if (this.isMobile) {
      this.showMobileMenu = false;
    }
    this.router.navigate(["/broadcast"]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/auth/login"]);
  }

  // UI and Mobile methods
  checkMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;

    // If switching from mobile to desktop, hide mobile menu and restore sidebar state
    if (wasMobile && !this.isMobile) {
      this.showMobileMenu = false;
      // Restore sidebar state from localStorage when switching to desktop
      const savedSidebarState = localStorage.getItem("sidebarCollapsed");
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
      localStorage.setItem(
        "sidebarCollapsed",
        JSON.stringify(this.sidebarCollapsed)
      );
    }
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileChat(): void {
    this.showMobileChat = false;
  }

  setActiveMenuTab(tab: string): void {
    // Handle navigation or tab switching as needed
    if (tab === "settings") {
      // Could implement settings navigation here
    }
  }

  // Override the existing selectSession method to support mobile
  selectSession(sessionOrData: SessionHistoryItem | any): void {
    // Handle both SessionHistoryItem and ListItemData
    const sessionId = typeof sessionOrData === 'object' && 'id' in sessionOrData ? sessionOrData.id : sessionOrData;
    const session = typeof sessionOrData === 'object' && 'client' in sessionOrData ? sessionOrData : this.sessions.find(s => s.id === sessionId);
    
    if (!session) return;
    
    this.historyService
      .getSessionDetails(session.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.selectedSession = details;

          // Show mobile chat view on mobile
          if (this.isMobile) {
            this.showMobileChat = true;
          }
        },
        error: (error) => {
          console.error("Error loading session details:", error);
        },
      });
  }

  trackBySessionId(index: number, session: any): string {
    return session.id;
  }

  formatChatTime(date?: string): string {
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

  private setupSessionsScrollListener(): void {
    if (!this.sessionsContainer?.nativeElement) {
      console.warn('Sessions container not available for scroll listener setup');
      return;
    }
    
    // Find the scrollable parent element (list panel content area)
    let scrollableElement = this.sessionsContainer.nativeElement.parentElement;
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
      this.currentScrollableElement.removeEventListener('scroll', this.sessionsScrollHandler);
    }
    this.currentScrollableElement = scrollableElement;
    
    console.log('Setting up history sessions scroll listener with initial state:', {
      hasMoreSessions: this.historyService.hasMoreSessions(),
      sessionsCount: this.sessions.length,
      scrollHeight: scrollableElement.scrollHeight,
      clientHeight: scrollableElement.clientHeight,
      canScroll: scrollableElement.scrollHeight > scrollableElement.clientHeight
    });
    
    // Create the scroll handler for sessions
    this.sessionsScrollHandler = () => {
      // Debounce scroll events for performance
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        const scrollTop = scrollableElement!.scrollTop;
        const scrollHeight = scrollableElement!.scrollHeight;
        const clientHeight = scrollableElement!.clientHeight;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold from bottom
        
        // Debug scroll position
        console.log('History sessions scroll event:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          isNearBottom,
          hasMoreSessions: this.historyService.hasMoreSessions(),
          isLoading: this.historyService.isLoadingSessions(),
          sessionsCount: this.sessions.length,
          canScroll: scrollHeight > clientHeight
        });
        
        // Check if user scrolled to bottom and all conditions are met
        if (isNearBottom && 
            this.historyService.hasMoreSessions() && 
            !this.historyService.isLoadingSessions() &&
            scrollHeight > clientHeight) { // Ensure container is actually scrollable
          console.log('Triggering loadMoreSessions...');
          this.loadMoreSessions();
        }
      }, 150); // Debounce time for better responsiveness
    };
    
    scrollableElement.addEventListener('scroll', this.sessionsScrollHandler);
    
    // Also trigger an initial check in case the container is not scrollable yet
    setTimeout(() => {
      if (scrollableElement!.scrollHeight <= scrollableElement!.clientHeight && 
          this.historyService.hasMoreSessions() && 
          !this.historyService.isLoadingSessions()) {
        console.log('History sessions container not scrollable, loading more sessions automatically');
        this.loadMoreSessions();
      }
    }, 200);
  }
}
