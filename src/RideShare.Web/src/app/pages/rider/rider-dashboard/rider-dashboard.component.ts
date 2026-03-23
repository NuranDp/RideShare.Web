import { Component, OnInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { RiderService } from '../../../services/rider.service';
import { RideService } from '../../../services/ride.service';
import { ThemeService } from '../../../services/theme.service';
import { PendingRequestWithRide } from '../../../models/ride.model';
import * as L from 'leaflet';

// Mobile-friendly Rider Dashboard with bottom navigation

@Component({
  selector: 'app-rider-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MatRippleModule,
    MatSnackBarModule
  ],
  templateUrl: './rider-dashboard.component.html',
  styleUrls: ['./rider-dashboard.component.scss']
})
export class RiderDashboardComponent implements OnInit, AfterViewChecked, OnDestroy {
  activeTab: 'rides' | 'requests' | 'profile' = 'rides';
  
  // Rider stats
  totalRides = 0;
  riderRating = 0;
  totalRatings = 0;
  pendingRequests = 0;
  isVerified = false;
  isPending = false;
  motorcycleModel = '';
  emergencyContact = '';
  
  // Data
  upcomingRides: any[] = [];
  activities: any[] = [];
  pendingRequestsList: PendingRequestWithRide[] = [];
  
  // Processing state
  processingRequest: string | null = null;
  processingAction: 'accept' | 'reject' | null = null;
  confirmingRequest: PendingRequestWithRide | null = null;
  
  // Map expansion state
  expandedRequestId: string | null = null;
  private mapInitialized = false;
  private requestMaps: Map<string, L.Map> = new Map();

  constructor(
    public authService: AuthService,
    private riderService: RiderService,
    private rideService: RideService,
    public themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check for tab query param
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['rides', 'requests', 'profile'].includes(params['tab'])) {
        this.activeTab = params['tab'] as 'rides' | 'requests' | 'profile';
      }
    });
    
    this.loadRiderProfile();
    this.loadUpcomingRides();
    this.loadPendingRequests();
    this.loadActivities();
  }

  ngAfterViewChecked(): void {
    if (this.expandedRequestId && !this.mapInitialized) {
      this.initializeMap(this.expandedRequestId);
    }
  }

  ngOnDestroy(): void {
    // Cleanup all maps
    this.requestMaps.forEach(map => map.remove());
    this.requestMaps.clear();
  }

  toggleRequestDetails(requestId: string): void {
    if (this.expandedRequestId === requestId) {
      // Cleanup existing map
      const existingMap = this.requestMaps.get(requestId);
      if (existingMap) {
        existingMap.remove();
        this.requestMaps.delete(requestId);
      }
      this.expandedRequestId = null;
      this.mapInitialized = false;
    } else {
      // Cleanup previous map if any
      if (this.expandedRequestId) {
        const existingMap = this.requestMaps.get(this.expandedRequestId);
        if (existingMap) {
          existingMap.remove();
          this.requestMaps.delete(this.expandedRequestId);
        }
      }
      this.expandedRequestId = requestId;
      this.mapInitialized = false;
    }
  }

  showRequestDetails(requestId: string): void {
    // Switch to requests tab and expand this specific request
    this.activeTab = 'requests';
    // Cleanup any previously expanded map
    if (this.expandedRequestId && this.expandedRequestId !== requestId) {
      const existingMap = this.requestMaps.get(this.expandedRequestId);
      if (existingMap) {
        existingMap.remove();
        this.requestMaps.delete(this.expandedRequestId);
      }
    }
    this.expandedRequestId = requestId;
    this.mapInitialized = false;
  }

  private initializeMap(requestId: string): void {
    const mapContainer = document.getElementById(`request-map-${requestId}`);
    if (!mapContainer || this.requestMaps.has(requestId)) return;

    const request = this.pendingRequestsList.find(r => r.id === requestId);
    if (!request) return;

    this.mapInitialized = true;

    // Create map
    const map = L.map(`request-map-${requestId}`, {
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    this.requestMaps.set(requestId, map);

    // Collect all points for bounds
    const points: L.LatLngExpression[] = [];

    // Custom icons
    const originIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: linear-gradient(135deg, #4caf50, #2e7d32); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">A</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const destIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: linear-gradient(135deg, #f44336, #c62828); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">B</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const pickupIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: linear-gradient(135deg, #2196f3, #1565c0); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">P</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const dropoffIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: linear-gradient(135deg, #ff9800, #ef6c00); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">D</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Default to Dhaka if no coordinates
    const defaultLat = 23.8103;
    const defaultLng = 90.4125;

    // Get ride origin/destination coordinates (use defaults if not available)
    const rideOriginLat = request.rideOriginLat || defaultLat;
    const rideOriginLng = request.rideOriginLng || defaultLng;
    const rideDestLat = request.rideDestLat || (defaultLat + 0.015);
    const rideDestLng = request.rideDestLng || (defaultLng + 0.015);

    // Passenger pickup: use custom if provided, otherwise use ride origin with slight offset
    const pickupLat = request.pickupLat || (rideOriginLat + 0.003);
    const pickupLng = request.pickupLng || (rideOriginLng + 0.003);
    const pickupLabel = request.pickupLocation || 'Same as ride start';

    // Passenger dropoff: use custom if provided, otherwise use ride destination with slight offset
    const dropoffLat = request.dropoffLat || (rideDestLat - 0.003);
    const dropoffLng = request.dropoffLng || (rideDestLng - 0.003);
    const dropoffLabel = request.dropoffLocation || 'Same as ride end';

    // 1. Add ride origin marker (A - green)
    L.marker([rideOriginLat, rideOriginLng], { icon: originIcon })
      .addTo(map)
      .bindPopup(`<b>Ride Start</b><br>${request.rideOrigin}`);
    points.push([rideOriginLat, rideOriginLng]);

    // 2. Add passenger pickup marker (P - blue)
    L.marker([pickupLat, pickupLng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<b>Passenger Pickup</b><br>${pickupLabel}`);
    points.push([pickupLat, pickupLng]);

    // 3. Add passenger dropoff marker (D - orange)
    L.marker([dropoffLat, dropoffLng], { icon: dropoffIcon })
      .addTo(map)
      .bindPopup(`<b>Passenger Dropoff</b><br>${dropoffLabel}`);
    points.push([dropoffLat, dropoffLng]);

    // 4. Add ride destination marker (B - red)
    L.marker([rideDestLat, rideDestLng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<b>Ride End</b><br>${request.rideDestination}`);
    points.push([rideDestLat, rideDestLng]);

    // Draw route line connecting all points in order: A -> P -> D -> B
    L.polyline(points, {
      color: '#034694',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);

    // Fit bounds with padding
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [30, 30] });

    // Invalidate size after a short delay to ensure proper rendering
    setTimeout(() => map.invalidateSize(), 100);
  }

  loadRiderProfile(): void {
    this.riderService.getMyProfile().subscribe({
      next: (profile) => {
        this.isVerified = profile.isLicenseVerified;
        this.isPending = !!profile.licenseNumber && !profile.isLicenseVerified;
        this.motorcycleModel = profile.motorcycleModel || '';
        this.totalRides = profile.totalRides || 0;
        this.riderRating = profile.averageRating || 0;
        this.totalRatings = profile.totalRatings || 0;
      },
      error: () => {}
    });

    // Load emergency contact from user profile
    const user = this.authService.currentUser();
    if (user?.emergencyContact?.name) {
      this.emergencyContact = user.emergencyContact.name;
    }
  }

  loadUpcomingRides(): void {
    this.rideService.getMyPostedRides().subscribe({
      next: (rides) => {
        // Filter to upcoming rides (Active or Booked status)
        this.upcomingRides = rides
          .filter(r => r.status === 'Active' || r.status === 'Booked' || r.status === 'InProgress')
          .slice(0, 3);
        
        // Count pending requests
        this.pendingRequests = rides.reduce((sum, r) => sum + (r.requestCount || 0), 0);
      },
      error: () => {}
    });
  }

  loadPendingRequests(): void {
    this.rideService.getMyPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequestsList = requests;
        this.pendingRequests = requests.length;
      },
      error: () => {}
    });
  }

  acceptRequest(request: PendingRequestWithRide): void {
    this.confirmingRequest = request;
  }

  cancelConfirm(): void {
    this.confirmingRequest = null;
  }

  confirmAccept(): void {
    if (!this.confirmingRequest) return;
    
    const request = this.confirmingRequest;
    this.processingRequest = request.id;
    this.processingAction = 'accept';
    
    this.rideService.acceptRequest(request.id).subscribe({
      next: () => {
        this.snackBar.open(`Accepted ${request.passengerName}'s request!`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.confirmingRequest = null;
        this.loadPendingRequests();
        this.loadUpcomingRides();
        this.processingRequest = null;
        this.processingAction = null;
      },
      error: () => {
        this.snackBar.open('Failed to accept request. Please try again.', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.confirmingRequest = null;
        this.processingRequest = null;
        this.processingAction = null;
      }
    });
  }

  rejectRequest(request: PendingRequestWithRide): void {
    this.processingRequest = request.id;
    this.processingAction = 'reject';
    
    this.rideService.rejectRequest(request.id).subscribe({
      next: () => {
        this.snackBar.open('Request declined', 'Close', {
          duration: 3000
        });
        this.loadPendingRequests();
        this.processingRequest = null;
        this.processingAction = null;
      },
      error: () => {
        this.snackBar.open('Failed to decline request. Please try again.', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.processingRequest = null;
        this.processingAction = null;
      }
    });
  }

  loadActivities(): void {
    // Mock activity data - in real app, this would come from an API
    this.activities = [
      { id: 1, type: 'request', title: 'New ride request', description: 'John Doe requested to join your ride', time: '2 hours ago' },
      { id: 2, type: 'rating', title: 'New rating received', description: 'You received a 5-star rating', time: '1 day ago' },
      { id: 3, type: 'completed', title: 'Ride completed', description: 'Mirpur → Dhanmondi', time: '2 days ago' },
    ];
  }

  getTabIcon(): string {
    switch (this.activeTab) {
      case 'rides': return 'electric_moped';
      case 'requests': return 'person_add';
      case 'profile': return 'person';
      default: return 'electric_moped';
    }
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'rides': return 'Rider';
      case 'requests': return 'Pending Requests';
      case 'profile': return 'Profile';
      default: return 'Rider';
    }
  }

  getShortAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    return parts[0].trim().substring(0, 20) + (parts[0].length > 20 ? '...' : '');
  }

  getMediumAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    const firstPart = parts[0].trim();
    const secondPart = parts[1]?.trim();
    let result = firstPart.substring(0, 30);
    if (secondPart) {
      result += ', ' + secondPart.substring(0, 20);
    }
    if (result.length > 45) {
      result = result.substring(0, 45) + '...';
    }
    return result;
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatShortDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'request': 'person_add',
      'accepted': 'check_circle',
      'completed': 'done_all',
      'rating': 'star'
    };
    return icons[type] || 'notifications';
  }

  formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  getFirstName(): string {
    const fullName = this.authService.currentUser()?.fullName;
    return fullName?.split(' ')[0] || 'Rider';
  }

  logout(): void {
    this.authService.logout();
  }
}
