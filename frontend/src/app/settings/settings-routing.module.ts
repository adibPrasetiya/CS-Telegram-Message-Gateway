import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings-new.component';
import { BotConfigurationComponent } from './components/bot-configuration/bot-configuration.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { NotificationRulesComponent } from './components/notification-rules/notification-rules.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full'
      },
      {
        path: 'bot-configuration',
        component: BotConfigurationComponent,
        title: 'Bot Configuration - Settings'
      },
      {
        path: 'notification-rules',
        component: NotificationRulesComponent,
        title: 'Notification Rules - Settings'
      },
      {
        path: 'user-management',
        component: UserManagementComponent,
        title: 'User Management - Settings'
      }
      // Add more routes as you create more feature components
      // {
      //   path: 'system-settings',
      //   component: SystemSettingsComponent,
      //   title: 'System Settings - Settings'
      // },
      // {
      //   path: 'security',
      //   component: SecurityComponent,
      //   title: 'Security - Settings'
      // }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }