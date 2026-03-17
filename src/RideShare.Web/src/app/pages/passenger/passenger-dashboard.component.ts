import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth.service';
import { RideService } from '../../services/ride.service';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-passenger-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatBadgeModule,
    NotificationBellComponent
  ],
  template: `
    <!-- Top App Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <mat-icon class="logo-icon">hail</mat-icon>
        <span class="app-title">Passenger</span>
      </div>
      <div class="top-bar-right">
        <app-notification-bell></app-notification-bell>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Home Tab -->
      @if (activeTab === 'home') {
        <div class="tab-content home-tab">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <div class="welcome-content">
              <div class="welcome-text">
                <span class="greeting">Hello, {{ getFirstName() }}! 👋</span>
                <h2>Where are you heading today?</h2>
              </div>
              <div class="welcome-icon">
                <mat-icon>hail</mat-icon>
              </div>
            </div>
            <div class="welcome-wave"></div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="action-card primary" routerLink="/passenger/browse-rides">
              <div class="action-icon">
                <mat-icon>search</mat-icon>
              </div>
              <span class="action-label">Find a Ride</span>
            </button>
            <button class="action-card" routerLink="/passenger/my-requests">
              <div class="action-icon">
                <mat-icon>pending_actions</mat-icon>
              </div>
              <span class="action-label">My Requests</span>
              @if (pendingCount > 0) {
                <span class="action-badge">{{ pendingCount }}</span>
              }
            </button>
          </div>

          <!-- Active Rides Section -->
          <div class="section">
            <div class="section-title">
              <mat-icon>schedule</mat-icon>
              <span>Upcoming Rides</span>
            </div>
            @if (upcomingRides.length === 0) {
              <div class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <p>No upcoming rides</p>
                <button class="action-btn outline" routerLink="/passenger/browse-rides">
                  <mat-icon>search</mat-icon>
                  Find a Ride
                </button>
              </div>
            } @else {
              <div class="rides-list">
                @for (ride of upcomingRides; track ride.id) {
                  <div class="ride-card" matRipple [routerLink]="ride.rideStatus === 'InProgress' ? ['/passenger/track-ride', ride.rideId] : null">
                    <div class="ride-route">
                      <div class="route-point">
                        <span class="marker origin">A</span>
                        <span class="location">{{ getShortAddress(ride.origin) }}</span>
                      </div>
                      <mat-icon class="route-arrow">arrow_forward</mat-icon>
                      <div class="route-point">
                        <span class="marker dest">B</span>
                        <span class="location">{{ getShortAddress(ride.destination) }}</span>
                      </div>
                    </div>
                    <div class="ride-meta">
                      <span class="ride-time">
                        <mat-icon>schedule</mat-icon>
                        {{ formatDateTime(ride.departureTime) }}
                      </span>
                      <span class="ride-status" [class]="ride.status.toLowerCase()">
                        {{ ride.rideStatus === 'InProgress' ? 'In Progress' : ride.status }}
                      </span>
                    </div>
                    @if (ride.rideStatus === 'InProgress') {
                      <div class="live-badge">
                        <div class="pulse-dot"></div>
                        <span>Live Tracking</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Stats Section -->
          <div class="section">
            <div class="section-title">
              <mat-icon>insights</mat-icon>
              <span>Your Stats</span>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ totalRides }}</div>
                <div class="stat-label">Total Rides</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ pendingCount }}</div>
                <div class="stat-label">Pending</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ acceptedCount }}</div>
                <div class="stat-label">Accepted</div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Activity Tab -->
      @if (activeTab === 'activity') {
        <div class="tab-content activity-tab">
          <div class="section-header">
            <h2>Activity</h2>
          </div>

          <div class="activity-list">
            @if (activities.length === 0) {
              <div class="empty-state">
                <mat-icon>history</mat-icon>
                <p>No recent activity</p>
              </div>
            } @else {
              @for (activity of activities; track activity.id) {
                <div class="activity-item" matRipple>
                  <div class="activity-icon" [class]="activity.type">
                    <mat-icon>{{ getActivityIcon(activity.type) }}</mat-icon>
                  </div>
                  <div class="activity-content">
                    <span class="activity-title">{{ activity.title }}</span>
                    <span class="activity-desc">{{ activity.description }}</span>
                    <span class="activity-time">{{ activity.time }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- Profile Tab -->
      @if (activeTab === 'profile') {
        <div class="tab-content profile-tab">
          <!-- Profile Header -->
          <div class="profile-header">
            <div class="profile-avatar">
              @if (authService.currentUser()?.profilePhotoUrl) {
                <img [src]="authService.currentUser()?.profilePhotoUrl" alt="Profile">
              } @else {
                <mat-icon>person</mat-icon>
              }
            </div>
            <div class="profile-info">
              <h2>{{ authService.currentUser()?.fullName }}</h2>
              <p>{{ authService.currentUser()?.email }}</p>
            </div>
          </div>

          <!-- Profile Menu -->
          <div class="profile-menu">
            <div class="menu-section">
              <div class="menu-item" matRipple routerLink="/passenger/my-requests">
                <div class="menu-icon">
                  <mat-icon>pending_actions</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">My Requests</span>
                  <span class="menu-subtitle">View all your ride requests</span>
                </div>
                <mat-icon class="menu-arrow">chevron_right</mat-icon>
              </div>

              <div class="menu-item" matRipple routerLink="/passenger/ride-history">
                <div class="menu-icon">
                  <mat-icon>history</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">Ride History</span>
                  <span class="menu-subtitle">View past rides and ratings</span>
                </div>
                <mat-icon class="menu-arrow">chevron_right</mat-icon>
              </div>

              <div class="menu-item" matRipple>
                <div class="menu-icon">
                  <mat-icon>contact_phone</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">Emergency Contact</span>
                  <span class="menu-subtitle">{{ emergencyContact || 'Add emergency contact' }}</span>
                </div>
                <mat-icon class="menu-arrow">chevron_right</mat-icon>
              </div>
            </div>

            <div class="menu-section">
              <div class="menu-item logout" matRipple (click)="logout()">
                <div class="menu-icon logout">
                  <mat-icon>logout</mat-icon>
                </div>
                <div class="menu-content">
                  <span class="menu-title">Log Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <button class="nav-item" [class.active]="activeTab === 'home'" (click)="activeTab = 'home'">
        <mat-icon>home</mat-icon>
        <span>Home</span>
      </button>
      <button class="nav-item" routerLink="/passenger/browse-rides">
        <mat-icon>search</mat-icon>
        <span>Find Ride</span>
      </button>
      <button class="nav-item" routerLink="/passenger/my-requests">
        <mat-icon>pending_actions</mat-icon>
        <span>Requests</span>
      </button>
      <button class="nav-item" [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'">
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </button>
    </nav>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f5f7fa;
    }

    /* Top Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      position: relative;
      width: 160px;
    }

    .logo-icon {
      color: #034694;
      font-size: 28px;
      width: 28px;
      height: 28px;
      animation: passenger-wave 3s ease-in-out infinite;
      position: relative;
      z-index: 1;
    }

    .app-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      position: relative;
      z-index: 2;
      background: white;
      padding-left: 4px;
    }

    @keyframes passenger-wave {
      0% {
        transform: translateX(-40px) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      30% {
        transform: translateX(0px) rotate(0deg);
        opacity: 1;
      }
      40% {
        transform: translateX(0px) rotate(-15deg);
      }
      50% {
        transform: translateX(0px) rotate(15deg);
      }
      60% {
        transform: translateX(0px) rotate(-10deg);
      }
      70% {
        transform: translateX(0px) rotate(0deg);
        opacity: 1;
      }
      85% {
        transform: translateX(25px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateX(45px) rotate(0deg);
        opacity: 0;
      }
    }

    .top-bar-right {
      display: flex;
      align-items: center;
    }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 80px;
    }

    .tab-content {
      padding: 16px;
    }

    .section-header h2 {
      margin: 0 0 16px;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    /* Welcome Section */
    .welcome-section {
      margin-bottom: 24px;
      padding: 24px 20px 40px;
      background: linear-gradient(135deg, #034694 0%, #1565C0 50%, #42A5F5 100%);
      border-radius: 20px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .welcome-text {
      flex: 1;
    }

    .welcome-text .greeting {
      font-size: 14px;
      opacity: 0.9;
      display: block;
      margin-bottom: 4px;
    }

    .welcome-section h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
    }

    .welcome-icon {
      width: 60px;
      height: 60px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .welcome-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .welcome-wave {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 120'%3E%3Cpath fill='%23ffffff' fill-opacity='0.1' d='M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,101.3C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z'%3E%3C/path%3E%3C/svg%3E") no-repeat bottom;
      background-size: cover;
    }

    /* Quick Actions */
    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 16px;
      background: white;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      position: relative;
    }

    .action-card:active {
      transform: scale(0.98);
    }

    .action-card.primary {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
    }

    .action-card.primary .action-icon {
      background: rgba(255,255,255,0.2);
    }

    .action-card.primary .action-icon mat-icon {
      color: white;
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f0f3ff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #034694;
    }

    .action-label {
      font-size: 14px;
      font-weight: 500;
    }

    .action-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #f44336;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    /* Sections */
    .section {
      margin-bottom: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .section-title mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Rides List */
    .rides-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ride-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: pointer;
    }

    .ride-route {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .route-point {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .marker {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }

    .marker.origin {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .marker.dest {
      background: linear-gradient(135deg, #f44336, #c62828);
    }

    .location {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .route-arrow {
      color: #ccc;
      font-size: 18px;
      flex-shrink: 0;
    }

    .ride-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ride-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #666;
    }

    .ride-time mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .ride-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .ride-status.accepted {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .ride-status.pending {
      background: #fff3e0;
      color: #ef6c00;
    }

    .live-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      color: #1565c0;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2196f3;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      background: white;
      border-radius: 16px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 12px;
    }

    .empty-state p {
      color: #666;
      margin: 0 0 16px;
    }

    /* Activity Tab */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      cursor: pointer;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon.request {
      background: #e3f2fd;
      color: #1976d2;
    }

    .activity-icon.accepted {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .activity-icon.completed {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .activity-icon.rejected {
      background: #ffebee;
      color: #c62828;
    }

    .activity-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .activity-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .activity-desc {
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }

    .activity-time {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }

    /* Profile Tab */
    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 16px;
      background: white;
      border-radius: 20px;
      margin-bottom: 16px;
    }

    .profile-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-avatar mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: white;
    }

    .profile-info {
      flex: 1;
    }

    .profile-info h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .profile-info p {
      margin: 4px 0 0;
      font-size: 14px;
      color: #666;
    }

    /* Profile Menu */
    .profile-menu {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .menu-section {
      background: white;
      border-radius: 16px;
      overflow: hidden;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .menu-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #034694;
    }

    .menu-icon.logout {
      background: #ffebee;
      color: #f44336;
    }

    .menu-content {
      flex: 1;
      min-width: 0;
    }

    .menu-title {
      display: block;
      font-size: 15px;
      font-weight: 500;
      color: #333;
    }

    .menu-item.logout .menu-title {
      color: #f44336;
    }

    .menu-subtitle {
      display: block;
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }

    .menu-arrow {
      color: #ccc;
    }

    /* Action Buttons */
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .action-btn.outline {
      background: white;
      border: 1px solid #034694;
      color: #034694;
    }

    /* Bottom Navigation */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      background: white;
      padding: 8px 0;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 24px;
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      transition: color 0.2s;
    }

    .nav-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nav-item span {
      font-size: 12px;
      font-weight: 500;
    }

    .nav-item.active {
      color: #034694;
    }

    .nav-item.active mat-icon {
      color: #034694;
    }
  `]
})
export class PassengerDashboardComponent implements OnInit {
  activeTab: 'home' | 'activity' | 'profile' = 'home';
  
  // Stats
  totalRides = 0;
  pendingCount = 0;
  acceptedCount = 0;
  emergencyContact = '';
  
  // Data
  upcomingRides: any[] = [];
  activities: any[] = [];

  constructor(
    public authService: AuthService,
    private rideService: RideService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
    this.loadActivities();
  }

  getFirstName(): string {
    const fullName = this.authService.currentUser()?.fullName || '';
    return fullName.split(' ')[0];
  }

  loadRequests(): void {
    this.rideService.getMyRequests().subscribe({
      next: (requests) => {
        this.pendingCount = requests.filter(r => r.status === 'Pending').length;
        this.acceptedCount = requests.filter(r => r.status === 'Accepted').length;
        this.totalRides = requests.filter(r => r.status === 'Accepted' && r.rideStatus === 'Completed').length;
        
        // Get upcoming rides (accepted requests)
        this.upcomingRides = requests
          .filter(r => r.status === 'Accepted' && (r.rideStatus === 'Booked' || r.rideStatus === 'InProgress'))
          .slice(0, 3);
      },
      error: () => {}
    });
  }

  loadActivities(): void {
    // Mock activities - in real app, this would come from an API
    this.activities = [];
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return 'Not specified';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim();
    return shortAddr.length > 18 ? shortAddr.substring(0, 18) + '...' : shortAddr;
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'request': return 'send';
      case 'accepted': return 'check_circle';
      case 'rejected': return 'cancel';
      case 'completed': return 'flag';
      default: return 'notifications';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
