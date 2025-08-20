import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" 
         [class.inline]="inline"
         [class.overlay]="overlay">
      <div class="spinner-wrapper">
        <div class="spinner" 
             [class.small]="size === 'small'"
             [class.large]="size === 'large'"
             [style.border-top-color]="color">
        </div>
        <span *ngIf="message" class="loading-message">{{ message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .loading-container.inline {
      display: inline-flex;
      padding: 8px;
    }

    .loading-container.overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
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

    .spinner.small {
      width: 16px;
      height: 16px;
      border-width: 1px;
    }

    .spinner.large {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }

    .loading-message {
      color: #8696a8;
      font-size: 14px;
      text-align: center;
    }

    .loading-container.overlay .loading-message {
      color: #ffffff;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-container.inline .spinner-wrapper {
      flex-direction: row;
      gap: 8px;
    }

    .loading-container.inline .loading-message {
      font-size: 12px;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'medium';
  @Input() message?: string;
  @Input() color = '#5288c1';
  @Input() inline = false;
  @Input() overlay = false;
}