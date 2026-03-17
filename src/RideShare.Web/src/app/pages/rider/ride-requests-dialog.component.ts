import { Component, Inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { RideService } from '../../services/ride.service';
import { Ride, RideRequest, RequestStatus } from '../../models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-ride-requests-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <!-- Dialog Header -->
    <div class="dialog-header">
      <div class="header-content">
        <mat-icon class="header-icon">group</mat-icon>
        <div class="header-text">
          <h2>Ride Requests</h2>
          <span class="header-subtitle">{{ formatDateTime(data.ride.departureTime) }}</span>
        </div>
      </div>
      <button class="close-btn" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <!-- Your Ride Summary -->
      <div class="ride-summary-card">
        <div class="summary-label">
          <mat-icon>two_wheeler</mat-icon>
          <span>Your Route</span>
        </div>
        <div class="route-bar">
          <div class="route-endpoint start">
            <span class="endpoint-marker">A</span>
            <span class="endpoint-text">{{ getShortAddress(data.ride.origin) }}</span>
          </div>
          <div class="route-line"></div>
          <div class="route-endpoint end">
            <span class="endpoint-marker">B</span>
            <span class="endpoint-text">{{ getShortAddress(data.ride.destination) }}</span>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="30"></mat-spinner>
          <span>Loading requests...</span>
        </div>
      }

      @if (!loading && requests.length === 0) {
        <div class="empty-state">
          <mat-icon>person_add</mat-icon>
          <p>No requests yet</p>
          <span class="empty-subtitle">When passengers request to join, they'll appear here</span>
        </div>
      }

      <div class="requests-list">
        @for (request of requests; track request.id) {
          <div class="request-card" [class.processed]="request.status !== 'Pending'">
            <!-- Passenger Header -->
            <div class="request-header">
              <div class="passenger-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="passenger-info">
                <span class="passenger-name">{{ request.passengerName }}</span>
                <span class="request-time">{{ formatTimeAgo(request.createdAt) }}</span>
              </div>
              <mat-chip [class]="'status-chip chip-' + request.status.toLowerCase()">
                {{ request.status }}
              </mat-chip>
            </div>

            <!-- Message -->
            @if (request.message) {
              <div class="message-box">
                <mat-icon>chat_bubble_outline</mat-icon>
                <span>{{ request.message }}</span>
              </div>
            }

            <!-- Journey Visual -->
            <div class="journey-visual">
              <div class="passenger-label">
                <mat-icon>person_pin_circle</mat-icon>
                <span>Passenger wants</span>
              </div>
              <div class="passenger-points">
                <div class="passenger-point pickup">
                  <span class="point-marker pickup">P</span>
                  <div class="point-details">
                    <span class="point-label">Pick up at</span>
                    <span class="point-location">{{ request.pickupLocation ? getShortAddress(request.pickupLocation) : 'Ride start (A)' }}</span>
                  </div>
                </div>
                <mat-icon class="journey-arrow">east</mat-icon>
                <div class="passenger-point dropoff">
                  <span class="point-marker dropoff">D</span>
                  <div class="point-details">
                    <span class="point-label">Drop off at</span>
                    <span class="point-location">{{ request.dropoffLocation ? getShortAddress(request.dropoffLocation) : 'Ride end (B)' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- View Route Toggle -->
            @if (hasRouteCoordinates(request)) {
              <button class="view-route-btn" (click)="toggleMap(request.id)">
                <mat-icon>{{ expandedMapId === request.id ? 'expand_less' : 'map' }}</mat-icon>
                <span>{{ expandedMapId === request.id ? 'Hide Map' : 'View Route' }}</span>
              </button>
              
              @if (expandedMapId === request.id) {
                <div class="map-section">
                  <div class="map-container" [id]="'request-map-' + request.id"></div>
                  <div class="map-legend">
                    <span class="legend-item"><span class="legend-dot origin"></span>Origin (A)</span>
                    <span class="legend-item"><span class="legend-dot pickup"></span>Pickup (P)</span>
                    <span class="legend-item"><span class="legend-dot dropoff"></span>Dropoff (D)</span>
                    <span class="legend-item"><span class="legend-dot dest"></span>Destination (B)</span>
                  </div>
                </div>
              }
            }

            <!-- Actions -->
            @if (request.status === 'Pending') {
              <div class="request-actions">
                <button class="action-btn reject" (click)="rejectRequest(request)" [disabled]="processing">
                  @if (processing && processingId === request.id && processingAction === 'reject') {
                    <mat-spinner diameter="16"></mat-spinner>
                  } @else {
                    <mat-icon>close</mat-icon>
                  }
                  <span>Decline</span>
                </button>
                <button class="action-btn accept" (click)="acceptRequest(request)" [disabled]="processing">
                  @if (processing && processingId === request.id && processingAction === 'accept') {
                    <mat-spinner diameter="16"></mat-spinner>
                  } @else {
                    <mat-icon>check</mat-icon>
                  }
                  <span>Accept</span>
                </button>
              </div>
            }

            @if (request.status === 'Accepted') {
              <div class="contact-card">
                <mat-icon>phone</mat-icon>
                <div class="contact-details">
                  <span class="contact-label">Contact passenger</span>
                  <span class="contact-value">{{ request.passengerPhone || 'Not provided' }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Dialog Header */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
      margin: -24px -24px 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .header-text h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .header-subtitle {
      font-size: 12px;
      opacity: 0.9;
    }

    .close-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
    }

    .close-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Ride Summary Card */
    .ride-summary-card {
      background: #f8f9fc;
      border-radius: 12px;
      padding: 12px;
      margin: 16px 0;
    }

    .summary-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .summary-label mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .route-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: white;
      border-radius: 8px;
    }

    .route-endpoint {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .route-endpoint.end {
      justify-content: flex-end;
      text-align: right;
    }

    .endpoint-marker {
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

    .route-endpoint.start .endpoint-marker {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .route-endpoint.end .endpoint-marker {
      background: linear-gradient(135deg, #f44336, #c62828);
    }

    .endpoint-text {
      font-size: 12px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .route-line {
      flex: 0 0 30px;
      height: 2px;
      background: linear-gradient(90deg, #4caf50, #f44336);
      border-radius: 1px;
    }

    /* Loading */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px;
      color: #666;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 32px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }

    .empty-state p {
      margin: 12px 0 4px;
      font-size: 16px;
      color: #666;
    }

    .empty-subtitle {
      font-size: 13px;
    }

    /* Requests List */
    .requests-list {
      max-height: 55vh;
      overflow-y: auto;
      padding-bottom: 8px;
    }

    .request-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid #034694;
    }

    .request-card.processed {
      opacity: 0.7;
      border-left-color: #999;
    }

    /* Request Header */
    .request-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .passenger-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .passenger-avatar mat-icon {
      color: white;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .passenger-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .passenger-name {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }

    .request-time {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }

    .status-chip {
      font-size: 11px !important;
      min-height: 24px !important;
      padding: 0 10px !important;
    }

    .chip-pending { background: #fff3e0 !important; color: #e65100 !important; }
    .chip-accepted { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .chip-rejected { background: #ffebee !important; color: #c62828 !important; }
    .chip-cancelled { background: #f5f5f5 !important; color: #757575 !important; }

    /* Message Box */
    .message-box {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 13px;
      color: #555;
    }

    .message-box mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
      flex-shrink: 0;
    }

    /* Journey Visual */
    .journey-visual {
      background: linear-gradient(135deg, rgba(3, 70, 148, 0.08), rgba(10, 86, 164, 0.08));
      border: 1px solid rgba(3, 70, 148, 0.2);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .passenger-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #034694;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .passenger-label mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .passenger-points {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .passenger-point {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background: white;
      border-radius: 10px;
      min-width: 0;
    }

    .point-marker {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }

    .point-marker.pickup {
      background: linear-gradient(135deg, #2196f3, #1565c0);
    }

    .point-marker.dropoff {
      background: linear-gradient(135deg, #ff9800, #ef6c00);
    }

    .point-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .point-label {
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
    }

    .point-location {
      font-size: 12px;
      font-weight: 500;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .journey-arrow {
      color: #ccc;
      font-size: 18px;
      flex-shrink: 0;
    }

    /* View Route Button */
    .view-route-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 10px;
      background: #f8f9fc;
      border: 1px dashed #ddd;
      border-radius: 8px;
      color: #034694;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 12px;
      transition: all 0.2s;
    }

    .view-route-btn:hover {
      background: #f0f3ff;
      border-color: #034694;
    }

    .view-route-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Map Section */
    .map-section {
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 12px;
      border: 1px solid #e0e0e0;
    }

    .map-container {
      height: 180px;
      width: 100%;
    }

    .map-legend {
      display: flex;
      justify-content: space-around;
      padding: 8px;
      background: #f8f9fc;
      font-size: 10px;
      color: #666;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .legend-dot.origin { background: #4caf50; }
    .legend-dot.pickup { background: #2196f3; }
    .legend-dot.dropoff { background: #ff9800; }
    .legend-dot.dest { background: #f44336; }

    /* Request Actions */
    .request-actions {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .action-btn.reject {
      background: #ffebee;
      color: #c62828;
    }

    .action-btn.reject:hover {
      background: #ffcdd2;
    }

    .action-btn.accept {
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
      color: white;
    }

    .action-btn.accept:hover {
      opacity: 0.9;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Contact Card */
    .contact-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 10px;
      margin-top: 12px;
    }

    .contact-card mat-icon {
      color: #2e7d32;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
    }

    .contact-label {
      font-size: 11px;
      color: #666;
    }

    .contact-value {
      font-size: 15px;
      font-weight: 600;
      color: #2e7d32;
    }

    /* Mobile adjustments */
    @media (max-width: 480px) {
      .passenger-points {
        flex-direction: column;
      }

      .passenger-point {
        width: 100%;
      }

      .journey-arrow {
        transform: rotate(90deg);
      }

      .map-legend {
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  `]
})
export class RideRequestsDialogComponent implements OnInit, OnDestroy {
  requests: RideRequest[] = [];
  loading = true;
  processing = false;
  processingId: string | null = null;
  processingAction: 'accept' | 'reject' | null = null;
  hasChanges = false;
  expandedMapId: string | null = null;
  private maps: { [key: string]: L.Map } = {};
  private routeLines: { [key: string]: L.Polyline } = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { ride: Ride },
    private dialogRef: MatDialogRef<RideRequestsDialogComponent>,
    private rideService: RideService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
    this.addMarkerStyles();
  }

  ngOnDestroy(): void {
    // Clean up all maps
    Object.values(this.maps).forEach(map => map.remove());
  }

  private addMarkerStyles(): void {
    const styleId = 'request-dialog-marker-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .request-marker-circle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        color: white;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .request-origin-circle { background: #4caf50; }
      .request-pickup-circle { background: #2196f3; }
      .request-dropoff-circle { background: #ff9800; }
      .request-dest-circle { background: #f44336; }
    `;
    document.head.appendChild(style);
  }

  toggleMap(requestId: string): void {
    if (this.expandedMapId === requestId) {
      this.expandedMapId = null;
    } else {
      this.expandedMapId = requestId;
      setTimeout(() => this.initMapForRequest(requestId), 50);
    }
  }

  hasRouteCoordinates(request: RideRequest): boolean {
    const ride = this.data.ride;
    return !!(
      ride.originLat && ride.originLng && ride.destLat && ride.destLng &&
      request.pickupLat && request.pickupLng && request.dropoffLat && request.dropoffLng
    );
  }

  private initMapForRequest(requestId: string): void {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) return;

    // Skip if map already exists
    if (this.maps[requestId]) return;

    const ride = this.data.ride;
    const mapId = `request-map-${requestId}`;
    const container = document.getElementById(mapId);
    if (!container) return;

    // Create map
    const map = L.map(mapId, {
      zoomControl: true,
      attributionControl: false
    }).setView([23.8103, 90.4125], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    this.maps[requestId] = map;

    // Add markers: A (origin), P (pickup), D (dropoff), B (destination)
    const createIcon = (label: string, className: string) => L.divIcon({
      className: 'custom-marker',
      html: `<div class="request-marker-circle ${className}"><span>${label}</span></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // A - Origin (green)
    if (ride.originLat && ride.originLng) {
      L.marker([ride.originLat, ride.originLng], { icon: createIcon('A', 'request-origin-circle') })
        .addTo(map)
        .bindPopup(`<strong>Origin (A):</strong><br>${ride.origin}`);
    }

    // P - Pickup (purple)
    if (request.pickupLat && request.pickupLng) {
      L.marker([request.pickupLat, request.pickupLng], { icon: createIcon('P', 'request-pickup-circle') })
        .addTo(map)
        .bindPopup(`<strong>Pickup (P):</strong><br>${request.pickupLocation || 'Passenger pickup'}`);
    }

    // D - Dropoff (orange)
    if (request.dropoffLat && request.dropoffLng) {
      L.marker([request.dropoffLat, request.dropoffLng], { icon: createIcon('D', 'request-dropoff-circle') })
        .addTo(map)
        .bindPopup(`<strong>Drop-off (D):</strong><br>${request.dropoffLocation || 'Passenger drop-off'}`);
    }

    // B - Destination (red)
    if (ride.destLat && ride.destLng) {
      L.marker([ride.destLat, ride.destLng], { icon: createIcon('B', 'request-dest-circle') })
        .addTo(map)
        .bindPopup(`<strong>Destination (B):</strong><br>${ride.destination}`);
    }

    // Fetch and draw route A → P → D → B
    this.fetchAndDrawRoute(requestId, map, ride, request);
  }

  private fetchAndDrawRoute(requestId: string, map: L.Map, ride: Ride, request: RideRequest): void {
    if (!ride.originLat || !ride.originLng || !ride.destLat || !ride.destLng ||
        !request.pickupLat || !request.pickupLng || !request.dropoffLat || !request.dropoffLng) {
      return;
    }

    // OSRM route: A → P → D → B
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${ride.originLng},${ride.originLat};${request.pickupLng},${request.pickupLat};${request.dropoffLng},${request.dropoffLat};${ride.destLng},${ride.destLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(osrmUrl, { signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId);
        return response.json();
      })
      .then(data => {
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const latLngs: L.LatLngExpression[] = route.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]]
          );

          this.routeLines[requestId] = L.polyline(latLngs, {
            color: '#1976d2',
            weight: 4,
            opacity: 0.8
          }).addTo(map);

          map.fitBounds(this.routeLines[requestId].getBounds(), { padding: [30, 30] });
        } else {
          this.drawFallbackRoute(requestId, map, ride, request);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.drawFallbackRoute(requestId, map, ride, request);
      });
  }

  private drawFallbackRoute(requestId: string, map: L.Map, ride: Ride, request: RideRequest): void {
    if (!ride.originLat || !ride.originLng || !ride.destLat || !ride.destLng ||
        !request.pickupLat || !request.pickupLng || !request.dropoffLat || !request.dropoffLng) {
      return;
    }

    const points: L.LatLngExpression[] = [
      [ride.originLat, ride.originLng],
      [request.pickupLat, request.pickupLng],
      [request.dropoffLat, request.dropoffLng],
      [ride.destLat, ride.destLng]
    ];

    this.routeLines[requestId] = L.polyline(points, {
      color: '#1976d2',
      weight: 3,
      opacity: 0.6,
      dashArray: '8, 8'
    }).addTo(map);

    map.fitBounds(this.routeLines[requestId].getBounds(), { padding: [30, 30] });
  }

  loadRequests(): void {
    this.loading = true;
    this.expandedMapId = null;
    // Clean up existing maps before reloading
    Object.values(this.maps).forEach(map => map.remove());
    this.maps = {};
    this.routeLines = {};
    
    this.rideService.getRideRequests(this.data.ride.id).subscribe({
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

  acceptRequest(request: RideRequest): void {
    this.processing = true;
    this.processingId = request.id;
    this.processingAction = 'accept';
    this.rideService.acceptRequest(request.id).subscribe({
      next: () => {
        this.snackBar.open('Request accepted! Contact info shared.', 'Close', { duration: 3000 });
        this.hasChanges = true;
        this.loadRequests();
        this.processing = false;
        this.processingId = null;
        this.processingAction = null;
      },
      error: () => {
        this.snackBar.open('Failed to accept request', 'Close', { duration: 3000 });
        this.processing = false;
        this.processingId = null;
        this.processingAction = null;
      }
    });
  }

  rejectRequest(request: RideRequest): void {
    this.processing = true;
    this.processingId = request.id;
    this.processingAction = 'reject';
    this.rideService.rejectRequest(request.id).subscribe({
      next: () => {
        this.snackBar.open('Request declined', 'Close', { duration: 3000 });
        this.hasChanges = true;
        this.loadRequests();
        this.processing = false;
        this.processingId = null;
        this.processingAction = null;
      },
      error: () => {
        this.snackBar.open('Failed to decline request', 'Close', { duration: 3000 });
        this.processing = false;
        this.processingId = null;
        this.processingAction = null;
      }
    });
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

  formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return 'Not specified';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim();
    if (parts.length > 1) {
      shortAddr += ', ' + parts[1].trim();
    }
    return shortAddr.length > 35 ? shortAddr.substring(0, 35) + '...' : shortAddr;
  }

  close(): void {
    this.dialogRef.close(this.hasChanges ? 'refresh' : null);
  }
}
