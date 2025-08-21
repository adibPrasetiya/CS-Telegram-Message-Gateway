import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-management-container">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-content">
          <div class="header-title">
            <i class="fas fa-users"></i>
            <div>
              <h1>User Management</h1>
              <p>Manage user accounts, roles, and permissions</p>
            </div>
          </div>
          <div class="header-status">
            <div class="status-indicator configured">
              <i class="fas fa-check-circle"></i>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>

      <!-- User Management Content -->
      <div class="user-management-content">
        <!-- User Stats Cards -->
        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stats-info">
              <h3>15</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div class="stats-card">
            <div class="stats-icon">
              <i class="fas fa-user-shield"></i>
            </div>
            <div class="stats-info">
              <h3>3</h3>
              <p>Administrators</p>
            </div>
          </div>
          <div class="stats-card">
            <div class="stats-icon">
              <i class="fas fa-headset"></i>
            </div>
            <div class="stats-info">
              <h3>8</h3>
              <p>Agents</p>
            </div>
          </div>
          <div class="stats-card">
            <div class="stats-icon">
              <i class="fas fa-user-clock"></i>
            </div>
            <div class="stats-info">
              <h3>4</h3>
              <p>Online</p>
            </div>
          </div>
        </div>

        <!-- User Management Panel -->
        <div class="management-panel">
          <!-- Panel Header -->
          <div class="panel-header">
            <div class="panel-title">
              <h3>User List</h3>
              <p>Manage user accounts and permissions</p>
            </div>
            <div class="panel-actions">
              <button class="btn-primary">
                <i class="fas fa-plus"></i>
                Add User
              </button>
              <button class="btn-secondary">
                <i class="fas fa-filter"></i>
                Filter
              </button>
              <button class="btn-secondary">
                <i class="fas fa-download"></i>
                Export
              </button>
            </div>
          </div>

          <!-- User List -->
          <div class="user-list">
            <!-- User Item 1 -->
            <div class="user-item">
              <div class="user-avatar">
                <img src="https://via.placeholder.com/40x40/5288c1/ffffff?text=JD" alt="User Avatar">
              </div>
              <div class="user-info">
                <h4>John Doe</h4>
                <p>john.doe&#64;company.com</p>
              </div>
              <div class="user-role">
                <span class="role-badge admin">Administrator</span>
              </div>
              <div class="user-status">
                <span class="status-badge online">Online</span>
              </div>
              <div class="user-actions">
                <button class="action-btn" title="Edit User">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn danger" title="Delete User">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <!-- User Item 2 -->
            <div class="user-item">
              <div class="user-avatar">
                <img src="https://via.placeholder.com/40x40/28a745/ffffff?text=SM" alt="User Avatar">
              </div>
              <div class="user-info">
                <h4>Sarah Miller</h4>
                <p>sarah.miller&#64;company.com</p>
              </div>
              <div class="user-role">
                <span class="role-badge agent">Agent</span>
              </div>
              <div class="user-status">
                <span class="status-badge online">Online</span>
              </div>
              <div class="user-actions">
                <button class="action-btn" title="Edit User">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn danger" title="Delete User">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <!-- More user items... -->
          </div>

          <!-- Pagination -->
          <div class="pagination-container">
            <div class="pagination-info">
              Showing 1-5 of 15 users
            </div>
            <div class="pagination">
              <button class="pagination-btn" disabled>
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="pagination-btn active">1</button>
              <button class="pagination-btn">2</button>
              <button class="pagination-btn">3</button>
              <button class="pagination-btn">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
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

    .status-indicator.configured {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.3);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-management-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stats-card {
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stats-icon {
      width: 56px;
      height: 56px;
      background: rgba(82, 136, 193, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stats-icon i {
      color: #5288c1;
      font-size: 24px;
    }

    .stats-info h3 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }

    .stats-info p {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
      font-weight: 500;
    }

    .management-panel {
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 12px;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px;
      background: #17212b;
      border-bottom: 1px solid #2b374a;
    }

    .panel-title h3 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .panel-title p {
      color: #8696a8;
      font-size: 14px;
      margin: 0;
    }

    .panel-actions {
      display: flex;
      gap: 12px;
    }

    .user-list {
      background: #232e3c;
    }

    .user-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      border-bottom: 1px solid #2b374a;
      transition: background-color 0.2s;
    }

    .user-item:last-child {
      border-bottom: none;
    }

    .user-item:hover {
      background: rgba(82, 136, 193, 0.03);
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-info h4 {
      color: #ffffff;
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 4px 0;
    }

    .user-info p {
      color: #8696a8;
      font-size: 13px;
      margin: 0;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .role-badge.admin {
      background: rgba(220, 53, 69, 0.2);
      color: #dc3545;
      border: 1px solid rgba(220, 53, 69, 0.3);
    }

    .role-badge.agent {
      background: rgba(40, 167, 69, 0.2);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .status-badge.online {
      background: rgba(40, 167, 69, 0.2);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.3);
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .user-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      margin-left: 16px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background: #2b374a;
      color: #8696a8;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover {
      background: #5288c1;
      color: white;
    }

    .action-btn.danger:hover {
      background: #dc3545;
      color: white;
    }

    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: #17212b;
      border-top: 1px solid #2b374a;
    }

    .pagination-info {
      color: #8696a8;
      font-size: 14px;
    }

    .pagination {
      display: flex;
      gap: 8px;
    }

    .pagination-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #2b374a;
      border-radius: 8px;
      background: #232e3c;
      color: #8696a8;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 500;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #5288c1;
      color: white;
      border-color: #5288c1;
    }

    .pagination-btn.active {
      background: #5288c1;
      color: white;
      border-color: #5288c1;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary, .btn-secondary {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      white-space: nowrap;
    }

    .btn-primary {
      background: #5288c1;
      color: white;
    }

    .btn-primary:hover {
      background: #4a7ba7;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }
  `]
})
export class UserManagementComponent {
  constructor() {}
}