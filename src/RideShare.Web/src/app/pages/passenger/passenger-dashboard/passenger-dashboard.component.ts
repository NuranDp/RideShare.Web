import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { AuthService } from '../../../services/auth.service';
import { RideService } from '../../../services/ride.service';
import { NotificationService } from '../../../services/notification.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-passenger-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatBadgeModule
  ],
  templateUrl: './passenger-dashboard.component.html',
  styleUrls: ['./passenger-dashboard.component.scss']
})
export class PassengerDashboardComponent implements OnInit, OnDestroy {
  activeTab: 'home' | 'activity' | 'profile' = 'home';
  activeHomeTab: 'find' | 'request' = 'find';
  
  // Stats
  totalRides = 0;
  pendingCount = 0;
  acceptedCount = 0;
  emergencyContact = '';
  
  // Data
  upcomingRides: any[] = [];
  activities: any[] = [];

  // Request Ride — location state
  pickupAddress = '';
  pickupLat = 0;
  pickupLng = 0;
  dropoffAddress = '';
  dropoffLat = 0;
  dropoffLng = 0;

  // Inline search
  searchResults: any[] = [];
  activeInput: 'pickup' | 'dropoff' | null = null;
  routeDistance = '';
  mapMode: 'pickup' | 'dropoff' = 'pickup';
  private requestMap?: L.Map;
  private pickupMarker?: L.Marker;
  private dropoffMarker?: L.Marker;
  private routeLine?: L.Polyline;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  private notificationSub?: Subscription;

  constructor(
    public authService: AuthService,
    private rideService: RideService,
    private notificationService: NotificationService,
    public themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'profile') {
        this.activeTab = 'profile';
      } else if (params['tab'] === 'home') {
        this.activeTab = 'home';
      }
      if (params['homeTab'] === 'request') {
        this.activeHomeTab = 'request';
        setTimeout(() => this.initRequestMap(), 300);
      } else if (params['homeTab'] === 'find') {
        this.activeHomeTab = 'find';
      }
    });
    this.loadRequests();
    this.loadActivities();

    // Auto-refresh dashboard when ride-related notifications come in
    this.notificationSub = this.notificationService.onRideNotification$.subscribe(() => {
      this.loadRequests();
    });
  }

  ngOnDestroy(): void {
    this.notificationSub?.unsubscribe();
    this.requestMap?.remove();
    this.requestMap = undefined;
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
  }

  setHomeTab(tab: 'find' | 'request'): void {
    this.activeHomeTab = tab;
    if (tab === 'request') {
      setTimeout(() => this.initRequestMap(), 150);
    }
  }

  setMapMode(mode: 'pickup' | 'dropoff'): void {
    if (mode === 'dropoff' && !this.pickupLat) return;
    this.mapMode = mode;
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

        // Upcoming rides should only include booked rides, not active in-progress rides
        this.upcomingRides = requests
          .filter(r => r.status === 'Accepted' && r.rideStatus === 'Booked')
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

  requestRideNow(): void {
    this.router.navigate(['/passenger/request-ondemand'], {
      state: {
        pickupLocation: this.pickupAddress,
        pickupLat: this.pickupLat,
        pickupLng: this.pickupLng,
        dropoffLocation: this.dropoffAddress,
        dropoffLat: this.dropoffLat,
        dropoffLng: this.dropoffLng
      }
    });
  }

  onPickupInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pickupLat = 0;
    this.pickupLng = 0;
    this.pickupMarker?.remove(); this.pickupMarker = undefined;
    this.dropoffMarker?.remove(); this.dropoffMarker = undefined;
    this.routeLine?.remove(); this.routeLine = undefined;
    this.routeDistance = '';
    this.doAddressSearch(value);
  }

  onDropoffInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dropoffLat = 0;
    this.dropoffLng = 0;
    this.dropoffMarker?.remove(); this.dropoffMarker = undefined;
    this.routeLine?.remove(); this.routeLine = undefined;
    this.routeDistance = '';
    this.doAddressSearch(value);
  }

  onInputBlur(): void {
    setTimeout(() => {
      this.searchResults = [];
      this.activeInput = null;
    }, 150);
  }

  doAddressSearch(query: string): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    if (!query || query.length < 3) { this.searchResults = []; return; }
    this.searchDebounce = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=bd`)
        .then(r => r.json())
        .then(results => { this.searchResults = Array.isArray(results) ? results : []; })
        .catch(() => { this.searchResults = []; });
    }, 450);
  }

  selectResult(result: any): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (this.activeInput === 'pickup') {
      this.pickupAddress = result.display_name;
      this.pickupLat = lat;
      this.pickupLng = lng;
      this.addPickupMarker(lat, lng);
      this.mapMode = 'dropoff';
      this.requestMap?.setView([lat, lng] as L.LatLngExpression, 15);
    } else if (this.activeInput === 'dropoff') {
      this.dropoffAddress = result.display_name;
      this.dropoffLat = lat;
      this.dropoffLng = lng;
      this.addDropoffMarker(lat, lng);
    }
    this.searchResults = [];
    if (this.pickupLat && this.dropoffLat) {
      this.routeDistance = this.calcDistance(this.pickupLat, this.pickupLng, this.dropoffLat, this.dropoffLng);
      this.drawRoute();
    }
  }

  clearPickup(): void {
    this.pickupAddress = '';
    this.pickupLat = 0;
    this.pickupLng = 0;
    this.dropoffAddress = '';
    this.dropoffLat = 0;
    this.dropoffLng = 0;
    this.pickupMarker?.remove(); this.pickupMarker = undefined;
    this.dropoffMarker?.remove(); this.dropoffMarker = undefined;
    this.routeLine?.remove(); this.routeLine = undefined;
    this.routeDistance = '';
    this.mapMode = 'pickup';
    this.requestMap?.setView([23.8103, 90.4125] as L.LatLngExpression, 12);
  }

  clearDropoff(): void {
    this.dropoffAddress = '';
    this.dropoffLat = 0;
    this.dropoffLng = 0;
    this.dropoffMarker?.remove(); this.dropoffMarker = undefined;
    this.routeLine?.remove(); this.routeLine = undefined;
    this.routeDistance = '';
    if (this.pickupLat) this.requestMap?.setView([this.pickupLat, this.pickupLng] as L.LatLngExpression, 15);
  }

  getResultName(result: any): string {
    return (result.display_name || '').split(',')[0].trim();
  }

  useCurrentLocation(type: 'pickup' | 'dropoff'): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.ngZone.run(() => {
          if (type === 'pickup') {
            this.pickupLat = lat;
            this.pickupLng = lng;
            this.pickupAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            this.addPickupMarker(lat, lng);
            this.mapMode = 'dropoff';
            this.requestMap?.setView([lat, lng] as L.LatLngExpression, 15);
          } else {
            this.dropoffLat = lat;
            this.dropoffLng = lng;
            this.dropoffAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            this.addDropoffMarker(lat, lng);
          }
          this.reverseGeocodePoint(lat, lng, type);
          if (this.pickupLat && this.dropoffLat) {
            this.routeDistance = this.calcDistance(this.pickupLat, this.pickupLng, this.dropoffLat, this.dropoffLng);
            this.drawRoute();
          }
        });
      },
      () => {}
    );
  }

  private initRequestMap(): void {
    const container = document.getElementById('request-ride-map');
    if (!container) return;
    if (this.requestMap) {
      this.requestMap.invalidateSize();
      return;
    }

    this.requestMap = L.map('request-ride-map', {
      zoomControl: true,
      attributionControl: false,
      center: [23.8103, 90.4125] as L.LatLngExpression,
      zoom: 12
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.requestMap);

    this.requestMap.on('click', (e: L.LeafletMouseEvent) => {
      this.ngZone.run(() => this.onMapClick(e.latlng.lat, e.latlng.lng));
    });

    // Restore markers if locations already set
    if (this.pickupLat) this.addPickupMarker(this.pickupLat, this.pickupLng);
    if (this.dropoffLat) {
      this.addDropoffMarker(this.dropoffLat, this.dropoffLng);
      this.drawRoute();
    } else if (this.pickupLat) {
      this.requestMap.setView([this.pickupLat, this.pickupLng] as L.LatLngExpression, 15);
    }
  }

  private onMapClick(lat: number, lng: number): void {
    if (this.mapMode === 'pickup') {
      this.pickupAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      this.pickupLat = lat;
      this.pickupLng = lng;
      this.addPickupMarker(lat, lng);
      this.mapMode = 'dropoff';
      this.reverseGeocodePoint(lat, lng, 'pickup');
      // Clear dropoff if re-selecting pickup
      if (this.dropoffLat) {
        this.dropoffAddress = '';
        this.dropoffLat = 0; this.dropoffLng = 0;
        this.dropoffMarker?.remove(); this.dropoffMarker = undefined;
        this.routeLine?.remove(); this.routeLine = undefined;
        this.routeDistance = '';
      }
    } else {
      this.dropoffAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      this.dropoffLat = lat;
      this.dropoffLng = lng;
      this.addDropoffMarker(lat, lng);
      this.routeDistance = this.calcDistance(this.pickupLat, this.pickupLng, lat, lng);
      this.drawRoute();
      this.reverseGeocodePoint(lat, lng, 'dropoff');
    }
  }

  private makeMarkerIcon(label: string, color: string): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `<div style="background:${color};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)">${label}</div>`,
      iconAnchor: [16, 16]
    });
  }

  private addPickupMarker(lat: number, lng: number): void {
    this.pickupMarker?.remove();
    if (!this.requestMap) return;
    this.pickupMarker = L.marker([lat, lng] as L.LatLngExpression, { icon: this.makeMarkerIcon('P', '#4CAF50') }).addTo(this.requestMap);
  }

  private addDropoffMarker(lat: number, lng: number): void {
    this.dropoffMarker?.remove();
    if (!this.requestMap) return;
    this.dropoffMarker = L.marker([lat, lng] as L.LatLngExpression, { icon: this.makeMarkerIcon('D', '#F44336') }).addTo(this.requestMap);
  }

  private drawRoute(): void {
    this.routeLine?.remove();
    this.routeLine = undefined;
    if (!this.requestMap || !this.pickupLat || !this.dropoffLat) return;
    const url = `https://router.project-osrm.org/route/v1/driving/${this.pickupLng},${this.pickupLat};${this.dropoffLng},${this.dropoffLat}?overview=full&geometries=geojson`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        this.ngZone.run(() => {
          if (!this.requestMap || !data?.routes?.[0]) return;
          this.routeLine?.remove();
          const coords: L.LatLngExpression[] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as L.LatLngExpression
          );
          this.routeLine = L.polyline(coords, { color: '#034694', weight: 4, opacity: 0.85 }).addTo(this.requestMap);
          this.requestMap.fitBounds(this.routeLine.getBounds(), { padding: [60, 60] });
        });
      })
      .catch(() => {
        if (!this.requestMap) return;
        this.routeLine = L.polyline(
          [[this.pickupLat, this.pickupLng], [this.dropoffLat, this.dropoffLng]] as L.LatLngExpression[],
          { color: '#034694', weight: 3, dashArray: '8, 6', opacity: 0.9 }
        ).addTo(this.requestMap);
      });
  }

  private fitBothMarkers(): void {
    if (!this.requestMap || !this.pickupLat || !this.dropoffLat) return;
    this.requestMap.fitBounds(
      L.latLngBounds([this.pickupLat, this.pickupLng], [this.dropoffLat, this.dropoffLng]),
      { padding: [60, 60] }
    );
  }

  private reverseGeocodePoint(lat: number, lng: number, type: 'pickup' | 'dropoff'): void {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(r => r.json())
      .then(data => {
        this.ngZone.run(() => {
          if (data?.display_name) {
            if (type === 'pickup') this.pickupAddress = data.display_name;
            else this.dropoffAddress = data.display_name;
          }
        });
      })
      .catch(() => {});
  }

  private calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }
}
