import { Component, OnInit, OnDestroy, signal, effect, AfterViewInit, Injector, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RideService } from '../../../services/ride.service';
import { LocationTrackingService } from '../../../services/location-tracking.service';
import { NotificationBellComponent } from '../../../components/notification-bell/notification-bell.component';
import { RideLocation } from '../../../models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-track-ride',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NotificationBellComponent
  ],
  templateUrl: './track-ride.component.html',
  styleUrls: ['./track-ride.component.scss']
})
export class TrackRideComponent implements OnInit, OnDestroy, AfterViewInit {
  private map: L.Map | null = null;
  private riderMarker: L.Marker | null = null;
  private originMarker: L.Marker | null = null;
  private destMarker: L.Marker | null = null;
  private rideId: string = '';
  private locationSubscription: EffectRef | null = null;

  loading = signal(true);
  error = signal<string | null>(null);
  rideLocation = signal<RideLocation | null>(null);
  lastUpdateTime = signal<string | null>(null);
  
  cardExpanded = false;

  constructor(
    private route: ActivatedRoute,
    private rideService: RideService,
    public locationService: LocationTrackingService,
    private snackBar: MatSnackBar,
    private injector: Injector,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.rideId) {
      this.error.set('Invalid ride ID');
      this.loading.set(false);
      return;
    }

    this.loadRideLocation();
    
    // Set up location tracking effect after initialization
    this.locationSubscription = effect(() => {
      const location = this.locationService.currentLocation();
      if (location && this.map) {
        this.updateRiderPosition(location.lat, location.lng);
      }
    }, { injector: this.injector, allowSignalWrites: true });
  }

  ngAfterViewInit(): void {
    // Map will be initialized after ride location is loaded
  }

  ngOnDestroy(): void {
    // Clean up effect subscription
    if (this.locationSubscription) {
      this.locationSubscription.destroy();
    }
    this.locationService.stopTrackingRide();
    this.locationService.disconnect();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadRideLocation(): void {
    this.rideService.getRideLocation(this.rideId).subscribe({
      next: (location) => {
        this.rideLocation.set(location);
        this.loading.set(false);
        
        // Initialize map after a short delay to ensure DOM is ready
        setTimeout(() => {
          this.initMap(location);
          this.startTracking();
        }, 100);
      },
      error: (err) => {
        if (err.status === 404) {
          this.error.set('Ride not found or not in progress');
        } else {
          this.error.set('Failed to load ride location');
        }
        this.loading.set(false);
      }
    });
  }

  private async startTracking(): Promise<void> {
    await this.locationService.connect();
    this.locationService.startTrackingRide(this.rideId);
  }

  private initMap(location: RideLocation): void {
    // Calculate center based on available locations
    let centerLat = location.originLat ?? 0;
    let centerLng = location.originLng ?? 0;
    
    if (location.currentLat && location.currentLng) {
      centerLat = location.currentLat;
      centerLng = location.currentLng;
    }

    this.map = L.map('tracking-map').setView([centerLat, centerLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Custom icons
    const originIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#4caf50; width:24px; height:24px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const destIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#f44336; width:24px; height:24px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const riderIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#034694; width:32px; height:32px; border-radius:50%; border:4px solid white; box-shadow:0 2px 8px rgba(102,126,234,0.5);"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Add origin marker
    if (location.originLat && location.originLng) {
      this.originMarker = L.marker([location.originLat, location.originLng], { icon: originIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Pickup:</strong> ${location.origin}`);
    }

    // Add destination marker
    if (location.destLat && location.destLng) {
      this.destMarker = L.marker([location.destLat, location.destLng], { icon: destIcon })
        .addTo(this.map)
        .bindPopup(`<strong>Drop-off:</strong> ${location.destination}`);
    }

    // Add rider marker if location available
    if (location.currentLat && location.currentLng) {
      this.riderMarker = L.marker([location.currentLat, location.currentLng], { icon: riderIcon })
        .addTo(this.map)
        .bindPopup(`<strong>${location.riderName}</strong><br>Your rider`);
    }

    // Fit bounds to show all markers
    if (location.originLat && location.originLng && location.destLat && location.destLng) {
      const bounds = L.latLngBounds([
        [location.originLat, location.originLng],
        [location.destLat, location.destLng]
      ]);
      if (location.currentLat && location.currentLng) {
        bounds.extend([location.currentLat, location.currentLng]);
      }
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  private updateRiderPosition(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.riderMarker) {
      this.riderMarker.setLatLng([lat, lng]);
    } else {
      const riderIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background:#034694; width:32px; height:32px; border-radius:50%; border:4px solid white; box-shadow:0 2px 8px rgba(102,126,234,0.5);"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.riderMarker = L.marker([lat, lng], { icon: riderIcon }).addTo(this.map);
    }

    // Update the last update time separately to avoid signal loop
    this.lastUpdateTime.set(new Date().toISOString());
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  toggleCard(): void {
    this.cardExpanded = !this.cardExpanded;
  }

  recenterMap(): void {
    if (!this.map) return;
    
    const location = this.rideLocation();
    if (location) {
      // If rider has current position, center on that
      if (location.currentLat && location.currentLng) {
        this.map.setView([location.currentLat, location.currentLng], 15);
      } else if (location.originLat && location.originLng) {
        this.map.setView([location.originLat, location.originLng], 14);
      }
    }
  }

  getShortAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    let shortAddr = parts[0].trim();
    if (parts.length > 1) {
      shortAddr += ', ' + parts[1].trim();
    }
    return shortAddr.length > 35 ? shortAddr.substring(0, 35) + '...' : shortAddr;
  }

  goToProfile(): void {
    this.router.navigate(['/passenger'], { queryParams: { tab: 'profile' } });
  }
}
