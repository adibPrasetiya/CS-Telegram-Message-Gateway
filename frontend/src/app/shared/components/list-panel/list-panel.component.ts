import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ListPanelConfig {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  showFilters?: boolean;
  showPagination?: boolean;
  emptyStateIcon?: string;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
}

@Component({
  selector: 'app-list-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list-panel" 
         [class.mobile-hidden]="mobileHidden && isMobile"
         [style.width]="width">
      
      <!-- Header Section -->
      <div class="panel-header" *ngIf="config.title || config.showSearch || config.showFilters">
        <!-- Title -->
        <h2 *ngIf="config.title" class="panel-title">
          <i *ngIf="titleIcon" [class]="'fas ' + titleIcon"></i>
          {{ config.title }}
        </h2>

        <!-- Search Container -->
        <div class="search-container" *ngIf="config.showSearch">
          <ng-content select="[slot=search]"></ng-content>
        </div>

        <!-- Filters Container -->
        <div class="filters-container" *ngIf="config.showFilters">
          <ng-content select="[slot=filters]"></ng-content>
        </div>
      </div>

      <!-- List Content -->
      <div class="list-content" [class.loading]="loading">
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-indicator">
          <div class="spinner"></div>
          <span>{{ loadingMessage || 'Loading...' }}</span>
        </div>
        
        <!-- List Items -->
        <div *ngIf="!loading && !showEmptyState" class="list-items">
          <ng-content select="[slot=list-items]"></ng-content>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && showEmptyState" class="empty-state">
          <i [class]="'fas ' + (config.emptyStateIcon || 'fa-inbox') + ' empty-icon'"></i>
          <h4>{{ config.emptyStateTitle || 'No items found' }}</h4>
          <p>{{ config.emptyStateMessage || 'No items available' }}</p>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="panel-footer" *ngIf="config.showPagination || hasFooterContent">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .list-panel {
      width: 360px;
      height: 100vh;
      background: #0e1621;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #2b374a;
      transition: margin-left 0.3s ease;
    }

    .panel-header {
      border-bottom: 1px solid #2b374a;
      flex-shrink: 0;
    }

    .panel-title {
      padding: 20px;
      margin: 0;
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #2b374a;
    }

    .panel-title i {
      color: #5288c1;
      font-size: 20px;
    }

    .search-container {
      padding: 20px 20px 16px 20px;
    }

    .filters-container {
      padding: 0 20px 16px 20px;
    }

    .list-content {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .list-content::-webkit-scrollbar {
      width: 4px;
    }

    .list-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .list-content::-webkit-scrollbar-thumb {
      background: #2b374a;
      border-radius: 2px;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #8696a8;
      flex-direction: column;
      gap: 12px;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #2b374a;
      border-top: 2px solid #5288c1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .list-items {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
      color: #8696a8;
      min-height: 200px;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #8696a8;
      opacity: 0.7;
    }

    .empty-state h4 {
      color: #ffffff;
      margin-bottom: 8px;
      font-size: 16px;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .panel-footer {
      border-top: 1px solid #2b374a;
      flex-shrink: 0;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .mobile-hidden {
        display: none !important;
      }

      .list-panel {
        width: 100% !important;
      }

      .panel-title {
        font-size: 16px;
        padding: 16px 20px;
      }

      .search-container {
        padding: 16px 20px 12px 20px;
      }

      .filters-container {
        padding: 0 20px 12px 20px;
      }

      .empty-state {
        padding: 30px 15px;
        min-height: 150px;
      }

      .empty-icon {
        font-size: 40px;
      }
      
      .empty-state h4 {
        font-size: 15px;
      }
      
      .empty-state p {
        font-size: 13px;
      }
    }

    @media (max-width: 480px) {
      .panel-title {
        font-size: 15px;
        padding: 14px 16px;
      }

      .search-container {
        padding: 12px 16px 8px 16px;
      }

      .filters-container {
        padding: 0 16px 8px 16px;
      }
    }
  `]
})
export class ListPanelComponent {
  @Input() config: ListPanelConfig = {};
  @Input() width = '360px';
  @Input() loading = false;
  @Input() loadingMessage?: string;
  @Input() showEmptyState = false;
  @Input() titleIcon?: string;
  @Input() isMobile = false;
  @Input() mobileHidden = false;
  @Input() hasFooterContent = false;

  @Output() itemClick = new EventEmitter<any>();
}