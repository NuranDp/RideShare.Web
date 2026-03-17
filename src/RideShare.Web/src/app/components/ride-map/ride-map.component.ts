import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as L from 'leaflet';

export interface RideLocation {
  id: string;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  riderName: string;
  departureTime: string;
}

@Component({
  selector: 'app-ride-map',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './ride-map.component.html',
  styleUrls: ['./ride-map.component.scss']
})
export class RideMapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() rides: RideLocation[] = [];
  @Input() height = '400px';
  @Input() mapId = 'ride-map-' + Math.random().toString(36).substr(2, 9);
  @Output() rideClicked = new EventEmitter<string>();
  
  mapReady = false;
  private map?: L.Map;
  private markers: L.Marker[] = [];
  private polylines: L.Polyline[] = [];
  private originIcon?: L.Icon;
  private destIcon?: L.Icon;

  // Default to Dhaka, Bangladesh
  private defaultCenter: L.LatLngExpression = [23.8103, 90.4125];
  private defaultZoom = 11;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rides'] && !changes['rides'].firstChange && this.map) {
      this.updateRides(this.rides);
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
      console.error('Map container not found:', this.mapId);
      setTimeout(() => this.initMap(), 100);
      return;
    }

    // Create icons
    this.originIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.destIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    try {
      this.map = L.map(this.mapId, {
        center: this.defaultCenter,
        zoom: this.defaultZoom
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      // Add rides to map
      this.addRidesToMap();

      // Force map to recalculate size
      setTimeout(() => {
        this.map?.invalidateSize();
        this.mapReady = true;
      }, 300);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  // Public method to refresh map size
  refreshMap(): void {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private addRidesToMap(): void {
    if (!this.map || !this.originIcon || !this.destIcon) return;

    this.clearMarkers();
    const bounds: L.LatLngBounds = L.latLngBounds([]);
    let hasValidRides = false;

    this.rides.forEach(ride => {
      if (ride.originLat && ride.originLng && ride.destLat && ride.destLng) {
        hasValidRides = true;
        
        // Add origin marker
        const originMarker = L.marker([ride.originLat, ride.originLng], { icon: this.originIcon })
          .bindPopup(`
            <div style="min-width: 200px;">
              <strong style="color: #4caf50;">📍 Origin</strong><br>
              ${ride.origin}<br><br>
              <strong>🏍️ Rider:</strong> ${ride.riderName}<br>
              <strong>🕐 Time:</strong> ${new Date(ride.departureTime).toLocaleString()}
            </div>
          `)
          .on('click', () => this.ngZone.run(() => this.rideClicked.emit(ride.id)))
          .addTo(this.map!);
        this.markers.push(originMarker);

        // Add destination marker
        const destMarker = L.marker([ride.destLat, ride.destLng], { icon: this.destIcon })
          .bindPopup(`
            <div style="min-width: 200px;">
              <strong style="color: #f44336;">🏁 Destination</strong><br>
              ${ride.destination}<br><br>
              <strong>🏍️ Rider:</strong> ${ride.riderName}
            </div>
          `)
          .on('click', () => this.ngZone.run(() => this.rideClicked.emit(ride.id)))
          .addTo(this.map!);
        this.markers.push(destMarker);

        // Draw line between origin and destination
        const polyline = L.polyline(
          [[ride.originLat, ride.originLng], [ride.destLat, ride.destLng]],
          { color: '#1976d2', weight: 3, opacity: 0.7, dashArray: '10, 10' }
        ).addTo(this.map!);
        this.polylines.push(polyline);

        // Extend bounds
        bounds.extend([ride.originLat, ride.originLng]);
        bounds.extend([ride.destLat, ride.destLng]);
      }
    });

    // Fit map to show all markers
    if (hasValidRides && bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  // Public method to update rides
  updateRides(rides: RideLocation[]): void {
    this.rides = rides;
    this.addRidesToMap();
  }

  private clearMarkers(): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];
    this.polylines.forEach(p => p.remove());
    this.polylines = [];
  }
}
