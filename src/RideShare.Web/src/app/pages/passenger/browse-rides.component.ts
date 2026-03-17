import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { RideService } from '../../services/ride.service';
import { RideListItem, RideSearchParams } from '../../models/ride.model';
import { RideMapComponent } from '../../components/ride-map/ride-map.component';
import { RoutePreviewComponent } from '../../components/route-preview/route-preview.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-browse-rides',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRippleModule,
    RideMapComponent,
    RoutePreviewComponent,
    NotificationBellComponent
  ],
  template: `
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <mat-icon class="logo-icon">search</mat-icon>
        <span class="app-title">Find a Ride</span>
      </div>
      <div class="top-bar-right">
        <button class="view-toggle" (click)="toggleViewMode()">
          <mat-icon>{{ viewMode === 'list' ? 'map' : 'view_list' }}</mat-icon>
        </button>
        <app-notification-bell></app-notification-bell>
      </div>
    </div>

    <!-- Search Section -->
    <div class="search-section" [class.collapsed]="searchCollapsed">
      <div class="search-header" (click)="searchCollapsed = !searchCollapsed">
        <div class="search-icon">
          <mat-icon>search</mat-icon>
        </div>
        <span>Search & Filter</span>
        <mat-icon class="expand-icon">{{ searchCollapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
      </div>
      @if (!searchCollapsed) {
        <div class="search-form">
          <div class="search-field">
            <mat-icon class="field-icon origin">trip_origin</mat-icon>
            <input type="text" [(ngModel)]="searchParams.origin" placeholder="From (origin)">
          </div>
          <div class="search-field">
            <mat-icon class="field-icon dest">place</mat-icon>
            <input type="text" [(ngModel)]="searchParams.destination" placeholder="To (destination)">
          </div>
          <div class="search-actions">
            <button class="search-btn outline" (click)="clearSearch()">Clear</button>
            <button class="search-btn primary" (click)="searchRides()">
              <mat-icon>search</mat-icon>
              Search
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Content Area -->
    <div class="content-area">
      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Searching for rides...</p>
        </div>
      } @else if (rides.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <mat-icon>search_off</mat-icon>
          </div>
          <h3>No rides found</h3>
          <p>Try adjusting your search criteria or check back later.</p>
          <button class="action-btn outline" (click)="clearSearch()">
            <mat-icon>refresh</mat-icon>
            Clear Filters
          </button>
        </div>
      } @else {
        @if (viewMode === 'map') {
          <!-- Map View -->
          <div class="map-view">
            <app-ride-map 
              [rides]="ridesWithCoords" 
              (rideClicked)="onRideClicked($event)">
            </app-ride-map>
            @if (selectedRide) {
              <div class="map-card">
                <div class="map-card-header">
                  <div class="rider-avatar">
                    <mat-icon>two_wheeler</mat-icon>
                  </div>
                  <div class="rider-info">
                    <span class="rider-name">{{ selectedRide.riderName }}</span>
                    @if (selectedRide.riderRating > 0) {
                      <span class="rating">
                        <mat-icon>star</mat-icon>
                        {{ selectedRide.riderRating | number:'1.1-1' }}
                      </span>
                    }
                  </div>
                  <button class="close-btn" (click)="selectedRide = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="map-card-route">
                  <div class="route-point">
                    <span class="marker origin">A</span>
                    <span>{{ getShortAddress(selectedRide.origin) }}</span>
                  </div>
                  <mat-icon class="route-arrow">arrow_forward</mat-icon>
                  <div class="route-point">
                    <span class="marker dest">B</span>
                    <span>{{ getShortAddress(selectedRide.destination) }}</span>
                  </div>
                </div>
                <div class="map-card-meta">
                  <div class="meta-item">
                    <mat-icon>schedule</mat-icon>
                    <span>{{ formatDateTime(selectedRide.departureTime) }}</span>
                  </div>
                  <div class="meta-item">
                    <mat-icon>sports_motorsports</mat-icon>
                    <span>{{ selectedRide.helmetProvided ? 'Helmet provided' : 'No helmet' }}</span>
                  </div>
                </div>
                <button class="request-btn" (click)="requestRide(selectedRide)">
                  <mat-icon>send</mat-icon>
                  Request Ride
                </button>
              </div>
            }
          </div>
        } @else {
          <!-- List View -->
          <div class="results-count">
            <span>{{ rides.length }} ride{{ rides.length === 1 ? '' : 's' }} available</span>
          </div>
          <div class="rides-list">
            @for (ride of rides; track ride.id) {
              <div class="ride-card" matRipple (click)="toggleExpand(ride.id)">
                <!-- Card Header -->
                <div class="card-header">
                  <div class="rider-section">
                    <div class="rider-avatar">
                      <mat-icon>two_wheeler</mat-icon>
                    </div>
                    <div class="rider-info">
                      <span class="rider-name">{{ ride.riderName }}</span>
                      @if (ride.riderRating > 0) {
                        <span class="rating">
                          <mat-icon>star</mat-icon>
                          {{ ride.riderRating | number:'1.1-1' }}
                        </span>
                      }
                    </div>
                  </div>
                  <div class="helmet-badge" [class.provided]="ride.helmetProvided">
                    <mat-icon>{{ ride.helmetProvided ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>{{ ride.helmetProvided ? 'Helmet' : 'No helmet' }}</span>
                  </div>
                </div>

                <!-- Route Section -->
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

                <!-- Time Badge -->
                <div class="time-badge">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ formatDateTime(ride.departureTime) }}</span>
                </div>

                <!-- Expanded Content -->
                @if (expandedRideId === ride.id) {
                  <div class="expanded-content">
                    @if (ride.originLat && ride.originLng && ride.destLat && ride.destLng) {
                      <div class="route-preview">
                        <app-route-preview
                          [origin]="{ lat: ride.originLat, lng: ride.originLng, address: ride.origin }"
                          [destination]="{ lat: ride.destLat, lng: ride.destLng, address: ride.destination }">
                        </app-route-preview>
                      </div>
                    }
                    <button class="request-btn full" (click)="requestRide(ride); $event.stopPropagation()">
                      <mat-icon>send</mat-icon>
                      Request to Join
                    </button>
                  </div>
                }

                <!-- Expand Indicator -->
                <div class="expand-indicator">
                  <mat-icon>{{ expandedRideId === ride.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <a class="nav-item" routerLink="/passenger">
        <mat-icon>home</mat-icon>
        <span>Home</span>
      </a>
      <a class="nav-item active" routerLink="/passenger/browse-rides">
        <mat-icon>search</mat-icon>
        <span>Find Ride</span>
      </a>
      <a class="nav-item" routerLink="/passenger/my-requests">
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

    .view-toggle {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #333;
    }

    /* Search Section */
    .search-section {
      background: white;
      margin: 16px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .search-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      cursor: pointer;
    }

    .search-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f0f3ff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #034694;
    }

    .search-header span {
      flex: 1;
      font-weight: 500;
      color: #333;
    }

    .expand-icon {
      color: #999;
    }

    .search-form {
      padding: 0 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .search-field {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 12px;
    }

    .field-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .field-icon.origin { color: #4caf50; }
    .field-icon.dest { color: #f44336; }

    .search-field input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 15px;
      outline: none;
    }

    .search-actions {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }

    .search-btn {
      flex: 1;
      padding: 12px 16px;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .search-btn.primary {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
    }

    .search-btn.outline {
      background: #f5f7fa;
      color: #666;
    }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 0 16px 80px;
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
      margin-top: 16px;
    }

    .loading-state p, .empty-state p {
      color: #666;
      margin: 16px 0;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #ccc;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    /* Results Count */
    .results-count {
      padding: 12px 0;
      font-size: 14px;
      color: #666;
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
      cursor: pointer;
      transition: all 0.3s;
    }

    .ride-card:active {
      transform: scale(0.99);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .rider-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rider-avatar {
      width: 44px;
      height: 44px;
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
      gap: 2px;
    }

    .rider-name {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 13px;
      color: #f57c00;
    }

    .rating mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #ffc107;
    }

    .helmet-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      background: #ffebee;
      color: #c62828;
    }

    .helmet-badge.provided {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .helmet-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
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
    }

    .time-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Expanded Content */
    .expanded-content {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .route-preview {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .request-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .request-btn.full {
      width: 100%;
    }

    .request-btn:active {
      transform: scale(0.98);
    }

    /* Expand Indicator */
    .expand-indicator {
      display: flex;
      justify-content: center;
      margin-top: 12px;
      color: #ccc;
    }

    /* Map View */
    .map-view {
      position: relative;
      height: calc(100vh - 180px);
      margin-top: 16px;
      border-radius: 20px;
      overflow: hidden;
    }

    .map-card {
      position: absolute;
      bottom: 20px;
      left: 16px;
      right: 16px;
      background: white;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
    }

    .map-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .map-card-route {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .map-card-route .route-point {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #333;
    }

    .map-card-route .marker {
      width: 22px;
      height: 22px;
      font-size: 10px;
    }

    .route-arrow {
      color: #ccc;
      font-size: 18px;
    }

    .map-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #666;
    }

    .meta-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #999;
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

    /* Mobile */
    @media (max-width: 480px) {
      .map-view {
        height: calc(100vh - 200px);
        border-radius: 16px;
      }

      .map-card {
        left: 12px;
        right: 12px;
        bottom: 12px;
        padding: 16px;
      }
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
  `]
})
export class BrowseRidesComponent implements OnInit {
  rides: RideListItem[] = [];
  loading = true;
  searchParams: RideSearchParams = {};
  viewMode: 'list' | 'map' = 'list';
  selectedRide: RideListItem | null = null;
  expandedRideId: string | null = null;
  searchCollapsed = true;

  constructor(
    private rideService: RideService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRides();
  }

  get ridesWithCoords(): RideListItem[] {
    return this.rides.filter(r => r.originLat && r.originLng && r.destLat && r.destLng);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'map' : 'list';
    this.selectedRide = null;
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return '';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim();
    return shortAddr.length > 20 ? shortAddr.substring(0, 20) + '...' : shortAddr;
  }

  toggleExpand(rideId: string): void {
    this.expandedRideId = this.expandedRideId === rideId ? null : rideId;
  }

  loadRides(): void {
    this.loading = true;
    this.rideService.getAvailableRides(this.searchParams).subscribe({
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

  searchRides(): void {
    this.searchCollapsed = true;
    this.loadRides();
  }

  clearSearch(): void {
    this.searchParams = {};
    this.loadRides();
  }

  onRideClicked(rideId: string): void {
    this.selectedRide = this.rides.find(r => r.id === rideId) || null;
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

  requestRide(ride: RideListItem): void {
    this.router.navigate(['/passenger/request-ride', ride.id]);
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }
}
