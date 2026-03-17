import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import * as L from 'leaflet';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-unified-route-map',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <div class="unified-route-map">
      <!-- Location Inputs -->
      <div class="location-inputs">
        <!-- Origin Input -->
        <div class="location-input-row" [class.active]="activeInput === 'origin'">
          <div class="location-marker origin">A</div>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Pickup Location</mat-label>
            <input matInput 
                   [(ngModel)]="originAddress" 
                   (focus)="setActiveInput('origin')"
                   (input)="onSearchInput($event, 'origin')"
                   (keydown.enter)="searchAddress('origin')"
                   placeholder="Search or tap on map"
                   [matAutocomplete]="autoOrigin">
            <button mat-icon-button matSuffix type="button" 
                    (click)="searchAddress('origin')" 
                    [disabled]="!originAddress || searching">
              @if (searching && activeInput === 'origin') {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>search</mat-icon>
              }
            </button>
            <mat-autocomplete #autoOrigin="matAutocomplete" (optionSelected)="onOptionSelected($event, 'origin')">
              @for (result of searchResults; track result.display_name) {
                <mat-option [value]="result">
                  <mat-icon>place</mat-icon>
                  <span>{{ result.display_name }}</span>
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
          <button mat-icon-button type="button"
                  (click)="useCurrentLocation('origin')"
                  [disabled]="gettingLocation"
                  matTooltip="Use my current location">
            @if (gettingLocation && activeInput === 'origin') {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>my_location</mat-icon>
            }
          </button>
        </div>

        <!-- Destination Input -->
        <div class="location-input-row" [class.active]="activeInput === 'dest'">
          <div class="location-marker dest">B</div>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Drop-off Location</mat-label>
            <input matInput 
                   [(ngModel)]="destAddress" 
                   (focus)="setActiveInput('dest')"
                   (input)="onSearchInput($event, 'dest')"
                   (keydown.enter)="searchAddress('dest')"
                   placeholder="Search or tap on map"
                   [matAutocomplete]="autoDest">
            <button mat-icon-button matSuffix type="button" 
                    (click)="searchAddress('dest')" 
                    [disabled]="!destAddress || searching">
              @if (searching && activeInput === 'dest') {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>search</mat-icon>
              }
            </button>
            <mat-autocomplete #autoDest="matAutocomplete" (optionSelected)="onOptionSelected($event, 'dest')">
              @for (result of searchResults; track result.display_name) {
                <mat-option [value]="result">
                  <mat-icon>place</mat-icon>
                  <span>{{ result.display_name }}</span>
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
          <button mat-icon-button type="button"
                  (click)="useCurrentLocation('dest')"
                  [disabled]="gettingLocation"
                  matTooltip="Use my current location">
            @if (gettingLocation && activeInput === 'dest') {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>my_location</mat-icon>
            }
          </button>
        </div>
      </div>

      <!-- Map Container -->
      <div class="map-wrapper">
        <div class="map-container" id="unified-route-map"></div>
        @if (!mapReady) {
          <div class="map-loading">
            <mat-spinner diameter="30"></mat-spinner>
            <span>Loading map...</span>
          </div>
        }
        @if (loadingRoute) {
          <div class="route-loading">
            <mat-spinner diameter="24"></mat-spinner>
            <span>Calculating route...</span>
          </div>
        }
        
        <!-- Map Instructions -->
        <div class="map-hint">
          @if (!origin) {
            <mat-icon>touch_app</mat-icon>
            <span>Tap on map to set pickup location</span>
          } @else if (!destination) {
            <mat-icon>touch_app</mat-icon>
            <span>Tap on map to set drop-off location</span>
          } @else {
            <mat-icon>check_circle</mat-icon>
            <span>Route set! Tap to adjust locations</span>
          }
        </div>
      </div>

      <!-- Route Info -->
      @if (routeInfo && origin && destination) {
        <div class="route-info-bar">
          <div class="route-stat">
            <mat-icon>straighten</mat-icon>
            <span>{{ formatDistance(routeInfo.distance) }}</span>
          </div>
          <div class="route-stat">
            <mat-icon>schedule</mat-icon>
            <span>{{ formatDuration(routeInfo.duration) }}</span>
          </div>
          <div class="route-stat">
            <mat-icon>two_wheeler</mat-icon>
            <span>Motorcycle</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .unified-route-map {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }

    .location-inputs {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }

    .location-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      border-radius: 12px;
      transition: background 0.2s;
    }

    .location-input-row.active {
      background: #e3f2fd;
    }

    .location-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .location-marker.origin {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .location-marker.dest {
      background: linear-gradient(135deg, #f44336, #c62828);
    }

    .search-field {
      flex: 1;
    }

    ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .map-wrapper {
      position: relative;
      height: 350px;
    }

    .map-container {
      height: 100%;
      width: 100%;
    }

    .map-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      z-index: 1000;
    }

    .map-loading span {
      color: #666;
      font-size: 14px;
    }

    .route-loading {
      position: absolute;
      top: 12px;
      right: 12px;
      background: white;
      padding: 8px 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
    }

    .route-loading span {
      font-size: 13px;
      color: #1976d2;
    }

    .map-hint {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.75);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      z-index: 1000;
    }

    .map-hint mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .route-info-bar {
      display: flex;
      justify-content: space-around;
      padding: 12px 16px;
      background: linear-gradient(135deg, #034694 0%, #0A56A4 100%);
    }

    .route-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      color: white;
      font-size: 14px;
      font-weight: 500;
    }

    .route-stat mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      opacity: 0.9;
    }
  `]
})
export class UnifiedRouteMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() initialOrigin?: LocationCoordinates;
  @Input() initialDestination?: LocationCoordinates;
  
  @Output() originSelected = new EventEmitter<LocationCoordinates>();
  @Output() destinationSelected = new EventEmitter<LocationCoordinates>();
  @Output() routeCalculated = new EventEmitter<RouteInfo>();

  origin: LocationCoordinates | null = null;
  destination: LocationCoordinates | null = null;
  originAddress = '';
  destAddress = '';
  
  activeInput: 'origin' | 'dest' = 'origin';
  searchResults: SearchResult[] = [];
  searching = false;
  gettingLocation = false;
  mapReady = false;
  loadingRoute = false;
  routeInfo: RouteInfo | null = null;

  private map?: L.Map;
  private originMarker?: L.Marker;
  private destMarker?: L.Marker;
  private routeLine?: L.Polyline;
  private searchTimeout?: any;

  // Custom icons
  private originIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-pin origin"><span>A</span></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  });

  private destIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-pin dest"><span>B</span></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  });

  // Default to Dhaka, Bangladesh
  private defaultCenter: L.LatLngExpression = [23.8103, 90.4125];
  private defaultZoom = 12;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    // Add custom marker styles to head
    this.addCustomStyles();
    
    if (this.initialOrigin) {
      this.origin = this.initialOrigin;
      this.originAddress = this.initialOrigin.address || '';
    }
    if (this.initialDestination) {
      this.destination = this.initialDestination;
      this.destAddress = this.initialDestination.address || '';
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 200);
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private addCustomStyles(): void {
    const styleId = 'unified-map-marker-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .marker-pin {
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .marker-pin span {
        transform: rotate(45deg);
        color: white;
        font-weight: bold;
        font-size: 14px;
      }
      .marker-pin.origin {
        background: linear-gradient(135deg, #4caf50, #2e7d32);
      }
      .marker-pin.dest {
        background: linear-gradient(135deg, #f44336, #c62828);
      }
    `;
    document.head.appendChild(style);
  }

  private initMap(): void {
    const container = document.getElementById('unified-route-map');
    if (!container) {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    try {
      this.map = L.map('unified-route-map', {
        center: this.defaultCenter,
        zoom: this.defaultZoom
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      // Add click handler
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.ngZone.run(() => {
          this.handleMapClick(e.latlng.lat, e.latlng.lng);
        });
      });

      // Add initial markers if provided
      if (this.initialOrigin) {
        this.setOriginMarker(this.initialOrigin.lat, this.initialOrigin.lng);
      }
      if (this.initialDestination) {
        this.setDestMarker(this.initialDestination.lat, this.initialDestination.lng);
      }
      if (this.initialOrigin && this.initialDestination) {
        this.calculateRoute();
      }

      setTimeout(() => {
        this.map?.invalidateSize();
        this.mapReady = true;
      }, 300);

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  private handleMapClick(lat: number, lng: number): void {
    if (this.activeInput === 'origin' || !this.origin) {
      this.setOriginMarker(lat, lng);
      this.reverseGeocode(lat, lng, 'origin');
      if (!this.destination) {
        this.activeInput = 'dest';
      }
    } else {
      this.setDestMarker(lat, lng);
      this.reverseGeocode(lat, lng, 'dest');
    }
  }

  private setOriginMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.originMarker) {
      this.originMarker.setLatLng([lat, lng]);
    } else {
      this.originMarker = L.marker([lat, lng], { icon: this.originIcon, draggable: true }).addTo(this.map);
      this.originMarker.on('dragend', () => {
        const pos = this.originMarker!.getLatLng();
        this.ngZone.run(() => {
          this.reverseGeocode(pos.lat, pos.lng, 'origin');
        });
      });
    }

    this.origin = { lat, lng, address: this.originAddress };
    this.originSelected.emit(this.origin);
    this.updateMapView();
    
    if (this.destination) {
      this.calculateRoute();
    }
  }

  private setDestMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.destMarker) {
      this.destMarker.setLatLng([lat, lng]);
    } else {
      this.destMarker = L.marker([lat, lng], { icon: this.destIcon, draggable: true }).addTo(this.map);
      this.destMarker.on('dragend', () => {
        const pos = this.destMarker!.getLatLng();
        this.ngZone.run(() => {
          this.reverseGeocode(pos.lat, pos.lng, 'dest');
        });
      });
    }

    this.destination = { lat, lng, address: this.destAddress };
    this.destinationSelected.emit(this.destination);
    this.updateMapView();
    
    if (this.origin) {
      this.calculateRoute();
    }
  }

  private updateMapView(): void {
    if (!this.map) return;

    if (this.origin && this.destination) {
      const bounds = L.latLngBounds([
        [this.origin.lat, this.origin.lng],
        [this.destination.lat, this.destination.lng]
      ]);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    } else if (this.origin) {
      this.map.setView([this.origin.lat, this.origin.lng], 15);
    } else if (this.destination) {
      this.map.setView([this.destination.lat, this.destination.lng], 15);
    }
  }

  private async reverseGeocode(lat: number, lng: number, type: 'origin' | 'dest'): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        this.ngZone.run(() => {
          if (type === 'origin') {
            this.originAddress = data.display_name;
            this.origin = { lat, lng, address: this.originAddress };
            this.originSelected.emit(this.origin);
          } else {
            this.destAddress = data.display_name;
            this.destination = { lat, lng, address: this.destAddress };
            this.destinationSelected.emit(this.destination);
          }
        });
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  }

  private async calculateRoute(): Promise<void> {
    if (!this.origin || !this.destination || !this.map) return;

    this.loadingRoute = true;

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${this.origin.lng},${this.origin.lat};${this.destination.lng},${this.destination.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Remove existing route line
        if (this.routeLine) {
          this.map.removeLayer(this.routeLine);
        }

        // Draw new route
        const coordinates = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        this.routeLine = L.polyline(coordinates, {
          color: '#034694',
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(this.map);

        // Update route info
        this.routeInfo = {
          distance: route.distance,
          duration: route.duration
        };
        this.routeCalculated.emit(this.routeInfo);

        // Fit bounds to show entire route
        this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    } finally {
      this.loadingRoute = false;
    }
  }

  setActiveInput(type: 'origin' | 'dest'): void {
    this.activeInput = type;
    this.searchResults = [];
  }

  onSearchInput(event: Event, type: 'origin' | 'dest'): void {
    const value = (event.target as HTMLInputElement).value;
    this.activeInput = type;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (value.length < 3) {
      this.searchResults = [];
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.performSearch(value);
    }, 400);
  }

  private async performSearch(query: string): Promise<void> {
    this.searching = true;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=bd`
      );
      const data = await response.json();
      this.ngZone.run(() => {
        this.searchResults = data;
        this.searching = false;
      });
    } catch (error) {
      console.error('Search failed:', error);
      this.searching = false;
      this.searchResults = [];
    }
  }

  onOptionSelected(event: any, type: 'origin' | 'dest'): void {
    const result = event.option.value as SearchResult;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (type === 'origin') {
      this.originAddress = result.display_name;
      this.setOriginMarker(lat, lng);
    } else {
      this.destAddress = result.display_name;
      this.setDestMarker(lat, lng);
    }
    this.searchResults = [];
  }

  async searchAddress(type: 'origin' | 'dest'): Promise<void> {
    const address = type === 'origin' ? this.originAddress : this.destAddress;
    if (!address || !this.map) return;

    this.searching = true;
    this.activeInput = type;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        if (type === 'origin') {
          this.originAddress = result.display_name;
          this.setOriginMarker(lat, lng);
        } else {
          this.destAddress = result.display_name;
          this.setDestMarker(lat, lng);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      this.searching = false;
    }
  }

  useCurrentLocation(type: 'origin' | 'dest'): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    this.gettingLocation = true;
    this.activeInput = type;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (type === 'origin') {
            this.setOriginMarker(lat, lng);
            this.reverseGeocode(lat, lng, 'origin');
          } else {
            this.setDestMarker(lat, lng);
            this.reverseGeocode(lat, lng, 'dest');
          }
          this.gettingLocation = false;
        });
      },
      (error) => {
        this.ngZone.run(() => {
          this.gettingLocation = false;
          let message = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }
          alert(message);
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + ' km';
    }
    return Math.round(meters) + ' m';
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  }

  refreshMap(): void {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }
}
