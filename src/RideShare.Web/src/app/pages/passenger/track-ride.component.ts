import { Component, OnInit, OnDestroy, signal, effect, AfterViewInit, Injector, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RideService } from '../../services/ride.service';
import { LocationTrackingService } from '../../services/location-tracking.service';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { RideLocation } from '../../models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-track-ride',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NotificationBellComponent
  ],
  template: `
    <div class="page-container">
      <!-- Top Bar -->
      <div class="top-bar">
        <div class="top-bar-left">
          <mat-icon class="logo-icon">gps_fixed</mat-icon>
          <span class="app-title">Live Tracking</span>
        </div>
        <div class="top-bar-right">
          <app-notification-bell></app-notification-bell>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading ride information...</p>
        </div>
      }

      @if (error()) {
        <div class="error-container">
          <div class="error-icon">
            <mat-icon>error_outline</mat-icon>
          </div>
          <h3>{{ error() }}</h3>
          <p>Please try again or go back to your requests</p>
          <button class="action-btn primary" routerLink="/passenger/my-requests">
            <mat-icon>arrow_back</mat-icon>
            Back to Requests
          </button>
        </div>
      }

      @if (!loading() && !error() && rideLocation()) {
        <!-- Map Container (Full Screen) -->
        <div class="map-wrapper">
          <div id="tracking-map" class="tracking-map"></div>
          
          <!-- Connection Status -->
          <div class="connection-badge" [class.connected]="locationService.connectionState() === 'connected'">
            <div class="pulse-dot" [class.active]="locationService.connectionState() === 'connected'"></div>
            <span>{{ locationService.connectionState() === 'connected' ? 'Live' : 'Connecting...' }}</span>
          </div>

          <!-- Recenter Button -->
          <button class="recenter-btn" (click)="recenterMap()">
            <mat-icon>my_location</mat-icon>
          </button>
        </div>

        <!-- Floating Info Card -->
        <div class="info-card" [class.expanded]="cardExpanded" (click)="toggleCard()">
          <div class="card-handle"></div>
          
          <!-- Rider Header -->
          <div class="rider-header">
            <div class="rider-avatar">
              <mat-icon>sports_motorsports</mat-icon>
            </div>
            <div class="rider-info">
              <span class="rider-name">{{ rideLocation()?.riderName }}</span>
              @if (rideLocation()?.vehicleNumber) {
                <span class="vehicle-info">
                  <mat-icon>two_wheeler</mat-icon>
                  {{ rideLocation()?.vehicleNumber }}
                </span>
              }
            </div>
            <div class="status-badge live">
              <div class="pulse-dot active"></div>
              <span>In Progress</span>
            </div>
          </div>

          <!-- Quick Actions -->
          @if (rideLocation()?.riderPhone) {
            <div class="quick-actions">
              <a class="action-btn call" href="tel:{{ rideLocation()?.riderPhone }}">
                <mat-icon>phone</mat-icon>
                <span>Call Rider</span>
              </a>
            </div>
          }

          @if (cardExpanded) {
            <!-- Route Display -->
            <div class="route-display">
              <div class="route-point">
                <div class="point-marker pickup">
                  <span>P</span>
                </div>
                <div class="point-details">
                  <span class="point-label">Pickup</span>
                  <span class="point-address">{{ getShortAddress(rideLocation()?.origin || '') }}</span>
                </div>
              </div>
              <div class="route-connector">
                <div class="connector-line"></div>
              </div>
              <div class="route-point">
                <div class="point-marker dropoff">
                  <span>D</span>
                </div>
                <div class="point-details">
                  <span class="point-label">Drop-off</span>
                  <span class="point-address">{{ getShortAddress(rideLocation()?.destination || '') }}</span>
                </div>
              </div>
            </div>

            <!-- Time Info -->
            <div class="time-info">
              @if (rideLocation()?.startedAt) {
                <div class="time-item">
                  <mat-icon>play_circle</mat-icon>
                  <span>Started at {{ formatTime(rideLocation()!.startedAt!) }}</span>
                </div>
              }
              @if (lastUpdateTime() || rideLocation()?.locationUpdatedAt) {
                <div class="time-item live">
                  <mat-icon>update</mat-icon>
                  <span>Last update: {{ formatTime(lastUpdateTime() || rideLocation()!.locationUpdatedAt!) }}</span>
                </div>
              }
            </div>

            <!-- Legend -->
            <div class="map-legend">
              <div class="legend-item">
                <div class="legend-dot pickup"></div>
                <span>Pickup</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot dropoff"></div>
                <span>Drop-off</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot rider"></div>
                <span>Rider</span>
              </div>
            </div>
          }

          <div class="expand-hint">
            <mat-icon>{{ cardExpanded ? 'expand_more' : 'expand_less' }}</mat-icon>
          </div>
        </div>
      }

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
    </div>
  `,
  styles: [`
    .page-container {
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
      position: relative;
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

    /* Loading & Error States */
    .loading-container, .error-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: #666;
      padding: 24px;
      text-align: center;
    }

    .error-icon {
      width: 80px;
      height: 80px;
      background: #ffebee;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f44336;
    }

    .error-container h3 {
      margin: 0;
      color: #333;
    }

    .error-container p {
      margin: 0;
      color: #666;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 24px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      margin-top: 8px;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
    }

    /* Map Wrapper */
    .map-wrapper {
      flex: 1;
      position: relative;
    }

    .tracking-map {
      height: 100%;
      width: 100%;
    }

    /* Connection Badge */
    .connection-badge {
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(255, 152, 0, 0.95);
      color: white;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10;
    }

    .connection-badge.connected {
      background: rgba(76, 175, 80, 0.95);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    }

    .pulse-dot.active {
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
    }

    /* Recenter Button */
    .recenter-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .recenter-btn mat-icon {
      color: #034694;
    }

    /* Floating Info Card */
    .info-card {
      position: fixed;
      bottom: 70px;
      left: 16px;
      right: 16px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
      padding: 12px 16px 16px;
      z-index: 1000;
      transition: all 0.3s ease;
      max-height: 200px;
      overflow: hidden;
    }

    .info-card.expanded {
      max-height: 450px;
    }

    .card-handle {
      width: 40px;
      height: 4px;
      background: #ddd;
      border-radius: 2px;
      margin: 0 auto 12px;
    }

    /* Rider Header */
    .rider-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rider-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .rider-avatar mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    .rider-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .rider-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .vehicle-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #034694;
      font-weight: 500;
      margin-top: 2px;
    }

    .vehicle-info mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .quick-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .quick-actions .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }

    .quick-actions .action-btn.call {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
    }

    .quick-actions .action-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.live {
      background: #e8f5e9;
      color: #2e7d32;
    }

    /* Route Display */
    .route-display {
      margin-top: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .route-point {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .point-marker {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
    }

    .point-marker.pickup {
      background: #4caf50;
    }

    .point-marker.dropoff {
      background: #f44336;
    }

    .point-details {
      display: flex;
      flex-direction: column;
    }

    .point-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
    }

    .point-address {
      font-size: 14px;
      color: #333;
    }

    .route-connector {
      padding-left: 14px;
      height: 20px;
    }

    .connector-line {
      width: 2px;
      height: 100%;
      background: #ddd;
    }

    /* Time Info */
    .time-info {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 12px;
    }

    .time-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #666;
    }

    .time-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .time-item.live {
      color: #4caf50;
    }

    /* Map Legend */
    .map-legend {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #666;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .legend-dot.pickup {
      background: #4caf50;
    }

    .legend-dot.dropoff {
      background: #f44336;
    }

    .legend-dot.rider {
      background: #034694;
    }

    .expand-hint {
      display: flex;
      justify-content: center;
      margin-top: 8px;
      color: #999;
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
      z-index: 1001;
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
export class TrackRideComponent implements OnInit, OnDestroy, AfterViewInit {
  private map: L.Map | null = null;
  private riderMarker: L.Marker | null = null;
  private originMarker: L.Marker | null = null;
  private destMarker: L.Marker | null = null;
  private rideId: string = '';
  private locationSubscription: EffectRef | null = null;

  loading = signal(true);
  error = signal<string | null>(null);
  rideLocation = signal<RideLocation | null>(null);
  lastUpdateTime = signal<string | null>(null);
  
  cardExpanded = false;

  constructor(
    private route: ActivatedRoute,
    private rideService: RideService,
    public locationService: LocationTrackingService,
    private snackBar: MatSnackBar,
    private injector: Injector,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.rideId) {
      this.error.set('Invalid ride ID');
      this.loading.set(false);
      return;
    }

    this.loadRideLocation();
    
    // Set up location tracking effect after initialization
    this.locationSubscription = effect(() => {
      const location = this.locationService.currentLocation();
      if (location && this.map) {
        this.updateRiderPosition(location.lat, location.lng);
      }
    }, { injector: this.injector, allowSignalWrites: true });
  }

  ngAfterViewInit(): void {
    // Map will be initialized after ride location is loaded
  }

  ngOnDestroy(): void {
    // Clean up effect subscription
    if (this.locationSubscription) {
      this.locationSubscription.destroy();
    }
    this.locationService.stopTrackingRide();
    this.locationService.disconnect();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadRideLocation(): void {
    this.rideService.getRideLocation(this.rideId).subscribe({
      next: (location) => {
        this.rideLocation.set(location);
        this.loading.set(false);
        
        // Initialize map after a short delay to ensure DOM is ready
        setTimeout(() => {
          this.initMap(location);
          this.startTracking();
        }, 100);
      },
      error: (err) => {
        if (err.status === 404) {
          this.error.set('Ride not found or not in progress');
        } else {
          this.error.set('Failed to load ride location');
        }
        this.loading.set(false);
      }
    });
  }

  private async startTracking(): Promise<void> {
    await this.locationService.connect();
    this.locationService.startTrackingRide(this.rideId);
  }

  private initMap(location: RideLocation): void {
    // Calculate center based on available locations
    let centerLat = location.originLat ?? 0;
    let centerLng = location.originLng ?? 0;
    
    if (location.currentLat && location.currentLng) {
      centerLat = location.currentLat;
      centerLng = location.currentLng;
    }

    this.map = L.map('tracking-map').setView([centerLat, centerLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Custom icons
    const originIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#4caf50; width:24px; height:24px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const destIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#f44336; width:24px; height:24px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const riderIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#034694; width:32px; height:32px; border-radius:50%; border:4px solid white; box-shadow:0 2px 8px rgba(102,126,234,0.5);"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Add origin marker
    if (location.originLat && location.originLng) {
      this.originMarker = L.marker([location.originLat, location.originLng], { icon: originIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Pickup:</strong> ${location.origin}`);
    }

    // Add destination marker
    if (location.destLat && location.destLng) {
      this.destMarker = L.marker([location.destLat, location.destLng], { icon: destIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Drop-off:</strong> ${location.destination}`);
    }

    // Add rider marker if location available
    if (location.currentLat && location.currentLng) {
      this.riderMarker = L.marker([location.currentLat, location.currentLng], { icon: riderIcon })
        .addTo(this.map)
        .bindPopup(`<strong>${location.riderName}</strong><br>Your rider`);
    }

    // Fit bounds to show all markers
    if (location.originLat && location.originLng && location.destLat && location.destLng) {
      const bounds = L.latLngBounds([
        [location.originLat, location.originLng],
        [location.destLat, location.destLng]
      ]);
      if (location.currentLat && location.currentLng) {
        bounds.extend([location.currentLat, location.currentLng]);
      }
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  private updateRiderPosition(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.riderMarker) {
      this.riderMarker.setLatLng([lat, lng]);
    } else {
      const riderIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background:#034694; width:32px; height:32px; border-radius:50%; border:4px solid white; box-shadow:0 2px 8px rgba(102,126,234,0.5);"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.riderMarker = L.marker([lat, lng], { icon: riderIcon }).addTo(this.map);
    }

    // Update the last update time separately to avoid signal loop
    this.lastUpdateTime.set(new Date().toISOString());
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  toggleCard(): void {
    this.cardExpanded = !this.cardExpanded;
  }

  recenterMap(): void {
    if (!this.map) return;
    
    const location = this.rideLocation();
    if (location) {
      // If rider has current position, center on that
      if (location.currentLat && location.currentLng) {
        this.map.setView([location.currentLat, location.currentLng], 15);
      } else if (location.originLat && location.originLng) {
        this.map.setView([location.originLat, location.originLng], 14);
      }
    }
  }

  getShortAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    let shortAddr = parts[0].trim();
    if (parts.length > 1) {
      shortAddr += ', ' + parts[1].trim();
    }
    return shortAddr.length > 35 ? shortAddr.substring(0, 35) + '...' : shortAddr;
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }
}
