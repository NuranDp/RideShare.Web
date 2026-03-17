import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';
import { RideService } from '../../services/ride.service';
import { MyRideRequest, RequestStatus, CreateRatingRequest } from '../../models/ride.model';
import { RatingDialogComponent, RatingDialogData } from '../../components/rating-dialog/rating-dialog.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatRippleModule,
    NotificationBellComponent
  ],
  template: `
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <mat-icon class="logo-icon">pending_actions</mat-icon>
        <span class="app-title">My Requests</span>
      </div>
      <div class="top-bar-right">
        <app-notification-bell></app-notification-bell>
      </div>
    </div>

    <!-- Tab Toggle -->
    <div class="tab-toggle-container">
      <div class="tab-toggle">
        <button class="tab-btn" [class.active]="activeTab === 'pending'" (click)="activeTab = 'pending'">
          <mat-icon>hourglass_top</mat-icon>
          <span>Pending</span>
          @if (pendingRequests.length > 0) {
            <span class="tab-badge">{{ pendingRequests.length }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'accepted'" (click)="activeTab = 'accepted'">
          <mat-icon>check_circle</mat-icon>
          <span>Accepted</span>
          @if (acceptedRequests.length > 0) {
            <span class="tab-badge">{{ acceptedRequests.length }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">
          <mat-icon>history</mat-icon>
          <span>History</span>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading your requests...</p>
        </div>
      } @else {
        <!-- Pending Tab -->
        @if (activeTab === 'pending') {
          @if (pendingRequests.length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <mat-icon>hourglass_empty</mat-icon>
              </div>
              <h3>No pending requests</h3>
              <p>Your ride requests will appear here</p>
              <button class="action-btn primary" routerLink="/passenger/browse-rides">
                <mat-icon>search</mat-icon>
                Find a Ride
              </button>
            </div>
          } @else {
            <div class="requests-list">
              @for (request of pendingRequests; track request.id) {
                <ng-container *ngTemplateOutlet="requestCard; context: { request: request }"></ng-container>
              }
            </div>
          }
        }

        <!-- Accepted Tab -->
        @if (activeTab === 'accepted') {
          @if (acceptedRequests.length === 0) {
            <div class="empty-state">
              <div class="empty-icon secondary">
                <mat-icon>check_circle_outline</mat-icon>
              </div>
              <h3>No accepted requests</h3>
              <p>Your confirmed rides will appear here</p>
            </div>
          } @else {
            <div class="requests-list">
              @for (request of acceptedRequests; track request.id) {
                <ng-container *ngTemplateOutlet="requestCard; context: { request: request }"></ng-container>
              }
            </div>
          }
        }

        <!-- History Tab -->
        @if (activeTab === 'history') {
          @if (historyRequests.length === 0) {
            <div class="empty-state">
              <div class="empty-icon secondary">
                <mat-icon>history</mat-icon>
              </div>
              <h3>No history yet</h3>
              <p>Past requests will appear here</p>
            </div>
          } @else {
            <div class="requests-list">
              @for (request of historyRequests; track request.id) {
                <ng-container *ngTemplateOutlet="requestCard; context: { request: request }"></ng-container>
              }
            </div>
          }
        }
      }

      <!-- Request Card Template -->
      <ng-template #requestCard let-request="request">
        <div class="request-card" [class]="'status-border-' + request.status.toLowerCase()">
          <!-- Status Badge -->
          <div class="status-badge" [class]="'badge-' + request.status.toLowerCase()">
            <mat-icon>{{ getStatusIcon(request.status) }}</mat-icon>
            <span>{{ request.status }}</span>
          </div>

          <!-- Rider Info -->
          <div class="rider-section">
            <div class="rider-avatar">
              <mat-icon>two_wheeler</mat-icon>
            </div>
            <div class="rider-info">
              <span class="rider-name">{{ request.riderName }}</span>
              <span class="rider-label">Rider</span>
            </div>
          </div>

          <!-- Route Section -->
          <div class="route-section">
            <div class="route-point">
              <span class="marker origin">A</span>
              <div class="route-details">
                <span class="route-label">From</span>
                <span class="route-address">{{ request.origin }}</span>
              </div>
            </div>
            <div class="route-connector">
              <div class="connector-line"></div>
            </div>
            <div class="route-point">
              <span class="marker dest">B</span>
              <div class="route-details">
                <span class="route-label">To</span>
                <span class="route-address">{{ request.destination }}</span>
              </div>
            </div>
          </div>

          <!-- My Pickup/Dropoff -->
          @if (request.pickupLocation || request.dropoffLocation) {
            <div class="my-route-section">
              <div class="my-route-title">
                <mat-icon>person_pin_circle</mat-icon>
                Your Stops
              </div>
              @if (request.pickupLocation) {
                <div class="my-stop">
                  <span class="stop-marker pickup">P</span>
                  <span>{{ request.pickupLocation }}</span>
                </div>
              }
              @if (request.dropoffLocation) {
                <div class="my-stop">
                  <span class="stop-marker dropoff">D</span>
                  <span>{{ request.dropoffLocation }}</span>
                </div>
              }
            </div>
          }

          <!-- Time Badge -->
          <div class="time-badge">
            <mat-icon>schedule</mat-icon>
            <span>{{ formatDateTime(request.departureTime) }}</span>
          </div>

          <!-- Message -->
          @if (request.message) {
            <div class="message-section">
              <mat-icon>message</mat-icon>
              <span>{{ request.message }}</span>
            </div>
          }

          <!-- Contact Info (for accepted) -->
          @if (request.status === 'Accepted') {
            <div class="contact-section">
              <div class="contact-title">
                <mat-icon>contact_phone</mat-icon>
                Rider Contact
              </div>
              <div class="contact-item">
                <mat-icon>person</mat-icon>
                <span>{{ request.riderName }}</span>
              </div>
              <div class="contact-item">
                <mat-icon>phone</mat-icon>
                <span>{{ request.riderPhone || 'Not provided' }}</span>
              </div>
            </div>
          }

          <!-- In Progress Banner -->
          @if (request.status === 'Accepted' && request.rideStatus === 'InProgress') {
            <div class="live-banner">
              <div class="pulse-dot"></div>
              <span>Ride in progress! Track your rider's location</span>
            </div>
          }

          <!-- Rate Prompt -->
          @if (request.status === 'Accepted' && request.rideStatus === 'Completed' && !request.hasRated) {
            <div class="rate-banner">
              <mat-icon>star_border</mat-icon>
              <span>Ride completed! Please rate your experience</span>
            </div>
          }

          <!-- Rated Badge -->
          @if (request.hasRated) {
            <div class="rated-badge">
              <mat-icon>check_circle</mat-icon>
              <span>You've rated this ride</span>
            </div>
          }

          <!-- Actions -->
          <div class="card-actions">
            @if (request.status === 'Pending') {
              <button class="action-btn danger" (click)="cancelRequest(request)">
                <mat-icon>close</mat-icon>
                Cancel Request
              </button>
            }

            @if (request.status === 'Accepted' && request.rideStatus === 'InProgress') {
              <button class="action-btn primary" [routerLink]="['/passenger/track-ride', request.rideId]">
                <mat-icon>location_on</mat-icon>
                Track Ride
              </button>
            }

            @if (request.status === 'Accepted' && request.rideStatus === 'Completed' && !request.hasRated) {
              <button class="action-btn accent" (click)="rateRide(request)">
                <mat-icon>star</mat-icon>
                Rate Ride
              </button>
            }
          </div>
        </div>
      </ng-template>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <a class="nav-item" routerLink="/passenger">
        <mat-icon>home</mat-icon>
        <span>Home</span>
      </a>
      <a class="nav-item" routerLink="/passenger/browse-rides">
        <mat-icon>search</mat-icon>
        <span>Find Ride</span>
      </a>
      <a class="nav-item active" routerLink="/passenger/my-requests">
        <mat-icon>pending_actions</mat-icon>
        <span>Requests</span>
      </a>
      <a class="nav-item" (click)="goToProfile()">
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </a>
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
    }

    .logo-icon {
      color: #034694;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .app-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Tab Toggle */
    .tab-toggle-container {
      padding: 16px 16px 0;
      background: #f5f7fa;
    }

    .tab-toggle {
      display: flex;
      background: white;
      border-radius: 16px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 12px;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: #666;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .tab-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
    }

    .tab-badge {
      padding: 2px 6px;
      border-radius: 8px;
      background: rgba(255,255,255,0.3);
      font-size: 11px;
      font-weight: 600;
    }

    .tab-btn:not(.active) .tab-badge {
      background: #e0e0e0;
      color: #666;
    }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 100px;
    }

    /* Loading & Empty States */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      background: white;
      border-radius: 20px;
      text-align: center;
    }

    .loading-state p {
      margin-top: 16px;
      color: #666;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .empty-icon.secondary {
      background: #e0e0e0;
    }

    .empty-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: white;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 24px;
      color: #666;
    }

    /* Requests List */
    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Request Card */
    .request-card {
      background: white;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .status-border-pending {
      border-left: 4px solid #ff9800;
    }

    .status-border-accepted {
      border-left: 4px solid #4caf50;
    }

    .status-border-rejected {
      border-left: 4px solid #f44336;
    }

    .status-border-cancelled {
      border-left: 4px solid #9e9e9e;
    }

    /* Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .status-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .badge-pending {
      background: #fff3e0;
      color: #ef6c00;
    }

    .badge-accepted {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-rejected {
      background: #ffebee;
      color: #c62828;
    }

    .badge-cancelled {
      background: #f5f5f5;
      color: #757575;
    }

    /* Rider Section */
    .rider-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .rider-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rider-avatar mat-icon {
      color: white;
      font-size: 24px;
    }

    .rider-info {
      display: flex;
      flex-direction: column;
    }

    .rider-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .rider-label {
      font-size: 12px;
      color: #999;
    }

    /* Route Section */
    .route-section {
      margin-bottom: 16px;
    }

    .route-point {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .marker {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .marker.origin {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .marker.dest {
      background: linear-gradient(135deg, #f44336, #c62828);
    }

    .route-details {
      flex: 1;
      min-width: 0;
    }

    .route-label {
      display: block;
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .route-address {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-top: 2px;
    }

    .route-connector {
      padding: 4px 0 4px 13px;
    }

    .connector-line {
      width: 2px;
      height: 20px;
      background: linear-gradient(to bottom, #4caf50, #f44336);
      border-radius: 1px;
    }

    /* My Route Section */
    .my-route-section {
      background: #f0f3ff;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }

    .my-route-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #034694;
      margin-bottom: 10px;
    }

    .my-route-title mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .my-stop {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #333;
      margin: 6px 0;
    }

    .stop-marker {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: white;
    }

    .stop-marker.pickup {
      background: #9c27b0;
    }

    .stop-marker.dropoff {
      background: #ff9800;
    }

    /* Time Badge */
    .time-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      color: #1565c0;
      margin-bottom: 16px;
    }

    .time-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Message Section */
    .message-section {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #666;
    }

    .message-section mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #999;
      flex-shrink: 0;
    }

    /* Contact Section */
    .contact-section {
      background: #e8f5e9;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .contact-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #2e7d32;
      margin-bottom: 12px;
    }

    .contact-title mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #333;
      margin: 6px 0;
    }

    .contact-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #2e7d32;
    }

    /* Live Banner */
    .live-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      font-weight: 500;
      color: #1565c0;
    }

    .pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #2196f3;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
    }

    /* Rate Banner */
    .rate-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #fff8e1;
      border-radius: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #f57c00;
    }

    .rate-banner mat-icon {
      color: #ffc107;
    }

    /* Rated Badge */
    .rated-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #e8f5e9;
      border-radius: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      font-weight: 500;
      color: #2e7d32;
    }

    .rated-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Card Actions */
    .card-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Action Buttons */
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 20px;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
    }

    .action-btn.accent {
      background: linear-gradient(135deg, #ffc107, #ff9800);
      color: white;
    }

    .action-btn.danger {
      background: #ffebee;
      color: #c62828;
    }

    .action-btn:active {
      transform: scale(0.98);
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
      border-top: 1px solid #eee;
      padding: 8px 0;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 16px;
      color: #999;
      text-decoration: none;
      font-size: 11px;
      cursor: pointer;
      transition: color 0.2s;
    }

    .nav-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nav-item.active {
      color: #034694;
    }

    /* Mobile */
    @media (max-width: 480px) {
      .tab-btn span {
        display: none;
      }

      .tab-btn {
        padding: 12px 16px;
      }

      .card-actions {
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
      }
    }
  `]
})
export class MyRequestsComponent implements OnInit {
  requests: MyRideRequest[] = [];
  loading = true;
  activeTab: 'pending' | 'accepted' | 'history' = 'pending';

  constructor(
    private rideService: RideService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.rideService.getMyRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load requests', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  get pendingRequests(): MyRideRequest[] {
    return this.requests.filter(r => r.status === 'Pending');
  }

  get acceptedRequests(): MyRideRequest[] {
    return this.requests.filter(r => r.status === 'Accepted');
  }

  get historyRequests(): MyRideRequest[] {
    return this.requests.filter(r => r.status === 'Rejected' || r.status === 'Cancelled');
  }

  getStatusIcon(status: RequestStatus): string {
    switch (status) {
      case 'Pending': return 'hourglass_top';
      case 'Accepted': return 'check_circle';
      case 'Rejected': return 'cancel';
      case 'Cancelled': return 'block';
      default: return 'help';
    }
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  cancelRequest(request: MyRideRequest): void {
    if (confirm('Are you sure you want to cancel this request?')) {
      this.rideService.cancelMyRequest(request.id).subscribe({
        next: () => {
          this.snackBar.open('Request cancelled', 'Close', { duration: 3000 });
          this.loadRequests();
        },
        error: () => {
          this.snackBar.open('Failed to cancel request', 'Close', { duration: 3000 });
        }
      });
    }
  }

  rateRide(request: MyRideRequest): void {
    const dialogRef = this.dialog.open(RatingDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        rideId: request.rideId,
        riderName: request.riderName,
        origin: request.origin,
        destination: request.destination
      } as RatingDialogData
    });

    dialogRef.afterClosed().subscribe((result: CreateRatingRequest | undefined) => {
      if (result) {
        this.rideService.rateRider(request.rideId, result).subscribe({
          next: () => {
            this.snackBar.open('Thank you for your rating!', 'Close', { duration: 3000 });
            this.loadRequests();
          },
          error: () => {
            this.snackBar.open('Failed to submit rating. Please try again.', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }
}
