import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" 
         class="toast" 
         [class]="'toast-' + type"
         [class.toast-dismissible]="dismissible">
      <div class="toast-content">
        <i class="toast-icon" [class]="iconClass"></i>
        <div class="toast-body">
          <div *ngIf="title" class="toast-title">{{ title }}</div>
          <div class="toast-message">{{ message }}</div>
        </div>
        <button *ngIf="dismissible" 
                class="toast-close" 
                (click)="dismiss()"
                type="button">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div *ngIf="showProgress" 
           class="toast-progress" 
           [style.animation-duration]="duration + 'ms'"></div>
    </div>
  `,
  styles: [`
    .toast {
      min-width: 300px;
      max-width: 500px;
      background: #232e3c;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid #2b374a;
      overflow: hidden;
      position: relative;
      margin-bottom: 12px;
      animation: slideIn 0.3s ease-out;
    }

    .toast-success {
      border-left: 4px solid #4caf50;
    }

    .toast-error {
      border-left: 4px solid #f44336;
    }

    .toast-warning {
      border-left: 4px solid #ff9800;
    }

    .toast-info {
      border-left: 4px solid #2196f3;
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }

    .toast-icon {
      font-size: 18px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .toast-success .toast-icon {
      color: #4caf50;
    }

    .toast-error .toast-icon {
      color: #f44336;
    }

    .toast-warning .toast-icon {
      color: #ff9800;
    }

    .toast-info .toast-icon {
      color: #2196f3;
    }

    .toast-body {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .toast-message {
      color: #8696a8;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
    }

    .toast-close {
      background: none;
      border: none;
      color: #8696a8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .toast-close:hover {
      background: #2b374a;
      color: #ffffff;
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
      animation: progress linear;
      transform-origin: left;
    }

    .toast-success .toast-progress {
      background: #4caf50;
    }

    .toast-error .toast-progress {
      background: #f44336;
    }

    .toast-warning .toast-progress {
      background: #ff9800;
    }

    .toast-info .toast-progress {
      background: #2196f3;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @keyframes progress {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }

    .toast.dismissing {
      animation: slideOut 0.3s ease-in forwards;
    }

    @media (max-width: 768px) {
      .toast {
        min-width: 280px;
        max-width: calc(100vw - 32px);
      }
    }
  `]
})
export class ToastComponent {
  @Input() type: ToastType = 'info';
  @Input() title?: string;
  @Input() message = '';
  @Input() duration = 5000;
  @Input() dismissible = true;
  @Input() showProgress = true;
  @Input() visible = false;

  @Output() close = new EventEmitter<void>();

  private timeoutId?: number;

  get iconClass(): string {
    switch (this.type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-info-circle';
    }
  }

  ngOnInit(): void {
    if (this.visible && this.duration > 0) {
      this.startAutoClose();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoClose();
  }

  show(): void {
    this.visible = true;
    if (this.duration > 0) {
      this.startAutoClose();
    }
  }

  dismiss(): void {
    this.clearAutoClose();
    this.visible = false;
    this.close.emit();
  }

  private startAutoClose(): void {
    this.clearAutoClose();
    this.timeoutId = window.setTimeout(() => {
      this.dismiss();
    }, this.duration);
  }

  private clearAutoClose(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}