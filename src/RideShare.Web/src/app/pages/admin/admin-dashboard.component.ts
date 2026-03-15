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
    <mat-toolbar color="warn">
      <mat-icon>admin_panel_settings</mat-icon>
      <span class="toolbar-title">Ride Share - Admin Panel</span>
      <span class="spacer"></span>
      <span>{{ authService.currentUser()?.fullName }}</span>
      <button mat-icon-button (click)="authService.logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <div class="dashboard-container">
      <h1>Admin Dashboard</h1>
      
      <div class="cards-grid">
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>people</mat-icon>
            <mat-card-title>User Management</mat-card-title>
            <mat-card-subtitle>Manage all users</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>View, activate, or deactivate user accounts.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary">Manage Users</button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>verified_user</mat-icon>
            <mat-card-title>License Verification</mat-card-title>
            <mat-card-subtitle>Review pending licenses</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Approve or reject rider license submissions.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="accent" routerLink="/admin/license-review">Review Licenses</button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>two_wheeler</mat-icon>
            <mat-card-title>Ride Management</mat-card-title>
            <mat-card-subtitle>Oversee all rides</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>View and manage all rides on the platform.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button>View Rides</button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>analytics</mat-icon>
            <mat-card-title>Platform Statistics</mat-card-title>
            <mat-card-subtitle>View metrics & analytics</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Monitor platform usage and performance metrics.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button>View Stats</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .toolbar-title {
      margin-left: 8px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 24px;
      color: #333;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    mat-card {
      height: 100%;
    }

    mat-icon[mat-card-avatar] {
      background-color: #f44336;
      color: white;
      border-radius: 50%;
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 480px) {
      .dashboard-container {
        padding: 12px;
        overflow-x: hidden;
        max-width: 100vw;
      }

      h1 {
        font-size: 20px;
        margin-bottom: 16px;
        word-break: break-word;
      }

      .cards-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      mat-card {
        max-width: 100%;
        overflow: hidden;
      }
    }
  `]
})
export class AdminDashboardComponent {
  constructor(public authService: AuthService) {}
}
