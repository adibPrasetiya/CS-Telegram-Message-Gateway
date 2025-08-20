import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="telegram-layout">
      <!-- Sidebar Toggle Button -->
      <button 
        class="sidebar-toggle-btn" 
        [class.mobile-chat-active]="showMobileContent && isMobile"
        (click)="onToggleSidebar()"
        [title]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <i class="fas fa-bars toggle-icon" [class.collapsed]="collapsed"></i>
      </button>

      <!-- Navigation Sidebar -->
      <ng-content select="[slot=navigation]"></ng-content>

      <!-- Content Panels -->
      <ng-content select="[slot=content-panels]"></ng-content>

      <!-- Main Content Area -->
      <ng-content select="[slot=main-content]"></ng-content>

      <!-- Mobile Overlay -->
      <div 
        *ngIf="isMobile && showMobileMenu" 
        class="mobile-overlay" 
        (click)="onToggleMobileMenu()"
      ></div>
    </div>
  `,
  styles: [`
    .telegram-layout {
      display: flex;
      height: 100vh;
      background: #17212b;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
    }

    .sidebar-toggle-btn {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1003;
      background: #232e3c;
      border: none;
      border-radius: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .sidebar-toggle-btn.mobile-chat-active {
      top: 80px;
    }

    .sidebar-toggle-btn:hover {
      background: #2b374a;
      transform: scale(1.05);
    }

    .toggle-icon {
      color: #ffffff;
      font-size: 18px;
      transition: transform 0.3s ease;
    }

    .toggle-icon.collapsed {
      transform: rotate(180deg);
    }

    .mobile-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1001;
    }

    @media (max-width: 768px) {
      .sidebar-toggle-btn {
        top: 12px;
        left: 12px;
        width: 36px;
        height: 36px;
      }
    }
  `]
})
export class SidebarContainerComponent {
  @Input() collapsed = false;
  @Input() isMobile = false;
  @Input() showMobileMenu = false;
  @Input() showMobileContent = false;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleMobileMenu = new EventEmitter<void>();

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleMobileMenu(): void {
    this.toggleMobileMenu.emit();
  }
}