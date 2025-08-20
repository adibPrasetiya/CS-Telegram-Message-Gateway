import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusBadgeType = 'active' | 'inactive' | 'ended' | 'pending' | 'online' | 'offline';
export type StatusBadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge" 
          [class]="'status-' + status"
          [class.small]="size === 'small'"
          [class.large]="size === 'large'"
          [title]="tooltip">
      <i *ngIf="showIcon" [class]="iconClass"></i>
      {{ displayText }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      background: #2b374a;
      color: #8696a8;
      white-space: nowrap;
      font-weight: 500;
    }

    .status-badge.small {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 8px;
    }

    .status-badge.large {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 12px;
    }

    .status-badge.status-active {
      background: #4caf50;
      color: white;
    }

    .status-badge.status-online {
      background: #4caf50;
      color: white;
    }

    .status-badge.status-inactive {
      background: #757575;
      color: white;
    }

    .status-badge.status-offline {
      background: #757575;
      color: white;
    }

    .status-badge.status-ended {
      background: #f44336;
      color: white;
    }

    .status-badge.status-pending {
      background: #ff9800;
      color: white;
    }

    .status-badge i {
      font-size: 0.9em;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: StatusBadgeType = 'inactive';
  @Input() size: StatusBadgeSize = 'medium';
  @Input() showIcon = false;
  @Input() customText?: string;
  @Input() tooltip?: string;

  get displayText(): string {
    if (this.customText) return this.customText;
    
    switch (this.status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'ended': return 'Ended';
      case 'pending': return 'Pending';
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  }

  get iconClass(): string {
    switch (this.status) {
      case 'active':
      case 'online':
        return 'fas fa-circle';
      case 'inactive':
      case 'offline':
        return 'fas fa-circle';
      case 'ended':
        return 'fas fa-times-circle';
      case 'pending':
        return 'fas fa-clock';
      default:
        return 'fas fa-question-circle';
    }
  }
}