import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as L from 'leaflet';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-location-picker',
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
    MatTooltipModule
  ],
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss']
})
export class LocationPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() label = 'Location';
  @Input() placeholder = 'Search address or click on map';
  @Input() icon = 'location_on';
  @Input() mapId = 'map-' + Math.random().toString(36).substr(2, 9);
  @Input() initialLocation?: LocationCoordinates;
  
  @Output() locationSelected = new EventEmitter<LocationCoordinates>();
  @Output() addressChanged = new EventEmitter<string>();

  address = '';
  selectedLocation?: LocationCoordinates;
  searchResults: SearchResult[] = [];
  searching = false;
  gettingLocation = false;
  mapReady = false;
  
  private map?: L.Map;
  private marker?: L.Marker;
  private searchTimeout?: any;
  private pendingLocation?: { lat: number; lng: number };

  // Default to Dhaka, Bangladesh
  private defaultCenter: L.LatLngExpression = [23.8103, 90.4125];
  private defaultZoom = 12;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    if (this.initialLocation) {
      this.selectedLocation = this.initialLocation;
      this.address = this.initialLocation.address || '';
    }
  }

  ngAfterViewInit(): void {
    // Delay initialization to ensure DOM is ready
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

  private initMap(): void {
    const container = document.getElementById(this.mapId);
    if (!container) {
      console.error('Map container not found:', this.mapId);
      setTimeout(() => this.initMap(), 100);
      return;
    }

    // Use CDN for marker icons
    const defaultIcon = L.icon({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = defaultIcon;

    const center = this.initialLocation 
      ? [this.initialLocation.lat, this.initialLocation.lng] as L.LatLngExpression
      : this.defaultCenter;

    try {
      this.map = L.map(this.mapId, {
        center: center,
        zoom: this.initialLocation ? 15 : this.defaultZoom
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      // Add click handler
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.ngZone.run(() => {
          this.setMarker(e.latlng.lat, e.latlng.lng);
          this.reverseGeocode(e.latlng.lat, e.latlng.lng);
        });
      });

      // Add initial marker if location provided
      if (this.initialLocation) {
        this.setMarker(this.initialLocation.lat, this.initialLocation.lng);
      }

      // Force map to recalculate size
      setTimeout(() => {
        this.map?.invalidateSize();
        this.mapReady = true;
        
        // Apply pending location from "use current location" if any
        if (this.pendingLocation) {
          const { lat, lng } = this.pendingLocation;
          this.map?.setView([lat, lng], 16);
          this.setMarker(lat, lng);
          this.reverseGeocode(lat, lng);
          this.pendingLocation = undefined;
        }
      }, 300);

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  // Public method to refresh map (call when panel opens)
  refreshMap(): void {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private setMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }

    this.selectedLocation = { lat, lng, address: this.address };
    this.locationSelected.emit(this.selectedLocation);
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        this.ngZone.run(() => {
          this.address = data.display_name;
          this.selectedLocation = { lat, lng, address: this.address };
          this.addressChanged.emit(this.address);
          this.locationSelected.emit(this.selectedLocation);
        });
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    
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

  onOptionSelected(event: any): void {
    const result = event.option.value as SearchResult;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    this.address = result.display_name;
    this.map?.setView([lat, lng], 16);
    this.setMarker(lat, lng);
    this.selectedLocation = { lat, lng, address: this.address };
    this.searchResults = [];
    this.locationSelected.emit(this.selectedLocation);
  }

  async searchAddress(): Promise<void> {
    if (!this.address || !this.map) return;

    this.searching = true;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        this.map.setView([lat, lng], 16);
        this.setMarker(lat, lng);
        this.address = result.display_name;
        this.selectedLocation = { lat, lng, address: this.address };
        this.addressChanged.emit(this.address);
        this.locationSelected.emit(this.selectedLocation);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      this.searching = false;
    }
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    this.gettingLocation = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (this.map && this.mapReady) {
            // Map is ready, apply location immediately
            this.map.setView([lat, lng], 16);
            this.setMarker(lat, lng);
            this.reverseGeocode(lat, lng);
          } else {
            // Map not ready yet, store as pending
            this.pendingLocation = { lat, lng };
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
}
