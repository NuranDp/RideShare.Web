import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { RideService } from '../../services/ride.service';
import { Ride, RideStatus } from '../../models/ride.model';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-my-rides',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRippleModule,
    NotificationBellComponent
  ],
  template: `
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <mat-icon class="logo-icon">list_alt</mat-icon>
        <span class="app-title">My Rides</span>
      </div>
      <div class="top-bar-right">
        <app-notification-bell></app-notification-bell>
      </div>
    </div>

    <!-- Tab Toggle -->
    <div class="tab-toggle-container">
      <div class="tab-toggle">
        <button class="tab-btn" [class.active]="activeTab === 'active'" (click)="activeTab = 'active'">
          <mat-icon>schedule</mat-icon>
          <span>Active</span>
          @if (activeRides.length > 0) {
            <span class="tab-badge">{{ activeRides.length }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">
          <mat-icon>history</mat-icon>
          <span>History</span>
          @if (historyRides.length > 0) {
            <span class="tab-badge secondary">{{ historyRides.length }}</span>
          }
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading your rides...</p>
        </div>
      } @else {
        <!-- Active Tab -->
        @if (activeTab === 'active') {
          @if (activeRides.length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <mat-icon>two_wheeler</mat-icon>
              </div>
              <h3>No active rides</h3>
              <p>Share your daily commute and help fellow commuters!</p>
              <button class="action-btn primary" routerLink="/rider/post-ride">
                <mat-icon>add</mat-icon>
                Post a Ride
              </button>
            </div>
          } @else {
            <div class="rides-list">
              @for (ride of activeRides; track ride.id) {
                <div class="ride-card" [class]="'status-border-' + ride.status.toLowerCase()">
                  <!-- Status Badge -->
                  <div class="status-badge" [class]="'badge-' + ride.status.toLowerCase()">
                    <mat-icon>{{ getStatusIcon(ride.status) }}</mat-icon>
                    <span>{{ ride.status }}</span>
                  </div>

                  <!-- Route Display -->
                  <div class="route-section">
                    <div class="route-point">
                      <span class="marker origin">A</span>
                      <div class="route-details">
                        <span class="route-label">Pickup</span>
                        <span class="route-address">{{ ride.origin }}</span>
                      </div>
                    </div>
                    <div class="route-connector">
                      <div class="connector-line"></div>
                    </div>
                    <div class="route-point">
                      <span class="marker dest">B</span>
                      <div class="route-details">
                        <span class="route-label">Drop-off</span>
                        <span class="route-address">{{ ride.destination }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Time & Info -->
                  <div class="ride-info">
                    <div class="info-item">
                      <mat-icon>schedule</mat-icon>
                      <span>{{ formatDateTime(ride.departureTime) }}</span>
                    </div>
                    <div class="info-item">
                      <mat-icon>sports_motorsports</mat-icon>
                      <span>{{ ride.helmetProvided ? 'Helmet provided' : 'No helmet' }}</span>
                    </div>
                    @if (ride.notes) {
                      <div class="info-item notes">
                        <mat-icon>notes</mat-icon>
                        <span>{{ ride.notes }}</span>
                      </div>
                    }
                  </div>

                  <!-- In Progress Status -->
                  @if (ride.status === 'InProgress') {
                    <div class="live-tracking-banner">
                      <div class="pulse-dot"></div>
                      <span>Live tracking active</span>
                    </div>
                  }

                  <!-- Actions -->
                  <div class="card-actions">
                    <button class="action-btn outline" (click)="viewRequests(ride)">
                      <mat-icon>group</mat-icon>
                      <span>Requests</span>
                      @if (ride.requestCount > 0) {
                        <span class="request-badge">{{ ride.requestCount }}</span>
                      }
                    </button>

                    @if (ride.status === 'Active') {
                      <button class="action-btn danger" (click)="cancelRide(ride)">
                        <mat-icon>close</mat-icon>
                        <span>Cancel</span>
                      </button>
                    }

                    @if (ride.status === 'Booked') {
                      <button class="action-btn primary" (click)="startRide(ride)" [disabled]="startingRide">
                        @if (startingRide) {
                          <mat-spinner diameter="18"></mat-spinner>
                        } @else {
                          <mat-icon>play_arrow</mat-icon>
                        }
                        <span>Start Ride</span>
                      </button>
                    }

                    @if (ride.status === 'InProgress') {
                      <button class="action-btn success" (click)="completeRide(ride)">
                        <mat-icon>check_circle</mat-icon>
                        <span>Complete</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }

        <!-- History Tab -->
        @if (activeTab === 'history') {
          @if (historyRides.length === 0) {
            <div class="empty-state">
              <div class="empty-icon secondary">
                <mat-icon>history</mat-icon>
              </div>
              <h3>No ride history</h3>
              <p>Completed and cancelled rides will appear here.</p>
            </div>
          } @else {
            <div class="rides-list">
              @for (ride of historyRides; track ride.id) {
                <div class="ride-card history" [class.cancelled]="ride.status === 'Cancelled'">
                  <!-- Status Badge -->
                  <div class="status-badge" [class]="'badge-' + ride.status.toLowerCase()">
                    <mat-icon>{{ getStatusIcon(ride.status) }}</mat-icon>
                    <span>{{ ride.status }}</span>
                  </div>

                  <!-- Route Display -->
                  <div class="route-section compact">
                    <div class="route-inline">
                      <span class="marker small origin">A</span>
                      <span class="route-text">{{ getShortAddress(ride.origin) }}</span>
                      <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                      <span class="marker small dest">B</span>
                      <span class="route-text">{{ getShortAddress(ride.destination) }}</span>
                    </div>
                  </div>

                  <!-- Expandable Details -->
                  @if (expandedRides.has(ride.id)) {
                    <div class="expanded-details">
                      <div class="detail-row">
                        <mat-icon class="origin-color">trip_origin</mat-icon>
                        <span>{{ ride.origin }}</span>
                      </div>
                      <div class="detail-row">
                        <mat-icon class="dest-color">location_on</mat-icon>
                        <span>{{ ride.destination }}</span>
                      </div>
                    </div>
                  }

                  <!-- Time & Info -->
                  <div class="ride-info">
                    <div class="info-item">
                      <mat-icon>schedule</mat-icon>
                      <span>{{ formatDateTime(ride.departureTime) }}</span>
                    </div>
                    <div class="info-item">
                      <mat-icon>sports_motorsports</mat-icon>
                      <span>{{ ride.helmetProvided ? 'Helmet provided' : 'No helmet' }}</span>
                    </div>
                  </div>

                  <!-- Show More Button -->
                  <button class="show-more-btn" (click)="toggleExpand(ride.id)">
                    <mat-icon>{{ expandedRides.has(ride.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
                    {{ expandedRides.has(ride.id) ? 'Show less' : 'Show details' }}
                  </button>
                </div>
              }
            </div>
          }
        }
      }
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <button class="nav-item" routerLink="/rider">
        <mat-icon>home</mat-icon>
        <span>Home</span>
      </button>
      <button class="nav-item active">
        <mat-icon>list_alt</mat-icon>
        <span>My Rides</span>
      </button>
      <button class="nav-item" (click)="goToRequests()">
        <mat-icon>person_add</mat-icon>
        <span>Requests</span>
      </button>
      <button class="nav-item" (click)="goToProfile()">
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </button>
    </nav>

    <!-- Floating Action Button -->
    <button class="fab" matRipple routerLink="/rider/post-ride">
      <mat-icon>add</mat-icon>
    </button>
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
      gap: 8px;
      padding: 12px 16px;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: #666;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .tab-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
    }

    .tab-badge {
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(255,255,255,0.3);
      font-size: 12px;
      font-weight: 600;
    }

    .tab-btn:not(.active) .tab-badge {
      background: #e0e0e0;
      color: #666;
    }

    .tab-badge.secondary {
      background: #e0e0e0;
    }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 140px;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #666;
    }

    .loading-state p {
      margin-top: 16px;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      background: white;
      border-radius: 20px;
      text-align: center;
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
      font-size: 14px;
    }

    /* Rides List */
    .rides-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Ride Card */
    .ride-card {
      background: white;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
    }

    .ride-card.history {
      opacity: 0.9;
    }

    .ride-card.cancelled {
      opacity: 0.6;
    }

    .status-border-active {
      border-left: 4px solid #4caf50;
    }

    .status-border-booked {
      border-left: 4px solid #ff9800;
    }

    .status-border-inprogress {
      border-left: 4px solid #2196f3;
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

    .badge-active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-booked {
      background: #fff3e0;
      color: #ef6c00;
    }

    .badge-inprogress {
      background: #e3f2fd;
      color: #1565c0;
    }

    .badge-completed {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .badge-cancelled {
      background: #ffebee;
      color: #c62828;
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

    .marker.small {
      width: 22px;
      height: 22px;
      font-size: 10px;
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

    /* Compact Route (History) */
    .route-section.compact {
      margin-bottom: 12px;
    }

    .route-inline {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .route-text {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .arrow-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #999;
    }

    /* Ride Info */
    .ride-info {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #666;
    }

    .info-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #999;
    }

    .info-item.notes {
      width: 100%;
    }

    /* Live Tracking Banner */
    .live-tracking-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 12px;
      margin-bottom: 16px;
      color: #1565c0;
      font-size: 13px;
      font-weight: 500;
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
      padding: 10px 16px;
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

    .action-btn.primary:disabled {
      background: #e0e0e0;
      color: #999;
    }

    .action-btn.success {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
    }

    .action-btn.danger {
      background: #ffebee;
      color: #c62828;
    }

    .action-btn.outline {
      background: #f5f7fa;
      color: #333;
    }

    .action-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .request-badge {
      padding: 2px 8px;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Expanded Details */
    .expanded-details {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 0;
      font-size: 13px;
      color: #333;
    }

    .detail-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .origin-color {
      color: #4caf50 !important;
    }

    .dest-color {
      color: #f44336 !important;
    }

    /* Show More Button */
    .show-more-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      margin: -4px 0 0 -12px;
      background: none;
      border: none;
      color: #034694;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    .show-more-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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
      padding: 8px 16px;
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
      font-size: 11px;
      font-weight: 500;
    }

    .nav-item.active {
      color: #034694;
    }

    /* Floating Action Button */
    .fab {
      position: fixed;
      bottom: 80px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      border: none;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
      box-shadow: 0 4px 16px rgba(3, 70, 148, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      transition: all 0.3s;
    }

    .fab mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .fab:active {
      transform: scale(0.95);
    }

    /* Mobile Responsiveness */
    @media (max-width: 480px) {
      .card-actions {
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
      }

      .route-inline {
        flex-wrap: nowrap;
        overflow: hidden;
      }

      .route-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100px;
      }

      .fab {
        bottom: 76px;
        right: 16px;
      }
    }
  `]
})
export class MyRidesComponent implements OnInit, OnDestroy {
  rides: Ride[] = [];
  loading = true;
  startingRide = false;
  expandedRides = new Set<string>();
  activeTab: 'active' | 'history' = 'active';
  private locationWatchId: number | null = null;
  private currentRideId: string | null = null;

  get activeRides(): Ride[] {
    return this.rides.filter(r => r.status === 'Active' || r.status === 'Booked' || r.status === 'InProgress');
  }

  get historyRides(): Ride[] {
    return this.rides.filter(r => r.status === 'Completed' || r.status === 'Cancelled');
  }

  constructor(
    private rideService: RideService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRides();
  }

  loadRides(): void {
    this.loading = true;
    this.rideService.getMyPostedRides().subscribe({
      next: (rides) => {
        this.rides = rides;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load rides', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getStatusIcon(status: RideStatus): string {
    switch (status) {
      case 'Active': return 'radio_button_unchecked';
      case 'Booked': return 'person';
      case 'InProgress': return 'two_wheeler';
      case 'Completed': return 'check_circle';
      case 'Cancelled': return 'cancel';
      default: return 'help';
    }
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

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return 'Not specified';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim();
    return shortAddr.length > 20 ? shortAddr.substring(0, 20) + '...' : shortAddr;
  }

  toggleExpand(rideId: string): void {
    if (this.expandedRides.has(rideId)) {
      this.expandedRides.delete(rideId);
    } else {
      this.expandedRides.add(rideId);
    }
  }

  viewRequests(ride: Ride): void {
    this.router.navigate(['/rider/ride-requests', ride.id]);
  }

  cancelRide(ride: Ride): void {
    if (confirm(`Are you sure you want to cancel this ride?`)) {
      this.rideService.cancelRide(ride.id).subscribe({
        next: () => {
          this.snackBar.open('Ride cancelled', 'Close', { duration: 3000 });
          this.loadRides();
        },
        error: () => {
          this.snackBar.open('Failed to cancel ride', 'Close', { duration: 3000 });
        }
      });
    }
  }

  completeRide(ride: Ride): void {
    if (confirm(`Mark this ride as completed?`)) {
      this.stopLocationSharing();
      
      this.rideService.completeRide(ride.id).subscribe({
        next: () => {
          this.snackBar.open('Ride completed!', 'Close', { duration: 3000 });
          this.loadRides();
        },
        error: () => {
          this.snackBar.open('Failed to complete ride', 'Close', { duration: 3000 });
        }
      });
    }
  }

  startRide(ride: Ride): void {
    this.startingRide = true;
    
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation is not supported by your browser', 'Close', { duration: 3000 });
      this.startingRide = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const request = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        this.rideService.startRide(ride.id, request).subscribe({
          next: () => {
            this.snackBar.open('Ride started! Passenger has been notified.', 'Close', { duration: 3000 });
            this.currentRideId = ride.id;
            this.startLocationSharing();
            this.loadRides();
            this.startingRide = false;
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to start ride', 'Close', { duration: 3000 });
            this.startingRide = false;
          }
        });
      },
      (error) => {
        let message = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Please allow location access to start the ride';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.startingRide = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  private startLocationSharing(): void {
    if (!navigator.geolocation || !this.currentRideId) return;

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.rideService.updateLocation(this.currentRideId!, {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }).subscribe();
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  private stopLocationSharing(): void {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
    this.currentRideId = null;
  }

  goToRequests(): void {
    this.router.navigate(['/rider'], { queryParams: { tab: 'requests' } });
  }

  goToProfile(): void {
    this.router.navigate(['/rider'], { queryParams: { tab: 'profile' } });
  }

  ngOnDestroy(): void {
    this.stopLocationSharing();
  }
}
