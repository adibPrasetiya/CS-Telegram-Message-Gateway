import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../shared/services/auth.service';
import { SocketService } from '../shared/services/socket.service';
import { User } from '../shared/models';
import { NavigationItem } from '../shared/components/sidebar-navigation/sidebar-navigation.component';
import { 
  SidebarContainerComponent, 
  SidebarNavigationComponent
} from '../shared/components';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    SidebarContainerComponent,
    SidebarNavigationComponent
  ],
  template: `
    <app-sidebar-container
      [collapsed]="sidebarCollapsed"
      [isMobile]="isMobile"
      [showMobileMenu]="showMobileMenu"
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

      <!-- Main Content Area -->
      <div slot="main-content" class="main-content">
        <router-outlet></router-outlet>
      </div>


    </app-sidebar-container>
  `,
  styles: [`
    .main-content {
      flex: 1;
      height: 100vh;
      overflow-y: auto;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  
  // UI State
  isMobile = false;
  showMobileMenu = false;
  sidebarCollapsed = false;
  
  // Navigation configuration
  navigationItems: NavigationItem[] = [
    { id: 'chats', icon: 'fa-comments', label: 'Chats', routerLink: '/dashboard/chats' },
    { id: 'history', icon: 'fa-history', label: 'History', routerLink: '/dashboard/history' },
    { id: 'clients', icon: 'fa-users', label: 'Clients', routerLink: '/dashboard/clients' },
    { id: 'broadcast', icon: 'fa-bullhorn', label: 'Broadcast', routerLink: '/dashboard/broadcast' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings', routerLink: '/dashboard/settings', isVisible: false }
  ];


  constructor(
    private authService: AuthService,
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

    // Socket connection is now handled at app level
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
    window.removeEventListener('resize', () => this.checkMobile());
  }

  // Socket connection is handled at the application level
  // Individual components will handle their own socket listeners

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
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

  onNavigationItemClick(item: NavigationItem): void {
    // Close mobile menu if open (router navigation handled by routerLink)
    if (this.isMobile) {
      this.showMobileMenu = false;
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
    // Update navigation items visibility based on user role
    this.navigationItems = [
      { id: 'chats', icon: 'fa-comments', label: 'Chats', routerLink: '/dashboard/chats' },
      { id: 'history', icon: 'fa-history', label: 'History', routerLink: '/dashboard/history' },
      { id: 'clients', icon: 'fa-users', label: 'Clients', routerLink: '/dashboard/clients' },
      { id: 'broadcast', icon: 'fa-bullhorn', label: 'Broadcast', routerLink: '/dashboard/broadcast' },
      { id: 'settings', icon: 'fa-cog', label: 'Settings', routerLink: '/dashboard/settings', isVisible: this.currentUser?.role === 'ADMIN' }
    ];
  }
}