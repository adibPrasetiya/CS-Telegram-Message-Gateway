import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { BotConfigService, BotConfig } from '../shared/services/bot-config.service';

interface SettingsMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  isActive: boolean;
  isEnabled: boolean;
  statusIndicator?: {
    type: 'success' | 'warning' | 'error';
    text: string;
  };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="settings-container">
  <!-- Sidebar Menu -->
  <div class="menu-sidebar">
    <div class="sidebar-header">
      <i class="fas fa-cog"></i>
      <h3>Settings</h3>
    </div>
    
    <div class="panel-list">
      <div 
        *ngFor="let item of menuItems" 
        class="panel-item" 
        [class.active]="item.isActive"
        [class.disabled]="!item.isEnabled"
        (click)="navigateToSection(item)">
        
        <div class="panel-icon">
          <i [class]="item.icon"></i>
        </div>
        
        <div class="panel-content">
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </div>
        
        <div class="panel-status" *ngIf="item.statusIndicator">
          <div 
            class="status-dot" 
            [class.connected]="item.statusIndicator.type === 'success'"
            [class.warning]="item.statusIndicator.type === 'warning'"
            [class.disconnected]="item.statusIndicator.type === 'error'">
          </div>
        </div>
        
        <div class="panel-status" *ngIf="!item.isEnabled">
          <div class="coming-soon">Soon</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="main-content">
    <!-- Welcome Section (when no specific route is active) -->
    <div class="welcome-section" *ngIf="showWelcome">
      <div>
        <i class="fas fa-cog welcome-icon"></i>
        <h2>Settings</h2>
        <p>Select a configuration option from the sidebar to get started</p>
      </div>
    </div>

    <!-- Router Outlet for Feature Components -->
    <div class="feature-container" *ngIf="!showWelcome">
      <router-outlet></router-outlet>
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

    .status-dot.warning {
      background: #ffc107;
      box-shadow: 0 0 8px rgba(255, 193, 7, 0.4);
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

    .feature-container {
      flex: 1;
      height: 100%;
      overflow: hidden;
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
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  menuItems: SettingsMenuItem[] = [];
  showWelcome = true;
  botConfig: BotConfig | null = null;

  constructor(
    private router: Router,
    private botConfigService: BotConfigService
  ) {}

  ngOnInit(): void {
    this.initializeMenuItems();
    this.loadBotConfiguration();
    this.setupRouterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeMenuItems(): void {
    this.menuItems = [
      {
        id: 'bot-configuration',
        title: 'Bot Configuration',
        description: 'Telegram bot setup and notifications',
        icon: 'fab fa-telegram-plane',
        route: '/settings/bot-configuration',
        isActive: false,
        isEnabled: true,
        statusIndicator: {
          type: 'error',
          text: 'Not connected'
        }
      },
      {
        id: 'notification-rules',
        title: 'Notification Rules',
        description: 'Customize alert preferences',
        icon: 'fas fa-bell',
        route: '/settings/notification-rules',
        isActive: false,
        isEnabled: true,
        statusIndicator: {
          type: 'error',
          text: 'Disabled'
        }
      },
      {
        id: 'user-management',
        title: 'User Management',
        description: 'Manage user accounts and permissions',
        icon: 'fas fa-users',
        route: '/settings/user-management',
        isActive: false,
        isEnabled: true,
        statusIndicator: {
          type: 'success',
          text: 'Active'
        }
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        description: 'Application configuration',
        icon: 'fas fa-server',
        route: '/settings/system-settings',
        isActive: false,
        isEnabled: false
      },
      {
        id: 'security',
        title: 'Security',
        description: 'Authentication and access control',
        icon: 'fas fa-shield-alt',
        route: '/settings/security',
        isActive: false,
        isEnabled: false
      }
    ];
  }

  private loadBotConfiguration(): void {
    this.botConfigService.getBotConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.botConfig = config;
          this.updateBotConfigStatus(config);
        },
        error: (error) => {
          console.error('Error loading bot configuration:', error);
        }
      });
  }

  private updateBotConfigStatus(config: BotConfig): void {
    const botConfigItem = this.menuItems.find(item => item.id === 'bot-configuration');
    const notificationItem = this.menuItems.find(item => item.id === 'notification-rules');
    
    if (botConfigItem) {
      if (config.isConnected && config.isGroupConfigured) {
        botConfigItem.statusIndicator = { type: 'success', text: 'Fully configured' };
      } else if (config.isConnected) {
        botConfigItem.statusIndicator = { type: 'warning', text: 'Bot connected' };
      } else {
        botConfigItem.statusIndicator = { type: 'error', text: 'Not connected' };
      }
    }

    if (notificationItem) {
      if (config.notificationsEnabled) {
        notificationItem.statusIndicator = { type: 'success', text: 'Enabled' };
      } else {
        notificationItem.statusIndicator = { type: 'error', text: 'Disabled' };
      }
    }
  }

  private setupRouterListener(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.updateActiveMenuItem(event.url);
        this.showWelcome = event.url === '/settings' || event.url === '/settings/';
      });
    
    // Set initial state
    this.updateActiveMenuItem(this.router.url);
    this.showWelcome = this.router.url === '/settings' || this.router.url === '/settings/';
  }

  private updateActiveMenuItem(url: string): void {
    this.menuItems.forEach(item => {
      item.isActive = url.includes(item.id);
    });
  }

  navigateToSection(item: SettingsMenuItem): void {
    if (!item.isEnabled) return;
    
    this.router.navigate([item.route]);
  }
}