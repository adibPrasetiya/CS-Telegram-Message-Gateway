import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';
import { BotConfigurationComponent } from './components/bot-configuration/bot-configuration.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { NotificationRulesComponent } from './components/notification-rules/notification-rules.component';

@NgModule({
  declarations: [
    // Note: Since we're using standalone components, we don't need to declare them here
    // The routing module will handle the imports
  ],
  imports: [
    CommonModule,
    FormsModule,
    SettingsRoutingModule,
    // Import standalone components
    SettingsComponent,
    BotConfigurationComponent,
    UserManagementComponent,
    NotificationRulesComponent
  ]
})
export class SettingsModule { }