import { Component, Input, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import * as L from 'leaflet';

export interface RoutePoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: [number, number][]; // [lng, lat] pairs
}

@Component({
  selector: 'app-route-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './route-preview.component.html',
  styleUrls: ['./route-preview.component.scss']
})
export class RoutePreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() origin?: RoutePoint;
  @Input() destination?: RoutePoint;

  mapId = 'route-map-' + Math.random().toString(36).substr(2, 9);
  loading = false;
  error?: string;
  routeInfo?: RouteInfo;

  private map?: L.Map;
  private originMarker?: L.Marker;
  private destMarker?: L.Marker;
  private routeLine?: L.Polyline;
  private mapInitialized = false;

  // Custom icons
  private originIcon = L.divIcon({
    className: 'custom-marker origin-marker',
    html: '<div class="marker-circle origin-circle"><span>A</span></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  private destIcon = L.divIcon({
    className: 'custom-marker dest-marker',
    html: '<div class="marker-circle dest-circle"><span>B</span></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['origin'] || changes['destination']) && this.mapInitialized) {
      this.updateRoute();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const container = document.getElementById(this.mapId);
    if (!container) {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    // Add custom marker styles
    this.addMarkerStyles();

    // Default center (Dhaka)
    const defaultCenter: L.LatLngExpression = [23.8103, 90.4125];

    try {
      this.map = L.map(this.mapId, {
        center: defaultCenter,
        zoom: 12,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      this.mapInitialized = true;

      // Update route if we already have origin and destination
      if (this.origin && this.destination) {
        setTimeout(() => this.updateRoute(), 100);
      }

    } catch (error) {
      console.error('Error initializing route map:', error);
    }
  }

  private addMarkerStyles(): void {
    const styleId = 'route-marker-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .marker-circle {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: bold;
        font-size: 16px;
        color: white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .origin-circle {
        background: #4caf50;
        border: 3px solid white;
      }
      .dest-circle {
        background: #f44336;
        border: 3px solid white;
      }
    `;
    document.head.appendChild(style);
  }

  private async updateRoute(): Promise<void> {
    if (!this.map || !this.origin || !this.destination) return;

    this.loading = true;
    this.error = undefined;

    // Clear existing markers and route
    this.clearMap();

    // Add origin marker
    this.originMarker = L.marker([this.origin.lat, this.origin.lng], {
      icon: this.originIcon
    }).addTo(this.map);

    // Add destination marker
    this.destMarker = L.marker([this.destination.lat, this.destination.lng], {
      icon: this.destIcon
    }).addTo(this.map);

    // Fit bounds to show both markers
    const bounds = L.latLngBounds(
      [this.origin.lat, this.origin.lng],
      [this.destination.lat, this.destination.lng]
    );
    this.map.fitBounds(bounds, { padding: [50, 50] });

    // Fetch route from OSRM
    try {
      const routeData = await this.fetchRoute(
        this.origin.lng, this.origin.lat,
        this.destination.lng, this.destination.lat
      );

      if (routeData) {
        this.ngZone.run(() => {
          this.routeInfo = routeData;
          this.drawRoute(routeData.geometry);
          this.loading = false;
        });
      }
    } catch (err) {
      this.ngZone.run(() => {
        console.error('Route fetch error:', err);
        // Silently fallback to direct line on error
        this.drawDirectLine();
        this.loading = false;
      });
    }
  }

  private async fetchRoute(
    originLng: number, originLat: number,
    destLng: number, destLat: number
  ): Promise<RouteInfo | null> {
    // Use OSRM demo server for routing with timeout
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    // Add timeout using AbortController (5 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry.coordinates
        };
      }

      return null;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Route calculation timed out');
      }
      throw err;
    }
  }

  private drawRoute(geometry: [number, number][]): void {
    if (!this.map) return;

    // OSRM returns [lng, lat], Leaflet needs [lat, lng]
    const latLngs: L.LatLngExpression[] = geometry.map(coord => [coord[1], coord[0]]);

    this.routeLine = L.polyline(latLngs, {
      color: '#1976d2',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(this.map);

    // Add route shadow for better visibility
    L.polyline(latLngs, {
      color: '#000',
      weight: 8,
      opacity: 0.2,
      lineJoin: 'round'
    }).addTo(this.map).bringToBack();

    // Fit bounds to route
    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  private drawDirectLine(): void {
    if (!this.map || !this.origin || !this.destination) return;

    this.routeLine = L.polyline(
      [[this.origin.lat, this.origin.lng], [this.destination.lat, this.destination.lng]],
      {
        color: '#9e9e9e',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10'
      }
    ).addTo(this.map);

    // Calculate straight-line distance
    const distance = this.map.distance(
      [this.origin.lat, this.origin.lng],
      [this.destination.lat, this.destination.lng]
    );

    // Estimate duration (assuming 30 km/h average for motorcycle in city)
    const duration = (distance / 1000) / 30 * 3600;

    this.routeInfo = {
      distance: distance,
      duration: duration,
      geometry: []
    };
  }

  private clearMap(): void {
    if (this.originMarker) {
      this.originMarker.remove();
      this.originMarker = undefined;
    }
    if (this.destMarker) {
      this.destMarker.remove();
      this.destMarker = undefined;
    }
    if (this.routeLine) {
      this.routeLine.remove();
      this.routeLine = undefined;
    }
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  // Public method to refresh map
  refreshMap(): void {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }
}
