import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar-circle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-circle" 
         [class.online]="isOnline"
         [class.large]="size === 'large'"
         [class.small]="size === 'small'"
         [style.background-color]="backgroundColor">
      <span class="avatar-text">{{ displayText }}</span>
    </div>
  `,
  styles: [`
    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #5288c1;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 16px;
      position: relative;
      flex-shrink: 0;
    }

    .avatar-circle.small {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }

    .avatar-circle.large {
      width: 64px;
      height: 64px;
      font-size: 20px;
    }

    .avatar-circle.online::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #4caf50;
      border: 2px solid #0e1621;
      border-radius: 50%;
    }

    .avatar-circle.small.online::after {
      width: 8px;
      height: 8px;
      bottom: 1px;
      right: 1px;
      border-width: 1px;
    }

    .avatar-circle.large.online::after {
      width: 16px;
      height: 16px;
      bottom: 3px;
      right: 3px;
      border-width: 3px;
    }

    .avatar-text {
      user-select: none;
    }
  `]
})
export class AvatarCircleComponent {
  @Input() name = '';
  @Input() isOnline = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() backgroundColor?: string;

  get displayText(): string {
    if (!this.name) return 'U';
    return this.name.charAt(0).toUpperCase();
  }
}