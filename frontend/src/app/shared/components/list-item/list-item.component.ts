import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarCircleComponent } from '../avatar-circle/avatar-circle.component';
import { StatusBadgeComponent, StatusBadgeType } from '../status-badge/status-badge.component';

export interface ListItemData {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  time?: string;
  avatarName?: string;
  isOnline?: boolean;
  status?: string;
  badges?: Array<{
    text: string;
    type: 'count' | 'status';
    variant?: string;
  }>;
  isActive?: boolean;
  customData?: any;
}

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [CommonModule, AvatarCircleComponent, StatusBadgeComponent],
  template: `
    <div class="list-item"
         [class.active]="data.isActive"
         [class.unread]="hasUnreadBadge"
         (click)="onClick()">
      
      <!-- Avatar Section -->
      <div class="item-avatar" *ngIf="data.avatarName">
        <app-avatar-circle
          [name]="data.avatarName"
          [isOnline]="data.isOnline || false">
        </app-avatar-circle>
      </div>
      
      <!-- Content Section -->
      <div class="item-content">
        <div class="item-header">
          <h4 class="item-title">{{ data.title }}</h4>
          <span class="item-time" *ngIf="data.time">{{ data.time }}</span>
        </div>
        
        <div class="item-body" *ngIf="data.subtitle || data.description || hasBadges">
          <div class="item-text">
            <p class="item-subtitle" *ngIf="data.subtitle">{{ data.subtitle }}</p>
            <p class="item-description" *ngIf="data.description">
              <span [innerHTML]="data.description"></span>
            </p>
          </div>
          
          <div class="item-badges" *ngIf="hasBadges">
            <ng-container *ngFor="let badge of data.badges">
              <span *ngIf="badge.type === 'count'" 
                    class="count-badge"
                    [class]="badge.variant">
                {{ badge.text }}
              </span>
              <app-status-badge *ngIf="badge.type === 'status'"
                               [status]="getStatusType(badge.variant)"
                               [customText]="badge.text">
              </app-status-badge>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Custom Content Slot -->
      <div class="item-custom" *ngIf="hasCustomContent">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .list-item {
      display: flex;
      padding: 12px 20px;
      cursor: pointer;
      transition: background-color 0.15s;
      border-left: 3px solid transparent;
      gap: 12px;
    }

    .list-item:hover {
      background: #151e27;
    }

    .list-item.active {
      background: #151e27;
      border-left-color: #5288c1;
    }

    .list-item.unread {
      background: #0f1419;
    }

    .item-avatar {
      flex-shrink: 0;
    }

    .item-content {
      flex: 1;
      min-width: 0;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .item-title {
      color: #ffffff;
      font-size: 15px;
      font-weight: 500;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-time {
      color: #8696a8;
      font-size: 13px;
      white-space: nowrap;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .item-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .item-text {
      flex: 1;
      min-width: 0;
    }

    .item-subtitle {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-description {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-badges {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .count-badge {
      background: #5288c1;
      color: white;
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 12px;
      min-width: 20px;
      text-align: center;
    }

    .count-badge.unread {
      background: #5288c1;
    }

    .count-badge.messages {
      background: #8696a8;
    }

    .item-custom {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .list-item {
        padding: 10px 16px;
      }

      .item-title {
        font-size: 14px;
      }

      .item-subtitle,
      .item-description {
        font-size: 13px;
      }

      .item-time {
        font-size: 12px;
      }
    }
  `]
})
export class ListItemComponent {
  @Input() data!: ListItemData;
  @Input() hasCustomContent = false;

  @Output() itemClick = new EventEmitter<ListItemData>();

  get hasBadges(): boolean {
    return !!(this.data.badges && this.data.badges.length > 0);
  }

  get hasUnreadBadge(): boolean {
    return this.data.badges?.some(badge => 
      badge.type === 'count' && badge.variant === 'unread'
    ) || false;
  }

  onClick(): void {
    this.itemClick.emit(this.data);
  }
  
  getStatusType(variant?: string): StatusBadgeType {
    // Map variant strings to valid StatusBadgeType values
    switch (variant) {
      case 'active': return 'active';
      case 'ended': return 'ended';
      case 'inactive': return 'inactive';
      case 'pending': return 'pending';
      case 'online': return 'online';
      case 'offline': return 'offline';
      default: return 'inactive';
    }
  }
}