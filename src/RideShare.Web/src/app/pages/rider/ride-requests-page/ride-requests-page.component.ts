import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { RideService } from '../../../services/ride.service';
import { Ride, RideRequest } from '../../../models/ride.model';
import { NotificationBellComponent } from '../../../components/notification-bell/notification-bell.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-ride-requests-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRippleModule,
    MatChipsModule,
    NotificationBellComponent
  ],
  templateUrl: './ride-requests-page.component.html',
  styleUrls: ['./ride-requests-page.component.scss']
})
export class RideRequestsPageComponent implements OnInit, OnDestroy {
  rideId: string = '';
  ride: Ride | null = null;
  requests: RideRequest[] = [];
  loadingRide = true;
  loadingRequests = false;
  processing = false;
  processingId: string | null = null;
  processingAction: 'accept' | 'reject' | null = null;
  expandedMapId: string | null = null;
  private maps: { [key: string]: L.Map } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rideService: RideService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    if (this.rideId) {
      this.loadRide();
    }
    this.addMarkerStyles();
  }

  ngOnDestroy(): void {
    Object.values(this.maps).forEach(map => map.remove());
  }

  private addMarkerStyles(): void {
    const styleId = 'request-page-marker-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .page-marker-circle {
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
      .page-origin-circle { background: #4caf50; }
      .page-pickup-circle { background: #2196f3; }
      .page-dropoff-circle { background: #ff9800; }
      .page-dest-circle { background: #f44336; }
    `;
    document.head.appendChild(style);
  }

  loadRide(): void {
    this.loadingRide = true;
    this.rideService.getRide(this.rideId).subscribe({
      next: (ride) => {
        this.ride = ride;
        this.loadingRide = false;
        this.loadRequests();
      },
      error: () => {
        this.snackBar.open('Failed to load ride', 'Close', { duration: 3000 });
        this.loadingRide = false;
        this.router.navigate(['/rider/my-rides']);
      }
    });
  }

  loadRequests(): void {
    this.loadingRequests = true;
    this.rideService.getRideRequests(this.rideId).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loadingRequests = false;
      },
      error: () => {
        this.snackBar.open('Failed to load requests', 'Close', { duration: 3000 });
        this.loadingRequests = false;
      }
    });
  }

  hasRouteCoordinates(request: RideRequest): boolean {
    if (!this.ride) return false;
    return !!(
      this.ride.originLat && this.ride.originLng && this.ride.destLat && this.ride.destLng &&
      request.pickupLat && request.pickupLng && request.dropoffLat && request.dropoffLng
    );
  }

  toggleMap(requestId: string): void {
    if (this.expandedMapId === requestId) {
      this.expandedMapId = null;
    } else {
      this.expandedMapId = requestId;
      setTimeout(() => this.initMapForRequest(requestId), 50);
    }
  }

  private initMapForRequest(requestId: string): void {
    const request = this.requests.find(r => r.id === requestId);
    if (!request || !this.ride) return;
    if (this.maps[requestId]) return;

    const mapId = `request-map-${requestId}`;
    const container = document.getElementById(mapId);
    if (!container) return;

    const map = L.map(mapId, {
      zoomControl: true,
      attributionControl: false
    }).setView([23.8103, 90.4125], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    this.maps[requestId] = map;

    const createIcon = (label: string, className: string) => L.divIcon({
      className: 'custom-marker',
      html: `<div class="page-marker-circle ${className}"><span>${label}</span></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const ride = this.ride;
    const bounds: L.LatLngExpression[] = [];

    if (ride.originLat && ride.originLng) {
      L.marker([ride.originLat, ride.originLng], { icon: createIcon('A', 'page-origin-circle') })
        .addTo(map).bindPopup(`<strong>Origin (A):</strong><br>${ride.origin}`);
      bounds.push([ride.originLat, ride.originLng]);
    }

    if (request.pickupLat && request.pickupLng) {
      L.marker([request.pickupLat, request.pickupLng], { icon: createIcon('P', 'page-pickup-circle') })
        .addTo(map).bindPopup(`<strong>Pickup (P):</strong><br>${request.pickupLocation || 'Passenger pickup'}`);
      bounds.push([request.pickupLat, request.pickupLng]);
    }

    if (request.dropoffLat && request.dropoffLng) {
      L.marker([request.dropoffLat, request.dropoffLng], { icon: createIcon('D', 'page-dropoff-circle') })
        .addTo(map).bindPopup(`<strong>Drop-off (D):</strong><br>${request.dropoffLocation || 'Passenger drop-off'}`);
      bounds.push([request.dropoffLat, request.dropoffLng]);
    }

    if (ride.destLat && ride.destLng) {
      L.marker([ride.destLat, ride.destLng], { icon: createIcon('B', 'page-dest-circle') })
        .addTo(map).bindPopup(`<strong>Destination (B):</strong><br>${ride.destination}`);
      bounds.push([ride.destLat, ride.destLng]);
    }

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    }
  }

  acceptRequest(request: RideRequest): void {
    this.processing = true;
    this.processingId = request.id;
    this.processingAction = 'accept';
    this.rideService.acceptRequest(request.id).subscribe({
      next: () => {
        this.snackBar.open('Request accepted! Contact info shared.', 'Close', { duration: 3000 });
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
    return shortAddr.length > 30 ? shortAddr.substring(0, 30) + '...' : shortAddr;
  }

  goBack(): void {
    this.router.navigate(['/rider/my-rides']);
  }

  goToRequests(): void {
    this.router.navigate(['/rider'], { queryParams: { tab: 'requests' } });
  }

  goToProfile(): void {
    this.router.navigate(['/rider'], { queryParams: { tab: 'profile' } });
  }
}
