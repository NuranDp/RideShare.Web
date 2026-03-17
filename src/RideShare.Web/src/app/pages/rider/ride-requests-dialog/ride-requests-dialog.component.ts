import { Component, Inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { RideService } from '../../../services/ride.service';
import { Ride, RideRequest, RequestStatus } from '../../../models/ride.model';
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
  templateUrl: './ride-requests-dialog.component.html',
  styleUrls: ['./ride-requests-dialog.component.scss']
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
