import { Component, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, style, transition, animate } from '@angular/animations';
import { RideService } from '../../../services/ride.service';
import { RideListItem } from '../../../models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-request-ride-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatStepperModule,
    MatDividerModule
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
  templateUrl: './request-ride-dialog.component.html',
  styleUrls: ['./request-ride-dialog.component.scss']
})
export class RequestRideDialogComponent implements AfterViewInit, OnDestroy {
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
  
  // Search-related properties
  pickupSearchQuery = '';
  dropoffSearchQuery = '';
  pickupSearchResults: any[] = [];
  dropoffSearchResults: any[] = [];
  showPickupResults = false;
  showDropoffResults = false;
  pickupSearching = false;
  dropoffSearching = false;
  private searchDebounceTimer: any;
  
  private map: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private dropoffMarker: L.Marker | null = null;
  private routeLine?: L.Polyline;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { ride: RideListItem },
    private dialogRef: MatDialogRef<RequestRideDialogComponent>,
    private rideService: RideService,
    private snackBar: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const ride = this.data.ride;
    
    let centerLat = 23.8103;
    let centerLng = 90.4125;
    
    if (ride.originLat && ride.originLng) {
      centerLat = ride.originLat;
      centerLng = ride.originLng;
    }

    this.map = L.map('request-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(this.map);

    this.addMarkerStyles();

    // Add rider's origin marker (A - Green)
    if (ride.originLat && ride.originLng) {
      const originIcon = L.divIcon({
        className: 'custom-marker origin-marker',
        html: `<div class="marker-circle origin-circle"><span>A</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([ride.originLat, ride.originLng], { icon: originIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Rider's Start (A):</strong><br>${ride.origin}`);
    }

    // Add rider's destination marker (B - Red)
    if (ride.destLat && ride.destLng) {
      const destIcon = L.divIcon({
        className: 'custom-marker dest-marker',
        html: `<div class="marker-circle dest-circle"><span>B</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([ride.destLat, ride.destLng], { icon: destIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Rider's End (B):</strong><br>${ride.destination}`);
    }

    // Fetch and draw actual driving route using OSRM
    if (ride.originLat && ride.originLng && ride.destLat && ride.destLng) {
      this.fetchAndDrawRoute(ride.originLat, ride.originLng, ride.destLat, ride.destLng);
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
      .origin-circle {
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      }
      .dest-circle {
        background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
      }
      .pickup-circle {
        background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
      }
      .dropoff-circle {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      }
      @keyframes ping {
        0% { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(2); opacity: 0; }
      }
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
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          
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
        this.updateFullRouteIfReady();
      });

      this.snackBar.open('Pickup point set! Now set your drop-off.', 'OK', { 
        duration: 2500,
        panelClass: 'success-snackbar'
      });
      this.selectionMode = 'dropoff';
      this.updateFullRouteIfReady();
    } else {
      this.dropoffLat = latlng.lat;
      this.dropoffLng = latlng.lng;

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
        this.updateFullRouteIfReady();
      });

      this.snackBar.open('Drop-off point set! Ready to send request.', 'OK', { 
        duration: 2500 
      });
      this.updateFullRouteIfReady();
    }
  }

  clearPickup(event: Event): void {
    event.stopPropagation();
    if (this.pickupMarker && this.map) {
      this.map.removeLayer(this.pickupMarker);
    }
    this.pickupMarker = null;
    this.pickupLat = undefined;
    this.pickupLng = undefined;
    this.pickupLocation = '';
    this.selectionMode = 'pickup';
    this.restoreOriginalRoute();
  }

  clearDropoff(event: Event): void {
    event.stopPropagation();
    if (this.dropoffMarker && this.map) {
      this.map.removeLayer(this.dropoffMarker);
    }
    this.dropoffMarker = null;
    this.dropoffLat = undefined;
    this.dropoffLng = undefined;
    this.dropoffLocation = '';
    this.restoreOriginalRoute();
  }

  resetPoints(): void {
    this.clearPickup(new Event('click'));
    this.clearDropoff(new Event('click'));
    this.selectionMode = 'pickup';
    this.snackBar.open('Points cleared. Start over.', 'OK', { duration: 1500 });
  }

  private restoreOriginalRoute(): void {
    const ride = this.data.ride;
    if (ride.originLat && ride.originLng && ride.destLat && ride.destLng) {
      this.fetchAndDrawRoute(ride.originLat, ride.originLng, ride.destLat, ride.destLng);
    }
  }

  isValid(): boolean {
    return !!(this.pickupLocation || (this.pickupLat && this.pickupLng));
  }

  getShortAddress(fullAddress: string): string {
    if (!fullAddress) return '';
    const parts = fullAddress.split(/[,،]/);
    let shortAddr = parts[0].trim().replace(/^\d+\s*/, '');
    if (shortAddr.length < 3) shortAddr = parts[0].trim();
    return shortAddr.length > 20 ? shortAddr.substring(0, 20) + '...' : shortAddr;
  }

  formatShortDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
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

  sendRequest(): void {
    this.sending = true;
    this.rideService.requestToJoin(this.data.ride.id, {
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
        this.dialogRef.close('success');
      },
      error: (err) => {
        this.sending = false;
        const message = err.error?.message || 'Failed to send request. You may have already requested this ride.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  // Search methods using Nominatim API
  onPickupSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pickupSearchQuery = value;
    this.showPickupResults = true;
    this.searchLocation(value, 'pickup');
  }

  onDropoffSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dropoffSearchQuery = value;
    this.showDropoffResults = true;
    this.searchLocation(value, 'dropoff');
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
      
      fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      })
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

  selectPickupResult(result: any): void {
    this.pickupLocation = result.display_name;
    this.pickupSearchQuery = this.getShortDisplayName(result.display_name);
    this.pickupLat = parseFloat(result.lat);
    this.pickupLng = parseFloat(result.lon);
    this.showPickupResults = false;
    this.pickupSearchResults = [];

    if (this.map) {
      this.updateMarkerFromSearch(this.pickupLat, this.pickupLng, 'pickup');
      this.updateFullRouteIfReady();
    }
    
    this.snackBar.open('Pickup location set!', 'OK', { duration: 2000 });
    this.selectionMode = 'dropoff';
  }

  selectDropoffResult(result: any): void {
    this.dropoffLocation = result.display_name;
    this.dropoffSearchQuery = this.getShortDisplayName(result.display_name);
    this.dropoffLat = parseFloat(result.lat);
    this.dropoffLng = parseFloat(result.lon);
    this.showDropoffResults = false;
    this.dropoffSearchResults = [];

    if (this.map) {
      this.updateMarkerFromSearch(this.dropoffLat, this.dropoffLng, 'dropoff');
      this.updateFullRouteIfReady();
    }
    
    this.snackBar.open('Drop-off location set!', 'OK', { duration: 2000 });
  }

  private updateFullRouteIfReady(): void {
    const ride = this.data.ride;
    
    if (this.pickupLat && this.pickupLng && this.dropoffLat && this.dropoffLng &&
        ride.originLat && ride.originLng && ride.destLat && ride.destLng) {
      this.fetchAndDrawFullRoute(
        ride.originLat, ride.originLng,
        this.pickupLat, this.pickupLng,
        this.dropoffLat, this.dropoffLng,
        ride.destLat, ride.destLng
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
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          
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

  getShortDisplayName(displayName: string): string {
    if (!displayName) return '';
    const parts = displayName.split(',');
    return parts.slice(0, 2).join(', ').trim();
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

  onSearchFocus(type: 'pickup' | 'dropoff'): void {
    if (type === 'pickup' && this.pickupSearchResults.length > 0) {
      this.showPickupResults = true;
    } else if (type === 'dropoff' && this.dropoffSearchResults.length > 0) {
      this.showDropoffResults = true;
    }
  }

  clearPickupSearch(event: Event): void {
    event.stopPropagation();
    this.pickupSearchQuery = '';
    this.pickupSearchResults = [];
    this.showPickupResults = false;
    this.clearPickup(event);
  }

  clearDropoffSearch(event: Event): void {
    event.stopPropagation();
    this.dropoffSearchQuery = '';
    this.dropoffSearchResults = [];
    this.showDropoffResults = false;
    this.clearDropoff(event);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
