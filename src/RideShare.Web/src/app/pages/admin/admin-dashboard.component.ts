import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule
  ],
  template: `
    <div class="admin-header">
      <div class="header-content">
        <div class="brand">
          <mat-icon>admin_panel_settings</mat-icon>
          <span>Share Ride Admin</span>
        </div>
        <div class="user-info">
          <span class="user-name">{{ authService.currentUser()?.fullName }}</span>
          <button mat-icon-button (click)="authService.logout()" matTooltip="Logout">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </div>
    </div>

    <div class="dashboard-container">
      <div class="welcome-section">
        <h1>Welcome to Admin Dashboard</h1>
        <p>Manage your platform from here</p>
      </div>
      
      <div class="cards-grid">
        <mat-card class="admin-card">
          <mat-card-header>
            <div class="card-icon users">
              <mat-icon>people</mat-icon>
            </div>
            <mat-card-title>User Management</mat-card-title>
            <mat-card-subtitle>Manage all users</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>View, activate, or deactivate user accounts.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button class="action-btn">Manage Users</button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="admin-card highlight">
          <mat-card-header>
            <div class="card-icon verify">
              <mat-icon>verified_user</mat-icon>
            </div>
            <mat-card-title>License Verification</mat-card-title>
            <mat-card-subtitle>Review pending licenses</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Approve or reject rider license submissions.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button class="action-btn primary" routerLink="/admin/license-review">Review Licenses</button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="admin-card">
          <mat-card-header>
            <div class="card-icon rides">
              <mat-icon>two_wheeler</mat-icon>
            </div>
            <mat-card-title>Ride Management</mat-card-title>
            <mat-card-subtitle>Oversee all rides</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>View and manage all rides on the platform.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button class="action-btn">View Rides</button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="admin-card">
          <mat-card-header>
            <div class="card-icon stats">
              <mat-icon>analytics</mat-icon>
            </div>
            <mat-card-title>Platform Statistics</mat-card-title>
            <mat-card-subtitle>View metrics & analytics</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Monitor platform usage and performance metrics.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button class="action-btn">View Stats</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .admin-header {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
      padding: 16px 24px;
      box-shadow: 0 2px 12px rgba(3, 70, 148, 0.2);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
    }

    .brand mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-name {
      opacity: 0.9;
    }

    .dashboard-container {
      padding: 32px 24px;
      max-width: 1200px;
      margin: 0 auto;
      background: #f8fafc;
      min-height: calc(100vh - 64px);
    }

    .welcome-section {
      margin-bottom: 32px;
    }

    .welcome-section h1 {
      margin: 0 0 8px;
      color: #1e293b;
      font-size: 28px;
      font-weight: 700;
    }

    .welcome-section p {
      margin: 0;
      color: #64748b;
      font-size: 16px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .admin-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      transition: all 0.3s;
    }

    .admin-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(3, 70, 148, 0.12) !important;
    }

    .admin-card.highlight {
      border: 2px solid #034694;
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .card-icon mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: white;
    }

    .card-icon.users { background: linear-gradient(135deg, #034694, #0A56A4); }
    .card-icon.verify { background: linear-gradient(135deg, #2e7d32, #4caf50); }
    .card-icon.rides { background: linear-gradient(135deg, #f57c00, #ff9800); }
    .card-icon.stats { background: linear-gradient(135deg, #7b1fa2, #9c27b0); }

    mat-card-header {
      padding: 20px 20px 0 !important;
    }

    mat-card-content {
      padding: 16px 20px !important;
      color: #64748b;
    }

    mat-card-actions {
      padding: 0 20px 20px !important;
    }

    .action-btn {
      border-radius: 8px !important;
      padding: 0 20px;
      height: 40px;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%) !important;
      color: white !important;
    }

    @media (max-width: 480px) {
      .admin-header {
        padding: 12px 16px;
      }

      .brand {
        font-size: 16px;
      }

      .user-name {
        display: none;
      }

      .dashboard-container {
        padding: 20px 16px;
      }

      .welcome-section h1 {
        font-size: 22px;
      }

      .cards-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  `]
})
export class AdminDashboardComponent {
  constructor(public authService: AuthService) {}
}
