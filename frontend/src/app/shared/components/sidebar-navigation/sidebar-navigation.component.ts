import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../models';

export interface NavigationItem {
  id: string;
  icon: string;
  label: string;
  routerLink: string;
  isVisible?: boolean;
  exactMatch?: boolean;
}

@Component({
  selector: 'app-sidebar-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="menu-sidebar" 
         [class.collapsed]="collapsed && !isMobile"
         [class.mobile-hidden]="!showMobileMenu && isMobile">
      <div class="menu-header">
        <div class="user-avatar">
          {{ currentUser?.name?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <div class="user-info" *ngIf="!collapsed || isMobile">
          <span class="user-name">{{ currentUser?.name }}</span>
          <span class="user-role">{{ currentUser?.role }}</span>
        </div>
      </div>
      
      <div class="menu-items">
        <a *ngFor="let item of navigationItems; trackBy: trackByItemId" 
           class="menu-item" 
           [routerLink]="item.routerLink"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: item.exactMatch || false }"
           [title]="collapsed ? item.label : ''"
           [style.display]="item.isVisible === false ? 'none' : 'flex'"
           (click)="onItemClick(item)">
          <i [class]="'fas ' + item.icon + ' menu-icon'"></i>
          <span class="menu-label" *ngIf="!collapsed || isMobile">{{ item.label }}</span>
        </a>
      </div>

      <div class="menu-footer">
        <div class="menu-item logout-btn" 
             (click)="onLogout()"
             [title]="collapsed ? 'Logout' : ''">
          <i class="fas fa-sign-out-alt menu-icon"></i>
          <span class="menu-label" *ngIf="!collapsed || isMobile">Logout</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-sidebar {
      width: 200px;
      height: 100vh;
      background: #232e3c;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #2b374a;
      z-index: 1001;
      transition: width 0.3s ease;
      overflow: hidden;
    }

    .menu-sidebar.collapsed {
      width: 64px;
    }

    .menu-header {
      padding: 16px;
      border-bottom: 1px solid #2b374a;
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 72px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #5288c1;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .user-name {
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      color: #8696a8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .menu-items {
      flex: 1;
      padding: 12px 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin: 4px 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      color: #b8c5d1;
      gap: 12px;
      white-space: nowrap;
      text-decoration: none;
      font-weight: 500;
    }

    a.menu-item {
      color: #b8c5d1;
      text-decoration: none;
    }

    .menu-sidebar.collapsed .menu-item {
      justify-content: center;
      padding: 12px 8px;
    }

    .menu-item:hover {
      background: #2b374a;
      color: #ffffff;
    }

    .menu-item.active {
      background: #5288c1;
      color: #ffffff;
      font-weight: 600;
    }

    .menu-icon {
      font-size: 18px;
      flex-shrink: 0;
      width: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .menu-label {
      font-size: 14px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-footer {
      border-top: 1px solid #2b374a;
      padding: 12px 0;
    }

    .logout-btn:hover {
      background: #d32f2f !important;
      color: white !important;
    }

    @media (max-width: 768px) {
      .mobile-hidden {
        display: none !important;
      }

      .menu-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 280px !important;
        z-index: 1002;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .menu-sidebar:not(.mobile-hidden) {
        transform: translateX(0);
      }

      .menu-sidebar.collapsed {
        width: 280px !important;
      }

      .menu-sidebar .menu-label {
        display: block !important;
      }

      .menu-sidebar .user-info {
        display: flex !important;
      }
    }
  `]
})
export class SidebarNavigationComponent {
  @Input() currentUser: User | null = null;
  @Input() navigationItems: NavigationItem[] = [];
  @Input() collapsed = false;
  @Input() isMobile = false;
  @Input() showMobileMenu = false;

  @Output() itemClick = new EventEmitter<NavigationItem>();
  @Output() logout = new EventEmitter<void>();

  onItemClick(item: NavigationItem): void {
    this.itemClick.emit(item);
  }

  onLogout(): void {
    this.logout.emit();
  }

  trackByItemId(index: number, item: NavigationItem): string {
    return item.id;
  }
}