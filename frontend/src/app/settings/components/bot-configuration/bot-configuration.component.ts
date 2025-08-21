import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BotConfigService, BotConfig, BotConnectionTest, GroupInvitationStatus, BotNotificationSettings } from '../../../shared/services/bot-config.service';
import { SocketService } from '../../../shared/services/socket.service';
import { StepperComponent, StepperStep } from '../../../shared/components/stepper/stepper.component';

@Component({
  selector: 'app-bot-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, StepperComponent],
  template: `
    <div class="bot-config-container">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-content">
          <div class="header-title">
            <i class="fab fa-telegram-plane"></i>
            <div>
              <h1>Telegram Bot Configuration</h1>
              <p>Set up your Telegram bot for help desk notifications</p>
            </div>
          </div>
          <div class="header-status" *ngIf="botConfig">
            <div class="status-indicator" [class.connected]="botConfig.isConnected" [class.configured]="botConfig.isGroupConfigured">
              <i class="fas" [class.fa-check-circle]="botConfig.isConnected && botConfig.isGroupConfigured" 
                 [class.fa-exclamation-triangle]="botConfig.isConnected && !botConfig.isGroupConfigured"
                 [class.fa-times-circle]="!botConfig.isConnected"></i>
              <span>{{ getStatusText() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stepper and Content -->
      <div class="bot-config-content">
        <!-- Stepper -->
        <app-stepper [steps]="stepperSteps" (stepClick)="onStepClick($event)"></app-stepper>
    
        <!-- Step Content -->
        <div class="step-content">
          <!-- Bot Configuration Steps Content Here -->
          <!-- This would contain all the bot configuration logic from the original settings component -->
          
          <div class="step-panel" *ngIf="currentStep === 'token'">
            <div class="step-header">
              <h2>Connect Your Telegram Bot</h2>
              <p>Enter your Telegram bot token to establish the connection</p>
            </div>
            <!-- Bot token configuration UI -->
          </div>

          <div class="step-panel" *ngIf="currentStep === 'group'">
            <div class="step-header">
              <h2>Configure Notification Group</h2>
              <p>Set up a Telegram group to receive help desk notifications</p>
            </div>
            <!-- Group configuration UI -->
          </div>

          <div class="step-panel" *ngIf="currentStep === 'complete'">
            <div class="completion-card">
              <div class="completion-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <h2>Configuration Complete!</h2>
              <p>Your Telegram bot is now configured and ready to send notifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bot-config-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .settings-header {
      background: #232e3c;
      border-bottom: 1px solid #2b374a;
      padding: 24px 32px;
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-title i {
      font-size: 32px;
      color: #5288c1;
    }

    .header-title h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
      margin: 0;
    }

    .header-title p {
      color: #8696a8;
      font-size: 16px;
      margin: 4px 0 0 0;
    }

    .bot-config-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    .step-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .step-panel {
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 24px;
    }

    .step-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .step-header h2 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .step-header p {
      color: #8696a8;
      font-size: 16px;
      margin: 0;
    }

    .completion-card {
      text-align: center;
      padding: 40px 24px;
    }

    .completion-icon i {
      color: #28a745;
      font-size: 64px;
      margin-bottom: 24px;
    }

    .completion-card h2 {
      color: #28a745;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .completion-card p {
      color: #8696a8;
      font-size: 16px;
      margin: 0;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
      border: 1px solid rgba(220, 53, 69, 0.3);
    }

    .status-indicator.connected {
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
      border-color: rgba(255, 193, 7, 0.3);
    }

    .status-indicator.configured {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
      border-color: rgba(40, 167, 69, 0.3);
    }
  `]
})
export class BotConfigurationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Stepper management
  currentStep: string = 'token';
  stepperSteps: StepperStep[] = [];
  
  // Bot Configuration
  botConfig: BotConfig | null = null;
  groupInvitationStatus: GroupInvitationStatus = {
    isWaitingForInvitation: false,
    detectedGroups: []
  };
  
  constructor(
    private botConfigService: BotConfigService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.initializeStepperSteps();
    this.loadBotConfiguration();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeStepperSteps(): void {
    this.stepperSteps = [
      {
        id: 'token',
        title: 'Bot Token',
        description: 'Connect your bot',
        isCompleted: false,
        isActive: true,
        icon: 'fa-robot'
      },
      {
        id: 'group',
        title: 'Group Setup',
        description: 'Configure notifications',
        isCompleted: false,
        isActive: false,
        isDisabled: true,
        icon: 'fa-users'
      },
      {
        id: 'complete',
        title: 'Complete',
        description: 'Ready to use',
        isCompleted: false,
        isActive: false,
        isDisabled: true,
        icon: 'fa-check'
      }
    ];
  }

  private loadBotConfiguration(): void {
    this.botConfigService.getBotConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.botConfig = config;
          this.updateStepperSteps();
          
          if (config.isConnected && !config.isGroupConfigured) {
            this.currentStep = 'group';
          } else if (config.isConnected && config.isGroupConfigured) {
            this.currentStep = 'complete';
          }
          this.updateStepperSteps();
        },
        error: (error) => {
          console.error('Error loading bot configuration:', error);
        }
      });
  }

  private updateStepperSteps(): void {
    this.stepperSteps.forEach(step => {
      step.isActive = step.id === this.currentStep;
      
      switch (step.id) {
        case 'token':
          step.isCompleted = this.botConfig?.isConnected || false;
          break;
        case 'group':
          step.isCompleted = this.botConfig?.isGroupConfigured || false;
          step.isDisabled = !this.botConfig?.isConnected;
          break;
        case 'complete':
          step.isCompleted = this.botConfig?.isConnected && this.botConfig?.isGroupConfigured || false;
          step.isDisabled = !this.botConfig?.isGroupConfigured;
          break;
      }
    });
  }

  onStepClick(event: { step: StepperStep; index: number }): void {
    if (!event.step.isDisabled) {
      this.currentStep = event.step.id;
      this.updateStepperSteps();
    }
  }

  getStatusText(): string {
    if (!this.botConfig) return 'Not configured';
    
    if (this.botConfig.isConnected && this.botConfig.isGroupConfigured) {
      return 'Fully configured';
    } else if (this.botConfig.isConnected) {
      return 'Bot connected';
    } else {
      return 'Not connected';
    }
  }
}