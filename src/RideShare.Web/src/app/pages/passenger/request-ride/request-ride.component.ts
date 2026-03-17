import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { trigger, style, transition, animate } from '@angular/animations';
import { RideService } from '../../../services/ride.service';
import { Ride } from '../../../models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-request-ride',
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
    MatTooltipModule,
    MatCardModule
  ],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  templateUrl: './request-ride.component.html',
  styleUrls: ['./request-ride.component.scss']
})
export class RequestRideComponent implements OnInit, AfterViewInit, OnDestroy {
  rideId: string = '';
  ride: Ride | null = null;
  loading = true;
  error: string | null = null;
  
  message = '';
  pickupLocation = '';
  dropoffLocation = '';
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  selectionMode: 'pickup' | 'dropoff' = 'pickup';
  sending = false;
  routeLoading = false;
  
  // Search-related
  pickupSearchQuery = '';
  dropoffSearchQuery = '';
  pickupSearchResults: any[] = [];
  dropoffSearchResults: any[] = [];
  showPickupResults = false;
  showDropoffResults = false;
  pickupSearching = false;
  dropoffSearching = false;
  gettingPickupLocation = false;
  gettingDropoffLocation = false;
  private searchDebounceTimer: any;
  
  private map: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private dropoffMarker: L.Marker | null = null;
  private routeLine?: L.Polyline;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private rideService: RideService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    if (this.rideId) {
      this.loadRide();
    } else {
      this.error = 'No ride ID provided';
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    // Map will be initialized after ride is loaded
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  private loadRide(): void {
    this.loading = true;
    this.rideService.getRide(this.rideId).subscribe({
      next: (ride) => {
        this.ride = ride;
        this.loading = false;
        setTimeout(() => this.initMap(), 100);
      },
      error: () => {
        this.error = 'Could not load ride details';
        this.loading = false;
      }
    });
  }

  private initMap(): void {
    if (!this.ride) return;

    let centerLat = 23.8103;
    let centerLng = 90.4125;
    
    if (this.ride.originLat && this.ride.originLng) {
      centerLat = this.ride.originLat;
      centerLng = this.ride.originLng;
    }

    this.map = L.map('request-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(this.map);

    this.addMarkerStyles();

    // Add rider's origin marker (A)
    if (this.ride.originLat && this.ride.originLng) {
      const originIcon = L.divIcon({
        className: 'custom-marker origin-marker',
        html: `<div class="marker-circle origin-circle"><span>A</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([this.ride.originLat, this.ride.originLng], { icon: originIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Rider's Start (A):</strong><br>${this.ride.origin}`);
    }

    // Add rider's destination marker (B)
    if (this.ride.destLat && this.ride.destLng) {
      const destIcon = L.divIcon({
        className: 'custom-marker dest-marker',
        html: `<div class="marker-circle dest-circle"><span>B</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([this.ride.destLat, this.ride.destLng], { icon: destIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Rider's End (B):</strong><br>${this.ride.destination}`);
    }

    // Draw route
    if (this.ride.originLat && this.ride.originLng && this.ride.destLat && this.ride.destLng) {
      this.fetchAndDrawRoute(this.ride.originLat, this.ride.originLng, this.ride.destLat, this.ride.destLng);
    }

    // Handle map clicks
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.handleMapClick(e.latlng);
    });
  }

  private addMarkerStyles(): void {
    const styleId = 'request-map-marker-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .marker-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: white;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      }
      .origin-circle { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); }
      .dest-circle { background: linear-gradient(135deg, #f44336 0%, #c62828 100%); }
      .pickup-circle { background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); }
      .dropoff-circle { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); }
    `;
    document.head.appendChild(style);
  }

  private fetchAndDrawRoute(originLat: number, originLng: number, destLat: number, destLng: number): void {
    if (!this.map) return;

    this.routeLoading = true;

    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(osrmUrl, { signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId);
        return response.json();
      })
      .then(data => {
        this.routeLoading = false;
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          const latLngs: L.LatLngExpression[] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          this.routeLine = L.polyline(latLngs, {
            color: '#1976d2',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(this.map!);

          this.map!.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        } else {
          this.drawFallbackLine(originLat, originLng, destLat, destLng);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.routeLoading = false;
        this.drawFallbackLine(originLat, originLng, destLat, destLng);
      });
  }

  private drawFallbackLine(originLat: number, originLng: number, destLat: number, destLng: number): void {
    if (!this.map) return;

    this.routeLine = L.polyline([
      [originLat, originLng],
      [destLat, destLng]
    ], { 
      color: '#1976d2', 
      weight: 4, 
      opacity: 0.6, 
      dashArray: '10, 10',
      lineCap: 'round'
    }).addTo(this.map);

    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  private handleMapClick(latlng: L.LatLng): void {
    if (!this.map) return;

    if (this.selectionMode === 'pickup') {
      this.pickupLat = latlng.lat;
      this.pickupLng = latlng.lng;
      this.pickupLocation = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;

      if (this.pickupMarker) {
        this.map.removeLayer(this.pickupMarker);
      }

      const pickupIcon = L.divIcon({
        className: 'custom-marker pickup-marker',
        html: `<div class="marker-circle pickup-circle"><span>P</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.pickupMarker = L.marker([latlng.lat, latlng.lng], { 
        icon: pickupIcon,
        draggable: true 
      }).addTo(this.map)
        .bindPopup('<strong>Your Pickup Point (P)</strong><br>Drag to adjust');

      this.pickupMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.pickupLat = pos.lat;
        this.pickupLng = pos.lng;
        this.pickupLocation = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        this.updateFullRouteIfReady();
      });

      this.snackBar.open('Pickup point set! Now set your drop-off.', 'OK', { duration: 2500 });
      this.selectionMode = 'dropoff';
      this.updateFullRouteIfReady();
    } else {
      this.dropoffLat = latlng.lat;
      this.dropoffLng = latlng.lng;
      this.dropoffLocation = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;

      if (this.dropoffMarker) {
        this.map.removeLayer(this.dropoffMarker);
      }

      const dropoffIcon = L.divIcon({
        className: 'custom-marker dropoff-marker',
        html: `<div class="marker-circle dropoff-circle"><span>D</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.dropoffMarker = L.marker([latlng.lat, latlng.lng], { 
        icon: dropoffIcon,
        draggable: true 
      }).addTo(this.map)
        .bindPopup('<strong>Your Drop-off Point (D)</strong><br>Drag to adjust');

      this.dropoffMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.dropoffLat = pos.lat;
        this.dropoffLng = pos.lng;
        this.dropoffLocation = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        this.updateFullRouteIfReady();
      });

      this.snackBar.open('Drop-off point set! Ready to send request.', 'OK', { duration: 2500 });
      this.updateFullRouteIfReady();
    }
  }

  private updateFullRouteIfReady(): void {
    if (!this.ride) return;
    
    if (this.pickupLat && this.pickupLng && this.dropoffLat && this.dropoffLng &&
        this.ride.originLat && this.ride.originLng && this.ride.destLat && this.ride.destLng) {
      this.fetchAndDrawFullRoute(
        this.ride.originLat, this.ride.originLng,
        this.pickupLat, this.pickupLng,
        this.dropoffLat, this.dropoffLng,
        this.ride.destLat, this.ride.destLng
      );
    }
  }

  private fetchAndDrawFullRoute(
    aLat: number, aLng: number,
    pLat: number, pLng: number,
    dLat: number, dLng: number,
    bLat: number, bLng: number
  ): void {
    if (!this.map) return;

    this.routeLoading = true;

    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${aLng},${aLat};${pLng},${pLat};${dLng},${dLat};${bLng},${bLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(osrmUrl, { signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId);
        return response.json();
      })
      .then(data => {
        this.routeLoading = false;
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          const latLngs: L.LatLngExpression[] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          this.routeLine = L.polyline(latLngs, {
            color: '#1976d2',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(this.map!);

          this.map!.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        } else {
          this.drawFallbackFullRoute(aLat, aLng, pLat, pLng, dLat, dLng, bLat, bLng);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.routeLoading = false;
        this.drawFallbackFullRoute(aLat, aLng, pLat, pLng, dLat, dLng, bLat, bLng);
      });
  }

  private drawFallbackFullRoute(
    aLat: number, aLng: number,
    pLat: number, pLng: number,
    dLat: number, dLng: number,
    bLat: number, bLng: number
  ): void {
    if (!this.map) return;

    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    this.routeLine = L.polyline([
      [aLat, aLng],
      [pLat, pLng],
      [dLat, dLng],
      [bLat, bLng]
    ], { 
      color: '#1976d2', 
      weight: 4, 
      opacity: 0.6, 
      dashArray: '10, 10',
      lineCap: 'round'
    }).addTo(this.map);

    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  private restoreOriginalRoute(): void {
    if (!this.ride) return;
    if (this.ride.originLat && this.ride.originLng && this.ride.destLat && this.ride.destLng) {
      this.fetchAndDrawRoute(this.ride.originLat, this.ride.originLng, this.ride.destLat, this.ride.destLng);
    }
  }

  // Search methods
  onSearchInput(type: 'pickup' | 'dropoff'): void {
    const query = type === 'pickup' ? this.pickupSearchQuery : this.dropoffSearchQuery;
    
    if (type === 'pickup') {
      this.showPickupResults = true;
    } else {
      this.showDropoffResults = true;
    }
    
    this.searchLocation(query, type);
  }

  private searchLocation(query: string, type: 'pickup' | 'dropoff'): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (!query || query.length < 2) {
      if (type === 'pickup') {
        this.pickupSearchResults = [];
        this.pickupSearching = false;
      } else {
        this.dropoffSearchResults = [];
        this.dropoffSearching = false;
      }
      return;
    }

    if (type === 'pickup') {
      this.pickupSearching = true;
    } else {
      this.dropoffSearching = true;
    }

    this.searchDebounceTimer = setTimeout(() => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=bd`;
      
      fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(response => response.json())
        .then(results => {
          if (type === 'pickup') {
            this.pickupSearchResults = results;
            this.pickupSearching = false;
          } else {
            this.dropoffSearchResults = results;
            this.dropoffSearching = false;
          }
        })
        .catch(() => {
          if (type === 'pickup') {
            this.pickupSearchResults = [];
            this.pickupSearching = false;
          } else {
            this.dropoffSearchResults = [];
            this.dropoffSearching = false;
          }
        });
    }, 400);
  }

  selectSearchResult(result: any, type: 'pickup' | 'dropoff', event: Event): void {
    event.preventDefault();
    
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const location = result.display_name;
    const shortName = this.getShortDisplayName(location);

    if (type === 'pickup') {
      this.pickupLocation = location;
      this.pickupSearchQuery = shortName;
      this.pickupLat = lat;
      this.pickupLng = lng;
      this.showPickupResults = false;
      this.pickupSearchResults = [];
      this.selectionMode = 'dropoff';
      this.snackBar.open('Pickup location set!', 'OK', { duration: 2000 });
    } else {
      this.dropoffLocation = location;
      this.dropoffSearchQuery = shortName;
      this.dropoffLat = lat;
      this.dropoffLng = lng;
      this.showDropoffResults = false;
      this.dropoffSearchResults = [];
      this.snackBar.open('Drop-off location set!', 'OK', { duration: 2000 });
    }

    if (this.map) {
      this.updateMarkerFromSearch(lat, lng, type);
      this.updateFullRouteIfReady();
    }
  }

  private updateMarkerFromSearch(lat: number, lng: number, type: 'pickup' | 'dropoff'): void {
    if (!this.map) return;

    if (type === 'pickup') {
      if (this.pickupMarker) {
        this.map.removeLayer(this.pickupMarker);
      }
      const pickupIcon = L.divIcon({
        className: 'custom-marker pickup-marker',
        html: `<div class="marker-circle pickup-circle"><span>P</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.pickupMarker = L.marker([lat, lng], { icon: pickupIcon, draggable: true })
        .addTo(this.map)
        .bindPopup('<strong>Your Pickup Point (P)</strong><br>Drag to adjust');
      
      this.pickupMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.pickupLat = pos.lat;
        this.pickupLng = pos.lng;
        this.updateFullRouteIfReady();
      });
    } else {
      if (this.dropoffMarker) {
        this.map.removeLayer(this.dropoffMarker);
      }
      const dropoffIcon = L.divIcon({
        className: 'custom-marker dropoff-marker',
        html: `<div class="marker-circle dropoff-circle"><span>D</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.dropoffMarker = L.marker([lat, lng], { icon: dropoffIcon, draggable: true })
        .addTo(this.map)
        .bindPopup('<strong>Your Drop-off Point (D)</strong><br>Drag to adjust');
      
      this.dropoffMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        this.dropoffLat = pos.lat;
        this.dropoffLng = pos.lng;
        this.updateFullRouteIfReady();
      });
    }

    this.map.panTo([lat, lng]);
  }

  onSearchFocus(type: 'pickup' | 'dropoff'): void {
    if (type === 'pickup' && this.pickupSearchResults.length > 0) {
      this.showPickupResults = true;
    } else if (type === 'dropoff' && this.dropoffSearchResults.length > 0) {
      this.showDropoffResults = true;
    }
  }

  onSearchBlur(type: 'pickup' | 'dropoff'): void {
    setTimeout(() => {
      if (type === 'pickup') {
        this.showPickupResults = false;
      } else {
        this.showDropoffResults = false;
      }
    }, 200);
  }

  clearSearch(type: 'pickup' | 'dropoff', event: Event): void {
    event.stopPropagation();
    if (type === 'pickup') {
      this.pickupSearchQuery = '';
      this.pickupSearchResults = [];
      this.showPickupResults = false;
      this.clearPoint('pickup');
    } else {
      this.dropoffSearchQuery = '';
      this.dropoffSearchResults = [];
      this.showDropoffResults = false;
      this.clearPoint('dropoff');
    }
  }

  private clearPoint(type: 'pickup' | 'dropoff'): void {
    if (type === 'pickup') {
      if (this.pickupMarker && this.map) {
        this.map.removeLayer(this.pickupMarker);
      }
      this.pickupMarker = null;
      this.pickupLat = undefined;
      this.pickupLng = undefined;
      this.pickupLocation = '';
      this.selectionMode = 'pickup';
    } else {
      if (this.dropoffMarker && this.map) {
        this.map.removeLayer(this.dropoffMarker);
      }
      this.dropoffMarker = null;
      this.dropoffLat = undefined;
      this.dropoffLng = undefined;
      this.dropoffLocation = '';
    }
    this.restoreOriginalRoute();
  }

  resetPoints(): void {
    this.clearPoint('pickup');
    this.clearPoint('dropoff');
    this.pickupSearchQuery = '';
    this.dropoffSearchQuery = '';
    this.selectionMode = 'pickup';
    this.snackBar.open('Points cleared. Start over.', 'OK', { duration: 1500 });
  }

  // Utility methods
  getShortDisplayName(displayName: string): string {
    if (!displayName) return '';
    const parts = displayName.split(',');
    return parts.slice(0, 2).join(', ').trim();
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

  isValid(): boolean {
    return !!(this.pickupLocation || (this.pickupLat && this.pickupLng));
  }

  sendRequest(): void {
    this.sending = true;
    this.rideService.requestToJoin(this.rideId, {
      message: this.message || undefined,
      pickupLocation: this.pickupLocation || undefined,
      pickupLat: this.pickupLat,
      pickupLng: this.pickupLng,
      dropoffLocation: this.dropoffLocation || undefined,
      dropoffLat: this.dropoffLat,
      dropoffLng: this.dropoffLng
    }).subscribe({
      next: () => {
        this.sending = false;
        this.snackBar.open('Request sent! The rider will review your request.', 'Close', { duration: 4000 });
        this.router.navigate(['/passenger/my-requests']);
      },
      error: (err) => {
        this.sending = false;
        const message = err.error?.message || 'Failed to send request. You may have already requested this ride.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }

  useCurrentLocation(type: 'pickup' | 'dropoff'): void {
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation is not supported by your browser', 'Close', { duration: 3000 });
      return;
    }

    if (type === 'pickup') {
      this.gettingPickupLocation = true;
    } else {
      this.gettingDropoffLocation = true;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.reverseGeocode(lat, lng, type);
      },
      (error) => {
        if (type === 'pickup') {
          this.gettingPickupLocation = false;
        } else {
          this.gettingDropoffLocation = false;
        }
        
        let message = 'Unable to get your location';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enable location access.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information unavailable';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out';
        }
        this.snackBar.open(message, 'Close', { duration: 3000 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  private reverseGeocode(lat: number, lng: number, type: 'pickup' | 'dropoff'): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`;
    
    fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(response => response.json())
      .then(result => {
        const address = result.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const shortAddress = this.getShortDisplayName(address);
        
        if (type === 'pickup') {
          this.pickupLat = lat;
          this.pickupLng = lng;
          this.pickupLocation = address;
          this.pickupSearchQuery = shortAddress;
          this.gettingPickupLocation = false;
          this.selectionMode = 'dropoff';
          this.snackBar.open('Pickup location set from GPS!', 'OK', { duration: 2000 });
        } else {
          this.dropoffLat = lat;
          this.dropoffLng = lng;
          this.dropoffLocation = address;
          this.dropoffSearchQuery = shortAddress;
          this.gettingDropoffLocation = false;
          this.snackBar.open('Drop-off location set from GPS!', 'OK', { duration: 2000 });
        }
        
        if (this.map) {
          this.updateMarkerFromSearch(lat, lng, type);
          this.updateFullRouteIfReady();
        }
      })
      .catch(() => {
        if (type === 'pickup') {
          this.pickupLat = lat;
          this.pickupLng = lng;
          this.pickupLocation = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          this.pickupSearchQuery = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          this.gettingPickupLocation = false;
          this.selectionMode = 'dropoff';
        } else {
          this.dropoffLat = lat;
          this.dropoffLng = lng;
          this.dropoffLocation = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          this.dropoffSearchQuery = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          this.gettingDropoffLocation = false;
        }
        
        if (this.map) {
          this.updateMarkerFromSearch(lat, lng, type);
          this.updateFullRouteIfReady();
        }
        
        this.snackBar.open('Location set!', 'OK', { duration: 2000 });
      });
  }
}
