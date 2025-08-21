import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  isActive: boolean;
  isDisabled?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper">
      <div class="stepper-header">
        <div 
          *ngFor="let step of steps; let i = index; trackBy: trackByStep"
          class="step"
          [class.active]="step.isActive"
          [class.completed]="step.isCompleted"
          [class.disabled]="step.isDisabled"
          (click)="onStepClick(step, i)">
          
          <div class="step-indicator">
            <div class="step-number" *ngIf="!step.isCompleted && !step.icon">
              {{ i + 1 }}
            </div>
            <i *ngIf="step.isCompleted && !step.icon" class="fas fa-check"></i>
            <i *ngIf="step.icon" class="fas" [class]="step.icon"></i>
          </div>
          
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-description" *ngIf="step.description">{{ step.description }}</div>
          </div>
          
          <div class="step-connector" *ngIf="i < steps.length - 1"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stepper {
      width: 100%;
      margin-bottom: 32px;
    }

    .stepper-header {
      display: flex;
      align-items: flex-start;
      position: relative;
    }

    .step {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 16px 8px;
    }

    .step.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .step:not(.disabled):hover .step-indicator {
      transform: scale(1.1);
      box-shadow: 0 0 0 8px rgba(82, 136, 193, 0.1);
    }

    .step-indicator {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      transition: all 0.3s ease;
      border: 3px solid #2b374a;
      background: #232e3c;
      color: #8696a8;
      font-weight: 600;
      font-size: 16px;
      position: relative;
      z-index: 2;
    }

    .step.active .step-indicator {
      border-color: #5288c1;
      background: #5288c1;
      color: white;
      box-shadow: 0 0 0 4px rgba(82, 136, 193, 0.2);
    }

    .step.completed .step-indicator {
      border-color: #4caf50;
      background: #4caf50;
      color: white;
    }

    .step-number {
      font-size: 18px;
      font-weight: 600;
    }

    .step-content {
      text-align: center;
      max-width: 120px;
    }

    .step-title {
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .step.disabled .step-title {
      color: #6c757d;
    }

    .step-description {
      color: #8696a8;
      font-size: 12px;
      line-height: 1.3;
    }

    .step.active .step-description {
      color: #5288c1;
    }

    .step-connector {
      position: absolute;
      top: 40px;
      right: -50%;
      width: 100%;
      height: 3px;
      background: #2b374a;
      z-index: 1;
    }

    .step.completed .step-connector {
      background: #4caf50;
    }

    .step.active .step-connector {
      background: linear-gradient(to right, #4caf50 0%, #5288c1 100%);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .step {
        padding: 12px 4px;
      }

      .step-indicator {
        width: 40px;
        height: 40px;
        font-size: 14px;
      }

      .step-content {
        max-width: 100px;
      }

      .step-title {
        font-size: 12px;
      }

      .step-description {
        font-size: 11px;
      }

      .step-connector {
        top: 32px;
      }
    }

    @media (max-width: 480px) {
      .step-description {
        display: none;
      }

      .step-content {
        max-width: 80px;
      }
    }
  `]
})
export class StepperComponent {
  @Input() steps: StepperStep[] = [];
  @Output() stepClick = new EventEmitter<{ step: StepperStep; index: number }>();

  trackByStep(index: number, step: StepperStep): string {
    return step.id;
  }

  onStepClick(step: StepperStep, index: number): void {
    if (!step.isDisabled) {
      this.stepClick.emit({ step, index });
    }
  }
}